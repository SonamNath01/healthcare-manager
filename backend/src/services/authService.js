const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const generateToken = require("../utils/generateToken");
const AppError = require("../utils/AppError");
async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new AppError("name, email, and password are required", 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: "PATIENT" },
  });

  const token = generateToken(user);
  return { user: sanitizeUser(user), token };
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new AppError("email and password are required", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken(user);
  return { user: sanitizeUser(user), token };
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return sanitizeUser(user);
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

module.exports = { registerUser, loginUser, getUserById };
