# ImmunoTrace — Project Blueprint

## 1. Project Overview

**ImmunoTrace** is a user-friendly, multi-agent AI healthcare assistant that helps people organize their medical history and understand their uploaded health documents. Users can create an account, upload medical documents, review extracted information, maintain a unified health summary, and receive general wellness guidance from specialized AI agents.

The project is intended as a **college micro project and educational prototype**. It is not a medical diagnostic system and must not replace a qualified healthcare professional.

### Core idea

Turn scattered prescriptions and laboratory reports into an organized, user-reviewed medical history, then use that context to provide cautious, personalized wellness support.

### Main goals

- Provide simple username-and-password authentication.
- Give users a clean dashboard to manage their health information.
- Support uploading medical documents such as PDFs and images.
- Extract text and relevant information from uploaded documents.
- Let users verify extracted details before treating them as reliable records.
- Maintain a chronological medical history and a generated summary.
- Use a small multi-agent workflow for health-record questions and general wellness guidance.
- Protect private medical information and clearly communicate uncertainty.

---

## 2. Intended Users and Scope

### Intended users

- People who want to keep their prescriptions and reports organized.
- Patients who want a readable summary of the documents they have uploaded.
- Students demonstrating document processing and multi-agent orchestration.

### Version 1 scope

Build these features first:

1. Register, log in, and log out.
2. Dashboard with summary cards and recent records.
3. Upload PDFs and images.
4. Store documents privately.
5. Extract document text and let users correct errors.
6. Save structured medical-record entries.
7. Generate and display a health summary with source references.
8. Ask questions about uploaded records.
9. Get general diet and exercise suggestions, with safety limits.
10. Edit profile and delete uploaded documents.

### Out of scope for the first version

Avoid adding complexity until the core system works:

- Hospital/doctor integrations or automatic record collection.
- ABDM integration.
- Appointment booking with real providers.
- Autonomous diagnosis or treatment recommendations.
- Prescription generation or medication changes.
- Multiple independent AI models.
- Complex microservices, Kubernetes, or a separate vector database.
- Mobile applications.

---

## 3. Recommended Simple Technology Stack

Choose a small, understandable stack with one main application and a lightweight Python AI backend.

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML, CSS, JavaScript, Bootstrap 5 | Responsive pages and a user-friendly interface |
| Backend | Python with Flask | Routing, authentication flows, uploads, and application logic |
| Database | SQLite for local development | Users, document metadata, extracted records, summaries, and chat history |
| ORM | Flask-SQLAlchemy | Database models and queries |
| Authentication | Flask-Login | Login sessions and protected pages |
| Password security | Werkzeug password hashing | Store password hashes, never plaintext passwords |
| Document parsing | PyMuPDF for PDFs; Pillow for image handling | Read files and prepare images |
| OCR | Gemini 3.8 Flash vision, behind a small service module | Extract text from scanned documents and images |
| AI / agents | One LLM API with LangGraph, or a simple Python orchestrator initially | Route requests to specialized agent functions |
| Validation | Pydantic | Validate structured outputs from OCR/LLM steps |
| Charts | Chart.js (optional) | Display simple trends when enough verified data exists |
| UI icons | Bootstrap Icons | Consistent navigation and interface icons |
| Deployment | Render or another Python-compatible host | Host the Flask application |

### Why this stack?

- Flask is straightforward for a student project and keeps frontend and backend in one application.
- Bootstrap reduces the amount of CSS needed and supports responsive layouts.
- SQLite requires no separate database server during development.
- Flask-Login and Werkzeug cover basic session authentication and secure password hashing.
- A single LLM can power several specialized agents; separate models are unnecessary.
- LangGraph can be introduced when the basic orchestration flow is working. For the simplest first prototype, use ordinary Python functions and explicit routing, then add LangGraph if required to demonstrate the agent workflow.

### Practical simplification

**Recommended starting configuration:** Flask + Bootstrap + SQLite + Flask-Login + Gemini 3.8 Flash for OCR and chat.

