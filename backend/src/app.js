const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorPortalRoutes = require("./routes/doctorPortalRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(morgan("dev"));

app.use(cors());

app.use(express.json());
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctor/google", googleAuthRoutes);
app.use("/api/doctor", doctorPortalRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
