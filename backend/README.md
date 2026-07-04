# Healthcare Appointment & Follow-up Manager — Backend

Backend API for booking doctor appointments, managing availability, AI-assisted
visit summaries, prescriptions, and medication reminders.

## Tech Stack

- Node.js + Express — HTTP server / API
- PostgreSQL + Prisma — database and ORM
- JWT — authentication
- Gemini API — AI-generated summaries
- Nodemailer — email notifications
- Google Calendar API — appointment sync
- node-cron — scheduled medication reminders

## Project Structure

```
backend/
├── prisma/            # Prisma schema and migrations
├── src/
│   ├── config/         # Configuration (env loading, third-party clients)
│   ├── middleware/      # Express middleware (auth, error handling, etc.)
│   ├── controllers/     # Request handlers (HTTP layer only)
│   ├── routes/          # Route definitions, wired to controllers
│   ├── services/         # Business logic, DB access
│   ├── jobs/            # Scheduled background jobs (node-cron)
│   ├── prompts/          # Gemini prompt templates
│   ├── utils/            # Small shared helper functions
│   ├── app.js            # Express app: middleware + routes
│   └── server.js          # Entry point: starts the HTTP server
├── .env.example
└── package.json
```

## Environment Variables

See `.env.example` for the full list. Copy it to `.env` and fill in real values:

```
cp .env.example .env
```

