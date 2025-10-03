# Islam Bot Backend API

Express.js сервер с MongoDB для Telegram Mini App

## Установка

```bash
cd server
npm install
```

## Запуск

### Разработка
```bash
npm run dev
```

### Продакшн
```bash
npm start
```

Сервер запустится на порту 3001

## API Endpoints

### Authentication

#### POST /api/auth/login
Автоматическая регистрация/вход пользователя через Telegram ID

**Request:**
```json
{
  "telegramId": "123456789",
  "username": "user",
  "firstName": "John",
  "lastName": "Doe",
  "languageCode": "ru"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "telegramId": "123456789",
    "subscription": {...},
    "usage": {...},
    "favorites": {...},
    ...
  }
}
```

#### GET /api/auth/user/:telegramId
Получить данные пользователя

#### PUT /api/auth/onboarding/:telegramId
Отметить завершение онбординга

### Health Check

#### GET /api/health
Проверка работоспособности сервера

## База данных

### Модели

#### User
- Telegram данные (ID, имя, юзернейм)
- Подписка (tier, expiresAt, isActive)
- Использование лимитов (книги, нашиды)
- Избранное и офлайн контент
- Настройки молитв
- Прогресс чтения

#### Book
- Название, автор, описание
- Контент
- Категория, жанр, язык
- PRO/Exclusive статус

#### Nashid
- Название, исполнитель
- Аудио URL
- Категория
- Exclusive статус

## Особенности

- ✅ Автоматическая регистрация пользователей
- ✅ Проверка и сброс месячных лимитов
- ✅ Проверка статуса подписки
- ✅ Трекинг последней активности
- ✅ Подключение к MongoDB Atlas

## Конфигурация

Переменные окружения в `.env`:
- `PORT` - порт сервера (default: 3001)
- `MONGODB_URI` - строка подключения к MongoDB
