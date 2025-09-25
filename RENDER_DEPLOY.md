# 🚀 Инструкция по деплою на Render.com

## 🎯 Способ 1: Используйте Blueprint (рекомендуется)

1. **Frontend**: Blueprint из корня репозитория → создаст `mubarak-way-frontend`
2. **Bot**: Затем вручную создайте Web Service для папки `telegram-bot/`

## ⚠️ Способ 2: Создание сервисов вручную

---

## 📱 1. Деплой Frontend (Mini App)

### Шаг 1: Создание Static Site
1. Зайти на https://render.com
2. **New** → **Static Site**
3. **Connect GitHub repository**: `https://github.com/mainlego/MubarakWay.git`
4. **Branch**: `main`

### Шаг 2: Настройки Static Site
```
Name: mubarak-way
Build Command: npm ci && npm run build
Publish directory: dist
```

### Шаг 3: Environment Variables
```
NODE_VERSION = 20.17.0
VITE_APP_URL = https://mubarak-way.onrender.com
```

### Шаг 4: Headers (в настройках Static Site)
```
X-Frame-Options: ALLOWALL
Content-Security-Policy: frame-ancestors 'self' https://*.telegram.org https://telegram.org
X-Content-Type-Options: nosniff
```

---

## 🤖 2. Деплой Telegram Bot

### Шаг 1: Создание Web Service
1. **New** → **Web Service**
2. **Connect GitHub repository**: `https://github.com/mainlego/MubarakWay.git`
3. **Branch**: `main`

### Шаг 2: Настройки Web Service
```
Name: mubarak-way-bot
Root Directory: telegram-bot
Build Command: npm install
Start Command: npm start
```

### Шаг 3: Environment Variables для бота
```
NODE_VERSION = 20.17.0
BOT_TOKEN = 8257886464:AAHrJ525tcZV2WzbNWX-HWFc85T4OlJrgu0
WEB_APP_URL = https://mubarak-way.onrender.com
BOT_USERNAME = @mubarakway_bot
```

---

## 🔗 3. Связка сервисов

После деплоя у вас будет:

- **Frontend**: https://mubarak-way.onrender.com
- **Bot**: https://mubarak-way-bot.onrender.com

Бот будет ссылаться на frontend для Mini App.

---

## ⚡ 4. Быстрый деплой

Если хотите использовать Blueprint, то используйте только для frontend:

1. **New** → **Blueprint**
2. Подключить репозиторий
3. Render найдет основной `render.yaml` и создаст только frontend

Затем создать бота вручную как Web Service.

---

## 🎯 5. Проверка

После деплоя:

1. ✅ Frontend работает: https://mubarak-way.onrender.com
2. ✅ Bot отвечает в Telegram
3. ✅ Mini App открывается из бота
4. ✅ Все функции работают корректно

---

## 🔧 6. Troubleshooting

**Если frontend не деплоится:**
- Проверьте, что `package.json` в корне проекта
- Убедитесь, что `dist/` создается при сборке
- Проверьте логи сборки в Render

**Если бот не запускается:**
- Проверьте Environment Variables
- Убедитесь, что Root Directory = `telegram-bot`
- Проверьте логи в Render Dashboard

**Если Mini App не открывается:**
- Проверьте Headers для iframe
- Убедитесь, что URL правильный в настройках бота
- Проверьте CSP headers

---

**Готово! Приложение будет работать для всей уммы!** 🕌✨