Start with a normal Python orchestrator. Keep each agent in its own module with a clear input and output. If the project needs a visible agent graph or conditional workflow, add LangGraph without changing the UI or database design.

**Important:** Gemini API access may incur costs or usage limits. Keep API keys in environment variables; never put them in frontend JavaScript or commit them to Git.

---

## 4. Application Pages

### 4.1 Landing page — `/`

Purpose: Explain ImmunoTrace and provide clear entry points.

Elements:
- Project name and short tagline: “Your health history, organized.”
- Brief explanation of document upload, medical summary, and wellness agents.
- Buttons for **Create account** and **Log in**.
- Privacy and medical-safety disclaimer.

### 4.2 Register page — `/register`

Fields:
- Username
- Password
- Confirm password

Requirements:
- Username must be unique.
- Validate password length.
- Hash the password before storing it.
- Show clear validation errors.
- Do not expose whether a stored password matches any plaintext value.

Email can be optional for the first prototype if account recovery is not implemented. Do not imply that a user can recover an account without a recovery method.

### 4.3 Login page — `/login`

Fields:
- Username
- Password

Requirements:
- Use secure session cookies.
- Provide a logout action.
- Protect all private pages so unauthenticated users cannot access them.
- Use generic login failure messages.
- Add CSRF protection for state-changing forms.

### 4.4 Dashboard — `/dashboard`

This is the main page after login.

Suggested layout:
- Greeting and quick actions.
- Summary cards:
  - Documents uploaded
  - Verified record entries
  - Latest summary update
  - Pending extraction reviews
- Recent documents list.
- Recent activity.
- Quick buttons for **Upload document**, **View medical history**, and **Ask ImmunoTrace**.
- Optional chart of verified lab values over time, only when enough comparable data is available.

Do not create a single “health score” that could be mistaken for a medical assessment. Prefer transparent counts and clearly labelled, verified information.

### 4.5 Medical Records — `/records`

Purpose: View the user's uploaded documents and extracted information.

Features:
- Search and filter by document type or date.
- Display document status: Uploaded, Processing, Needs review, Verified, or Failed.
- Open the original file securely.
- View extracted text and structured fields.
- Correct extraction errors and mark reviewed information as verified.
- Delete documents and associated derived data when requested.

### 4.6 Upload Document — `/upload`

Supported initial formats:
- PDF
- JPG/JPEG
- PNG

Upload workflow:
1. Validate extension, MIME type, and file size.
2. Generate a random internal file name.
3. Store the original file in a private directory or private object storage.
4. Create a database entry with status `uploaded`.
5. Extract text from digital PDFs where possible.
6. Use OCR for scanned PDFs and images.
7. Ask the user to review extracted information.
8. Save verified fields and update document status.

Display progress and understandable error messages. Never claim an upload was successfully analyzed until processing actually finishes.

### 4.7 Medical Summary — `/summary`

Purpose: Show a readable overview of the user's stored medical information.

Possible sections:
- Patient-provided profile and relevant preferences.
- Medical conditions explicitly recorded in source documents.
- Medication mentions, including the document date and source.
- Allergies, only if documented or explicitly provided by the user.
- Laboratory results with units, reference ranges, and collection dates.
- Important timeline events.
- Unknown or conflicting details that need review.

Requirements:
- Distinguish extracted information from user-verified information.
- Link summary claims to source documents.
- Display “not found in uploaded records” rather than assuming a missing fact is absent medically.
- Provide a **Regenerate summary** action after the user verifies new records.
- Make it clear that an AI-generated summary may contain errors.

### 4.8 Health Q&A — `/assistant`

Purpose: Let users ask questions about their own uploaded records.

Examples:
- “What were the glucose values in my uploaded reports?”
- “Summarize the information in my latest report.”
- “Which reports mention this medication?”

Expected workflow:
1. Identify the user's question.
2. Retrieve relevant records belonging only to that user.
3. Generate a grounded answer from the retrieved passages.
4. Show the source document and date for important claims.
5. Say when the uploaded records do not contain enough information.

