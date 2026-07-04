const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const googleCalendarService = require("../services/googleCalendarService");
const AppError = require("../utils/AppError");

// Reached by a plain browser navigation (e.g. a link/button in a frontend),
// which can't attach our normal Authorization header -- so this route
// accepts the JWT as a query parameter instead, just for this one endpoint.
// Real production systems would use a short-lived, single-use link rather
// than the JWT itself in a URL (tokens in URLs can leak via logs/referrers);
// this is a deliberate scope simplification, called out in the README.
async function connect(req, res) {
  const { token } = req.query;
  if (!token) {
    throw new AppError("A token query parameter is required to start this flow", 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError("Invalid or expired token", 401);
  }

  if (decoded.role !== "DOCTOR") {
    throw new AppError("Only doctors can connect a Google Calendar", 403);
  }

  const doctor = await prisma.doctor.findUnique({ where: { userId: decoded.id } });
  if (!doctor) {
    throw new AppError("No doctor profile found for this account", 404);
  }

  res.redirect(googleCalendarService.getAuthUrl(doctor.id));
}

// Google calls this directly after the doctor grants (or denies) consent --
// there's no Authorization header at all here, by design. The doctor is
// identified via the "state" parameter, which /connect set to their
// Doctor.id when building the consent URL.
async function callback(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    // Route through AppError/errorHandler (JSON response) rather than
    // res.send() with a raw template string: res.send(string) serves
    // text/html by default, so interpolating unsanitized query input
    // there is a reflected XSS on this unauthenticated, publicly
    // reachable route -- confirmed live with a crafted ?error=<script>...
    // JSON responses aren't rendered as HTML, which closes that off.
    throw new AppError(`Google OAuth error: ${error}`, 400);
  }
  if (!code || !state) {
    throw new AppError("Missing code or state from Google's redirect", 400);
  }

  const doctorId = Number(state);
  if (!Number.isInteger(doctorId)) {
    throw new AppError("Invalid state parameter", 400);
  }

  await googleCalendarService.handleOAuthCallback(code, doctorId);

  res.send("Google Calendar connected successfully. You can close this window.");
}

module.exports = { connect, callback };
