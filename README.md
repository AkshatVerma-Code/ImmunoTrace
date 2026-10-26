# ImmunoTrace

ImmunoTrace is a local-first healthcare records and wellness project for an educational demonstration. It organizes user-uploaded records, creates source-linked summaries, and provides record-based and general wellness assistance.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React
- Backend: FastAPI, SQLAlchemy, Pydantic, Argon2
- Local data: SQLite and private opaque session cookies

## Requirements

- Node.js 20 or later
- Python 3.11 or later

## Run locally

1. Add your `GEMINI_API_KEY` to `.env` in the project root. A blank local `.env` and a shareable `.env.example` are provided. Keep the default cookie setting for local HTTP development. Set `COOKIE_SECURE=true` behind HTTPS.
2. Start the API in one terminal:

   ```sh
   cd backend
   python3 -m venv .venv
   .venv/bin/pip install -r requirements-dev.txt
   .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. Start the web app in a second terminal:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

4. Open <http://localhost:5173>, create an account, then sign in. The API health endpoint is <http://localhost:8000/api/health>.

The SQLite database and tables are initialized when the API starts. Passwords are hashed with Argon2. A random session token is stored as a hash in the database and sent only in an HttpOnly, SameSite cookie. Change the frontend origin, database URL, storage path, or upload size in `.env` as needed.

For local fallback OCR, install the Tesseract system executable. On Debian or Ubuntu, run `sudo apt install tesseract-ocr`. When Gemini is configured, image OCR and scanned PDF pages use Gemini vision with `gemini-3.8-flash`; if the Gemini request fails, the app falls back to Tesseract. PDFs with embedded text do not need OCR.

## AI configuration

With `GEMINI_API_KEY` unset, the agents use deterministic extraction and clearly labeled local demo responses. Set `GEMINI_API_KEY` in `.env` to enable Google Gemini. Chat and OCR use `gemini-3.8-flash`; the model and API base URL are configurable. Keys stay on the backend. When Gemini is configured, relevant excerpts are sent for record questions, the wellness prompt plus saved preferences may be sent for wellness replies, and uploaded image/scanned-page content may be sent to Gemini for transcription. The profile page displays this processing notice.

## Tests

```sh
cd backend
.venv/bin/pytest -q

cd ../frontend
npm test
npm run build
```

## Included features

- Landing, sign-in, registration, dashboard, medical records, upload/review, medical summary, AI assistant, wellness agents, and profile/settings screens.
- Private username/password accounts with Argon2 password hashes, server-side session records, HttpOnly cookies, logout, password changes, and account deletion.
- Per-user PDF, JPG, and PNG uploads; PDF text extraction; optional Tesseract OCR; editable extracted details; source preview/download; search, filters, review status, and deletion.
- Summaries and timelines built from reviewed documents, with source links and PDF export.
- Separate document, timeline, summary, records-retrieval, diet, and exercise agent modules coordinated by one backend orchestrator. Without provider configuration, the chat still works in explicitly labeled demo mode.
- User-owned conversation history, saved wellness preferences, document deletion, and account deletion.

SQLite tables initialize with SQLAlchemy `create_all` for this local prototype. Dashboard counts and recent documents come from the logged-in account’s database rows. No real or shared sample medical records are included.

## Privacy and medical use

Do not upload real patient data into this educational project unless you are authorized to do so. AI responses may be incomplete and should be checked against original documents. ImmunoTrace is not a diagnostic or treatment tool. Talk with a qualified health professional about medical decisions.
