const express = require("express");
const appointmentController = require("../controllers/appointmentController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("PATIENT"));

router.post("/", appointmentController.bookAppointment);
router.get("/me", appointmentController.getMyAppointments);
router.delete("/:appointmentId", appointmentController.cancelAppointment);

module.exports = router;