The assistant should not diagnose conditions, prescribe medicines, or suggest medication changes.

### 4.9 Wellness — `/wellness`

A simple page with two primary tools:

**Diet Agent**
- General meal-planning and nutrition education.
- Ask about dietary preferences, allergies, budget, and goals when relevant.
- Avoid claiming to provide a therapeutic diet.
- For documented conditions requiring specialized nutrition, advise review by a qualified clinician or dietitian.

**Exercise Agent**
- General activity and habit suggestions.
- Ask about goals, current activity, and stated physical limitations.
- Avoid exercise prescriptions for potentially serious symptoms or unclear medical restrictions.
- Encourage professional advice where appropriate.

Both agents may use relevant verified context, but should use only the minimum necessary information and must not infer diagnoses from isolated lab values.

### 4.10 Profile and Settings — `/profile`

Features:
- Edit username or profile preferences, subject to uniqueness.
- Set basic wellness preferences.
- View privacy information.
- Delete individual documents.
- Request account and data deletion.
- Log out.

If account deletion is implemented, delete or appropriately invalidate associated documents, extracted records, summaries, and chat history according to the application's retention policy.

---

## 5. Multi-Agent Design

Do not begin with many autonomous agents. Use a central orchestrator and a small set of narrowly defined agents. They can all use the same LLM API.

### Orchestrator

Responsibilities:
- Receive the user's request.
- Determine the task type.
- Select the relevant agent or agents.
- Supply only necessary, authorized context.
- Combine results.
- Run safety and output checks before responding.

### Agent 1 — Document Agent

Input: Uploaded document and OCR text.

Responsibilities:
- Classify document type.
- Extract dates, relevant measurements, units, and medication mentions.
- Return structured data.
- Mark uncertain or missing values.
- Never silently invent missing fields.

### Agent 2 — Medical Summary Agent

Input: Verified extracted records and source references.

Responsibilities:
- Build a readable chronological summary.
- Highlight missing, conflicting, or uncertain information.
- Preserve links to the source documents.
- Avoid diagnosing the user.

### Agent 3 — Health Q&A / Retrieval Agent

Input: User question and authorized record passages.

Responsibilities:
- Retrieve relevant passages from that user's records.
- Answer with source references.
- Distinguish source facts from general explanations.
- Abstain when evidence is insufficient.

### Agent 4 — Diet Agent

Input: Relevant verified context, dietary preferences, and user goals.

Responsibilities:
- Provide general nutrition education and meal ideas.
- Ask clarifying questions where necessary.
- Respect reported allergies and preferences.
- Avoid medical nutrition treatment plans beyond its safe scope.

### Agent 5 — Exercise Agent

Input: Relevant verified context, activity preferences, and user goals.

Responsibilities:
- Offer general activity and habit suggestions.
- Respect known limitations.
- Flag situations where professional assessment is needed.
- Avoid diagnosing symptoms or recommending exercise despite medical restrictions.

### Safety and validation layer

This can be a normal Python module rather than another AI agent.

Responsibilities:
- Validate structured outputs.
- Check that retrieved records belong to the logged-in user.
- Reject unsupported or malformed fields.
- Prevent agents from overriding safety constraints.
- Flag urgent symptoms for appropriate real-world medical help.
- Keep logs free of unnecessary sensitive health information.

### Example workflow

User asks: “Can you suggest a healthier daily routine?”

1. The orchestrator checks the user's stated goal and available verified context.
2. It selects the Diet Agent and Exercise Agent.
3. Each agent returns a structured recommendation and notes any missing information.
4. The safety layer checks for conflicts and unsupported medical claims.
5. The orchestrator returns one combined response with appropriate caveats.

For a question such as “What is written in my latest report?”, the orchestrator should normally select the retrieval/Q&A agent instead of running every agent.

---

## 6. Basic Data Model

A small relational database is enough for the first version.

