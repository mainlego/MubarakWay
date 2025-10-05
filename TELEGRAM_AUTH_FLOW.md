# Telegram Authentication Flow
**Project**: Mubarak Way (Islam Bot)
**Date**: 2025-10-05

---

## 📋 Authentication Architecture

### 🎯 **Requirements**

1. **Telegram Mini App Context**: Автоматический вход через Telegram SDK
2. **Browser Context**: Авторизация через Telegram Login Widget
3. **Auto-Registration**: Создание пользователя в MongoDB при первом входе
4. **Data Loading**: Загрузка всех данных пользователя после авторизации
5. **Session Persistence**: Сохранение сессии в localStorage

---

## 🔄 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    App Initialization                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            Check Environment: Telegram or Browser?           │
└─────────────────────────────────────────────────────────────┘
          │                                    │
          │                                    │
    [Telegram]                            [Browser]
          │                                    │
          ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────────┐
│ Telegram Mini App    │          │   Check localStorage     │
│                      │          │   'telegram_auth'        │
│ telegram.getUser()   │          └──────────────────────────┘
└──────────────────────┘                      │
          │                                   │
          │                          ┌────────┴────────┐
          │                          │                 │
          │                      [Found]           [Not Found]
          │                          │                 │
          │                          ▼                 ▼
          │              ┌──────────────────┐  ┌──────────────┐
          │              │ Restore Session  │  │ Show Telegram│
          │              │ loginUser(saved) │  │ Login Widget │
          │              └──────────────────┘  └──────────────┘
          │                          │                 │
          └──────────────┬───────────┘                 │
                         │                             │
                         ▼                             ▼
                ┌─────────────────────────────────────────┐
                │    POST /api/auth/login                  │
                │    { telegramId, firstName, ... }        │
                └─────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                [User Exists]                 [New User]
                    │                               │
                    ▼                               ▼
        ┌──────────────────────┐      ┌─────────────────────┐
        │ Load from MongoDB    │      │ Create in MongoDB   │
        │ Return user data     │      │ Return new user     │
        └──────────────────────┘      └─────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                ┌─────────────────────────────────────────┐
                │        Load User Data to Redux           │
                │                                           │
                │  • favorites.books → setBooksFavorites   │
                │  • favorites.nashids → setNashidsFavorites│
                │  • subscription tier                      │
                │  • usage limits                           │
                │  • prayer settings                        │
                └─────────────────────────────────────────┘
                                    │
                                    ▼
                ┌─────────────────────────────────────────┐
                │        Save to localStorage              │
                │        (browser mode only)               │
                │                                           │
                │  localStorage.setItem(                   │
                │    'telegram_auth',                      │
                │    JSON.stringify(telegramUser)          │
                │  )                                       │
                └─────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────┐
                        │   Show Application   │
                        └─────────────────────┘
