const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');

// GET /api/subscriptions - Get all active subscription tiers (public)
router.get('/', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ isActive: true })
      .sort({ order: 1 })
      .select('-createdAt -updatedAt -__v');

    res.json({
      success: true,
      subscriptions,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('❌ Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
});

// GET /api/subscriptions/:tier - Get specific subscription tier (public)
router.get('/:tier', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      tier: req.params.tier,
      isActive: true
    }).select('-createdAt -updatedAt -__v');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('❌ Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message
    });
  }
});

module.exports = router;
