import { orderService } from '../orders/order.service.js';
import { logger } from '../../shared/logger/index.js';

export class ExpiryWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Starts periodic scan for expired pending orders (e.g. every 20 seconds)
   */
  start(intervalMs = 20000) {
    if (this.timer) return;

    logger.info(`⏱️ Order Expiry Worker started (Interval: ${intervalMs / 1000}s)`);

    this.timer = setInterval(async () => {
      if (this.isRunning) return; // Prevent overlapping runs
      this.isRunning = true;

      try {
        const expiredCount = await orderService.expirePendingOrders();
        if (expiredCount > 0) {
          logger.info(`⌛ Auto-expired ${expiredCount} timed-out orders`);
        }
      } catch (error) {
        logger.error({ err: error }, '❌ Error during order expiration scan');
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
      logger.info('🛑 Order Expiry Worker stopped');
    }
  }
}

export const expiryWorker = new ExpiryWorker();
