/**
 * Location API Routes
 *
 * Handles user location updates from web app
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Helper function to determine timezone from coordinates
function getTimezoneFromCoordinates(lat, lon) {
  const timezones = [
    { name: 'Europe/Moscow', lat: [41, 82], lon: [19, 180] },
    { name: 'Europe/Kaliningrad', lat: [54, 56], lon: [19, 23] },
    { name: 'Europe/Samara', lat: [50, 56], lon: [45, 55] },
    { name: 'Asia/Yekaterinburg', lat: [54, 62], lon: [55, 65] },
    { name: 'Asia/Omsk', lat: [53, 60], lon: [68, 78] },
    { name: 'Asia/Krasnoyarsk', lat: [51, 72], lon: [84, 106] },
    { name: 'Asia/Irkutsk', lat: [50, 62], lon: [100, 120] },
    { name: 'Asia/Yakutsk', lat: [55, 75], lon: [115, 148] },
    { name: 'Asia/Vladivostok', lat: [42, 70], lon: [130, 150] },
    { name: 'Asia/Tashkent', lat: [37, 46], lon: [55, 74] },
    { name: 'Asia/Almaty', lat: [40, 56], lon: [46, 88] },
    { name: 'Europe/Istanbul', lat: [36, 42], lon: [25, 45] },
    { name: 'Asia/Dubai', lat: [22, 27], lon: [51, 57] },
    { name: 'Asia/Riyadh', lat: [16, 33], lon: [34, 56] },
    { name: 'Europe/London', lat: [49, 61], lon: [-11, 2] },
    { name: 'Europe/Paris', lat: [41, 51], lon: [-5, 10] },
    { name: 'Europe/Berlin', lat: [47, 55], lon: [5, 16] },
    { name: 'Asia/Jakarta', lat: [-11, 6], lon: [95, 141] },
    { name: 'Asia/Karachi', lat: [23, 38], lon: [60, 78] },
    { name: 'Asia/Dhaka', lat: [20, 27], lon: [88, 93] },
    { name: 'Asia/Tehran', lat: [25, 40], lon: [44, 64] },
    { name: 'Asia/Baghdad', lat: [29, 38], lon: [38, 49] },
    { name: 'Europe/Kiev', lat: [44, 53], lon: [22, 41] },
    { name: 'Europe/Minsk', lat: [51, 57], lon: [23, 33] },
  ];

  for (const tz of timezones) {
    if (lat >= tz.lat[0] && lat <= tz.lat[1] &&
        lon >= tz.lon[0] && lon <= tz.lon[1]) {
      return tz.name;
    }
  }

  const offset = Math.round(lon / 15);
  return offset >= 0 ? `Etc/GMT-${offset}` : `Etc/GMT+${Math.abs(offset)}`;
}

// POST /api/location - Update user location
router.post('/', async (req, res) => {
  try {
    const { telegramId, latitude, longitude, city, country } = req.body;

    console.log(`📍 Received location update from user ${telegramId}:`, {
      latitude,
      longitude,
      city,
      country
    });

    // Validate required fields
    if (!telegramId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: telegramId, latitude, longitude'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    // Determine timezone
    const timezone = getTimezoneFromCoordinates(latitude, longitude);

    console.log(`🌍 Detected timezone: ${timezone}`);

    // Find or create user
    let user = await User.findOne({ telegramId });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        telegramId,
        prayerSettings: {
          location: {
            latitude,
            longitude,
            city: city || null,
            country: country || null,
            timezone,
            updatedAt: new Date()
          },
          notifications: {
            enabled: true
          }
        }
      });

      console.log(`✅ Created new user ${telegramId} with location`);
    } else {
      // Update existing user
      user.prayerSettings = user.prayerSettings || {};
      user.prayerSettings.location = {
        latitude,
        longitude,
        city: city || user.prayerSettings.location?.city || null,
        country: country || user.prayerSettings.location?.country || null,
        timezone,
        updatedAt: new Date()
      };

      console.log(`✅ Updated location for user ${telegramId}`);
    }

    // Update last active
    user.lastActive = new Date();

    // Save to database
    await user.save();

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: {
          latitude,
          longitude,
          city: user.prayerSettings.location.city,
          country: user.prayerSettings.location.country,
          timezone
        }
      }
    });

  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
});

// GET /api/location/:telegramId - Get user location
router.get('/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user = await User.findOne({ telegramId });

    if (!user || !user.prayerSettings?.location?.latitude) {
      return res.status(404).json({
        success: false,
        message: 'Location not found for this user'
      });
    }

    res.json({
      success: true,
      data: {
        location: user.prayerSettings.location
      }
    });

  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location',
      error: error.message
    });
  }
});

module.exports = router;
