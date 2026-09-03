# ORDERFAST — University Campus Kiosk Ordering Platform

> **ORDER • WAIT • ENJOY**

OrderFAST is a campus-first kiosk ordering platform designed to eliminate physical waiting queues for university students and streamline operational order management for campus kiosks.

---

## 📌 Current Project Phase: Web Frontend Foundation

In this phase, we have implemented the **complete, production-quality Web Frontend** under `apps/web/`.

- **Web Application (`apps/web`)**: Fully implemented in Next.js (App Router), React, TypeScript, Tailwind CSS, and Zustand with high-fidelity mock data and modular repository services.
- **Arabic & RTL-First**: Designed natively for Arabic typography (`El Messiri`, `IBM Plex Sans Arabic`, `IBM Plex Mono`) and RTL layouts.
- **Future Packages & Backends (`apps/mobile`, `apps/api`, `packages/*`, `infrastructure/*`)**: Established as placeholder architecture for upcoming phases.

---

## 🏛️ Monorepo Architecture

```
/
├── apps/
│   ├── web/                          # Active Next.js Web Frontend
│   ├── mobile/                       # [Placeholder] Future React Native / Expo App
│   └── api/                          # [Placeholder] Future NestJS / Supabase Backend
│
├── packages/
│   ├── ui/                           # [Placeholder] Shared UI Component Library
│   ├── types/                        # [Placeholder] Shared Domain TypeScript Definitions
│   ├── validation/                   # [Placeholder] Shared Zod Validation Schemas
│   ├── config/                       # [Placeholder] Shared ESLint, Prettier, Tailwind configs
│   └── utils/                        # [Placeholder] Shared Utilities
│
├── infrastructure/
│   ├── docker/                       # [Placeholder] Docker & Compose configs
│   ├── nginx/                        # [Placeholder] Reverse proxy configurations
│   ├── monitoring/                   # [Placeholder] Prometheus / Grafana / Sentry
│   └── deployment/                   # [Placeholder] CI/CD deployment scripts
│
├── docs/                             # Architecture, API design, and system documentation
├── scripts/                          # Utility & maintenance scripts
├── tests/                            # E2E & integration test suites
├── .github/workflows/                # GitHub Actions CI/CD workflows
├── package.json                      # Monorepo workspaces configuration
├── pnpm-workspace.yaml               # PNPM workspace definition
└── turbo.json                        # Turborepo task pipeline
```

---

## 🚀 Quick Start (Web Frontend)

### Prerequisites
- Node.js 18+ or 20+
- npm (or pnpm)

### Running the Web Frontend

1. **Install dependencies**:
   ```bash
   cd apps/web
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🎨 Design Tokens & Visual Identity

| Token | Hex / Value | Description |
|---|---|---|
| **Primary** | `#E8992A` | Warm Amber Orange (actions, brand accent) |
| **Primary Ink** | `#5C3B08` | Deep Dark Orange for text on primary buttons |
| **Primary Soft** | `#FBEBD1` | Soft tint for badges and highlights |
| **Accent** | `#2F5233` | Forest Green (open kiosks, success badges) |
| **Accent Soft** | `#E3ECE1` | Soft green background for status pills |
| **Danger** | `#B23A2E` | Crimson / Rust Red (reject, urgent countdown) |
| **Ink** | `#241F1A` | Deep Espresso Black for primary text |
| **Ink Soft** | `#6B6255` | Warm grey/brown for secondary text |
| **Surface** | `#FAF8F3` | Warm off-white for cards and input fields |
| **Canvas** | `#F0EEE8` | Warm sand background |
| **Line** | `#D8CFBE` | Subtle beige border line |

---

## 🔌 Replacing Mock Services with Real Backend

The web application is structured with a decoupled Repository/Service layer (`apps/web/lib/services/`):
- `IOrderService` ➡️ `MockOrderService` (can be replaced by `ApiOrderService`)
- `IKioskService` ➡️ `MockKioskService` (can be replaced by `ApiKioskService`)
- `IMenuService` ➡️ `MockMenuService` (can be replaced by `ApiMenuService`)
- `INotificationService` ➡️ `MockNotificationService` (can be replaced by `ApiNotificationService`)
- `IAuthService` ➡️ `MockAuthService` (can be replaced by `ApiAuthService`)

No presentation components need to be modified when connecting to real APIs.
