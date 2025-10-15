# Система управления подписками

## Обзор

Гибкая система управления подписками в админ-панели MubarakWay, позволяющая настраивать лимиты и доступ для разных тарифов.

## Тарифные планы

### 1. Muslim (Бесплатный)
**Базовый доступ к платформе**

- **Цена**: Бесплатно
- **Лимиты**:
  - Книги офлайн: 3
  - Избранные книги: 10
  - Нашиды офлайн: 5
  - Избранные нашиды: 15
- **Доступ**: Только бесплатный контент
- **Возможности**: Офлайн режим

### 2. Mutahsin (Pro)
**Расширенный доступ и больше возможностей**

- **Цена**: 299 ₽/месяц
- **Лимиты**:
  - Книги офлайн: 20
  - Избранные книги: 50
  - Нашиды офлайн: 30
  - Избранные нашиды: 100
- **Доступ**: Бесплатный + Pro контент
- **Возможности**:
  - Офлайн режим
  - Без рекламы
  - Ранний доступ к новинкам

### 3. Sahib (Premium)
**Полный доступ ко всем материалам**

- **Цена**: 599 ₽/месяц
- **Лимиты**: Безлимит (все параметры = -1)
- **Доступ**: Весь контент (бесплатный + Pro + Premium)
- **Возможности**:
  - Офлайн режим
  - Без рекламы
  - Приоритетная поддержка
  - Ранний доступ к новинкам

## Структура модели Subscription

```javascript
{
  tier: String,              // 'muslim' | 'mutahsin' | 'sahib'
  name: String,              // Отображаемое название
  description: String,       // Описание тарифа

  price: {
    amount: Number,          // Сумма
    currency: String,        // Валюта (RUB, USD, etc)
    period: String           // 'monthly' | 'yearly' | 'lifetime'
  },

  limits: {
    booksOffline: Number,    // -1 = безлимит
    booksFavorites: Number,
    nashidsOffline: Number,
    nashidsFavorites: Number
  },

  access: {
    freeContent: Boolean,
    proContent: Boolean,
    premiumContent: Boolean
  },

  features: {
    offlineMode: Boolean,
    adFree: Boolean,
    prioritySupport: Boolean,
    earlyAccess: Boolean
  },

  isActive: Boolean,         // Активность тарифа
  order: Number              // Порядок отображения
}
```

## API Endpoints

### GET /api/admin/subscriptions
Получить все тарифы подписки

**Требуется**: Admin token

**Ответ**:
```json
{
  "success": true,
  "subscriptions": [...],
  "total": 3
}
```

### GET /api/admin/subscriptions/:tier
Получить конкретный тариф

**Параметры**:
- `tier` - muslim | mutahsin | sahib

**Ответ**:
```json
{
  "success": true,
  "subscription": {...}
}
```

### PUT /api/admin/subscriptions/:tier
Обновить настройки тарифа

**Требуется**: Admin token + разрешение `canManageAdmins`

**Тело запроса**: Любые поля из модели Subscription (кроме `tier`)

**Ответ**:
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "subscription": {...}
}
```

## Инициализация базы данных

### Автоматическая инициализация

Запустите скрипт для создания дефолтных подписок:

```bash
cd server
node initSubscriptions.js
```

Скрипт создаст 3 тарифа с настройками по умолчанию.

## Использование в админ-панели

### Доступ
1. Войдите в админ-панель: https://mubarak-way.onrender.com/admin/login
2. Перейдите в раздел "Подписки"

### Редактирование
1. Нажмите на иконку редактирования (карандаш)
2. Измените нужные параметры:
   - Лимиты (поставьте галочку "∞" для безлимита)
   - Доступ к контенту
   - Возможности
3. Нажмите "Сохранить изменения"

### Важно
- Значение `-1` означает безлимит
- Изменения применяются немедленно для всех пользователей
- Текущие пользователи сохранят свои тарифы до истечения срока

## Проверка лимитов пользователя

В коде приложения можно проверять лимиты так:

```javascript
// Получить настройки подписки
const subscription = await Subscription.findOne({ tier: user.subscription.tier });

// Проверить лимит
if (subscription.limits.booksOffline === -1) {
  // Безлимит
  allowDownload = true;
} else {
  // Проверить текущее использование
  allowDownload = user.usage.booksOffline < subscription.limits.booksOffline;
}

// Проверить доступ к контенту
if (book.accessLevel === 'premium') {
  allowAccess = subscription.access.premiumContent;
}
```

## Миграция существующих пользователей

Все существующие пользователи с тарифом `muslim`, `mutahsin` или `sahib` автоматически получат доступ к соответствующим настройкам из новой системы подписок.

## Будущие улучшения

- [ ] Создание кастомных тарифов
- [ ] Временные промо-тарифы
- [ ] A/B тестирование тарифов
- [ ] Статистика по подпискам
- [ ] История изменений тарифов
