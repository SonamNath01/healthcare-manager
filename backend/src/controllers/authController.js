const authService = require("../services/authService");

// Controllers only deal with HTTP: read the request, call the service,
// send the response. No business logic and no direct Prisma calls here.
async function register(req, res) {
  const { user, token } = await authService.registerUser(req.body);
  res.status(201).json({ user, token });
}

async function login(req, res) {
  const { user, token } = await authService.loginUser(req.body);
  res.status(200).json({ user, token });
}

async function getMe(req, res) {
  const user = await authService.getUserById(req.user.id);
  res.status(200).json({ user });
}

module.exports = { register, login, getMe };
