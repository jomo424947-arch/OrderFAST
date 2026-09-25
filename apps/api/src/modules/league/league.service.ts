import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  leagueSeasons,
  leaguePointsLog,
  leagueStandings,
  leaguePrizes,
  orders,
  profiles,
  notifications,
} from '../../db/schema.js';
import { AppError } from '../../shared/errors/index.js';
import { generateId } from '../../shared/id/index.js';
import { pushService } from '../notifications/push.service.js';
import { logger } from '../../shared/logger/index.js';

export class LeagueService {
  /**
   * Get the currently active season, or auto-initialize inaugural season if none exist
   */
  async getActiveSeason() {
    const [season] = await db
      .select()
      .from(leagueSeasons)
      .where(eq(leagueSeasons.status, 'active'))
      .limit(1);

    if (season) return season;

    // Check if zero seasons exist in the entire table
    const [anySeason] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leagueSeasons);

    if ((anySeason?.count || 0) === 0) {
      const now = new Date();
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + 30);

      const [inaugural] = await db
        .insert(leagueSeasons)
        .values({
          id: generateId(),
          name: 'الموسم الأول 2026',
          startsAt: now,
          endsAt,
          status: 'active',
          tier1MaxPiasters: 10000,
          tier2MaxPiasters: 20000,
          firstOrderPoints: 5,
          minOrdersForPrize: 5,
          maxPointsOrdersPerDay: 3,
        })
        .returning();

