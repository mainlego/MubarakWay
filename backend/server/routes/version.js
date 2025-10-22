/**
 * Version API Route
 *
 * Provides version information for the application.
 * Used for cache busting and update notifications.
 */

const express = require('express');
const router = express.Router();
const { readFileSync } = require('fs');
const path = require('path');

// Read version from package.json
const getServerVersion = () => {
  try {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version;
  } catch (error) {
    console.error('Error reading server version:', error);
    return '1.0.0';
  }
};

// GET /api/version - Get current version information
router.get('/', (req, res) => {
  try {
    const serverVersion = getServerVersion();
    const buildTime = process.env.BUILD_TIME || new Date().toISOString();

    res.json({
      success: true,
      version: {
        server: serverVersion,
        buildTime: buildTime,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Version endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get version information'
    });
  }
});

module.exports = router;
