
## ImmunoTrace (Next.js 15 + local MySQL)

This project now runs on **Next.js 15 App Router** and uses:
- Local MySQL database
- Email/password authentication only
- Next.js API routes (`/api/auth/*`)
- Gemini API for AI diet-plan generation (`/api/diet-plan`)
- Trace AI chatbot (`/api/trace/chat`)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` from `.env.example` and set values.

3. Run SQL schema in your local MySQL:
- `server/sql/schema.sql`

4. Start app:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Implemented Phase

### Phase 1 (completed)
- Sign up with profile details
- Sign in with email/password
- JWT session via httpOnly cookie
- Protected dashboard that reads user profile from MySQL

### Phase 2 (started)
- `/records` page for prescription upload
- Mistral OCR extraction endpoint: `POST /api/prescriptions/extract`
- Manual correction form before saving
- Save prescriptions into MySQL via `POST /api/prescriptions`
- AI prescription summary generation during extraction (`POST /api/prescriptions/extract`)
- Treatment period tracking (`treatment_start_date`, `treatment_end_date`) for active vs cured-context logic
- Raw OCR text is not persisted in the database

Set `MISTRAL_API_KEY` in `.env` before using OCR extraction.

### Phase 3 (started)
- `/diet-plan` page for personalized meal planning
- Gemini-powered diet plan endpoint: `POST /api/diet-plan`
- Saved diet plans in MySQL (`diet_plans` table)
- Uses full user context (age, height, weight, city/location, allergies, uploaded records)
- Detects low-hemoglobin patterns from uploaded records and includes Indian homemade kada guidance
- Supports diet-plan PDF download from the UI

Set `GEMINI_API_KEY` in `.env` before using diet-plan generation.

### Phase 4 (started)
- Trace AI chatbot for prevention-focused guidance
- Chat endpoint: `POST /api/trace/chat`
- Context endpoint: `GET /api/trace/context` (medical-record summary + AI health summary layer)
- Chat history endpoints: `GET /api/trace/chats`, `GET /api/trace/chats/[chatId]`
- Query page (`/query`) redesigned as chatbot UI with recent chats
- `+` upload support in query chat for files/photos, persisted for future context
- Uses user profile and uploaded records to detect recurring patterns
- Uses uploaded medicine-image context to explain likely usage and compare suitability against user records
- Gives Indian lifestyle and homemade kada prevention suggestions
- Does not prescribe medicines
- For serious symptoms, immediately advises doctor/hospital consultation

### Phase 5 (started)
- `/schedule` page for doctor appointment booking and medicine reminders
- Legacy `/calendar` route now redirects to `/schedule`
- Appointment API: `GET/POST /api/schedule/appointments`
- Medicine reminder API: `GET/POST /api/schedule/medicines`
- Medicine reminders support multiple times for one medicine in a day
- Browser notifications:
  - appointment reminders about 1 hour before
  - medicine reminders about 5 minutes before
