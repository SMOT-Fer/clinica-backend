// /ws/auth.ws.js
const express = require('express');
const router = express.Router();

const AuthBusiness = require('../business/auth.business');

/**
 * POST /auth/login
 * Body:
 * {
 *   "email": string,
 *   "password": string
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await AuthBusiness.login(email, password);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
