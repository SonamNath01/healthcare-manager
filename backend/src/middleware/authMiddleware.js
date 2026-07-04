const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Not authenticated", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    throw new AppError("Invalid or expired token", 401);
  }
}

module.exports = authMiddleware;
