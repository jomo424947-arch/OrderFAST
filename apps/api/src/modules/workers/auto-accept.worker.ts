import { orderService } from '../orders/order.service.js';
import { logger } from '../../shared/logger/index.js';

export class AutoAcceptWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Starts periodic scan for pending orders in kiosks with autoAcceptOrders active (every 5 seconds)
   */
  start(intervalMs = 5000) {
    if (this.timer) return;

    logger.info(`⚡ Auto-Accept Worker started (Interval: ${intervalMs / 1000}s)`);

    this.timer = setInterval(async () => {
      if (this.isRunning) return; // Prevent overlapping runs
      this.isRunning = true;

      try {
        const acceptedCount = await orderService.sweepAutoAcceptOrders();
        if (acceptedCount > 0) {
          logger.info(`⚡ Auto-accepted ${acceptedCount} orders to kitchen queue`);
        }
      } catch (error) {
        logger.error({ err: error }, '❌ Error during auto-accept scan');
      } finally {
        this.isRunning = false;
      }
    }, intervalMs);

    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  /**
   * Stops the background worker cleanly
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('🛑 Auto-Accept Worker stopped');
    }
  }
}

export const autoAcceptWorker = new AutoAcceptWorker();
