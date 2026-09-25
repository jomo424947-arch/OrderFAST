import { leagueService } from '../league/league.service.js';
import { logger } from '../../shared/logger/index.js';

export class LeagueWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Starts periodic check for season lifecycle (auto-close expired, activate upcoming)
   * Runs every 60 seconds
   */
  start(intervalMs = 60000) {
    if (this.timer) return;

    logger.info(`🏆 League Worker started (Interval: ${intervalMs / 1000}s)`);

    this.timer = setInterval(async () => {
      if (this.isRunning) return;
      this.isRunning = true;

      try {
        // Auto-close expired active seasons
        const closedCount = await leagueService.autoCloseExpiredSeasons();
        if (closedCount > 0) {
          logger.info(`🏆 Auto-closed ${closedCount} expired league season(s)`);
        }

        // Activate upcoming seasons whose start time has arrived
        const activatedCount = await leagueService.activateUpcomingSeasons();
        if (activatedCount > 0) {
          logger.info(`🏆 Activated ${activatedCount} upcoming league season(s)`);
        }
      } catch (error) {
        logger.error({ err: error }, '❌ Error during league worker scan');
      } finally {
        this.isRunning = false;
      }
    }, intervalMs);
  }

  /**
   * Stops the background worker cleanly
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('🛑 League Worker stopped');
    }
  }
}

export const leagueWorker = new LeagueWorker();
