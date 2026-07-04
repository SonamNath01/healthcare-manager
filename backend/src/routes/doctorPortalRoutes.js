const express = require("express");
const appointmentController = require("../controllers/appointmentController");
const visitController = require("../controllers/visitController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("DOCTOR"));

router.get("/appointments", appointmentController.getDoctorAppointments);
router.post("/appointments/:appointmentId/visit", visitController.submitVisit);

module.exports = router;
