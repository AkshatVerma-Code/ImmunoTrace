# Copilot instructions for this repository

## Build, test, and lint commands
- Install dependencies: `npm install`
- Start local development server (Next.js App Router): `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Initialize local MySQL schema before auth/records work: run `server/sql/schema.sql` against your local MySQL instance.
- Tests: no test framework/scripts are currently defined in `package.json`, so there is no single-test command yet.
- Linting: no lint script/config is currently defined in this repository.

## High-level architecture
- The active web app is a **Next.js 15 App Router** app under `app/`.
- API is implemented with **Next route handlers** under `app/api/*`:
  - Auth: `app/api/auth/{signup,login,logout,me}/route.ts`
  - Prescriptions: `app/api/prescriptions/route.ts` and `app/api/prescriptions/extract/route.ts`
  - Diet plans: `app/api/diet-plan/route.ts` (Gemini generation + MySQL persistence)
  - Trace chat: `app/api/trace/chat/route.ts`, `app/api/trace/context/route.ts`, `app/api/trace/chats/route.ts`, `app/api/trace/chats/[chatId]/route.ts`
- Auth is cookie-based JWT:
  - Token is set in `immunotrace_token` (httpOnly cookie) by auth route handlers.
  - Shared auth helpers live in `lib/auth.ts`.
  - Protected pages (`app/dashboard/page.tsx`, `app/records/page.tsx`) check session server-side and `redirect("/")` when unauthenticated.
- Data access is centralized in `lib/db.ts` via a shared MySQL pool (with `global.mysqlPool` reuse in dev).
- Prescription OCR flow:
  - UI in `app/records/records-client.tsx` uploads an image and calls `POST /api/prescriptions/extract`.
  - OCR integration is in `lib/mistral.ts`.
  - Corrected data is saved via `POST /api/prescriptions` into MySQL (`prescriptions` table), including doctor advice, treatment start/end dates, and AI summary.
  - AI summary is generated in the extract flow and returned with extracted fields.
  - Raw OCR text is intentionally not persisted.
- Diet-plan flow:
  - UI is rendered from `src/app/pages/DietPlan.tsx` through `app/diet-plan/*`.
  - `POST /api/diet-plan` uses `lib/gemini.ts` and full profile + uploaded-record context.
  - Route derives hemoglobin trend insights from uploaded records and asks Gemini to include an Indian homemade kada recipe (with stronger iron-support guidance when low hemoglobin trend is detected).
  - Generated plans are saved in MySQL (`diet_plans` table) and listed via `GET /api/diet-plan`.
  - Diet plan UI supports direct PDF download of the generated plan.
- Trace chat flow:
  - Floating chatbot UI is `src/app/components/TraceBot.tsx`.
  - Query page chatbot UI is `src/app/pages/SmartQuery.tsx` (recent chats + file/photo uploads).
  - `POST /api/trace/chat` builds profile + longitudinal record context and generates prevention-first replies.
  - `GET /api/trace/chats` and `GET /api/trace/chats/[chatId]` support recent/history retrieval.
  - `GET /api/trace/context` exposes medical-record summary and AI health summary for the signed-in user.
  - Bot must provide Indian lifestyle prevention guidance, handle medicine-image suitability checks against records, escalate serious symptoms to doctor/hospital guidance, and must not prescribe medicines.
- `server/` contains a legacy Express implementation and SQL schema. The current app runtime path is the Next.js `app/api` handlers.
- Large UI modules are still sourced from `src/app/*` and imported into Next pages (for example `app/dashboard/dashboard-client.tsx` imports from `@/src/app/...`).

## Key repository-specific conventions
- For route handlers that touch MySQL/bcrypt/external Node APIs, keep `export const runtime = "nodejs"` in the route file.
- Preserve the auth contract:
  - cookie name: `immunotrace_token`
  - JWT payload shape: `{ id, email }`
  - auth helper entrypoints: `signSession`, `verifySession`, `getSessionUserFromCookie` in `lib/auth.ts`
- Prefer server-side route protection in page files (`redirect("/")` from server components) instead of client-only guards for protected routes.
- Use the existing alias/import patterns:
  - TypeScript alias `@/*` resolves from repository root (`tsconfig.json`).
  - Next pages currently import shared UI from `@/src/...`, not only from `app/...`.
- Keep MySQL write normalization patterns consistent with current API handlers (convert empty values to `null`, stringify `medicines_json` before insert).
- External AI integrations are split by purpose: Mistral in `lib/mistral.ts` for OCR extraction, Gemini in `lib/gemini.ts` for diet plans.
- Styling entrypoint for Next is `app/globals.css`, which imports `src/styles/index.css`; keep style updates consistent with that chain.
