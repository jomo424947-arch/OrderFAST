# OrderFAST — Web Frontend (`apps/web`)

The production-ready Next.js Web Frontend foundation for **OrderFAST** ("ORDER • WAIT • ENJOY"), an Arabic-first university campus kiosk ordering platform.

---

## 🌟 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 14+ (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with curated Arabic typography tokens
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🎨 Design System & Visual Tokens

The design system directly implements the official OrderFAST brand identity:

```css
:root {
  --primary: #E8992A;      /* Warm Amber Orange */
  --primary-ink: #5C3B08;  /* High-contrast dark orange text */
  --primary-soft: #FBEBD1; /* Soft tint background */
  --accent: #2F5233;       /* Forest Green (open status, positive) */
  --accent-soft: #E3ECE1;  /* Soft green pill background */
  --danger: #B23A2E;       /* Crimson / Rust red (urgent timers, reject) */
  --ink: #241F1A;          /* Deep Espresso Black text */
  --ink-soft: #6B6255;     /* Muted secondary text */
  --surface: #FAF8F3;      /* Warm off-white surface */
  --canvas: #F0EEE8;       /* Warm sand background */
  --line: #D8CFBE;         /* Subtle beige border */
}
```

### Typography:
- **Display / Headings**: `El Messiri`
- **Body / UI**: `IBM Plex Sans Arabic`
- **Numbers / Timers / Stats**: `IBM Plex Mono`

---

## 📁 Directory Structure

```
apps/web/
├── app/
│   ├── layout.tsx                     # Root layout (lang="ar", dir="rtl", fonts)
│   ├── page.tsx                       # Landing / Welcome page
│   ├── onboarding/                    # 3-step interactive onboarding with ticket illustration
│   ├── auth/
│   │   ├── login/                     # Student & Cashier login with role switcher
│   │   ├── register/                  # Student registration with college picker
│   │   └── forgot-password/           # Password recovery flow
│   ├── student/
│   │   ├── layout.tsx                 # Student header & mobile bottom navigation
│   │   ├── page.tsx                   # Student Home (greeting, search, chips, kiosks)
│   │   ├── kiosks/                    # Campus kiosk exploration
│   │   │   └── [id]/                  # Kiosk details & categorized menu browsing
│   │   ├── cart/                      # Cart review with pickup payment instructions
│   │   ├── orders/                    # Orders list (active vs history)
│   │   │   └── [id]/                  # Live Ticket Order Tracking & 6-step lifecycle
│   │   ├── notifications/             # Student notification feed
│   │   ├── profile/                   # Student profile with status simulator (active/warning/restricted)
│   │   └── settings/                  # Student preferences & notification toggles
│   ├── kiosk/
│   │   ├── layout.tsx                 # Cashier sidebar, header & order countdown ticker
│   │   ├── page.tsx                   # Incoming orders with live countdown & accept/reject
│   │   ├── active/                    # Active orders lifecycle (preparing -> ready -> delivered)
│   │   ├── menu/                      # Menu management (availability toggle, add/edit item modal)
│   │   ├── settings/                  # Kiosk open/closed switch, rush mode & prep times
│   │   └── notifications/             # Cashier incoming alerts
│   ├── error.tsx                      # Error boundary
│   └── not-found.tsx                  # 404 page
│
├── components/
│   ├── branding/Logo.tsx              # Vector SVG OrderFAST logo & symbol matching brand reference
│   ├── ui/                            # Button, Input, Card, StatusPill, Badge, Modal, Tabs, etc.
│   ├── layout/                        # StudentHeader, StudentBottomNav, CashierSidebar, CashierHeader
│   ├── kiosk/                         # KioskCard
│   ├── menu/                          # MenuItemRow, CartBar
│   └── orders/                        # OrderTicket, OrderTimeline, CashierIncomingOrderCard
│
├── lib/
│   ├── mock/                          # Realistic Egyptian university data (Sphinx / Cairo)
│   ├── services/                      # Decoupled Repository / Service Interfaces
│   ├── constants/                     # Design tokens, college lists, status labels
│   ├── formatters/                    # Currency (ج.م), time, Arabic dates
│   └── utils/                         # Helper functions & class merger
│
├── stores/                            # Reactive Zustand stores (Cart, Order, Kiosk, Auth, Notifications)
├── types/                             # TypeScript schemas
└── styles/                            # Tailwind & CSS custom properties
```

---

## ⚡ How to Run Locally

```bash
# Navigate to web application directory
cd apps/web

# Install dependencies
npm install

# Run development server
npm run dev

# Run TypeScript typecheck
npm run type-check

# Run production build
npm run build
```

---

## 🔌 Transitioning from Mock to Production Backend

All data operations are decoupled through the `lib/services/` layer:
1. `IOrderService` ➡️ Replace `MockOrderService` with `ApiOrderService` (HTTP/REST/WebSocket).
2. `IKioskService` ➡️ Replace `MockKioskService` with `ApiKioskService`.
3. `IMenuService` ➡️ Replace `MockMenuService` with `ApiMenuService`.
4. `INotificationService` ➡️ Replace `MockNotificationService` with `ApiNotificationService` (FCM/WebSockets).
5. `IAuthService` ➡️ Replace `MockAuthService` with Supabase/JWT auth service.

No UI or presentation component requires rewriting.