| Variable         | Description                                                  |
| ---------------- | ------------------------------------------------------------- |
| `PORT`           | Port the Express server listens on                            |
| `NODE_ENV`       | `development` or `production`                                 |
| `DATABASE_URL`   | PostgreSQL connection string (e.g. from Neon)                  |
| `JWT_SECRET`     | Secret key used to sign JWTs                                   |
| `JWT_EXPIRES_IN` | How long a JWT stays valid (e.g. `7d`)                          |
| `GEMINI_API_KEY` | Key from [Google AI Studio](https://aistudio.google.com/apikey). If missing/invalid, AI pre-visit summaries silently fail — booking is unaffected. |
| `GEMINI_MODEL`   | Gemini model name (defaults to `gemini-2.5-flash` in code if unset) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Real SMTP credentials. Leave all blank to auto-use a free Ethereal test account instead (no signup, emails aren't really delivered but a preview link is logged). |
| `EMAIL_FROM`     | From address for outgoing email                              |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials from Google Cloud Console (see setup steps below). If missing, calendar sync silently skips. |
| `GOOGLE_REDIRECT_URI` | Must exactly match an authorized redirect URI configured in Google Cloud Console, e.g. `http://localhost:5000/api/doctor/google/callback` |

## Running Locally

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL, JWT_SECRET
npx prisma migrate dev    # creates tables in your database
npm run seed              # creates the first ADMIN account (admin@example.com / admin123)
npm run dev               # starts the server with nodemon (auto-restart on file changes)
# or
npm start                 # starts the server normally
```

Once running, check the server is alive:

```bash
curl http://localhost:5000/health
# {"status":"ok"}
```

## API Documentation

### Auth — `/api/auth`

| Method | Path        | Auth required  | Description                                       |
| ------ | ----------- | -------------- | --------------------------------------------------- |
| POST   | `/register` | No             | Creates a new **PATIENT** account. Returns `{ user, token }`. |
| POST   | `/login`    | No             | Verifies email/password. Returns `{ user, token }`.  |
| GET    | `/me`       | Yes (any role) | Returns the currently logged-in user.                |

Protected routes require the header: `Authorization: Bearer <token>`.

Public registration always creates a `PATIENT` — it never trusts a `role`
field from the client, since that would let anyone register as an admin.
`DOCTOR` accounts are created by an admin (below). The first `ADMIN`
account comes from `npm run seed`, not from the public API.

### Admin — `/api/admin` (all routes require ADMIN role)

| Method | Path                              | Description                                              |
| ------ | ---------------------------------- | ------------------------------------------------------- |
| POST   | `/doctors`                         | Creates a `User` (role=DOCTOR) + `Doctor` profile together |
| GET    | `/doctors`                         | Lists all doctors                                        |
| GET    | `/doctors/:doctorId`               | Gets one doctor, including working hours and leaves      |
| PUT    | `/doctors/:doctorId`               | Updates `name` and/or `specialization`                   |
| PUT    | `/doctors/:doctorId/working-hours` | Replaces the doctor's entire weekly schedule              |
| POST   | `/doctors/:doctorId/leave`         | Adds leave for a date range (`startDate`, `endDate`, `reason`) |
| DELETE | `/doctors/:doctorId/leave/:leaveId` | Cancels a single leave day                               |

`working-hours` body: `{ "workingHours": [{ "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00" }, ...] }`
(`dayOfWeek` 0=Sunday...6=Saturday, matching JS `Date.getDay()`).

### Doctors (public) — `/api/doctors`

| Method | Path                  | Auth required | Description                                          |
| ------ | --------------------- | -------------- | ------------------------------------------------------- |
| GET    | `/`                   | No             | Search doctors, optional `?specialization=` filter (name/email hidden except doctor's name) |
| GET    | `/:doctorId/slots`    | No             | Available start times for `?date=YYYY-MM-DD`, computed from working hours minus leave minus existing bookings |

### Appointments — `/api/appointments` (all routes require PATIENT role)

| Method | Path               | Description                                             |
| ------ | ------------------- | ----------------------------------------------------------- |
| POST   | `/`                 | Books `{ doctorId, date, startTime }`. See below for why double-booking can't happen. |
| GET    | `/me`               | Lists the logged-in patient's own appointments               |
| DELETE | `/:appointmentId`   | Cancels one of the patient's own appointments. `403` if not theirs, `409` if already cancelled, `400` if already completed or in the past. |

**Preventing double-booking:** the `Appointment` table has a unique
constraint on `(doctorId, date, startTime)`. Application code validates the
request first (doctor exists, day is a working day, time is on a valid slot
boundary, doctor isn't on leave, date isn't in the past) purely to produce a
specific error message — but the actual safety against two patients booking
the same slot simultaneously comes from that database constraint. If two
`INSERT`s race, Postgres guarantees only one succeeds; the other fails with
Prisma error `P2002`, which `appointmentService.bookAppointment` catches and
turns into a `409 Conflict`. Verified live by firing two concurrent booking
requests at the same slot: one got `201`, the other got a clean `409` — no
double-booking, no crash.

`POST /` accepts an optional `reasonForVisit` string. If provided, an AI
pre-visit summary is generated in the background after the booking response
is already sent — see below.

### Doctor Portal — `/api/doctor` (all routes require DOCTOR role)

| Method | Path                                | Description                                                    |
| ------ | ------------------------------------ | ------------------------------------------------------------------ |
| GET    | `/appointments`                      | Lists this doctor's own appointments — everything: patient info, `reasonForVisit`, Phase 5 AI prep, `doctorNotes`, prescriptions, `patientSummary` |
| POST   | `/appointments/:appointmentId/visit` | Submits `{ notes, prescriptions: [{ medicineName, dosage, frequency, durationDays, instructions? }] }` for one of this doctor's own past/current appointments. One-time only — see below. |

**Visit submission rules:** rejects with `403` if the appointment doesn't
belong to the requesting doctor (an ownership check independent of
`roleMiddleware`, which only proves "you're *a* doctor," not "this is *your*
patient"), `409` if the visit was already completed, and `400` if the
appointment date is still in the future. Verified live: doctor A submitting
notes on doctor B's appointment correctly gets `403`; resubmitting an
already-completed visit gets `409`.

### Google Calendar OAuth — `/api/doctor/google`

| Method | Path        | Auth                        | Description                                          |
| ------ | ----------- | --------------------------- | ------------------------------------------------------- |
| GET    | `/connect`  | JWT via `?token=` query param | Redirects the doctor's browser to Google's consent screen |
| GET    | `/callback` | None (called directly by Google) | Exchanges the auth code for tokens, stores the refresh token |

Deliberately **not** behind the normal `authMiddleware`/`roleMiddleware`
pipeline, unlike every other route in this project — see the Google
Calendar Sync section below for why each of these needs a different
identification mechanism.

## AI Pre-Visit Summaries (Phase 5)

When a patient books with a `reasonForVisit`, `aiService.generateAndStorePreVisitSummary`
calls Gemini (via `@google/genai`) to produce a JSON object — `summary`,
`urgency` (`LOW`/`MEDIUM`/`HIGH`), and `suggestedQuestions` — using
`config.responseSchema` to constrain the model's output shape at the API
level. The result is stored back onto the `Appointment` row.

This call happens **after** the booking's `201` response has already been
sent to the patient, and is never `await`-ed by the request — booking
success is fully independent of whether the AI call succeeds, fails, times
out, or returns malformed data. Every failure mode is caught inside
`aiService.js` and simply leaves the AI fields `null` (confirmed live: with
no `GEMINI_API_KEY` configured, booking still returned `201` instantly, and
the failure was only visible as a server-side log line).

The prompt (`src/prompts/preVisitSummaryPrompt.js`) explicitly instructs the
model not to diagnose or suggest treatment — its job is to summarize what
the patient wrote and flag urgency for the doctor's own judgment.

## Doctor Notes, Prescriptions & Patient Summaries (Phase 6)

When a doctor submits visit notes via `POST /api/doctor/appointments/:id/visit`,
`visitService.submitVisit` stores `doctorNotes` and creates one `Prescription`
row per medication in a single transaction, and marks the appointment
`completedAt`. Then, same pattern as Phase 5, `aiService.generateAndStorePatientSummary`
runs in the background (not awaited, never affects the response already
sent) to translate the clinical notes into a `patientSummary` — this time as
plain text via `response.text` rather than `responseSchema`, since the
output is one block of prose rather than several distinct fields.

**Two audiences, enforced at the query level, not just by convention:**
`getDoctorAppointments` (`include`) returns everything, including raw
`doctorNotes` — the doctor wrote it. `getMyAppointments` (`select`
whitelist) deliberately omits `doctorNotes` and the Phase 5
`aiSummary`/`aiUrgency`/`aiSuggestedQuestions` fields — a patient sees their
own `patientSummary` and prescriptions, never the clinician-internal prep
notes. Verified live: the same appointment returns different shapes
depending on who's asking.

## Notifications & Cancellation (Phase 7)

Building a real cancellation email required first building real
cancellation — `Appointment` didn't have any concept of "no longer active"
before this phase. `cancelAppointment` (ownership check, then rejects if
already cancelled/completed/in the past) soft-deletes via `cancelledAt`, and
`getAvailableSlots` filters `cancelledAt: null` so a cancelled slot
immediately shows as bookable to everyone else.

**The unique constraint had to change to make that safe.** The plain
`@@unique([doctorId, date, startTime])` from Phase 4 would have permanently
blocked that slot even after cancellation, since the cancelled row still
physically exists. Fixed with a **partial unique index** — unique only
among rows where `cancelledAt IS NULL`:

```sql
CREATE UNIQUE INDEX "Appointment_doctorId_date_startTime_active_key"
ON "Appointment"("doctorId", "date", "startTime")
WHERE "cancelledAt" IS NULL;
```

Prisma's schema language has no syntax for a `WHERE`-conditioned index, so
`schema.prisma` only has a plain `@@index` (for query performance) — the
real constraint lives by hand in
`prisma/migrations/20260703192635_add_cancellation/migration.sql`, generated
via `prisma migrate dev --create-only` and edited before applying. This is
normal Prisma practice, not a workaround: migrations are just SQL files you
can edit.

Verified live: booked `09:00`, confirmed it disappeared from the slot list,
cancelled it, confirmed `09:00` reappeared, then had a **different
booking** actually succeed for that same slot — two `Appointment` rows now
coexist for the identical `(doctorId, date, startTime)`, one cancelled and
one active, proving the database itself (not just the slot-search query)
treats them as non-conflicting.

Email is sent via `notificationService.js` using the same fire-and-forget,
never-throws pattern as the AI services — a booking or cancellation always
succeeds regardless of whether email delivery does. By default (no
`SMTP_HOST` set) it auto-provisions a free Ethereal test account with zero
signup; every send logs a preview URL instead of hitting a real inbox.
`sendAppointmentReminderEmail` exists but has no automatic trigger yet —
Phase 8 introduces `node-cron`, which is what actually decides *when* a
reminder should fire, for both appointment reminders and medication
reminders alike.

## Scheduled Jobs (Phase 8)

Two daily cron jobs, registered in `src/jobs/` and started once from
`server.js` (deliberately not `app.js` — same reasoning as keeping
`app.listen()` out of `app.js` since Phase 1: `app.js` must stay
side-effect-free and importable on its own):

| Job | Schedule | What it does |
| --- | --- | --- |
| Appointment reminders | `0 8 * * *` (08:00 UTC daily) | Emails patients with an appointment happening tomorrow |
| Medication reminders  | `0 9 * * *` (09:00 UTC daily) | Emails patients with any prescription still active today, one batched email per patient |

All the actual logic lives in `src/services/reminderService.js`, which has
no dependency on `node-cron` at all — the job files in `src/jobs/` are thin
wrappers that just call these functions on a schedule. That separation
means the logic can be (and was) tested directly, without waiting for a
real 8am.

**Idempotency**, extending the same nullable-timestamp pattern used
throughout this schema: `Appointment.reminderSentAt` and
`Prescription.lastReminderSentAt` track whether a reminder already went
out, so if the job somehow ran twice (e.g. a server restart mid-day), it
won't double-send. Verified live: ran both jobs manually against seeded
test data — the appointment-reminder job found and emailed 1 appointment,
the medication-reminder job found 1 patient with 2 active prescriptions and
sent one combined email (not two) — then ran both again immediately, and
each found 0 remaining, confirming the timestamps were set correctly the
first time.

**Known limitation, stated plainly:** `node-cron` schedules live only in
the Node process's memory. If the server is down at 08:00 UTC, that day's
run simply never fires — there's no catch-up. Acceptable for this
project's scale; a system needing guaranteed delivery would use a
persistent job queue instead.

## Google Calendar Sync (Phase 9)

### Setup

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com).
2. **APIs & Services → Library** → enable the **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** → User type **External**, add scope
   `https://www.googleapis.com/auth/calendar.events`, and add your own Google
   account under **Test users** (required — while the app is in "Testing"
   status, only listed test accounts can complete the consent screen).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   type **Web application**, with authorized redirect URI
   `http://localhost:5000/api/doctor/google/callback`.
5. Put the resulting Client ID/Secret into `.env` as `GOOGLE_CLIENT_ID` /
   `GOOGLE_CLIENT_SECRET`.

### Design

Sync targets the **doctor's** calendar (not the patient's) — the practical
use case is a doctor wanting their clinic schedule on their personal
calendar. The three operations map directly onto existing lifecycle events,
rather than inventing new ones:

| Operation | Triggered by | Function |
| --- | --- | --- |
| Create | Patient books (`bookAppointment`) | `createEventForAppointment` |
| Update | Doctor completes the visit (`submitVisit`) | `updateEventForCompletedVisit` |
| Delete | Patient cancels (`cancelAppointment`) | `deleteEventForAppointment` |

`Appointment.googleCalendarEventId` (`String?`) is what makes update/delete
possible at all — without storing the ID Google returns at creation time,
there'd be no way to know which event corresponds to which appointment.
`Doctor.googleRefreshToken` (`String?`) is null until a doctor completes the
OAuth flow; every calendar function checks for it first and silently
no-ops if absent — calendar sync is opt-in per doctor, never an error.

**Same never-throws, fire-and-forget pattern as Gemini and email — now for
a third external service.** By this phase, that's the one idea threading
through the whole second half of this project: anything we don't control
(an LLM, an SMTP server, Google's API) is isolated behind this same shape,
so its failure never touches the request that triggered it.

**Two honest simplifications in the OAuth wiring, not overlooked edge
cases:**
- The OAuth callback route can't use our normal JWT auth (Google calls it
  directly, no header we control) — the doctor is identified via the
  `state` parameter instead, set to their `Doctor.id` when `/connect` built
  the consent URL. Production systems would sign/encrypt this value against
  tampering; here it's a plain ID.
- `/connect` is reached by a plain browser navigation, which can't attach
  an `Authorization` header — so it accepts the JWT as a `?token=` query
  parameter instead, for this one route only.

### Verified live, against the real Google Calendar API (not just our database)

Confirmed via a direct read from `calendar.events.get()` after each step:
- **Create**: booked an appointment with a connected doctor → fetched the
  real event back → correct `summary` ("Appointment: \<patient name\>"),
  `description` (the patient's `reasonForVisit`), and start/end times
  (Google echoed them back in the calendar's local timezone, e.g.
  `15:30+05:30`, which is the same instant as the `10:00 UTC` submitted —
  worth knowing, not a bug).
- **Update**: completed that visit → refetched the same event → description
  changed to `"Visit completed.\n\nNotes: ..."`, while `summary` stayed
  untouched (`events.patch` only overwrites the fields you send).
- **Delete**: cancelled a different appointment → refetched its event →
  `status: "cancelled"`, Google's tombstone marker for a deleted event
  (per Google's own docs, this is the expected terminal state for a
  deleted event fetched directly by ID, not a sign it's still active).
- **Resilience**: with no doctor connected, booking/cancellation/visit
  submission all still returned normally (`201`/`200`) with
  `googleCalendarEventId: null` and no errors logged — proving the
  opt-in/silent-skip behavior, same as every other external service in
  this project.

## Database Schema

### `User`

| Field       | Type                          | Notes                                   |
| ----------- | ----------------------------- | ------------------------------------------ |
| `id`        | `Int` (autoincrement)          | Primary key                                |
| `name`      | `String`                       |                                             |
| `email`     | `String` (unique)              | Login identifier                           |
| `password`  | `String`                       | bcrypt hash, never the plain password      |
| `role`      | `Role` enum (`ADMIN`/`DOCTOR`/`PATIENT`) | Drives what role middleware allows |
| `createdAt` | `DateTime`                     | Set automatically                          |
| `updatedAt` | `DateTime`                     | Updated automatically on every write       |

### `Doctor` (1-to-1 with `User`)

| Field                 | Type              | Notes                                          |
| --------------------- | ----------------- | ------------------------------------------------- |
| `userId`              | `Int` (unique)    | Links to the `User` row that holds auth/email/password |
| `specialization`      | `String`          | What patients search/filter by (Phase 4)          |
| `slotDurationMinutes` | `Int`, default 30 | Length of one bookable appointment (Phase 4)      |
| `googleRefreshToken`  | `String?` (Phase 9) | Null until the doctor completes Google OAuth; calendar sync is opt-in per doctor |

### `WorkingHour` (recurring weekly schedule, one row per day worked)

| Field       | Type            | Notes                                    |
| ----------- | --------------- | -------------------------------------------- |
| `dayOfWeek` | `Int` (0-6)     | 0=Sunday...6=Saturday                        |
| `startTime` / `endTime` | `String` "HH:mm" | 24-hour, zero-padded so string comparison works |

Unique on `(doctorId, dayOfWeek)` — no split shifts.

### `Leave` (specific unavailable dates, one row per date)

| Field    | Type              | Notes                                  |
| -------- | ----------------- | ------------------------------------------ |
| `date`   | `DateTime @db.Date` | A single calendar date                    |
| `reason` | `String?`          | Optional                                   |

Unique on `(doctorId, date)`. A date *range* is expanded into individual rows
by the `addLeave` service function, so availability checks (Phase 4) stay a
simple existence lookup instead of a range-overlap query.

### `Appointment` (a booked slot)

| Field                   | Type                | Notes                                             |
| ------------------------ | ------------------- | -------------------------------------------------- |
| `doctorId` / `patientId` | `Int` FKs           | Links to `Doctor` and directly to `User`             |
| `date`                   | `DateTime @db.Date` | Same pure-calendar-date pattern as `Leave`          |
| `startTime` / `endTime`  | `String` "HH:mm"    | Same format as `WorkingHour`                        |

A **partial unique index** on `(doctorId, date, startTime)` where
`cancelledAt IS NULL` (Phase 7) is what makes double-booking of an *active*
slot impossible while still allowing rebooking after a cancellation — see
the Notifications & Cancellation section above for why this needed hand-written
migration SQL.

Also on `Appointment` (Phase 5): `reasonForVisit` (`String?`, patient input)
and the AI output fields `aiSummary` (`String?`), `aiUrgency` (`String?`),
`aiSuggestedQuestions` (`String[]`), `aiGeneratedAt` (`DateTime?`). All
nullable/empty by default — `aiGeneratedAt` being `null` means AI either
wasn't requested or failed, independent of whether the booking succeeded.

Also on `Appointment` (Phase 6): `doctorNotes` (`String?`, clinician-internal,
never shown to the patient — see the API section above), `completedAt`
(`DateTime?`, same nullable-timestamp-as-status pattern used throughout this
project), and the patient-facing AI output `patientSummary` (`String?`) /
`patientSummaryGeneratedAt` (`DateTime?`).

Also on `Appointment` (Phase 7): `cancelledAt` (`DateTime?`) — soft-delete
for cancellation, kept as a row rather than deleted so cancellation history
stays visible to both patient and doctor.

Also on `Appointment` (Phase 8): `reminderSentAt` (`DateTime?`) — set once
the day-before reminder email has gone out, preventing a double-send if the
scheduled job somehow runs more than once.

Also on `Appointment` (Phase 9): `googleCalendarEventId` (`String?`) — the
Google Calendar event this appointment created on the doctor's calendar, if
any. Required for update/delete to know which event to touch; null if the
doctor never connected their calendar or the create call failed.

### `Prescription`

| Field                            | Type      | Notes                                              |
| ---------------------------------- | --------- | ------------------------------------------------------ |
| `appointmentId`                    | `Int` FK  | One appointment can have many prescriptions (`onDelete: Cascade`) |
| `medicineName` / `dosage`          | `String`  | e.g. "Cetirizine", "10mg"                            |
| `frequency` / `durationDays`       | `String` / `Int` | Used by the Phase 8 medication reminder job to compute the active date range |
| `instructions`                     | `String?` | Optional, e.g. "Take at bedtime"                      |
| `lastReminderSentAt`                | `DateTime?` (Phase 8) | When the last "take your medication" email was sent, so the daily job doesn't resend the same day |

## Build Progress

- [x] Phase 1 — Project setup
- [x] Phase 2 — Authentication
- [x] Phase 3 — Admin (doctor management)
- [x] Phase 4 — Patient booking
- [x] Phase 5 — AI pre-visit summaries
- [x] Phase 6 — Doctor notes & prescriptions
- [x] Phase 7 — Notifications (email)
- [x] Phase 8 — Medication reminders (cron)
- [x] Phase 9 — Google Calendar sync

All 9 phases complete.
