# OrderFAST — Comprehensive Security & Technical Codebase Audit Report

**Target Application:** OrderFAST (Campus Food-Ordering Platform)  
**Monorepo Components:** `apps/api` (Backend), `apps/web` (Frontend), `apps/mobile` (Mobile WebView Wrapper), `packages/*` (Validation, Types, UI, Config)  
**Production URL:** `https://www.fast0rder.online`  
**Engagement:** Comprehensive Security Code Review & Architecture Audit  
**Date:** September 18, 2026  
**Auditor:** Senior Application Security & Systems Engineer  
**Status:** Audit Complete — Discovery & Planning Pass  

---

## Table of Contents
1. [Executive Summary & Actual Deployment Topology](#1-executive-summary--actual-deployment-topology)
2. [Deep-Dive Analysis Across 9 Scope Areas](#2-deep-dive-analysis-across-9-scope-areas)
   - [Area 1: Authentication & Authorization](#area-1-authentication--authorization)
   - [Area 2: Input Validation & Injection](#area-2-input-validation--injection)
   - [Area 3: Business Logic Abuse & Invariants](#area-3-business-logic-abuse--invariants)
   - [Area 4: Secrets & Configuration Exposure](#area-4-secrets--configuration-exposure)
   - [Area 5: Dependencies & Known CVEs](#area-5-dependencies--known-cves)
   - [Area 6: Rate Limiting & Abuse Prevention](#area-6-rate-limiting--abuse-prevention)
   - [Area 7: CORS & Network Configuration](#area-7-cors--network-configuration)
   - [Area 8: Error Handling & Information Leakage](#area-8-error-handling--information-leakage)
   - [Area 9: Production HTTP Header Scan & Hardening](#area-9-production-http-header-scan--hardening)
3. [Section A: Comprehensive Findings Table](#section-a-comprehensive-findings-table)
4. [Section B: Not Verified / Requires Manual Check](#section-b-not-verified--requires-manual-check)
5. [Section C: Prioritized Remediation Plan](#section-c-prioritized-remediation-plan)
   - [Priority 1: Critical Remediations](#priority-1-critical-remediations)
   - [Priority 2: High Severity Remediations](#priority-2-high-severity-remediations)
   - [Priority 3: Medium Severity Remediations & Production Headers](#priority-3-medium-severity-remediations--production-headers)
   - [Priority 4: Low Severity Hardening](#priority-4-low-severity-hardening)

---

## 1. Executive Summary & Actual Deployment Topology

### Deployment Topology: Expectation vs. Reality
The initial project brief outlined NestJS, Supabase, and Redis. However, rigorous inspection of the codebase reveals the actual deployed stack:
- **Backend API (`apps/api`):** Built on **Fastify v4.26.2** with **Drizzle ORM v0.30.1** and `pg` (node-postgres connection pool). It is packaged via `Dockerfile` for deployment on **Railway**.
- **Database:** Hosted on Supabase (AWS `eu-west-1`), connecting through Supabase's transaction pooler on port **6543** (`aws-1-eu-west-1.pooler.supabase.com:6543/postgres`).
- **Caching & Rate Limiting:** **Redis is NOT deployed or wired into the active application.** In-memory LRU cache (`lru-cache` v10.2.0) and `@fastify/rate-limit` (v9.1.0 in-memory) are used instead.
- **Frontend (`apps/web`):** Built on **Next.js 14.2.23 (App Router)** with Zustand for client state management and Tailwind CSS for styling, deployed on **Vercel**.
- **Mobile (`apps/mobile`):** Capacitor v7 Android WebView wrapper targeting the web application.

### Key Risk Summary
1. **Critical Authentication Flaw:** The API base64-decodes JWTs without verifying cryptographic signatures. Any user can forge an unsigned token and claim arbitrary user IDs, gaining instantaneous `admin` or `staff` rights.
2. **Unauthenticated Kiosk Hijacking:** `POST /api/auth/register-staff` is completely open to the public without authentication or administrative approval, allowing any anonymous actor to register as kiosk owner.
3. **Exposed Production Secrets:** Plaintext Supabase PostgreSQL master passwords and project credentials are committed in repository files and git history (`fe83e0008`).
4. **Payment Forgery Vector:** Digital wallet orders automatically set `paymentStatus = 'paid'` upon creation without verification or confirmation.
5. **Permissive CORS with Credentials:** Fastify reflects any incoming `Origin` header while allowing credentials.
6. **Production Header Deficiencies:** Zero CSP, clickjacking protection (X-Frame-Options), or MIME sniffing protection on `https://www.fast0rder.online`.

---

## 2. Deep-Dive Analysis Across 9 Scope Areas

### Area 1: Authentication & Authorization
- **JWT Issuance & Refresh:** Tokens are issued by Supabase Auth (`/api/auth/login`, `/api/auth/register-student`, and `/api/auth/refresh`). Refreshing exchanges refresh tokens via Supabase.
- **Server-Side Signature Validation:** **BROKEN.** In [apps/api/src/shared/middleware/auth.ts:31-89](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/shared/middleware/auth.ts#L31-L89), `parseJwtPayload` parses `token.split('.')[1]` via `Buffer.from(..., 'base64url')`. If `payload.sub` is present, it skips all signature validation and queries the `profiles` table directly. Unsigned, spoofed JWTs are accepted as valid.
- **Role Verification:** Server-side guards `requireSystemRole(['admin'])` and `requireKioskStaff()` are present on sensitive endpoints in `order.routes.ts`, `kiosk.routes.ts`, and `catalog.routes.ts`. However, because authentication itself is bypassable via spoofed `sub`, the role guards are undermined.
- **Direct API Privilege Escalation:** An unauthenticated user can call `POST /api/auth/register-staff` with `role: 'owner'` and any `kioskId`, gaining permanent access to that kiosk without admin intervention.

### Area 2: Input Validation & Injection
- **SQL Parameterization:** Queries across `order.service.ts`, `kiosk.service.ts`, and `catalog.service.ts` use Drizzle ORM query builders and parameterized `pool.query($1, ...)` calls. No direct string interpolation into SQL query text was discovered.
- **Vulnerable ORM:** `drizzle-orm` is at version `0.30.1`, which is subject to **GHSA-gpj5-g38j-94v9** (CVE CVSS 7.5 SQL injection vulnerability via unescaped SQL identifiers).
- **Zod Validation Coverage:** Most endpoints enforce Zod schemas defined in `packages/validation`. Exceptions include:
  - `POST /api/kiosks` ([kiosk.routes.ts:80](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/kiosks/kiosk.routes.ts#L80)) which casts `request.body as any`.
  - The `Idempotency-Key` HTTP header ([order.routes.ts:24](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.routes.ts#L24)) which is unvalidated and can trigger PostgreSQL UUID parsing crashes (HTTP 500).
- **File Upload Vulnerabilities:** In [apps/web/app/api/upload/route.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/web/app/api/upload/route.ts), file type validation trusts the client-provided `file.type.startsWith('image/')`. SVG files (`image/svg+xml`) containing embedded JavaScript can be uploaded and executed via Supabase Public Storage URLs (Stored XSS).

### Area 3: Business Logic Abuse & Invariants
- **Order Pricing Tampering:** **PROTECTED.** In [apps/api/src/modules/orders/order.service.ts:227-291](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.service.ts#L227-L291), the server ignores all prices, subtotals, and totals sent by the client. It queries authoritative prices from `menu_items` with `FOR SHARE` locks and calculates `subtotal`, `fees`, and `total` server-side in integer piasters.
- **Order State Machine Atomicity:** **PROTECTED.** Transitions (`acceptOrder`, `startPreparing`, `markReady`, `completeOrder`, `cancelOrderByStudent`, `markNoShow`) use atomic conditional updates:
  ```sql
  UPDATE orders SET status = 'ACCEPTED', ... WHERE id = $1 AND status = 'PENDING_KIOSK' RETURNING *;
  ```
  Invalid state jumps or concurrent conflicting actions fail cleanly with HTTP 409 `INVALID_STATE_TRANSITION`.
- **Idempotency Enforcement:** Database table `orders` has a `UNIQUE (idempotency_key)` constraint. If an existing order is found, it verifies that the requesting student and items match the previous order. However, simultaneous concurrent requests with the same key race the initial `SELECT`, resulting in unhandled `23505` DB errors (HTTP 500).
- **Payment Verification Abuse:** When `paymentMethod === 'digital_wallet'`, the backend assigns `paymentStatus = 'paid'` immediately without requiring confirmation from the cashier or a payment gateway.
- **Horizontal Access Control (IDOR):** In `getOrderById` ([order.service.ts:437-444](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.service.ts#L437-L444)), access is gated: students can only fetch their own orders, staff can only fetch orders belonging to their assigned kiosk, and admins can view all orders.
- **Review Expiration:** Enforced server-side by `expiryWorker` ([expiry.worker.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/workers/expiry.worker.ts)) polling every 20s for `expiresAt < now() AND status = 'PENDING_KIOSK'`.

### Area 4: Secrets & Configuration Exposure
- **Hardcoded Database Credentials:** Committed in [tests/test-correct-pooler.ts:8](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/tests/test-correct-pooler.ts#L8) and [tests/test-encoded-passwords.ts:8](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/tests/test-encoded-passwords.ts#L8):
  ```ts
  const rawPassword = '[REDACTED_DB_PASSWORD]';
  const connStr = `postgresql://postgres.xjypynrwmreulrxhaepg:...@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`;
  ```
  Committed in git commit `fe83e0008a3e97e24429e9d7428ca7e1775f3df6`.
- **Service Role Key Exposure:** `SUPABASE_SERVICE_ROLE_KEY` is present in `apps/api/.env` and `apps/web/.env.local`. It is referenced in `apps/web/app/api/upload/route.ts`. It is NOT prefixed with `NEXT_PUBLIC_`, but storing it across multiple local files increases leakage risk.

### Area 5: Dependencies & Known CVEs
From `npm audit`:
1. `drizzle-orm` `<0.45.2`: **GHSA-gpj5-g38j-94v9** (High, SQL Injection via unescaped identifiers, CVSS 7.5).
2. `fastify` `<5.7.2`: **GHSA-jx2c-rxcm-jvmq** (High, Content-Type tab character allows body validation bypass, CVSS 7.5), **GHSA-444r-cwp2-x5xf** (Host/Proto spoofing), and **GHSA-mrq3-vjjr-p77c** (DoS via memory allocation).
3. `find-my-way` `<=9.6.0`: **GHSA-c96f-x56v-gq3h** (High, HTTP2 DoS, CVSS 7.5).
4. `tar` `<=7.5.20`: Transitive dependency in `@capacitor/assets` with multiple arbitrary file overwrite and DoS vulnerabilities.

### Area 6: Rate Limiting & Abuse Prevention
- **In-Memory Rate Limiter:** Fastify uses `@fastify/rate-limit` with an in-memory store.
- **Key Generator Bypass:** In [apps/api/src/app.ts:69-75](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/app.ts#L69-L75):
  ```ts
  keyGenerator: (request) => {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7, 45);
    }
    return request.ip;
  }
  ```
  Because the token is not authenticated before generating the key, an attacker can bypass rate limits on any endpoint by passing a random `Authorization: Bearer <random-string>` header with each request.
- **Missing Redis:** If deployed to multiple Railway replicas, rate limits are not shared across instances.
- **Account Enumeration:** Registration endpoints explicitly indicate whether an email or university ID already exists.

### Area 7: CORS & Network Configuration
- **Permissive Reflection:** In [apps/api/src/app.ts:56-62](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/app.ts#L56-L62):
  ```ts
  await app.register(cors, {
    origin: (_origin, cb) => cb(null, true),
    credentials: true,
  });
  ```
  Any malicious website visited by a logged-in user can make authenticated cross-origin requests and read private data.
- **Health Check Resource Drain:** `/api/health` and `/health` run `testDbConnection()` (`SELECT 1`) on every hit without caching or rate limiting.

### Area 8: Error Handling & Information Leakage
- **Global Error Handler:** In [apps/api/src/app.ts:92-152](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/app.ts#L92-L152), errors are mapped to structured JSON (`VALIDATION_ERROR`, `INTERNAL_SERVER_ERROR`, `AppError`). Stack traces and internal DB strings are suppressed.
- **Upload Route Leakage:** In [apps/web/app/api/upload/route.ts:105, 121](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/web/app/api/upload/route.ts#L105), `err.message` is returned directly to clients.

### Area 9: Production HTTP Header Scan & Hardening
Confirmed missing on `https://www.fast0rder.online`:
1. `Content-Security-Policy`: Missing.
2. `X-Frame-Options`: Missing (Clickjacking risk).
3. `X-Content-Type-Options`: Missing (MIME-type sniffing).
4. `Referrer-Policy`: Missing.
5. `Strict-Transport-Security`: Needs `max-age=31536000; includeSubDomains; preload`.
6. `Permissions-Policy`: Missing.
7. `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy`: Missing.

---

## Section A: Comprehensive Findings Table

| Severity | Area | File & Line | Evidence (Code Excerpt) | Why It's a Risk |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | **Auth & Authorization** | [apps/api/src/shared/middleware/auth.ts:31-40](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/shared/middleware/auth.ts#L31-L40), [auth.ts:67-89](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/shared/middleware/auth.ts#L67-L89) | `const payload = parseJwtPayload(token); let userId = payload?.sub; if (!userId) { ... getUser(token) ... }` | **Complete Authentication Bypass:** Cryptographic signatures are never verified on tokens containing a `sub`. Any visitor can forge an unsigned JWT containing an admin UUID and obtain administrative access. |
| **CRITICAL** | **Auth & Authorization** | [apps/api/src/modules/auth/auth.routes.ts:24-32](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/auth/auth.routes.ts#L24-L32), [auth.service.ts:140-147](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/auth/auth.service.ts#L140-L147) | `app.post('/register-staff', async (request, reply) => { ... if (input.kioskId) { await tx.insert(kioskStaff).values({ role: input.role || 'cashier' ... }) } }` | **Unauthenticated Privilege Escalation & Kiosk Takeover:** Any unauthenticated person can register as staff, assign themselves role `'owner'`, and take over any campus kiosk. |
| **CRITICAL** | **Secrets & Config** | [tests/test-correct-pooler.ts:8-10](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/tests/test-correct-pooler.ts#L8-L10), [tests/test-encoded-passwords.ts:8-10](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/tests/test-encoded-passwords.ts#L8-L10) | `const rawPassword = '[REDACTED_PASSWORD]'; const connStr = 'postgresql://postgres.xjypynrwmreulrxhaepg:...'` | **Hardcoded Database Password Committed to Git:** Plaintext PostgreSQL root password and connection strings are committed in tracked files and git history (`fe83e0008`). |
| **CRITICAL** | **Secrets & Config** | [apps/api/.env:13](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/.env#L13), [apps/web/.env.local:5](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/web/.env.local#L5) | `SUPABASE_SERVICE_ROLE_KEY=[REDACTED_SUPABASE_SERVICE_ROLE_KEY]` | **Supabase Service Role Key Stored in Workspace Env Files:** Root administrative Supabase key present in local configuration files. |
| **HIGH** | **Business Logic Abuse** | [apps/api/src/modules/orders/order.service.ts:328-344](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.service.ts#L328-L344) | `const isOnline = input.paymentMethod === 'digital_wallet'; ... paymentStatus: isOnline ? 'paid' : 'pending_at_pickup'` | **Unverified Payment Status Forgery (Free Orders):** Selecting digital wallet automatically sets `paymentStatus = 'paid'` on order creation without cashier or payment gateway verification. |
| **HIGH** | **CORS & Network Config** | [apps/api/src/app.ts:56-62](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/app.ts#L56-L62) | `await app.register(cors, { origin: (_origin, cb) => cb(null, true), credentials: true })` | **Wildcard CORS Origin Reflection with Credentials:** Reflects any incoming `Origin` header with `Access-Control-Allow-Credentials: true`, allowing cross-origin data theft. |
| **HIGH** | **Input Validation** | [apps/api/package.json:24](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/package.json#L24) | `"drizzle-orm": "^0.30.1"` | **Known SQL Injection Vulnerability in ORM:** Version `<0.45.2` has known SQL injection vulnerability GHSA-gpj5-g38j-94v9 (CVSS 7.5). |
| **HIGH** | **Input Validation** | [apps/web/app/api/upload/route.ts:56-93](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/web/app/api/upload/route.ts#L56-L93) | `if (!file.type.startsWith('image/')) ... rawExt = file.name.split('.').pop()` | **Insecure File Upload & Stored XSS:** Magic bytes are not checked; malicious SVGs can be uploaded and executed via Supabase Public Storage URLs. |
| **HIGH** | **Dependencies** | [apps/api/package.json:25](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/package.json#L25) | `"fastify": "^4.26.2"` | **Multiple Known Vulnerabilities in Fastify v4:** Vulnerable to Content-Type header bypass (GHSA-jx2c-rxcm-jvmq) and HTTP2 DoS (GHSA-c96f-x56v-gq3h). |
| **MEDIUM** | **Business Logic Abuse** | [apps/api/src/modules/orders/order.service.ts:106-140](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.service.ts#L106-L140) | `const [existingOrder] = await tx.select().from(orders).where(...); ... await tx.insert(orders)...` | **Unhandled Idempotency Concurrency Race Condition:** Concurrent requests with identical idempotency keys race the SELECT, causing the second insert to crash with unhandled 500 error. |
| **MEDIUM** | **Rate Limiting** | [apps/api/src/app.ts:69-76](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/app.ts#L69-L76) | `keyGenerator: (request) => { if (authHeader.startsWith('Bearer ')) return authHeader.substring(7, 45); return request.ip; }` | **Global Rate Limiting Bypass via Header Rotation:** Unauthenticated clients can bypass rate limits on sensitive endpoints by supplying random Bearer header strings. |
| **MEDIUM** | **Rate Limiting** | [apps/api/src/shared/cache/index.ts:10-22](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/shared/cache/index.ts#L10-L22) | `export class MemoryCacheService implements ICacheService { private cache: LRUCache<string, any>;` | **Missing Distributed Redis Rate Limiting:** In-memory state is not shared across multi-container Railway instances, enabling amplified attacks. |
| **MEDIUM** | **Auth & Authorization** | [apps/web/components/auth/RoleGuard.tsx:13-45](file:///c:/Users/web/components/auth/RoleGuard.tsx#L13-L45) | `if (!isAuthenticated || role !== allowedRole) router.replace('/auth/login');` | **Cosmetic Frontend-Only Route Protection in Next.js:** Route guarding in Next.js relies on client-side React components rather than `middleware.ts`. |
| **MEDIUM** | **Business Logic** | [apps/api/src/modules/orders/order.service.ts:290](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.service.ts#L290), [apps/web/lib/constants/index.ts:7-8](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/web/lib/constants/index.ts#L7-L8) | `const fees = 100; // API hardcodes 1 EGP vs Frontend constants 3 EGP` | **Service Fee Financial Discrepancy:** Backend charges 1.00 EGP while frontend displays and computes 3.00 EGP. |
| **MEDIUM** | **Database Integrity** | [apps/api/src/db/migrations/0000_initial_schema.sql:197-207](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/db/migrations/0000_initial_schema.sql#L197-L207) | `order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | **Audit Log Tamper Risk via Cascade Deletion:** No PostgreSQL append-only rules; deleting an order destroys all associated audit history in `order_events`. |
| **MEDIUM** | **Database & RLS** | [apps/api/src/db/migrations/0000_initial_schema.sql:1-260](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/db/migrations/0000_initial_schema.sql#L1-L260) | *No ALTER TABLE ... ENABLE ROW LEVEL SECURITY statements exist* | **Unprotected Supabase Tables (Missing Row-Level Security):** Tables lack RLS; direct Supabase PostgREST queries using public anon keys could read/write sensitive data. |
| **MEDIUM** | **Error Handling** | [apps/web/app/api/upload/route.ts:105, 121](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/web/app/api/upload/route.ts#L105) | `return NextResponse.json({ success: false, error: err.message ... })` | **Raw Internal Error Message Leakage:** Exposes raw Supabase storage and server exception messages to clients. |
| **LOW** | **Input Validation** | [apps/api/src/modules/kiosks/kiosk.routes.ts:80](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/kiosks/kiosk.routes.ts#L80) | `const body = request.body as any; const data = await kioskService.createKiosk(body);` | **Unvalidated Admin Kiosk Creation Payload:** Admin endpoint casts body to `any` without Zod schema validation. |
| **LOW** | **Input Validation** | [apps/api/src/modules/orders/order.routes.ts:24-25](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.routes.ts#L24-L25) | `const idempotencyKey = (request.headers['idempotency-key'] as string) || generateId();` | **Missing UUID Format Validation on HTTP Header:** Non-UUID values cause unhandled PostgreSQL syntax errors (HTTP 500). |
| **LOW** | **Rate Limiting** | [apps/api/src/modules/notifications/notification.routes.ts:102-129](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/notifications/notification.routes.ts#L102-L129) | `app.post('/test-push', ... await pushService.sendToUsers(...))` | **Unthrottled Push Notification Trigger:** Authenticated users can spam `/test-push` to exhaust Firebase API quotas. |
| **LOW** | **Information Leakage** | [apps/api/src/modules/auth/auth.service.ts:34-36, 81-83](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/auth/auth.service.ts#L34-L36) | `throw AppError.conflict('البريد الإلكتروني مسجل مسبقاً'); ... throw AppError.conflict('الرقم الجامعي مسجل مسبقاً...');` | **User Enumeration Vector:** Distinct error messages allow attackers to harvest registered campus emails and student IDs. |
| **LOW** | **CORS & Network** | [apps/api/src/app.ts:155-171](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/app.ts#L155-L171) | `const isDbConnected = await testDbConnection();` | **Connection Exhaustion via Public Health Check:** Executes `SELECT 1` on every call without caching; discloses internal service versions. |

---

## Section B: Not Verified / Requires Manual Check

The following items cannot be confirmed from source code alone and must be verified directly against the production environment:

1. **Supabase PostgREST Direct API Exposure:**
   - *Requirement:* Verify whether `https://xjypynrwmreulrxhaepg.supabase.co/rest/v1/orders` is accessible with the public anon key.
   - *Check:* Run:
     ```bash
     curl -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" "https://xjypynrwmreulrxhaepg.supabase.co/rest/v1/orders?select=*"
     ```
     If records are returned, PostgREST table access is unshielded.

2. **Active State of Hardcoded Credentials:**
   - *Requirement:* Confirm whether database password and service role key remain valid on Supabase project `xjypynrwmreulrxhaepg`.
   - *Check:* Inspect Supabase Dashboard -> Project Settings -> Database & API.

3. **Railway Environment Configuration:**
   - *Requirement:* Verify that Railway production environment variables do not expose sensitive keys in build logs and that `CORS_ORIGIN` is configured.
   - *Check:* Inspect the Railway project dashboard under OrderFAST API Service -> Variables.

4. **Vercel Client Bundle Secrets Audit:**
   - *Requirement:* Verify that `SUPABASE_SERVICE_ROLE_KEY` is not present in Vercel client bundle environment settings.
   - *Check:* Review Vercel Project Settings -> Environment Variables, and search production JavaScript network responses for `sb_secret`.

5. **Firebase Service Account Scope:**
   - *Requirement:* Verify that `FIREBASE_SERVICE_ACCOUNT_KEY` has Firebase Cloud Messaging privileges only, rather than full Project Owner/Editor roles.
   - *Check:* Inspect Google Cloud Console -> IAM & Admin -> Service Accounts.

---

## Section C: Prioritized Remediation Plan

### Priority 1: Critical Remediations

#### Item 1: Cryptographic JWT Signature Verification
- **What to Change:** Enforce cryptographic signature verification on every incoming request. Verify the token against Supabase Auth JWKS or call `await supabaseAdmin.auth.getUser(token)` before trusting any `payload.sub`. Cache valid user IDs in memory for 60 seconds to preserve performance.
- **Where:** [apps/api/src/shared/middleware/auth.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/shared/middleware/auth.ts)
- **Trade-off / Side Effect:** Adds ~15ms latency on token cache misses.

#### Item 2: Restrict Staff Registration to Platform Admins
- **What to Change:** Guard `POST /api/auth/register-staff` with `{ preHandler: [authenticate, requireSystemRole(['admin'])] }`. Disallow self-service cashier/owner registration.
- **Where:** [apps/api/src/modules/auth/auth.routes.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/auth/auth.routes.ts)
- **Trade-off / Side Effect:** Staff accounts must be provisioned through the administrative dashboard.

#### Item 3: Rotate Database Password & Service Role Key; Scrub Git History
- **What to Change:**
  1. Reset the PostgreSQL database password in the Supabase Dashboard.
  2. Rotate the Supabase `service_role` key in Supabase API settings.
  3. Delete `tests/test-correct-pooler.ts` and `tests/test-encoded-passwords.ts`.
  4. Purge committed credentials from git commit history (`fe83e0008`) using `git filter-repo`.
  5. Update Railway and Vercel environment variables with rotated secrets.
- **Where:** Supabase Dashboard, [tests/test-correct-pooler.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/tests/test-correct-pooler.ts), [tests/test-encoded-passwords.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/tests/test-encoded-passwords.ts), Railway & Vercel dashboards.
- **Trade-off / Side Effect:** Requires synchronized credential updates to avoid connection downtime.

---

### Priority 2: High Severity Remediations

#### Item 4: Require Payment Verification Before Marking Orders 'paid'
- **What to Change:** Change default digital wallet order status to `'pending_verification'`. Require cashier confirmation before setting `paymentStatus = 'paid'`.
- **Where:** [apps/api/src/modules/orders/order.service.ts:343](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.service.ts#L343), [apps/api/src/db/schema.ts:40](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/db/schema.ts#L40)
- **Trade-off / Side Effect:** Requires database migration to add `'pending_verification'` to enum; Cashier UI must display verification controls.

#### Item 5: Whitelist CORS Origins
- **What to Change:** Replace `origin: true` with strict whitelist validation against `env.CORS_ORIGIN`, `https://www.fast0rder.online`, `https://fast0rder.online`, Capacitor schemes (`capacitor://localhost`), and approved Vercel domains.
- **Where:** [apps/api/src/app.ts:56-62](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/app.ts#L56-L62)
- **Trade-off / Side Effect:** New test hosts must be explicitly declared in CORS configuration.

#### Item 6: Upgrade Drizzle ORM and Fastify Dependencies
- **What to Change:** Update `drizzle-orm` to `>=0.45.2` and `fastify` to `>=4.28.1` (or Fastify 5.x) to resolve known high-severity CVEs.
- **Where:** [apps/api/package.json](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/package.json)
- **Trade-off / Side Effect:** Requires full regression test suite execution to confirm API compatibility.

#### Item 7: Secure File Upload Endpoint (`/api/upload`)
- **What to Change:**
  1. Validate image magic bytes using buffer inspection.
  2. Reject SVG files (`image/svg+xml`) completely.
  3. Restrict image uploads to `staff` and `admin` roles, allowing `student` uploads only for payment receipts.
  4. Sanitize error responses.
- **Where:** [apps/web/app/api/upload/route.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/web/app/api/upload/route.ts)
- **Trade-off / Side Effect:** Non-standard image formats will be rejected.

---

### Priority 3: Medium Severity Remediations & Production Headers

#### Item 8: Configure Production Security Headers in Next.js
- **What to Change:** Add the verified security headers in `next.config.mjs`:
  ```js
  // apps/web/next.config.mjs
  const securityHeaders = [
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https://images.unsplash.com https://placeholder.com https://xjypynrwmreulrxhaepg.supabase.co",
        "connect-src 'self' https://xjypynrwmreulrxhaepg.supabase.co wss://xjypynrwmreulrxhaepg.supabase.co https://*.railway.app http://localhost:4000 https://vitals.vercel-insights.com https://va.vercel-scripts.com",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
      ].join('; '),
    },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  ];

  const nextConfig = {
    reactStrictMode: true,
    async headers() {
      return [{ source: '/(.*)', headers: securityHeaders }];
    },
    images: {
      domains: ['images.unsplash.com', 'placeholder.com', 'xjypynrwmreulrxhaepg.supabase.co'],
      unoptimized: true,
    },
  };
  export default nextConfig;
  ```
- **Where:** [apps/web/next.config.mjs](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/web/next.config.mjs)
- **Trade-off / Side Effect:** Future CDNs, analytics tools, or font domains must be explicitly declared in the CSP.

#### Item 9: Handle Idempotency Concurrency Conflicts Gracefully
- **What to Change:** Catch PostgreSQL error code `23505` during `createOrder` execution; re-select the existing order and return HTTP 200 `{ isDuplicate: true }` rather than failing with HTTP 500.
- **Where:** [apps/api/src/modules/orders/order.service.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.service.ts)
- **Trade-off / Side Effect:** None; prevents duplicate order submission errors.

#### Item 10: Fix Rate Limiting Key Generation & Add Endpoint Throttling
- **What to Change:** Key unauthenticated requests by `request.ip` only. Implement strict route-level limits on `/api/auth/login` and `/api/auth/register-student` (max 10 req/min).
- **Where:** [apps/api/src/app.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/app.ts), [apps/api/src/modules/auth/auth.routes.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/auth/auth.routes.ts)
- **Trade-off / Side Effect:** Campus Wi-Fi NAT could share an IP bucket for unauthenticated login attempts (mitigate by keying login on IP + email).

#### Item 11: Synchronize Service Fee (1.00 EGP vs 3.00 EGP)
- **What to Change:** Update backend `fees` in `order.service.ts` to `300` piasters (3.00 EGP) to match frontend constants and business documentation.
- **Where:** [apps/api/src/modules/orders/order.service.ts:290](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.service.ts#L290)
- **Trade-off / Side Effect:** Increases order totals by 2.00 EGP on backend.

#### Item 12: Enable Database Row-Level Security (RLS) & Immutable Audit Triggers
- **What to Change:**
  1. Add a migration executing `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;` across all tables.
  2. Create a PostgreSQL trigger on `order_events` preventing `UPDATE` or `DELETE` statements (append-only enforcement).
  3. Change `order_events.order_id` foreign key from `ON DELETE CASCADE` to `ON DELETE RESTRICT`.
- **Where:** [apps/api/src/db/migrations/](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/db/migrations/)
- **Trade-off / Side Effect:** Any direct queries using Supabase anon key will be denied unless explicitly permitted by RLS policies.

---

### Priority 4: Low Severity Hardening

#### Item 13: Enforce Schema Validation for Kiosk Creation and Idempotency Key
- **What to Change:** Validate `Idempotency-Key` headers as UUIDs using `z.string().uuid()`. Implement `createKioskSchema` in `packages/validation` for `POST /api/kiosks`.
- **Where:** [apps/api/src/modules/orders/order.routes.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/orders/order.routes.ts), [apps/api/src/modules/kiosks/kiosk.routes.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/kiosks/kiosk.routes.ts)
- **Trade-off / Side Effect:** Rejects non-UUID headers immediately with 422 Unprocessable Entity.

#### Item 14: Cache Health Check DB Probe & Throttle Test Push
- **What to Change:** Cache `testDbConnection()` results for 10 seconds in `/api/health`. Add rate limiting to `/test-push` (max 3 pushes per user per 10 minutes).
- **Where:** [apps/api/src/app.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/app.ts), [apps/api/src/modules/notifications/notification.routes.ts](file:///c:/Users/jomo4/OneDrive/Desktop/OrserFAST/apps/api/src/modules/notifications/notification.routes.ts)
- **Trade-off / Side Effect:** Health check updates have up to a 10-second delay.

---
*End of Report — OrderFAST Security & Technical Audit.*
