# ImmunoTrace Instructions

## Phase status
- **Phase 1 (completed):** Auth with **email + password** using **MySQL**
- **Phase 2 (completed):** Prescription **OCR pipeline** + editable extraction + save
- **Phase 3 (completed):** Gemini-based **diet plan** with record-aware context + PDF download
- **Phase 4 (completed):** **Trace AI chatbot** for prevention-focused guidance from user profile + health record patterns
- **Phase 5 (completed):** **Schedule** module with doctor appointments + medicine reminders + browser notifications

## Run commands
1. Install dependencies: `npm install`
2. Configure `.env` from `.env.example`
3. Initialize database with `server/sql/schema.sql`
4. Start dev server: `npm run dev`
5. Build for production: `npm run build`
6. Start production server: `npm run start`

## Core APIs
- Auth: `app/api/auth/{signup,login,logout,me}`
- Prescriptions:
  - `app/api/prescriptions` (save/list records)
  - `app/api/prescriptions/extract` (Mistral OCR + one-time AI prescription summary)
- Diet:
  - `app/api/diet-plan` (generate/list plans)
- Trace chatbot:
  - `app/api/trace/chat` (chat response)
  - `app/api/trace/context` (medical-record summary + AI health summary context)
  - `app/api/trace/chats` (recent chats list)
  - `app/api/trace/chats/[chatId]` (chat history)
- Schedule:
  - `app/api/schedule/appointments` (create/list doctor appointments)
  - `app/api/schedule/medicines` (create/list medicine reminders with multi-time support)

## Key behavior rules
- Raw OCR text is **not persisted**.
- Prescription stores include `doctor_advice`, `treatment_start_date`, `treatment_end_date`, and `ai_summary`.
- Diet generation excludes old cured prescriptions and uses active/recent context.
- Trace bot:
  - uses profile + longitudinal record context and pattern hints,
  - gives **prevention-only** guidance aligned to Indian lifestyle,
  - includes Indian homemade kada recommendations when relevant,
  - handles medicine-image questions with record-based suitability checks,
  - immediately escalates serious symptoms to doctor/hospital guidance,
  - **never prescribes medicines**.
- Query chat supports `+` file/photo uploads and persists attachment context for future responses.
- Schedule route is `/schedule` (legacy `/calendar` redirects).
- Appointment reminders trigger browser notifications ~1 hour before time.
- Medicine reminders trigger browser notifications ~5 minutes before each dose time.
