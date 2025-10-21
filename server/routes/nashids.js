const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Nashid = require('../models/Nashid');

// POST /api/nashids/favorite - Add/Remove nashid from favorites
router.post('/favorite', async (req, res) => {
  try {
    const { telegramId, nashidId } = req.body;

    if (!telegramId || !nashidId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram ID and Nashid ID are required'
      });
    }

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle favorite
    const index = user.favorites.nashids.indexOf(nashidId);
    if (index > -1) {
      user.favorites.nashids.splice(index, 1);
    } else {
      user.favorites.nashids.push(nashidId);
    }

    await user.save();

    console.log(`🎵 Nashid ${nashidId} favorite toggled for user ${telegramId}`);

    res.json({
      success: true,
      favorites: user.favorites.nashids
    });

  } catch (error) {
    console.error('❌ Favorite nashid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/nashids/offline - Add/Remove nashid from offline
router.post('/offline', async (req, res) => {
  try {
    const { telegramId, nashidId } = req.body;

    if (!telegramId || !nashidId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram ID and Nashid ID are required'
      });
    }

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle offline
    const index = user.offline.nashids.indexOf(nashidId);
    if (index > -1) {
      user.offline.nashids.splice(index, 1);
      user.usage.nashidsOffline = Math.max(0, user.usage.nashidsOffline - 1);
    } else {
      user.offline.nashids.push(nashidId);
      user.usage.nashidsOffline += 1;
    }

    await user.save();

    console.log(`💾 Nashid ${nashidId} offline toggled for user ${telegramId}`);

    res.json({
      success: true,
      offline: user.offline.nashids,
      usage: user.usage
    });

  } catch (error) {
    console.error('❌ Offline nashid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/nashids/favorites/:telegramId - Get user's favorite nashids
router.get('/favorites/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      favorites: user.favorites.nashids
    });

  } catch (error) {
    console.error('❌ Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/nashids/playlist - Create or update playlist
router.post('/playlist', async (req, res) => {
  try {
    const { telegramId, name, nashids } = req.body;

    if (!telegramId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Telegram ID and playlist name are required'
      });
    }

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add playlist to user's playlists array (if exists in schema)
    // For now, we'll just log it
    console.log(`🎼 Playlist "${name}" created for user ${telegramId}`);

    res.json({
      success: true,
      message: 'Playlist created successfully'
    });

  } catch (error) {
    console.error('❌ Create playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/nashids - Get all nashids for users
router.get('/', async (req, res) => {
  try {
    const { search, category, language, limit = 50 } = req.query;

    // Build filter
    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = category;
    }

    if (language) {
      filter.language = language;
    }

    const nashids = await Nashid.find(filter)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .limit(parseInt(limit))
      .select('nashidId title titleTransliteration artist audioUrl coverImage cover duration category language releaseYear accessLevel isExclusive');

    console.log(`🎵 Fetched ${nashids.length} nashids for users`);

    res.json({
      success: true,
      nashids,
      count: nashids.length
    });

  } catch (error) {
    console.error('❌ Get nashids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nashids',
      error: error.message
    });
  }
});

// GET /api/nashids/:id - Get single nashid
router.get('/:id', async (req, res) => {
  try {
    const nashid = await Nashid.findById(req.params.id);

    if (!nashid) {
      return res.status(404).json({
        success: false,
        message: 'Nashid not found'
      });
    }

    console.log(`🎵 Fetched nashid: ${nashid.title}`);

    res.json({
      success: true,
      nashid: {
        ...nashid.toObject(),
        id: nashid._id
      }
    });

  } catch (error) {
    console.error('❌ Get nashid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nashid',
      error: error.message
    });
  }
});

module.exports = router;
