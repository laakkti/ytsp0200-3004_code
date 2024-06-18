const express = require('express');
const userControllers = require('../controllers/user-controllers');

const router = express.Router();

// Routes
router.post('/login', userControllers.login);
router.post('/register', userControllers.register);

module.exports = router;
