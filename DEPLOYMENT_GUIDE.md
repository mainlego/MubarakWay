# 🚀 MubarakWay - Deployment Guide

## 📋 Структура проекта

```
mubarakway/
├── frontend/          # Telegram Mini App (React + Vite)
│   ├── src/          # Исходный код приложения
│   ├── public/       # Статические файлы
│   └── package.json  # Frontend зависимости
│
├── backend/          # API Server + Telegram Bot
│   ├── server/       # Express сервер
│   └── package.json  # Backend зависимости
│
└── render.yaml       # Render.com Blueprint
```

## 🌐 Render.com Deployment

### Автоматический деплой

Проект настроен на **автоматический деплой** при пуше в `main` ветку:

1. **Push в GitHub** → Render автоматически начинает деплой
2. **Frontend** деплоится из папки `frontend/`
3. **Backend** деплоится из папки `backend/`

### Render.com Blueprint Configuration

**Frontend** ([render.yaml](render.yaml:3-36)):
```yaml
- type: web
  name: mubarakway-frontend
  runtime: static
  rootDir: frontend                    # ← Корневая папка фронтенда
  buildCommand: npm ci && npm run build
  staticPublishPath: frontend/dist     # ← Путь к собранным файлам
```

**Backend** ([render.yaml](render.yaml:38-66)):
```yaml
- type: web
  name: mubarakway-backend
  runtime: node
  rootDir: backend                     # ← Корневая папка бекенда
  buildCommand: npm install
  startCommand: node server/server.js  # ← Запуск сервера
```

## 🔐 Environment Variables

### Frontend Variables

Добавь эти переменные в Render Dashboard для **mubarakway-frontend**:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_VERSION` | `20.17.0` | Node.js версия |
| `VITE_API_URL` | `https://mubarakway-backend.onrender.com` | Backend API URL |
| `VITE_QURAN_API_URL` | `https://bot.e-replika.ru/api/v1` | Quran API URL |
| `VITE_QURAN_API_TOKEN` | `test_token_123` | Quran API токен |
| `BACKEND_URL` | `https://mubarakway-backend.onrender.com` | Backend URL |

### Backend Variables

Добавь эти переменные в Render Dashboard для **mubarakway-backend**:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Режим работы |
| `NODE_VERSION` | `20.17.0` | Node.js версия |
| `PORT` | `10000` | Порт сервера |
| `MONGODB_URI` | `mongodb+srv://...` | ⚠️ **SECRET** - MongoDB connection string |
| `BOT_TOKEN` | `8257886464:AAH...` | ⚠️ **SECRET** - Telegram Bot Token |
| `JWT_SECRET` | `mubarakway-admin-jwt...` | ⚠️ **SECRET** - JWT secret |
| `WEB_APP_URL` | `https://mubarakway-frontend.onrender.com` | Frontend URL |
| `BACKEND_URL` | `https://mubarakway-backend.onrender.com` | Backend URL |
| `VITE_API_URL` | `https://mubarakway-backend.onrender.com` | API URL |

## 🔄 Manual Deployment

Если автоматический деплой не работает:

1. Зайди на [Render Dashboard](https://dashboard.render.com)
2. Выбери сервис (`mubarakway-frontend` или `mubarakway-backend`)
3. Нажми **"Manual Deploy"** → **"Deploy latest commit"**

## ✅ Deployment Checklist

После деплоя проверь:

- [ ] Frontend деплой успешен (Status: **Live**)
- [ ] Backend деплой успешен (Status: **Live**)
- [ ] Health check работает: `https://mubarakway-backend.onrender.com/api/health`
- [ ] Frontend открывается: `https://mubarakway-frontend.onrender.com`
- [ ] API отвечает: `https://mubarakway-backend.onrender.com/api/books`
- [ ] Telegram Mini App работает в боте

## 🐛 Debug Panel

В приложении встроена **Debug Console** для диагностики:

1. Открой приложение в Telegram
2. Внизу экрана увидишь **"🐛 Debug Console"**
3. Используй фильтры:
   - **Все** - все логи
   - **📡 API** - только API запросы
   - **❌ Ошибки** - только ошибки
   - **✅ Успешные** - успешные операции
4. Кнопки действий:
   - **Copy** - скопировать логи в буфер
   - **Download** - скачать логи как .txt файл
   - **Clear** - очистить логи

## 🔧 Troubleshooting

### Проблема: Изменения не появляются на продакшене

**Решение**:
1. Проверь что изменения запушены в GitHub
2. Проверь статус деплоя на Render Dashboard
3. Очисти кеш Telegram: Настройки → Данные и память → Очистить кеш
4. Используй Debug Panel для диагностики

### Проблема: Books/Nashids не загружаются

**Решение**:
1. Открой Debug Panel
2. Нажми фильтр **"📡 API"**
3. Найди логи с тегами `[Books]` или `[Nashids]`
4. Скопируй логи (кнопка **Copy**)
5. Проверь ошибку в логах

### Проблема: CORS ошибки

**Решение**: CORS уже настроен для всех Telegram доменов:
- `https://web.telegram.org`
- `https://k.web.telegram.org`
- `https://z.web.telegram.org`
- `https://a.web.telegram.org`

Если ошибка всё равно есть, проверь backend логи на Render Dashboard.

## 📦 Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Backend
```bash
cd backend
npm install
npm start            # http://localhost:10000
```

## 🔗 Useful Links

- **GitHub Repository**: https://github.com/mainlego/MubarakWay
- **Render Dashboard**: https://dashboard.render.com
- **Frontend (Production)**: https://mubarakway-frontend.onrender.com
- **Backend (Production)**: https://mubarakway-backend.onrender.com
- **API Health Check**: https://mubarakway-backend.onrender.com/api/health

---

**Generated with Claude Code** 🤖
