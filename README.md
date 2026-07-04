# Healthcare Appointment & Follow-up Manager

REST API for booking doctor appointments, managing availability, AI-assisted
visit summaries, prescriptions, and automated appointment/medication reminders.

## Tech Stack

- Node.js + Express — HTTP server and API
- PostgreSQL + Prisma — database and ORM
- JWT — authentication and role-based access control
- Google Gemini — AI-generated pre-visit and patient summaries
- Nodemailer — email notifications
- Google Calendar API — appointment sync to the doctor's calendar
- node-cron — scheduled appointment and medication reminders

## Project Structure

backend/
├── prisma/              # Prisma schema and migrations
├── src/
│   ├── config/          # Env loading and third-party clients
│   ├── middleware/       # Auth, roles, error handling
│   ├── controllers/      # HTTP request handlers
│   ├── routes/           # Route definitions
│   ├── services/         # Business logic and DB access
│   ├── jobs/             # Scheduled background jobs (node-cron)
│   ├── prompts/          # Gemini prompt templates
│   ├── utils/            # Shared helpers
│   ├── app.js            # Express app (middleware + routes)
│   └── server.js         # Entry point (starts the HTTP server)
└── package.json

## Getting Started

npm install
cp .env.example .env       # then fill in DATABASE_URL and JWT_SECRET
npx prisma migrate dev     # create database tables
npm run seed               # create the first ADMIN account
npm run dev                # start with auto-reload (or `npm start`)

Verify the server is running:

curl http://localhost:5000/health
# {"status":"ok"}

## Environment Variables

Copy .env.example to .env and provide real values.

| Variable | Description |
| --- | --- |
| PORT | Port the server listens on |
| NODE_ENV | development or production |
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret used to sign JWTs |
| JWT_EXPIRES_IN | Token lifetime (e.g. 7d) |
| GEMINI_API_KEY | Google AI Studio key. If unset, AI summaries are skipped; bookings are unaffected. |
| GEMINI_MODEL | Gemini model name (defaults to gemini-2.5-flash) |
| SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS | SMTP credentials. Leave blank to use an auto-provisioned Ethereal test account. |
| EMAIL_FROM | From address for outgoing email |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | OAuth credentials from Google Cloud Console. If unset, calendar sync is skipped. |
| GOOGLE_REDIRECT_URI | Must match an authorized redirect URI, e.g. http://localhost:5000/api/doctor/google/callback |

## Authentication

Protected routes require an Authorization: Bearer <token> header. Access is
role-based (ADMIN, DOCTOR, PATIENT).

- Public registration always creates a PATIENT; the client cannot set its own role.
- DOCTOR accounts are created by an admin.
- The first ADMIN account is created via npm run seed.

## API Reference

### Auth — /api/auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /register | — | Create a PATIENT account. Returns { user, token }. |
| POST | /login | — | Authenticate. Returns { user, token }. |
| GET | /me | Any | Return the current user. |

### Admin — /api/admin (ADMIN)

| Method | Path | Description |
| --- | --- | --- |
| POST | /doctors | Create a doctor (User + Doctor profile) |
| GET | /doctors | List all doctors |
| GET | /doctors/:doctorId | Get one doctor, with working hours and leaves |
| PUT | /doctors/:doctorId | Update name and/or specialization |
| PUT | /doctors/:doctorId/working-hours | Replace the weekly schedule |
| POST | /doctors/:doctorId/leave | Add leave for a date range |
| DELETE | /doctors/:doctorId/leave/:leaveId | Cancel a single leave day |

working-hours body: { "workingHours": [{ "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00" }] }
(dayOfWeek: 0 = Sunday … 6 = Saturday).

### Doctors (public) — /api/doctors

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | / | — | Search doctors, optional ?specialization= filter |
| GET | /:doctorId/slots | — | Available start times for ?date=YYYY-MM-DD |
### Appointments — /api/appointments (PATIENT)

