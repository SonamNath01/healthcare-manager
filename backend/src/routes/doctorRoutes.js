const express = require("express");
const publicDoctorController = require("../controllers/publicDoctorController");

const router = express.Router();

router.get("/", publicDoctorController.searchDoctors);
router.get("/:doctorId/slots", publicDoctorController.getSlots);

module.exports = router;
