const authService = require('../services/auth.service');

module.exports = {
  register: async (req, res) => res.status(201).json({ data: await authService.register(req.body) }),
  login: async (req, res) => res.json({ data: await authService.login(req.body) }),
  adminLogin: async (req, res) => res.json({ data: await authService.adminLogin(req.body) }),
  me: async (req, res) => res.json({ data: await authService.me(req.user.sub) }),
  updateProfile: async (req, res) => res.json({ data: await authService.updateProfile(req.user.sub, req.body) }),
  forgotPassword: async (req, res) => res.json({ data: await authService.forgotPassword(req.body.email) }),
  resetPassword: async (req, res) => res.json({ data: await authService.resetPassword(req.body) })
};
