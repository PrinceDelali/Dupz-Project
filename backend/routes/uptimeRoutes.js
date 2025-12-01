/**
 * Uptime Routes
 * 
 * Routes for uptime monitoring and server health checks
 */

import express from 'express';
import pingServer from '../utils/keepAlive.js';
import { getUptimeStatus } from '../utils/uptimeService.js';

const router = express.Router();

/**
 * @route   GET /api/v1/uptime/ping
 * @desc    Ping the server and return status (for UptimeRobot)
 * @access  Public
 */
router.get('/ping', (req, res) => {
  const timestamp = new Date().toISOString();
  res.status(200).json({
    status: 'success',
    message: 'Server is up and running',
    timestamp
  });
});

/**
 * @route   GET /api/v1/uptime/status
 * @desc    Get uptime service status
 * @access  Public
 */
router.get('/status', (req, res) => {
  const status = getUptimeStatus();
  res.status(200).json({
    status: 'success',
    data: status
  });
});

/**
 * @route   POST /api/v1/uptime/manual-ping
 * @desc    Manually trigger a server ping
 * @access  Public
 */
router.post('/manual-ping', async (req, res) => {
  try {
    await pingServer();
    res.status(200).json({
      status: 'success',
      message: 'Manual ping successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Manual ping failed',
      error: error.message
    });
  }
});

export default router; 