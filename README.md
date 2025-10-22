# MubarakWay - Исламское мини-приложение для Telegram

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-purple.svg)](https://vitejs.dev/)

Комплексное исламское мини-приложение для Telegram, объединяющее функционал библиотеки контента и религиозных инструментов.

## 🌟 Основные возможности

### 📚 Библиотека книг
- **Встроенная читалка**: HTML-рендеринг текста с постраничной навигацией
- **Настройки чтения**: Изменение размера и типа шрифта
- **Сохранение прогресса**: Продолжение чтения с любого устройства
- **Офлайн-режим**: Доступ к контенту без интернета
- **Система подписок**: Бесплатные и премиум книги

### 🎵 Библиотека нашидов
- **Аудиоплеер**: Встроенный плеер с красивым интерфейсом
- **Плейлисты**: Создание персональных коллекций
- **Категории**: Сортировка по исполнителям и тематике
- **История прослушивания**: Отслеживание любимых треков

### 🧭 Определение киблы
- **Интерактивный компас**: Точное направление на Мекку
- **Карта направления**: Визуальное отображение
- **Время молитв**: Автоматический расчет времени намаза
- **Уведомления**: Напоминания о времени молитв

## 🚀 Технологический стек

- **Frontend**: React 18+ с современными хуками
- **Сборка**: Vite для быстрой разработки
- **Стили**: Tailwind CSS для адаптивного дизайна
- **Состояние**: Redux Toolkit для управления данными
- **Роутинг**: React Router для навигации
- **Иконки**: Lucide React для красивых иконок

## 📦 Установка и запуск

### Frontend (Telegram Mini App)
```bash
cd frontend
npm install
npm run dev          # Разработка
npm run build        # Сборка
```

### Backend (API Server + Telegram Bot)
```bash
cd backend
npm install
npm start            # Продакшен
npm run dev          # Разработка с nodemon
```

## ⚠️ Требования

- Node.js версии 20.17.0+
- npm или yarn
- MongoDB (для backend)

## 📱 Структура проекта

```
mubarakway/
├── frontend/               # Frontend - Telegram Mini App
│   ├── src/
│   │   ├── components/    # Переиспользуемые компоненты
│   │   ├── pages/         # Основные страницы
│   │   ├── store/         # Redux store и слайсы
│   │   ├── assets/        # Статические ресурсы
│   │   └── App.jsx        # Главный компонент
│   ├── public/            # Статические файлы
│   ├── package.json
│   └── .env.example       # Пример переменных окружения
│
├── backend/               # Backend - API + Bot
│   ├── server/
│   │   ├── models/        # MongoDB модели
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Express middleware
│   │   ├── bot/           # Telegram bot
│   │   └── server.js      # Главный файл сервера
│   ├── package.json
│   └── .env.example       # Пример переменных окружения
│
└── render.yaml            # Render.com deployment blueprint
```

## 🚀 Деплой на Render.com

Проект использует Blueprint для автоматического деплоя на Render.com:

1. Пуш в main ветку GitHub запускает автоматический деплой
2. Frontend деплоится как Static Site
3. Backend деплоится как Node.js Web Service

### Переменные окружения

**Frontend** (`frontend/.env.example`):
- `VITE_API_URL` - URL бекенда
- `VITE_QURAN_API_URL` - URL Quran API
- `VITE_QURAN_API_TOKEN` - Токен для Quran API

**Backend** (`backend/.env.example`):
- `MONGODB_URI` - Строка подключения к MongoDB
- `BOT_TOKEN` - Telegram Bot Token
- `JWT_SECRET` - Секрет для JWT токенов
- `WEB_APP_URL` - URL фронтенда
- `PORT` - Порт сервера (по умолчанию 10000)

## 🎨 Особенности

- **RTL поддержка**: Полная поддержка арабского языка
- **Адаптивность**: Оптимизация для всех устройств
- **Telegram Mini App**: Интеграция с Telegram API
- **Офлайн режим**: Работа без интернета

---

**Barakallahu feeki** 🤲
# MubarakWay
