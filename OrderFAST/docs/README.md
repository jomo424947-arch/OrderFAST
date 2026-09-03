# OrderFAST Architecture & Documentation

## Overview
OrderFAST is a campus-first ordering platform connecting university students with campus kiosks.

### System Components:
- **Web Frontend** (`apps/web`): Student web app & Cashier operations dashboard.
- **Mobile Client** (`apps/mobile`): Future student companion app.
- **Backend API** (`apps/api`): Future NestJS / Supabase / Redis / BullMQ service.

### Business Rules:
1. **On-Campus Payment**: Students pay in cash or digital wallet directly at kiosk pickup. The application does not handle credit card payment processing.
2. **Order Lifecycle**: Placed ➡️ Pending Review ➡️ Accepted (or Rejected) ➡️ Preparing ➡️ Ready for Pickup ➡️ Picked Up (or No-Show).
3. **Queue Estimation**: Approximate app orders ahead (`حوالي X أوردرات قدامك`) rather than physical queue guarantees.
4. **Availability Control**: Cashiers can toggle item availability and manage rush estimates in real-time.
