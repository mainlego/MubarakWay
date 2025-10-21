# Оставшиеся задачи для завершения

## ✅ Выполнено:

### 1. Debug логи
- ✅ Добавлен `debugLog()` helper
- ✅ Логи работают только в development mode
- ✅ В production логи отключены

### 2. Кастомные категории для нашидов
- ✅ Добавлено состояние `categories`, `showCustomCategory`, `customCategory`
- ✅ Добавлен UI для создания своей категории (кнопка "+ Добавить свою категорию")
- ✅ Обновлена модель `Nashid.js` - убран enum, теперь принимает любые категории
- ✅ Админ может создать категорию прямо при добавлении нашида

## ⏳ В процессе:

### 3. Главный экран с фильтрами (50% готово)

**Что уже есть:**
- Файл `mubarak-way/src/pages/Home.jsx` существует
- Отображает время намаза и статистику

**Что нужно добавить:**

#### 3.1. Добавить секцию ТОП и Новинки

Найти в `Home.jsx` после секции с молитвами и добавить:

```jsx
// После секции молитв (примерно строка 150-200)

{/* TOP and NEW Section */}
<section className="mt-8">
  {/* Tabs */}
  <div className="flex gap-4 mb-6">
    <button
      onClick={() => setActiveTab('top')}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
        activeTab === 'top'
          ? 'bg-white text-purple-900 shadow-lg'
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      <TrendingUp className="w-5 h-5" />
      ТОП
    </button>
    <button
      onClick={() => setActiveTab('new')}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
        activeTab === 'new'
          ? 'bg-white text-purple-900 shadow-lg'
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      <Sparkles className="w-5 h-5" />
      Новинки
    </button>
  </div>

  {/* Content based on active tab */}
  {activeTab === 'top' ? (
    <div>
      {/* TOP Books */}
      <h3 className="text-xl font-bold text-white mb-4">ТОП Книги</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* Render top books */}
      </div>

      {/* TOP Nashids */}
      <h3 className="text-xl font-bold text-white mb-4">ТОП Нашиды</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Render top nashids */}
      </div>
    </div>
  ) : (
    <div>
      {/* NEW Books */}
      <h3 className="text-xl font-bold text-white mb-4">Новые Книги</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* Render new books */}
      </div>

      {/* NEW Nashids */}
      <h3 className="text-xl font-bold text-white mb-4">Новые Нашиды</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Render new nashids */}
      </div>
    </div>
  )}
</section>
```

#### 3.2. Добавить состояние в начале компонента:

```jsx
const [activeTab, setActiveTab] = useState('top');
const [topBooks, setTopBooks] = useState([]);
const [topNashids, setTopNashids] = useState([]);
const [newBooks, setNewBooks] = useState([]);
const [newNashids, setNewNashids] = useState([]);
```

#### 3.3. Добавить функцию загрузки контента:

```jsx
const fetchTopAndNew = async () => {
  try {
    const [booksRes, nashidsRes] = await Promise.all([
      axios.get(`${API_URL}/api/books`),
      axios.get(`${API_URL}/api/nashids`)
    ]);

    const books = booksRes.data.books || [];
    const nashids = nashidsRes.data.nashids || [];

    // TOP: Sort by rating + reactions
    const topBooksData = [...books]
      .sort((a, b) => ((b.rating || 0) + (b.reactions || 0)) - ((a.rating || 0) + (a.reactions || 0)))
      .slice(0, 6);

    const topNashidsData = [...nashids]
      .sort((a, b) => ((b.rating || 0) + (b.reactions || 0)) - ((a.rating || 0) + (a.reactions || 0)))
      .slice(0, 6);

    // NEW: Sort by date
    const newBooksData = [...books]
      .sort((a, b) => new Date(b.publishedDate || b.createdAt) - new Date(a.publishedDate || a.createdAt))
      .slice(0, 6);

    const newNashidsData = [...nashids]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    setTopBooks(topBooksData);
    setTopNashids(topNashidsData);
    setNewBooks(newBooksData);
    setNewNashids(newNashidsData);
  } catch (error) {
    console.error('Error fetching content:', error);
  }
};

// Call in useEffect
useEffect(() => {
  fetchTopAndNew();
}, []);
```

