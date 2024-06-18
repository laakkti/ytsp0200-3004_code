const express = require('express');
const ndviControllers = require('../controllers/ndvi-controllers');
const sentinelhubTokenMiddleware = require('../sentinelhub/sentinelhub_token');
const router = express.Router();

// Middleware for checking token
const { checkToken } = sentinelhubTokenMiddleware;

// Routes
router.post('/list', checkToken, ndviControllers.list);
router.post('/activate', checkToken, ndviControllers.activate);
router.get('/image/:sentinelid', ndviControllers.image);
router.post('/weather', ndviControllers.weather);
router.get('/aois', ndviControllers.AOIs);

module.exports = router;
