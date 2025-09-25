# 💻 Локальный запуск MubarakWay

## ⚠️ Проблема с текущей версией Node.js

**Ваша текущая версия Node.js 18.20.7 не поддерживается.**

Vite 7.x требует Node.js версии **20.19+** или **22.12+**

## 🔧 Решение проблемы

### Вариант 1: Обновить Node.js (рекомендуется)

1. Скачайте Node.js 20.17+ с https://nodejs.org
2. Установите новую версию
3. Перезапустите терминал
4. Проверьте: `node --version`

### Вариант 2: Использовать nvm (если есть)

```bash
nvm install 20.17.0
nvm use 20.17.0
```

### Вариант 3: Downgrade Vite (временное решение)

```bash
cd mubarak-way
npm install vite@4.5.3 @vitejs/plugin-react@4.3.1 --save-dev
```

---

## 🚀 Запуск после решения проблемы

```bash
cd mubarak-way
npm install
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

---

## 🔍 Для проверки без обновления Node.js

Можете посмотреть структуру проекта:

```bash
cd mubarak-way
tree src/ # или ls -la src/
cat src/App.jsx
cat package.json
```

---

## 📱 Тестирование Telegram Mini App

1. После деплоя на Render получите URL
2. Создайте бота у @BotFather
3. Настройте Mini App с вашим URL
4. Тестируйте в Telegram

**URL будет примерно таким:**
`https://your-app-name.onrender.com`

---

## ✅ Что готово к деплою

- ✅ React приложение с 4 страницами
- ✅ Redux store с данными
- ✅ Telegram Mini App интеграция
- ✅ Адаптивный дизайн
- ✅ Конфиг для Render.com
- ✅ Подробные инструкции по настройке

Проект полностью готов к деплою на Render.com!