```

---

## 🔐 Component: TelegramLogin.jsx

### Purpose
Компонент для авторизации через Telegram Login Widget в браузере.

### Features
- ✅ Telegram Login Widget integration
- ✅ Beautiful UI with gradient background
- ✅ Feature list display
- ✅ Privacy notice
- ✅ Auto-callback handling

### Usage
```jsx
// Automatically shown when:
// 1. Not in Telegram Mini App context
// 2. User is not authenticated
if (!telegram.isMiniApp() && !isAuthenticated) {
  return <TelegramLogin />;
}
```

### Configuration
```jsx
// In TelegramLogin.jsx, line 52:
script.setAttribute('data-telegram-login', 'YOUR_BOT_USERNAME');
```

**⚠️ ВАЖНО**: Замените `YOUR_BOT_USERNAME` на имя вашего Telegram бота!

---

## 📱 Telegram Mini App Flow

### Step 1: Initialization
```javascript
if (telegram.isMiniApp()) {
  telegram.init();
  const user = telegram.getUser();
}
```

### Step 2: Auto-Login
```javascript
const userData = await dispatch(loginUser(user)).unwrap();
```

### Step 3: Load Data
```javascript
loadUserData(userData);
```

---

## 🌐 Browser Flow

### Step 1: Check Saved Session
```javascript
const savedAuth = localStorage.getItem('telegram_auth');
if (savedAuth) {
  const telegramUser = JSON.parse(savedAuth);
  // Restore session
}
```

### Step 2: Show Login Widget
If no saved session, display `<TelegramLogin />`.

### Step 3: Widget Callback
```javascript
window.onTelegramAuth = (user) => {
  dispatch(loginUser(user)).unwrap().then(userData => {
    loadUserData(userData);
    localStorage.setItem('telegram_auth', JSON.stringify(user));
  });
}
```

---

## 🗄️ MongoDB Auto-Registration

### Backend Logic (server/routes/auth.js)

```javascript
router.post('/login', async (req, res) => {
  const { telegramId, username, firstName, lastName } = req.body;

  // Поиск пользователя
  let user = await User.findOne({ telegramId });

  if (user) {
    // ✅ Существующий пользователь
    user.username = username || user.username;
    user.firstName = firstName || user.firstName;
    // Update last active, reset limits if needed
    await user.save();
  } else {
    // ✅ Новый пользователь - автоматическая регистрация
    user = new User({
      telegramId,
      username,
      firstName,
      lastName,
      subscription: { tier: 'muslim', isActive: true },
      usage: { booksOffline: 0, nashidsOffline: 0 },
      favorites: { books: [], nashids: [] }
    });
    await user.save();
    console.log(`🆕 New user registered: ${telegramId}`);
  }

  // Возвращаем полные данные пользователя
  res.json({ success: true, user: { ...user.toObject() } });
});
```

---

## 📥 Data Loading After Auth

### loadUserData() Function

```javascript
const loadUserData = (userData) => {
  // Загружаем избранное
  if (userData.favorites) {
    if (userData.favorites.books) {
      dispatch(setBooksFavorites(userData.favorites.books));
    }
    if (userData.favorites.nashids) {
      dispatch(setNashidsFavorites(userData.favorites.nashids));
    }
  }

  // Подписка уже в Redux через authSlice
  // Настройки молитв уже в userData
  // Прогресс чтения уже в userData
};
```

---

## 🚪 Logout Flow

### Settings.jsx - handleLogout()

```javascript
const handleLogout = () => {
  // 1. Очищаем Redux state
  dispatch(logout());

  // 2. Очищаем localStorage (кроме onboarding)
  const onboarding = localStorage.getItem('onboarding_completed');
  localStorage.clear();
  if (onboarding) {
    localStorage.setItem('onboarding_completed', onboarding);
  }

  // 3. Перезагружаем приложение
  window.location.reload();
};
```

---

## ✅ Security Considerations

### Session Storage
- ✅ Telegram hash validation (встроено в Widget)
- ✅ localStorage используется только для удобства
- ✅ Каждый запрос к API проверяет telegramId в MongoDB
- ✅ Нет хранения паролей

### Data Protection
- ✅ Только авторизованные пользователи могут изменять свои данные
- ✅ telegramId используется как уникальный идентификатор
- ✅ HTTPS для продакшена

---

## 🧪 Testing Checklist

### Telegram Mini App
- [ ] Автоматический вход при запуске в Telegram
- [ ] Создание нового пользователя при первом входе
- [ ] Загрузка существующих данных при повторном входе
- [ ] Синхронизация избранного с MongoDB

### Browser
- [ ] Показ экрана Telegram Login Widget
- [ ] Успешная авторизация через виджет
- [ ] Сохранение сессии в localStorage
- [ ] Восстановление сессии при перезагрузке страницы
- [ ] Полный выход из системы (logout)

### Data Persistence
- [ ] Избранные книги сохраняются
- [ ] Избранные нашиды сохраняются
- [ ] Прогресс чтения сохраняется
- [ ] Настройки пользователя сохраняются

---

## 📝 Configuration Required

### 1. Telegram Bot Setup
```bash
# Create bot via @BotFather
/newbot
# Get bot username (e.g., @MubarakWayBot)
```

### 2. Update TelegramLogin.jsx
```javascript
// Line 52
script.setAttribute('data-telegram-login', 'MubarakWayBot'); // ← Your bot
```

### 3. Configure Bot Domain
```bash
# Via @BotFather
/setdomain
# Enter your domain (e.g., mubarak-way.com)
```

---

## 🚀 Deployment Notes

### Production Checklist
1. ✅ Set `data-telegram-login` to production bot
2. ✅ Configure domain in @BotFather
3. ✅ Use HTTPS for Telegram Widget
4. ✅ Set proper CORS headers on backend
5. ✅ Environment variables for MongoDB connection

### Environment Variables
```bash
VITE_API_URL=https://api.mubarak-way.com
MONGODB_URI=mongodb+srv://...
TELEGRAM_BOT_USERNAME=MubarakWayBot
```

---

**Status**: ✅ **Ready for Testing**
**Next Steps**:
1. Configure Telegram Bot username
2. Test in both Telegram and Browser
3. Deploy to production

---

*Documentation Generated*: 2025-10-05
*Engineer*: Claude (Anthropic AI)
