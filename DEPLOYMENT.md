# 🚀 Деплой MubarakWay на Render.com и настройка Telegram Bot

## 📋 Что вам понадобится:

1. **Аккаунт на Render.com** - https://render.com
2. **Telegram Bot Token** - получить у @BotFather
3. **GitHub репозиторий** - для автодеплоя
4. **Домен (опционально)** - для кастомного URL

---

## 🤖 Шаг 1: Создание Telegram Bot

### 1.1 Создание бота у BotFather

1. Откройте Telegram и найдите бота **@BotFather**
2. Отправьте команду `/start`
3. Отправьте команду `/newbot`
4. Введите имя вашего бота: `MubarakWay Bot`
5. Введите username: `mubarak_way_bot` (должен заканчиваться на `_bot`)
6. **Сохраните полученный токен!** (например: `1234567890:AABBccDDeeFFggHHiiJJkkLLmmNNooP`)

### 1.2 Настройка команд бота

Отправьте следующие команды @BotFather:

```
/setcommands
```

Выберите вашего бота, затем отправьте:

```
start - Запуск приложения
library - Библиотека книг
nashids - Нашиды
qibla - Направление киблы
help - Помощь
```

### 1.3 Настройка описания

```
/setdescription
```

Описание:
```
🕌 MubarakWay - ваш духовный путеводитель

📚 Библиотека исламских книг
🎵 Коллекция нашидов
🧭 Определение киблы
⏰ Время молитв
📖 Изучение Корана

Barakallahu feeki! 🤲
```

---

## ☁️ Шаг 2: Деплой на Render.com

### 2.1 Подготовка репозитория

1. Создайте репозиторий на GitHub
2. Загрузите туда папку `mubarak-way`
3. Убедитесь, что есть файлы:
   - `render.yaml`
   - `.nvmrc`
   - `package.json` с правильными скриптами

### 2.2 Деплой через Blueprint

1. Заходите на https://render.com
2. Нажмите **"New +"** → **"Blueprint"**
3. Подключите GitHub репозиторий
4. Render автоматически найдет `render.yaml`
5. Нажмите **"Apply"**

### 2.3 Настройка Environment Variables

В панели Render добавьте переменные окружения:

```bash
# Основные
NODE_VERSION=20.17.0
VITE_APP_URL=https://your-app-name.onrender.com

# Telegram (получите после создания Mini App)
VITE_TELEGRAM_BOT_TOKEN=ВАШ_ТОКЕН_БОТА
VITE_TELEGRAM_BOT_NAME=mubarak_way_bot
```

---

## 📱 Шаг 3: Настройка Telegram Mini App

### 3.1 Создание Mini App

1. Отправьте @BotFather команду:
```
/newapp
```

2. Выберите вашего бота
3. Введите название: `MubarakWay`
4. Введите описание: `Исламское приложение для духовного развития`
5. Загрузите фото (512x512 пикселей)
6. **ВАЖНО:** Введите URL приложения: `https://your-app-name.onrender.com`

### 3.2 Настройка Web App

```
/editapp
```

Выберите ваше приложение и настройте:

- **Short Name**: `mubarak_way`
- **Description**: как указано выше
- **Photo**: квадратная иконка 512x512px
- **GIF**: анимация (опционально)

### 3.3 Получение ссылки

После создания Mini App вы получите ссылку:
```
https://t.me/mubarak_way_bot/mubarak_way
```

---

## 🔧 Шаг 4: Настройка Telegram Bot (Node.js)

Создайте простой бот для обработки команд:

### 4.1 Структура бота

```
telegram-bot/
├── bot.js
├── package.json
└── .env
```

### 4.2 Код бота (bot.js)

```javascript
require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEB_APP_URL = process.env.WEB_APP_URL;

// Команда /start
bot.start((ctx) => {
  const keyboard = Markup.keyboard([
    [Markup.button.webApp('📱 Открыть MubarakWay', WEB_APP_URL)],
    ['📚 Библиотека', '🎵 Нашиды'],
    ['🧭 Кибла', '⚙️ Помощь']
  ]).resize();

  ctx.reply(
    `🕌 *Ассаламу алейкум!*\n\n` +
    `Добро пожаловать в MubarakWay - ваш духовный помощник.\n\n` +
    `🔸 Библиотека исламских книг\n` +
    `🔸 Коллекция нашидов\n` +
    `🔸 Определение киблы\n` +
    `🔸 Расписание намаза\n\n` +
    `Нажмите кнопку ниже для запуска приложения:`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    }
  );
});

// Команды
bot.command('library', (ctx) => {
  ctx.reply(
    '📚 *Библиотека книг*\n\nОткройте приложение для доступа к исламской литературе.',
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        Markup.button.webApp('📖 Открыть библиотеку', `${WEB_APP_URL}/library`)
      ])
    }
  );
});

bot.command('nashids', (ctx) => {
  ctx.reply(
    '🎵 *Нашиды*\n\nСлушайте исламские песнопения и создавайте плейлисты.',
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        Markup.button.webApp('🎶 Слушать нашиды', `${WEB_APP_URL}/nashids`)
      ])
    }
  );
});

bot.command('qibla', (ctx) => {
  ctx.reply(
    '🧭 *Направление киблы*\n\nОпределите точное направление на Мекку.',
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        Markup.button.webApp('🕋 Найти киблу', `${WEB_APP_URL}/qibla`)
      ])
    }
  );
});

bot.launch();
console.log('🤖 MubarakWay Bot запущен!');
```

### 4.3 Деплой бота на Render

1. Создайте отдельный репозиторий для бота
2. На Render создайте **Web Service**
3. Укажите start команду: `node bot.js`
4. Добавьте переменные окружения:

```
BOT_TOKEN=ваш_токен_бота
WEB_APP_URL=https://your-app-name.onrender.com
```

---

## 📚 Шаг 5: Данные, которые мне нужны от вас

### 5.1 Для завершения настройки пришлите:

1. **Токен бота** (от @BotFather)
2. **URL вашего деплоя** (после деплоя на Render)
3. **Username бота** (например: `mubarak_way_bot`)
4. **Желаемый домен** (если есть кастомный)

### 5.2 Опциональные данные:

1. **Логотип** (512x512px для Telegram)
2. **Цветовая схема** (если хотите кастомизировать)
3. **Дополнительные языки** (для мультиязычности)

---

## ✅ Шаг 6: Проверка работы

После деплоя проверьте:

1. ✅ Приложение открывается по ссылке
2. ✅ Бот отвечает на команды
3. ✅ Mini App запускается из Telegram
4. ✅ Все функции работают корректно

---

## 🔧 Дополнительные настройки

### SSL сертификат
Render автоматически выдает SSL сертификаты для всех приложений.

### Кастомный домен
1. В настройках Render перейдите в **Custom Domains**
2. Добавьте ваш домен
3. Настройте DNS записи согласно инструкции

### Мониторинг
Render предоставляет встроенный мониторинг и логи в реальном времени.

---

## 📞 Поддержка

Если возникнут проблемы:

1. Проверьте логи в панели Render
2. Убедитесь, что все переменные окружения настроены
3. Проверьте CSP заголовки для Telegram iframe

**Barakallahu feeki!** 🤲 Ваше приложение готово служить мусульманской умме!