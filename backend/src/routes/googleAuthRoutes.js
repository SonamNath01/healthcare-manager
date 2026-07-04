const express = require("express");
const googleAuthController = require("../controllers/googleAuthController");

const router = express.Router();
router.get("/connect", googleAuthController.connect);
router.get("/callback", googleAuthController.callback);

module.exports = router;
