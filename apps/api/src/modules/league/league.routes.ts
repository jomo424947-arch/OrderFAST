import { FastifyInstance } from 'fastify';
import { leagueService } from './league.service.js';
import {
  authenticate,
  requireSystemRole,
} from '../../shared/middleware/auth.js';

export async function leagueRoutes(app: FastifyInstance) {
  // =============================
  // Student-Facing Routes
  // =============================

  // 1. GET /league/current — Season info + paginated leaderboard + student's own rank
  app.get<{ Querystring: { page?: string; limit?: string } }>(
    '/current',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const page = Number(request.query.page) || 1;
      const limit = Math.min(Number(request.query.limit) || 20, 50);
      const studentId = request.user?.systemRole === 'student' ? request.user.id : null;

      const data = await leagueService.getCurrentLeaderboard(studentId, page, limit);
      return reply.status(200).send({ success: true, data });
    }
  );

  // 2. GET /league/me — Student's current-season points, lifetime points, rank
  app.get(
    '/me',
    { preHandler: [authenticate, requireSystemRole(['student'])] },
    async (request, reply) => {
      const data = await leagueService.getStudentLeagueStats(request.user!.id);
      return reply.status(200).send({ success: true, data });
    }
  );

  // 3. GET /league/seasons/:id — Past season standings + prize winners
  app.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/seasons/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const page = Number(request.query.page) || 1;
      const limit = Math.min(Number(request.query.limit) || 20, 50);
      const data = await leagueService.getSeasonStandings(request.params.id, page, limit);
      return reply.status(200).send({ success: true, data });
    }
  );

  // 4. GET /league/hall-of-fame — Past seasons with top 3 winners
  app.get(
    '/hall-of-fame',
    { preHandler: [authenticate] },
    async (_request, reply) => {
      const data = await leagueService.getPastSeasons();
      return reply.status(200).send({ success: true, data });
    }
  );

  // =============================
  // Admin Routes
  // =============================

  // 5. GET /league/admin/seasons — All seasons
  app.get(
    '/admin/seasons',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (_request, reply) => {
      const data = await leagueService.getAllSeasons();
      return reply.status(200).send({ success: true, data });
    }
  );

  // 6. POST /league/admin/seasons — Create a new season
  app.post<{
    Body: {
      name: string;
      startsAt: string;
      endsAt: string;
      tier1MaxPiasters?: number;
      tier2MaxPiasters?: number;
      firstOrderPoints?: number;
      minOrdersForPrize?: number;
      maxPointsOrdersPerDay?: number;
    };
  }>(
    '/admin/seasons',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const data = await leagueService.createSeason(request.body);
      return reply.status(201).send({
        success: true,
        message: 'تم إنشاء الموسم بنجاح',
        data,
      });
    }
  );

  // 7. POST /league/admin/seasons/:id/end — End a season manually
  app.post<{ Params: { id: string } }>(
    '/admin/seasons/:id/end',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const data = await leagueService.endSeason(request.params.id);
      return reply.status(200).send({
        success: true,
        message: 'تم إنهاء الموسم وتجميد الترتيب',
        data,
      });
    }
  );

  // 8. POST /league/admin/prizes — Create a prize
  app.post<{
    Body: {
      seasonId: string;
      rank: number;
      description: string;
      sponsorKioskId?: string;
    };
  }>(
    '/admin/prizes',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const data = await leagueService.createPrize(request.body);
      return reply.status(201).send({
        success: true,
        message: 'تم إضافة الجائزة بنجاح',
        data,
      });
    }
  );

  // 9. POST /league/admin/prizes/:id/claim — Assign prize to eligible winner
  app.post<{ Params: { id: string } }>(
    '/admin/prizes/:id/claim',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const data = await leagueService.claimPrize(request.params.id);
      return reply.status(200).send({
        success: true,
        message: 'تم تسليم الجائزة للفائز',
        data,
      });
    }
  );

  // 10. GET /league/admin/audit/:studentId — Student points audit trail
  app.get<{ Params: { studentId: string }; Querystring: { seasonId?: string } }>(
    '/admin/audit/:studentId',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const data = await leagueService.getStudentPointsAudit(
        request.params.studentId,
        request.query.seasonId
      );
      return reply.status(200).send({ success: true, data });
    }
  );
}