---

## 4. Система лайков и рейтингов

### 4.1. Обновить модели (Backend)

**server/models/Book.js** - добавить после поля `reactions`:

```javascript
likes: {
  type: Number,
  default: 0,
  min: 0
},
likedBy: [{
  type: String  // telegramId пользователей
}]
```

**server/models/Nashid.js** - добавить:

```javascript
rating: {
  type: Number,
  default: 0,
  min: 0,
  max: 5
},
reactions: {
  type: Number,
  default: 0,
  min: 0
},
likes: {
  type: Number,
  default: 0,
  min: 0
},
likedBy: [{
  type: String  // telegramId пользователей
}],
ratedBy: [{
  userId: String,
  rating: Number
}]
```

### 4.2. Создать API endpoints

**server/routes/books.js** - добавить:

```javascript
// POST /api/books/:id/like
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { telegramId } = req.body;

    const book = await Book.findOne({ bookId: parseInt(id) });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Toggle like
    const likedIndex = book.likedBy.indexOf(telegramId);
    if (likedIndex > -1) {
      // Unlike
      book.likedBy.splice(likedIndex, 1);
      book.likes = Math.max(0, book.likes - 1);
    } else {
      // Like
      book.likedBy.push(telegramId);
      book.likes += 1;
    }

    await book.save();

    res.json({
      success: true,
      likes: book.likes,
      isLiked: book.likedBy.includes(telegramId)
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/books/:id/rate
router.post('/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { telegramId, rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    }

    const book = await Book.findOne({ bookId: parseInt(id) });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Update or add rating
    if (!book.ratedBy) book.ratedBy = [];

    const existingRating = book.ratedBy.find(r => r.userId === telegramId);
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      book.ratedBy.push({ userId: telegramId, rating });
    }

    // Calculate average
    const totalRating = book.ratedBy.reduce((sum, r) => sum + r.rating, 0);
    book.rating = totalRating / book.ratedBy.length;

    await book.save();

    res.json({
      success: true,
      rating: book.rating,
      userRating: rating
    });
  } catch (error) {
    console.error('Rate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

**server/routes/nashids.js** - добавить аналогичные endpoints для нашидов.

### 4.3. Добавить UI для лайков и рейтинга

В `BookCard.jsx` и компонентах просмотра книг добавить:

```jsx
import { Heart, Star } from 'lucide-react';

// В компоненте
const [isLiked, setIsLiked] = useState(false);
const [likes, setLikes] = useState(book.likes || 0);
const [userRating, setUserRating] = useState(0);

const handleLike = async () => {
  try {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const response = await axios.post(`${API_URL}/api/books/${book.id}/like`, {
      telegramId
    });

    setLikes(response.data.likes);
    setIsLiked(response.data.isLiked);
  } catch (error) {
    console.error('Like error:', error);
  }
};

const handleRate = async (rating) => {
  try {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const response = await axios.post(`${API_URL}/api/books/${book.id}/rate`, {
      telegramId,
      rating
    });

    setUserRating(rating);
  } catch (error) {
    console.error('Rate error:', error);
  }
};

// В render
<div className="flex items-center gap-4">
  {/* Like button */}
  <button onClick={handleLike} className="flex items-center gap-2">
    <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
    <span>{likes}</span>
  </button>

  {/* Star rating */}
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button key={star} onClick={() => handleRate(star)}>
        <Star className={`w-5 h-5 ${star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
      </button>
    ))}
  </div>
</div>
```

---

## Порядок внедрения:

1. ✅ **Debug логи** - готово
2. ✅ **Кастомные категории** - готово
3. **Главный экран** - добавить код выше в Home.jsx
4. **Лайки и рейтинги** - обновить модели, добавить API, добавить UI

---

## Команды для деплоя:

```bash
# Коммит и пуш текущих изменений
git add .
git commit -m "feat: add custom categories and prepare for likes system"
git push origin main

# После завершения всех задач
git add .
git commit -m "feat: complete home filters and likes/ratings system"
git push origin main
```

---

Все готово к внедрению! 🚀