| Method | Path | Description |
| --- | --- | --- |
| POST | / | Book { doctorId, date, startTime, reasonForVisit? } |
| GET | /me | List the patient's own appointments |
| DELETE | /:appointmentId | Cancel the patient's own appointment |

### Doctor Portal — /api/doctor (DOCTOR)

| Method | Path | Description |
| --- | --- | --- |
| GET | /appointments | List the doctor's own appointments with full detail |
| POST | /appointments/:appointmentId/visit | Submit visit notes and prescriptions |

Visit body: { notes, prescriptions: [{ medicineName, dosage, frequency, durationDays, instructions? }] }.

### Google Calendar OAuth — /api/doctor/google

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /connect | JWT via ?token= | Redirect to Google's consent screen |
| GET | /callback | — (called by Google) | Exchange the auth code and store the refresh token |

## Key Design Notes

Preventing double-booking. A partial unique index on
(doctorId, date, startTime) where cancelledAt IS NULL guarantees only one
active booking per slot at the database level; concurrent inserts resolve to a
single winner, and the loser returns 409 Conflict. Cancelled rows are kept
(soft delete via cancelledAt) so a slot becomes bookable again after
cancellation. Because Prisma cannot express a conditional index, this
constraint is hand-written in the cancellation migration.

Resilient external integrations. All three external services — Gemini,
email, and Google Calendar — run fire-and-forget and never throw into the
request path. A booking, cancellation, or visit submission always succeeds
regardless of whether the AI call, email delivery, or calendar sync does. Each
integration is opt-in and silently no-ops when unconfigured.

AI summaries. On booking with a reasonForVisit, Gemini generates a
structured pre-visit summary (summary, urgency, suggestedQuestions) for
the doctor. On visit submission, it generates a plain-language patientSummary
for the patient. Prompts explicitly avoid diagnosis or treatment advice.

Audience separation. Doctor queries return clinician-internal fields
(doctorNotes, AI prep) via include; patient queries use a select
whitelist that omits them, so patients see only their own summary and
prescriptions.

Scheduled reminders. Two daily cron jobs email upcoming-appointment and
active-medication reminders. All logic lives in reminderService.js
(independent of node-cron, so it is directly testable); the job files are thin
schedulers. Nullable reminderSentAt / lastReminderSentAt timestamps make
sends idempotent.

> Note: node-cron schedules live only in the running process. If the server
> is down at the scheduled time, that run does not fire and is not retried. A
> deployment requiring guaranteed delivery should use a persistent job queue.

## Google Calendar Setup

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com).
2. APIs & Services → Library → enable the Google Calendar API.
3. OAuth consent screen → User type External, add scope
   https://www.googleapis.com/auth/calendar.events, and add your Google
   account under Test users.
4. Credentials → Create OAuth client ID → type Web application, with
   redirect URI http://localhost:5000/api/doctor/google/callback.
5. Set the resulting GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env.

Sync targets the doctor's calendar: booking creates an event, completing a
visit updates it, and cancellation deletes it.

## Data Model
- User — id, name, email (unique), password (bcrypt hash),
  role (ADMIN/DOCTOR/PATIENT), timestamps.
- Doctor (1:1 with User) — specialization, slotDurationMinutes
  (default 30), googleRefreshToken (null until OAuth completes).
- WorkingHour — recurring weekly schedule, one row per worked day; unique
  on (doctorId, dayOfWeek). Times stored as zero-padded "HH:mm".
- Leave — individual unavailable dates; unique on (doctorId, date). Date
  ranges are expanded into one row per date.
- Appointment — doctorId/patientId, date, startTime/endTime,
  reasonForVisit, AI fields (aiSummary, aiUrgency,
  aiSuggestedQuestions), doctorNotes, patientSummary, and status
  timestamps (completedAt, cancelledAt, reminderSentAt,
  googleCalendarEventId).
- Prescription — appointmentId (cascade delete), medicineName,
  dosage, frequency, durationDays, instructions?,
  lastReminderSentAt.
