const nodemailer = require("nodemailer");

let transporterPromise;
function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = process.env.SMTP_HOST
      ? Promise.resolve(
          nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_PORT === "465",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          })
        )
      : nodemailer.createTestAccount().then((testAccount) => {
          console.log(
            "No SMTP_HOST configured -- using an auto-generated Ethereal test account for email (preview links will be logged per email, nothing is really delivered)."
          );
          return nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: { user: testAccount.user, pass: testAccount.pass },
          });
        });
  }
  return transporterPromise;
}

module.exports = { getTransporter };
