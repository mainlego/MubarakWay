const mongoose = require('mongoose');

const nashidSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  titleTransliteration: {
    type: String,
    default: ''
  },
  artist: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  cover: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    default: function() {
      return this.cover;
    }
  },
  audioUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['spiritual', 'family', 'gratitude', 'prophetic', 'tawhid'],
    required: true
  },
  language: {
    type: String,
    default: 'ar',
    enum: ['ar', 'ru', 'en', 'tr']
  },
  releaseYear: {
    type: Number,
    default: function() {
      return new Date().getFullYear();
    }
  },
  accessLevel: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free'
  },
  isExclusive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Индексы
nashidSchema.index({ title: 'text', artist: 'text' });
nashidSchema.index({ category: 1 });
nashidSchema.index({ createdAt: -1 });

const Nashid = mongoose.model('Nashid', nashidSchema);

module.exports = Nashid;
