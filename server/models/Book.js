const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  author: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  cover: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    default: ''
  },
  textExtracted: {
    type: Boolean,
    default: false
  },
  isPro: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['religious', 'education', 'spiritual'],
    required: true
  },
  genre: {
    type: String,
    enum: ['quran', 'hadith', 'prophets', 'aqidah', 'tafsir', 'islam'],
    required: true
  },
  language: {
    type: String,
    enum: ['ru', 'ar', 'en'],
    default: 'ru'
  },
  isExclusive: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reactions: {
    type: Number,
    default: 0
  },
  publishedDate: {
    type: Date,
    default: Date.now
  },
  isNew: {
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

// Индексы для поиска
bookSchema.index({ title: 'text', author: 'text', description: 'text', extractedText: 'text' });
bookSchema.index({ isPro: 1, category: 1 });
bookSchema.index({ publishedDate: -1 });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