### `users`
- `id`
- `username` (unique)
- `password_hash`
- `created_at`

### `profiles`
- `id`
- `user_id`
- `display_name` (optional)
- `dietary_preferences` (optional)
- `activity_preferences` (optional)
- `updated_at`

### `medical_documents`
- `id`
- `user_id`
- `original_filename`
- `stored_path`
- `document_type`
- `document_date` (optional)
- `processing_status`
- `created_at`

### `extracted_records`
- `id`
- `document_id`
- `user_id`
- `record_type`
- `field_name`
- `field_value`
- `unit` (optional)
- `reference_range` (optional)
- `source_page` (optional)
- `verification_status`
- `created_at`

### `health_summaries`
- `id`
- `user_id`
- `summary_text`
- `source_document_ids`
- `version`
- `created_at`

### `chat_messages`
- `id`
- `user_id`
- `session_id`
- `role`
- `message_text`
- `created_at`

Use foreign keys and indexes where appropriate. Keep user data isolated in every query. Do not expose raw internal file paths to the browser.

---

## 7. User Interface and Design Guidelines

The interface should feel like a simple personal health organizer, not a hospital management system.

### Visual direction
- Light background with navy text and teal accents.
- Readable typography and generous spacing.
- Consistent icons and clear status labels.
- Responsive layout for laptop, tablet, and mobile.
- A left sidebar on desktop and a compact navigation menu on mobile.
- Cards for key information, tables for records, and clear empty states.
- Loading indicators during OCR and AI processing.
- Friendly errors with retry options.

### Suggested navigation

- Dashboard
- Upload Document
- Medical Records
- Medical Summary
- AI Assistant
- Wellness
- Profile / Settings
- Logout

### Usability requirements
- Use plain language and explain medical terms.
- Never use color alone to communicate a status.
- Show upload limits before the user selects a file.
- Make review and correction of extracted data easy.
- Clearly label AI-generated content.
- Provide source references wherever practical.
- Avoid charts that imply clinical meaning without appropriate context.

---

## 8. Security, Privacy, and Medical Safety

Medical records are sensitive. Even a student prototype should implement basic safeguards.

### Authentication and application security
- Store password hashes, never plaintext passwords.
- Use secure, HTTP-only session cookies in production.
- Enable CSRF protection for forms that change data.
- Validate uploads by size, extension, and file content.
- Use random stored filenames and private file access.
- Enforce ownership checks on every document, summary, and chat request.
- Keep API keys in server-side environment variables.
- Avoid logging passwords, document text, or unnecessary personal health data.
- Use HTTPS in deployment.
- Add rate limits for login and expensive AI endpoints.

### AI and health safety
- Treat OCR output as unverified until reviewed.
- Preserve original units, reference ranges, dates, and source passages.
- Do not equate an isolated abnormal lab value with a diagnosis.
- Do not recommend medication changes or generate prescriptions.
- Do not present wellness suggestions as individualized medical treatment.
- Make uncertainty explicit.
- Provide an appropriate emergency-care message for potentially urgent symptoms rather than attempting to manage them through the chatbot.

### Privacy and retention
- Explain what is uploaded and which AI service processes it.
- Obtain consent before sending health documents to external OCR or LLM providers.
- Check provider retention and data-use terms before sending real patient information.
- Use synthetic sample records for demonstrations whenever possible.
- Implement a clear deletion policy for source files and derived data.

---

## 9. Suggested Project Structure

