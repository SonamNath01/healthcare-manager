const express = require("express");
const doctorController = require("../controllers/doctorController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("ADMIN"));

router.post("/doctors", doctorController.createDoctor);
router.get("/doctors", doctorController.listDoctors);
router.get("/doctors/:doctorId", doctorController.getDoctor);
router.put("/doctors/:doctorId", doctorController.updateDoctor);
router.put("/doctors/:doctorId/working-hours", doctorController.setWorkingHours);
router.post("/doctors/:doctorId/leave", doctorController.addLeave);
router.delete("/doctors/:doctorId/leave/:leaveId", doctorController.deleteLeave);

module.exports = router;