      return inaugural || null;
    }

    return null;
  }

  /**
   * Award league points when an order is marked COMPLETED.
   * Called inside the completeOrder transaction.
   */
  async awardLeaguePoints(
    order: { id: string; studentId: string; total: number; completedAt: Date | null },
    tx: any
  ): Promise<{ points: number; reason: string; rank?: number } | null> {
    // 1. Find active season
    let [season] = await tx
      .select()
      .from(leagueSeasons)
      .where(eq(leagueSeasons.status, 'active'))
      .limit(1);

    if (!season) {
      const [anySeason] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(leagueSeasons);

      if ((anySeason?.count || 0) === 0) {
        const now = new Date();
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 30);
        const [created] = await tx
          .insert(leagueSeasons)
          .values({
            id: generateId(),
            name: 'الموسم الأول 2026',
            startsAt: now,
            endsAt,
            status: 'active',
            tier1MaxPiasters: 10000,
            tier2MaxPiasters: 20000,
            firstOrderPoints: 5,
            minOrdersForPrize: 5,
            maxPointsOrdersPerDay: 3,
          })
          .returning();
        season = created;
      }
    }

    if (!season) return null;

    // 2. Check if points already awarded for this order (idempotency)
    const [existing] = await tx
      .select({ id: leaguePointsLog.id })
      .from(leaguePointsLog)
      .where(
        and(
          eq(leaguePointsLog.orderId, order.id),
          eq(leaguePointsLog.studentId, order.studentId)
        )
      )
      .limit(1);

    if (existing) return null;

    // 3. Check daily cap: how many points-eligible orders today?
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [dailyCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(leaguePointsLog)
      .where(
        and(
          eq(leaguePointsLog.studentId, order.studentId),
          eq(leaguePointsLog.seasonId, season.id),
          sql`${leaguePointsLog.createdAt} >= ${today.toISOString()}::timestamptz`,
          sql`${leaguePointsLog.reason} != 'reversal'`
        )
      );

    if ((dailyCount?.count || 0) >= season.maxPointsOrdersPerDay) {
      return null; // Daily cap reached
    }

    // 4. Check if this is the student's very first COMPLETED order ever (lifetime)
    const [completedCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.studentId, order.studentId),
          eq(orders.status, 'COMPLETED')
        )
      );

    // Current order is already COMPLETED, so count=1 means this is the first
    const isFirstOrder = (completedCount?.count || 0) <= 1;

    // 5. Calculate points
    let points: number;
    let reason: 'tier_1' | 'tier_2' | 'tier_3' | 'first_order';

    if (isFirstOrder) {
      points = season.firstOrderPoints;
      reason = 'first_order';
    } else if (order.total < season.tier1MaxPiasters) {
      points = 1;
      reason = 'tier_1';
    } else if (order.total < season.tier2MaxPiasters) {
      points = 2;
      reason = 'tier_2';
    } else {
      points = 3;
      reason = 'tier_3';
    }

    // 6. Insert points log row
    await tx.insert(leaguePointsLog).values({
      id: generateId(),
      studentId: order.studentId,
      orderId: order.id,
      seasonId: season.id,
      points,
      reason,
    });

    // 7. Upsert standings (increment)
    const [existingStanding] = await tx
      .select()
      .from(leagueStandings)
      .where(
        and(
          eq(leagueStandings.studentId, order.studentId),
          eq(leagueStandings.seasonId, season.id)
        )
      )
      .limit(1);

    if (existingStanding) {
      await tx
        .update(leagueStandings)
        .set({
          totalPoints: sql`${leagueStandings.totalPoints} + ${points}`,
          ordersCount: sql`${leagueStandings.ordersCount} + 1`,
          lastPointAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leagueStandings.id, existingStanding.id));
    } else {
      await tx.insert(leagueStandings).values({
        id: generateId(),
        studentId: order.studentId,
        seasonId: season.id,
        totalPoints: points,
        ordersCount: 1,
        lastPointAt: new Date(),
      });
    }

    // 8. Get student's new rank
    const newTotalPoints = (existingStanding?.totalPoints || 0) + points;
    const [rankResult] = await tx
      .select({ rank: sql<number>`count(*)::int + 1` })
      .from(leagueStandings)
      .where(
        and(
          eq(leagueStandings.seasonId, season.id),
          sql`${leagueStandings.totalPoints} > ${newTotalPoints}`
        )
      );

    const rank = rankResult?.rank || 1;

    // 9. Create in-app notification for points
    const [studentProfile] = await tx
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, order.studentId))
      .limit(1);

    await tx.insert(notifications).values({
      id: generateId(),
      userId: order.studentId,
      type: 'system',
      title: `حصلت على +${points} نقطة في الدوري`,
      body: `ترتيبك الآن #${rank} في دوري ${season.name}. استمر في الطلب لتتصدر!`,
    });

    // 10. Push notification (fire-and-forget)
    pushService
      .sendToUsers([order.studentId], {
        title: `حصلت على +${points} نقطة في الدوري`,
        body: `ترتيبك الآن #${rank} في دوري ${season.name}.`,
        channelId: 'fastorder_status',
        data: {
          type: 'league_points',
          url: '/student/league',
        },
      })
      .catch((err) => {
        console.warn('[League] Push error:', err);
      });

    // 11. If entering top 3, send milestone notification
    if (rank <= 3) {
      const previousRank = existingStanding
        ? await this.getStudentRank(season.id, order.studentId, tx)
        : null;

      if (!previousRank || previousRank > 3) {
        await tx.insert(notifications).values({
          id: generateId(),
          userId: order.studentId,
          type: 'system',
          title: 'دخلت المراكز الأولى!',
          body: `مبروك! أنت الآن في المركز #${rank} بدوري ${season.name}. حافظ على ترتيبك!`,
        });
      }
    }

    return { points, reason, rank };
  }

  /**
   * Reverse league points when an order is un-completed or refunded
   */
  async reverseLeaguePoints(
    order: { id: string; studentId: string },
    tx: any
  ): Promise<boolean> {
    // Find original point award for this order
    const originalLogs = await tx
      .select()
      .from(leaguePointsLog)
      .where(
        and(
          eq(leaguePointsLog.orderId, order.id),
          eq(leaguePointsLog.studentId, order.studentId),
          sql`${leaguePointsLog.reason} != 'reversal'`
        )
      );

    if (originalLogs.length === 0) return false;

    let totalReversed = 0;

    for (const log of originalLogs) {
      // Check if already reversed
      const [existingReversal] = await tx
        .select({ id: leaguePointsLog.id })
        .from(leaguePointsLog)
        .where(
          and(
            eq(leaguePointsLog.orderId, order.id),
            eq(leaguePointsLog.studentId, order.studentId),
            eq(leaguePointsLog.reason, 'reversal')
          )
        )
        .limit(1);

      if (existingReversal) continue;

      // Insert reversal log
      await tx.insert(leaguePointsLog).values({
        id: generateId(),
        studentId: order.studentId,
        orderId: order.id,
        seasonId: log.seasonId,
        points: -log.points,
        reason: 'reversal',
      });

      totalReversed += log.points;

      // Update standings
      await tx
        .update(leagueStandings)
        .set({
          totalPoints: sql`GREATEST(${leagueStandings.totalPoints} - ${log.points}, 0)`,
          ordersCount: sql`GREATEST(${leagueStandings.ordersCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(leagueStandings.studentId, order.studentId),
            eq(leagueStandings.seasonId, log.seasonId)
          )
        );
    }

    if (totalReversed > 0) {
      await tx.insert(notifications).values({
        id: generateId(),
        userId: order.studentId,
        type: 'system',
        title: 'تم خصم نقاط من رصيدك',
        body: `تم خصم ${totalReversed} نقطة بسبب إلغاء/استرجاع أوردر.`,
      });
    }

    return totalReversed > 0;
  }

  /**
   * Helper: Get a student's rank in a season
   */
  private async getStudentRank(seasonId: string, studentId: string, txOrDb: any = db): Promise<number | null> {
    const [standing] = await txOrDb
      .select({ totalPoints: leagueStandings.totalPoints })
      .from(leagueStandings)
      .where(
        and(
          eq(leagueStandings.studentId, studentId),
          eq(leagueStandings.seasonId, seasonId)
        )
      )
      .limit(1);

    if (!standing) return null;

    const [rankResult] = await txOrDb
      .select({ rank: sql<number>`count(*)::int + 1` })
      .from(leagueStandings)
      .where(
        and(
          eq(leagueStandings.seasonId, seasonId),
          sql`${leagueStandings.totalPoints} > ${standing.totalPoints}`
        )
      );

    return rankResult?.rank || 1;
  }

  /**
   * GET /league/current — Season info + paginated leaderboard + student's own rank
   */
  async getCurrentLeaderboard(studentId: string | null, page = 1, limit = 20) {
    const season = await this.getActiveSeason();
    if (!season) {
      return { season: null, leaderboard: [], studentStats: null, total: 0 };
    }

    const offset = (page - 1) * limit;

    // Get paginated leaderboard with student names
    const leaderboard = await db
      .select({
        studentId: leagueStandings.studentId,
        totalPoints: leagueStandings.totalPoints,
        ordersCount: leagueStandings.ordersCount,
        lastPointAt: leagueStandings.lastPointAt,
        studentName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(leagueStandings)
      .innerJoin(profiles, eq(leagueStandings.studentId, profiles.id))
      .where(eq(leagueStandings.seasonId, season.id))
      .orderBy(desc(leagueStandings.totalPoints), asc(leagueStandings.lastPointAt))
      .limit(limit)
      .offset(offset);

    // Count total participants
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leagueStandings)
      .where(eq(leagueStandings.seasonId, season.id));

    // Get requesting student's stats if logged in
    let studentStats = null;
    if (studentId) {
      const rank = await this.getStudentRank(season.id, studentId);
      const [standing] = await db
        .select()
        .from(leagueStandings)
        .where(
          and(
            eq(leagueStandings.studentId, studentId),
            eq(leagueStandings.seasonId, season.id)
          )
        )
        .limit(1);

      // Lifetime points
      const [lifetimeResult] = await db
        .select({ total: sql<number>`coalesce(sum(${leaguePointsLog.points}), 0)::int` })
        .from(leaguePointsLog)
        .where(
          and(
            eq(leaguePointsLog.studentId, studentId),
            sql`${leaguePointsLog.reason} != 'reversal'`
          )
        );

      studentStats = {
        rank: rank || null,
        totalPoints: standing?.totalPoints || 0,
        ordersCount: standing?.ordersCount || 0,
        lifetimePoints: lifetimeResult?.total || 0,
        minOrdersForPrize: season.minOrdersForPrize,
        isEligibleForPrize: (standing?.ordersCount || 0) >= season.minOrdersForPrize,
      };
    }

    // Assign ranks to leaderboard entries based on position
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: offset + index + 1,
    }));

    return {
      season: {
        id: season.id,
        name: season.name,
        startsAt: season.startsAt,
        endsAt: season.endsAt,
        status: season.status,
        minOrdersForPrize: season.minOrdersForPrize,
        tier1MaxPiasters: season.tier1MaxPiasters,
        tier2MaxPiasters: season.tier2MaxPiasters,
        firstOrderPoints: season.firstOrderPoints,
      },
      leaderboard: rankedLeaderboard,
      studentStats,
      total: totalResult?.count || 0,
    };
  }

  /**
   * GET /league/me — Student's detailed stats
   */
  async getStudentLeagueStats(studentId: string) {
    const season = await this.getActiveSeason();

    let currentSeason = null;
    if (season) {
      const rank = await this.getStudentRank(season.id, studentId);
      const [standing] = await db
        .select()
        .from(leagueStandings)
        .where(
          and(
            eq(leagueStandings.studentId, studentId),
            eq(leagueStandings.seasonId, season.id)
          )
        )
        .limit(1);

      currentSeason = {
        seasonId: season.id,
        seasonName: season.name,
        endsAt: season.endsAt,
        rank: rank || null,
        totalPoints: standing?.totalPoints || 0,
        ordersCount: standing?.ordersCount || 0,
        minOrdersForPrize: season.minOrdersForPrize,
        isEligibleForPrize: (standing?.ordersCount || 0) >= season.minOrdersForPrize,
      };
    }

    // Lifetime points
    const [lifetimeResult] = await db
      .select({ total: sql<number>`coalesce(sum(${leaguePointsLog.points}), 0)::int` })
      .from(leaguePointsLog)
      .where(eq(leaguePointsLog.studentId, studentId));

    // Recent points history
    const recentPoints = await db
      .select({
        points: leaguePointsLog.points,
        reason: leaguePointsLog.reason,
        createdAt: leaguePointsLog.createdAt,
        orderId: leaguePointsLog.orderId,
      })
      .from(leaguePointsLog)
      .where(eq(leaguePointsLog.studentId, studentId))
      .orderBy(desc(leaguePointsLog.createdAt))
      .limit(20);

    // Past season prizes won
    const wonPrizes = await db
      .select({
        seasonName: leagueSeasons.name,
        rank: leaguePrizes.rank,
        description: leaguePrizes.description,
        claimedAt: leaguePrizes.claimedAt,
      })
      .from(leaguePrizes)
      .innerJoin(leagueSeasons, eq(leaguePrizes.seasonId, leagueSeasons.id))
      .where(eq(leaguePrizes.claimedBy, studentId))
      .orderBy(desc(leaguePrizes.claimedAt));

    return {
      currentSeason,
      lifetimePoints: lifetimeResult?.total || 0,
      recentPoints,
      wonPrizes,
    };
  }

  /**
   * GET /league/seasons/:id — Past season standings + prize winners
   */
  async getSeasonStandings(seasonId: string, page = 1, limit = 20) {
    const [season] = await db
      .select()
      .from(leagueSeasons)
      .where(eq(leagueSeasons.id, seasonId))
      .limit(1);

    if (!season) {
      throw AppError.notFound('الموسم غير موجود');
    }

    const offset = (page - 1) * limit;

    const standings = await db
      .select({
        studentId: leagueStandings.studentId,
        totalPoints: leagueStandings.totalPoints,
        ordersCount: leagueStandings.ordersCount,
        studentName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(leagueStandings)
      .innerJoin(profiles, eq(leagueStandings.studentId, profiles.id))
      .where(eq(leagueStandings.seasonId, seasonId))
      .orderBy(desc(leagueStandings.totalPoints), asc(leagueStandings.lastPointAt))
      .limit(limit)
      .offset(offset);

    const prizes = await db
      .select({
        rank: leaguePrizes.rank,
        description: leaguePrizes.description,
        winnerName: profiles.fullName,
        claimedAt: leaguePrizes.claimedAt,
      })
      .from(leaguePrizes)
      .leftJoin(profiles, eq(leaguePrizes.claimedBy, profiles.id))
      .where(eq(leaguePrizes.seasonId, seasonId))
      .orderBy(asc(leaguePrizes.rank));

    const rankedStandings = standings.map((entry, index) => ({
      ...entry,
      rank: offset + index + 1,
    }));

    return {
      season: {
        id: season.id,
        name: season.name,
        startsAt: season.startsAt,
        endsAt: season.endsAt,
        status: season.status,
      },
      standings: rankedStandings,
      prizes,
    };
  }

  /**
   * Get all past seasons (hall of fame)
   */
  async getPastSeasons() {
    const seasons = await db
      .select({
        id: leagueSeasons.id,
        name: leagueSeasons.name,
        startsAt: leagueSeasons.startsAt,
        endsAt: leagueSeasons.endsAt,
        status: leagueSeasons.status,
      })
      .from(leagueSeasons)
      .where(eq(leagueSeasons.status, 'ended'))
      .orderBy(desc(leagueSeasons.endsAt));

    // For each season, get top 3 winners
    const results = [];
    for (const season of seasons) {
      const top3 = await db
        .select({
          studentId: leagueStandings.studentId,
          totalPoints: leagueStandings.totalPoints,
          studentName: profiles.fullName,
          avatarUrl: profiles.avatarUrl,
        })
        .from(leagueStandings)
        .innerJoin(profiles, eq(leagueStandings.studentId, profiles.id))
        .where(eq(leagueStandings.seasonId, season.id))
        .orderBy(desc(leagueStandings.totalPoints), asc(leagueStandings.lastPointAt))
        .limit(3);

      results.push({
        ...season,
        winners: top3.map((w, i) => ({ ...w, rank: i + 1 })),
      });
    }

    return results;
  }

  // =============================
  // Admin Operations
  // =============================

  /**
   * Admin: Create a new season
   */
  async createSeason(input: {
    name: string;
    startsAt: string;
    endsAt: string;
    tier1MaxPiasters?: number;
    tier2MaxPiasters?: number;
    firstOrderPoints?: number;
    minOrdersForPrize?: number;
    maxPointsOrdersPerDay?: number;
  }) {
    // Ensure no overlapping active season
    const existingActive = await this.getActiveSeason();
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (endsAt <= startsAt) {
      throw AppError.badRequest('تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية');
    }

    const status = startsAt <= new Date() && endsAt > new Date() ? 'active' : 'upcoming';

    if (status === 'active' && existingActive) {
      throw AppError.conflict('يوجد موسم نشط بالفعل. يجب إنهاؤه أولاً.');
    }

    const [season] = await db
      .insert(leagueSeasons)
      .values({
        id: generateId(),
        name: input.name,
        startsAt,
        endsAt,
        status,
        tier1MaxPiasters: input.tier1MaxPiasters || 10000,
        tier2MaxPiasters: input.tier2MaxPiasters || 20000,
        firstOrderPoints: input.firstOrderPoints || 5,
        minOrdersForPrize: input.minOrdersForPrize || 5,
        maxPointsOrdersPerDay: input.maxPointsOrdersPerDay || 3,
      })
      .returning();

    return season;
  }

  /**
   * Admin: Create a prize for a season
   */
  async createPrize(input: {
    seasonId: string;
    rank: number;
    description: string;
    sponsorKioskId?: string;
  }) {
    if (input.rank < 1 || input.rank > 3) {
      throw AppError.badRequest('الترتيب يجب أن يكون 1 أو 2 أو 3');
    }

    const [prize] = await db
      .insert(leaguePrizes)
      .values({
        id: generateId(),
        seasonId: input.seasonId,
        rank: input.rank,
        description: input.description,
        sponsorKioskId: input.sponsorKioskId || null,
      })
      .returning();

    return prize;
  }

  /**
   * Admin: Claim/assign a prize to the eligible winner
   */
  async claimPrize(prizeId: string) {
    const [prize] = await db
      .select()
      .from(leaguePrizes)
      .where(eq(leaguePrizes.id, prizeId))
      .limit(1);

    if (!prize) throw AppError.notFound('الجائزة غير موجودة');
    if (prize.claimedBy) throw AppError.conflict('الجائزة تم تسليمها بالفعل');

    // Find the eligible winner at this rank
    const standings = await db
      .select({
        studentId: leagueStandings.studentId,
        totalPoints: leagueStandings.totalPoints,
        ordersCount: leagueStandings.ordersCount,
      })
      .from(leagueStandings)
      .where(eq(leagueStandings.seasonId, prize.seasonId))
      .orderBy(desc(leagueStandings.totalPoints), asc(leagueStandings.lastPointAt));

    // Get the season's min orders for prize
    const [season] = await db
      .select({ minOrdersForPrize: leagueSeasons.minOrdersForPrize })
      .from(leagueSeasons)
      .where(eq(leagueSeasons.id, prize.seasonId))
      .limit(1);

    const minOrders = season?.minOrdersForPrize || 5;

    // Filter eligible students (meet min orders requirement)
    const eligible = standings.filter((s) => s.ordersCount >= minOrders);

    if (prize.rank > eligible.length) {
      throw AppError.badRequest('لا يوجد طالب مؤهل لهذا المركز (لم يحقق الحد الأدنى من الطلبات)');
    }

    const winner = eligible[prize.rank - 1];

    const [updated] = await db
      .update(leaguePrizes)
      .set({
        claimedBy: winner.studentId,
        claimedAt: new Date(),
      })
      .where(eq(leaguePrizes.id, prizeId))
      .returning();

    // Notify winner
    await db.insert(notifications).values({
      id: generateId(),
      userId: winner.studentId,
      type: 'system',
      title: 'مبروك! أنت من الفائزين بالدوري',
      body: `حققت المركز #${prize.rank} — ${prize.description}. تواصل مع الإدارة لاستلام جايزتك.`,
    });

    pushService
      .sendToUsers([winner.studentId], {
        title: 'مبروك! أنت من الفائزين بالدوري',
        body: `حققت المركز #${prize.rank} — ${prize.description}.`,
        channelId: 'fastorder_status',
        data: { type: 'league_winner', url: '/student/league' },
      })
      .catch(() => {});

    return updated;
  }

  /**
   * End a season: freeze standings, snapshot top 3, open next season
   */
  async endSeason(seasonId: string) {
    return await db.transaction(async (tx) => {
      const [season] = await tx
        .update(leagueSeasons)
        .set({ status: 'ended' })
        .where(
          and(eq(leagueSeasons.id, seasonId), eq(leagueSeasons.status, 'active'))
        )
        .returning();

      if (!season) {
        throw AppError.conflict('الموسم ليس نشطاً');
      }

      // Get top 3 eligible students
      const allStandings = await tx
        .select({
          studentId: leagueStandings.studentId,
          totalPoints: leagueStandings.totalPoints,
          ordersCount: leagueStandings.ordersCount,
        })
        .from(leagueStandings)
        .where(eq(leagueStandings.seasonId, seasonId))
        .orderBy(desc(leagueStandings.totalPoints), asc(leagueStandings.lastPointAt));

      const eligible = allStandings.filter(
        (s) => s.ordersCount >= season.minOrdersForPrize
      );

      // Notify top 3
      for (let i = 0; i < Math.min(3, eligible.length); i++) {
        await tx.insert(notifications).values({
          id: generateId(),
          userId: eligible[i].studentId,
          type: 'system',
          title: `انتهى موسم ${season.name}`,
          body: `مبروك! حققت المركز #${i + 1} بـ ${eligible[i].totalPoints} نقطة.`,
        });

        pushService
          .sendToUsers([eligible[i].studentId], {
            title: `انتهى موسم ${season.name}`,
            body: `مبروك! حققت المركز #${i + 1}`,
            channelId: 'fastorder_status',
            data: { type: 'season_ended', url: '/student/league' },
          })
          .catch(() => {});
      }

      // Activate any upcoming season that should start now
      const [upcoming] = await tx
        .select()
        .from(leagueSeasons)
        .where(
          and(
            eq(leagueSeasons.status, 'upcoming'),
            sql`${leagueSeasons.startsAt} <= now()`
          )
        )
        .orderBy(asc(leagueSeasons.startsAt))
        .limit(1);

      if (upcoming) {
        await tx
          .update(leagueSeasons)
          .set({ status: 'active' })
          .where(eq(leagueSeasons.id, upcoming.id));
      }

      return season;
    });
  }

  /**
   * Admin: Get audit log for a student
   */
  async getStudentPointsAudit(studentId: string, seasonId?: string) {
    const conditions = [eq(leaguePointsLog.studentId, studentId)];
    if (seasonId) {
      conditions.push(eq(leaguePointsLog.seasonId, seasonId));
    }

    return await db
      .select({
        id: leaguePointsLog.id,
        orderId: leaguePointsLog.orderId,
        seasonId: leaguePointsLog.seasonId,
        points: leaguePointsLog.points,
        reason: leaguePointsLog.reason,
        createdAt: leaguePointsLog.createdAt,
      })
      .from(leaguePointsLog)
      .where(and(...conditions))
      .orderBy(desc(leaguePointsLog.createdAt))
      .limit(100);
  }

  /**
   * Admin: Get all seasons
   */
  async getAllSeasons() {
    return await db
      .select()
      .from(leagueSeasons)
      .orderBy(desc(leagueSeasons.createdAt));
  }

  /**
   * Worker: Check and auto-close expired active seasons
   */
  async autoCloseExpiredSeasons(): Promise<number> {
    const [expiredSeason] = await db
      .select()
      .from(leagueSeasons)
      .where(
        and(
          eq(leagueSeasons.status, 'active'),
          sql`${leagueSeasons.endsAt} <= now()`
        )
      )
      .limit(1);

    if (!expiredSeason) return 0;

    try {
      await this.endSeason(expiredSeason.id);
      logger.info(`League season "${expiredSeason.name}" auto-closed`);
      return 1;
    } catch (err) {
      logger.error({ err }, 'Failed to auto-close league season');
      return 0;
    }
  }

  /**
   * Worker: Activate upcoming seasons whose start time has arrived
   */
  async activateUpcomingSeasons(): Promise<number> {
    const existingActive = await this.getActiveSeason();
    if (existingActive) return 0;

    const [upcoming] = await db
      .select()
      .from(leagueSeasons)
      .where(
        and(
          eq(leagueSeasons.status, 'upcoming'),
          sql`${leagueSeasons.startsAt} <= now()`
        )
      )
      .orderBy(asc(leagueSeasons.startsAt))
      .limit(1);

    if (!upcoming) return 0;

    await db
      .update(leagueSeasons)
      .set({ status: 'active' })
      .where(eq(leagueSeasons.id, upcoming.id));

    logger.info(`League season "${upcoming.name}" activated`);
    return 1;
  }
}

export const leagueService = new LeagueService();