```text
immunotrace/
├── app.py
├── config.py
├── extensions.py
├── requirements.txt
├── .env.example
├── README.md
│
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── document.py
│   ├── medical_record.py
│   └── summary.py
│
├── routes/
│   ├── auth.py
│   ├── dashboard.py
│   ├── uploads.py
│   ├── records.py
│   ├── summary.py
│   ├── assistant.py
│   ├── wellness.py
│   └── profile.py
│
├── services/
│   ├── document_parser.py
│   ├── ocr_service.py
│   ├── extraction_service.py
│   ├── summary_service.py
│   └── retrieval_service.py
│
├── agents/
│   ├── orchestrator.py
│   ├── document_agent.py
│   ├── summary_agent.py
│   ├── qa_agent.py
│   ├── diet_agent.py
│   └── exercise_agent.py
│
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── auth/
│   ├── dashboard/
│   ├── records/
│   ├── summary/
│   ├── assistant/
│   ├── wellness/
│   └── profile/
│
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   └── images/
│
├── instance/
│   └── (local SQLite database; do not commit)
│
└── tests/
    ├── test_auth.py
    ├── test_uploads.py
    ├── test_ownership.py
    └── test_agents.py
```

This is a proposed structure; it is fine to begin with fewer files and split modules as the project grows.

---

## 10. Development Plan

### Phase 1 — UI and authentication
- Create the Flask application and Bootstrap layout.
- Build the landing page, registration, login, dashboard, and navigation.
- Add database models and session authentication.
- Protect private routes.

### Phase 2 — Document upload
- Add PDF and image upload.
- Validate file types and sizes.
- Store files privately.
- Add document status and error handling.

### Phase 3 — OCR and verification
- Integrate Gemini 3.8 Flash vision OCR behind an OCR service module.
- Convert results into structured fields.
- Show the extracted data in a review form.
- Save only reviewed data as verified records.

### Phase 4 — Medical summary and history
- Create a timeline and summary page.
- Attach source references to extracted facts.
- Allow summary regeneration when new records are verified.

### Phase 5 — Multi-agent assistant
- Implement the orchestrator and narrow agent functions.
- Add record-grounded Q&A.
- Add Diet and Exercise agents.
- Add structured output validation and safety checks.
- Add LangGraph only if it improves clarity or is needed for the demonstration.

### Phase 6 — Testing and demonstration
- Test authentication and cross-user data isolation.
- Test malformed files and OCR failures.
- Test unsupported health questions and conflicting records.
- Test the agent-routing workflow.
- Prepare synthetic records and a scripted demo.
- Write setup instructions and document limitations.

---

## 11. Minimum Demonstration Scenario

A successful demo should show this end-to-end flow:

1. A user registers with a username and password.
2. The user logs in and sees an empty dashboard.
3. The user uploads a sample laboratory report.
4. The application extracts the text and displays it for review.
5. The user verifies the extracted values.
6. ImmunoTrace updates the medical summary and timeline.
7. The user asks a question about the uploaded report.
8. The Q&A agent answers with a source reference.
9. The user requests general diet or exercise guidance.
10. The orchestrator routes the request to the appropriate agent and returns a cautious response.

Use synthetic sample records in the demo. The application should visibly distinguish verified facts from generated explanations and general wellness suggestions.

---

## 12. Definition of Done

The first release is ready to demonstrate when:

- Registration, login, logout, and route protection work.
- The dashboard and essential pages are navigable and responsive.
- PDF/image uploads are validated and privately stored.
- OCR failures are handled gracefully.
- Users can review and correct extracted data.
- Medical summaries cite the source records used.
- Q&A retrieves only the logged-in user's records.
- The orchestrator routes requests to the intended agents.
- Diet and Exercise agents stay within general wellness guidance.
- A user cannot access another user's documents by changing an ID.
- API keys are not exposed in the browser or committed to source control.
- The demo works with synthetic data and includes clear medical-safety disclaimers.

---

## 13. Final Recommendation

Keep ImmunoTrace as a **single Flask application with a Bootstrap frontend, SQLite database, Gemini 3.8 Flash for OCR and chat**. Implement each agent as a separate Python module and use a simple orchestrator first. Introduce LangGraph only after the basic workflow is working.

This architecture is suitable for a student micro project because it is understandable, inexpensive to develop, easy to demonstrate, and extensible. It delivers the central idea—organized medical history plus coordinated AI wellness support—without unnecessary infrastructure.

**Project tagline:** *ImmunoTrace — Your health history, organized.*
