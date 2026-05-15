# ImmunoTrace Project Context

## What has been built

### Phase 1: Authentication (MySQL + email/password)
- Signup and login with email/password.
- JWT session in httpOnly cookie (`immunotrace_token`).
- Protected pages redirect to landing when unauthenticated.
- User profile stored in MySQL.

### Phase 2: Prescription OCR and record management
- Prescription image upload from Records page.
- OCR extraction via Mistral (`POST /api/prescriptions/extract`).
- User can edit extracted fields before save.
- Prescription save includes:
  - doctor name
  - doctor advice
  - diagnosis
  - prescription date
  - treatment start/end dates
  - structured medicines
  - AI prescription summary
- Raw OCR text is intentionally not stored.

### Phase 3: Diet planning with Gemini
- Diet generation UI (`/diet-plan`) with goal/preferences/notes.
- API (`POST /api/diet-plan`) uses:
  - user profile (age, height, weight, allergies, location, etc.)
  - filtered prescription context
  - derived hemoglobin/anemia pattern signals
- Old cured prescriptions are excluded from diet context.
- Generated plans are stored, listed in Recent Plans, and downloadable as PDF.

### Phase 4: Trace AI chatbot
- Floating Trace chatbot available on dashboard, records, and diet pages.
- Query page (`/query`) is a full chatbot interface with recent chats.
- Chat API (`POST /api/trace/chat`) builds a rich context layer:
  - profile context
  - medical records summary document (record-by-record)
  - quick pattern summary
  - AI health summary (longitudinal)
- Chat history APIs:
  - `GET /api/trace/chats`
  - `GET /api/trace/chats/[chatId]`
- Query chat supports file/photo uploads via `+` icon and persists attachments.
- Trace responds with prevention-focused guidance only:
  - Indian lifestyle practicals
  - pattern-aware advice
  - homemade kada recommendations
  - medicine-image explanation + suitability check against user records
  - immediate doctor/hospital escalation on serious symptom messages
  - no medicine prescription recommendations.

### Phase 5: Schedule module
- New schedule route: `/schedule` (legacy `/calendar` now redirects to `/schedule`).
- Users can book doctor appointments with:
  - doctor name
  - hospital name
  - appointment date and time
- Users can create medicine reminders with:
  - medicine name
  - when-to-take context
  - multiple dose times in a single day
  - start and end date period
- Notifications:
  - doctor appointments notify around 1 hour before
  - medicine doses notify around 5 minutes before
- New APIs:
  - `GET/POST /api/schedule/appointments`
  - `GET/POST /api/schedule/medicines`
- New MySQL tables:
  - `doctor_appointments`
  - `medicine_reminders`

## How it works end-to-end

1. User logs in and gets JWT cookie session.
2. User uploads a prescription image.
3. OCR + one-time AI prescription summary is generated.
4. User edits and saves structured record.
5. Diet planner and Trace bot consume accumulated profile + record context.
6. Diet plan and Trace responses are generated with record-pattern awareness.

## Important files
- **Auth**
  - `app/api/auth/signup/route.ts`
  - `app/api/auth/login/route.ts`
  - `app/api/auth/me/route.ts`
  - `lib/auth.ts`
- **Records/OCR**
  - `app/api/prescriptions/route.ts`
  - `app/api/prescriptions/extract/route.ts`
  - `src/app/components/UploadPrescriptionModal.tsx`
  - `src/app/pages/Records.tsx`
  - `lib/mistral.ts`
- **Diet**
  - `app/api/diet-plan/route.ts`
  - `src/app/pages/DietPlan.tsx`
  - `lib/gemini.ts`
- **Trace chatbot**
  - `app/api/trace/chat/route.ts`
  - `app/api/trace/chats/route.ts`
  - `app/api/trace/chats/[chatId]/route.ts`
  - `app/api/trace/context/route.ts`
  - `src/app/components/TraceBot.tsx`
  - `src/app/pages/SmartQuery.tsx`
  - `lib/health-context.ts`
  - `lib/trace-schema.ts`
- **Schedule**
  - `app/schedule/page.tsx`
  - `app/schedule/schedule-client.tsx`
  - `src/app/pages/CalendarPage.tsx`
  - `src/app/components/AddAppointmentModal.tsx`
  - `src/app/components/AddMedicineModal.tsx`
  - `app/api/schedule/appointments/route.ts`
  - `app/api/schedule/medicines/route.ts`
  - `lib/schedule-schema.ts`

## Environment requirements
- DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Auth: `JWT_SECRET`
- OCR: `MISTRAL_API_KEY`
- AI: `GEMINI_API_KEY` (optional `GEMINI_MODEL`)
