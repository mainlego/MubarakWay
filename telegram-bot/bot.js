require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEB_APP_URL = process.env.WEB_APP_URL;

// Middleware для логирования
bot.use((ctx, next) => {
  console.log(`${new Date().toISOString()} - ${ctx.updateType} from ${ctx.from?.username || ctx.from?.first_name}`);
  return next();
});

// Команда /start
bot.start((ctx) => {
  const firstName = ctx.from.first_name || 'Друг';

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('🕌 Открыть MubarakWay', WEB_APP_URL)],
    [
      Markup.button.callback('📚 Библиотека', 'library'),
      Markup.button.callback('🎵 Нашиды', 'nashids')
    ],
    [
      Markup.button.callback('🧭 Кибла', 'qibla'),
      Markup.button.callback('⏰ Время намаза', 'prayer_times')
    ],
    [Markup.button.callback('ℹ️ О проекте', 'about')]
  ]);

  const message = `🕌 *Ассаламу алейкум, ${firstName}!*

Добро пожаловать в *MubarakWay* — ваш духовный помощник и путеводитель в мире ислама.

🌟 *Что вас ждет:*

📚 *Библиотека* — исламские книги с встроенной читалкой
• Священный Коран с переводами
• Сборники хадисов
• Духовная литература
• Возможность чтения оффлайн

🎵 *Нашиды* — коллекция религиозных песнопений
• Классические и современные нашиды
• Создание персональных плейлистов
• Прослушивание без интернета
• Тексты на арабском и русском

🧭 *Определение киблы*
• Точное направление на Мекку
• Интерактивный компас
• Работает в любой точке мира

⏰ *Время молитв*
• Автоматический расчет по вашей локации
• Напоминания о начале намаза
• Хиджрийский календарь

💎 *Особенности:*
✅ Полностью бесплатное использование
✅ Работает без интернета
✅ Поддержка арабского языка
✅ Красивый и понятный интерфейс

Нажмите кнопку ниже, чтобы начать духовное путешествие! 🚀

*Barakallahu feeki!* 🤲`;

  ctx.replyWithMarkdown(message, keyboard);
});

// Обработка inline кнопок
bot.action('library', (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithMarkdown(
    '📚 *Библиотека исламской литературы*\n\nОткройте приложение для доступа к духовным книгам и трактатам.',
    Markup.inlineKeyboard([
      [Markup.button.webApp('📖 Открыть библиотеку', `${WEB_APP_URL}/library`)]
    ])
  );
});

bot.action('nashids', (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithMarkdown(
    '🎵 *Коллекция нашидов*\n\nСлушайте религиозные песнопения и создавайте персональные плейлисты.',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎶 Слушать нашиды', `${WEB_APP_URL}/nashids`)]
    ])
  );
});

bot.action('qibla', (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithMarkdown(
    '🧭 *Направление киблы*\n\nОпределите точное направление на Мекку с помощью интерактивного компаса.',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🕋 Найти киблу', `${WEB_APP_URL}/qibla`)]
    ])
  );
});

bot.action('prayer_times', (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithMarkdown(
    '⏰ *Время молитв*\n\nАвтоматический расчет времени намаза по вашему местоположению.',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🕐 Посмотреть время', `${WEB_APP_URL}/qibla`)]
    ])
  );
});

bot.action('about', (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithMarkdown(
    `🌟 *О проекте MubarakWay*

*MubarakWay* — это комплексное исламское приложение, созданное для поддержки мусульман в их духовной практике.

👨‍💻 *Разработано с любовью*
Проект создан командой разработчиков-мусульман для всей уммы.

🆓 *Полностью бесплатно*
Все функции доступны без ограничений.

🔒 *Безопасность*
Ваши данные защищены и не передаются третьим лицам.

📧 *Поддержка*
По вопросам обращайтесь: support@mubarakway.com

*Да благословит Аллах всех, кто пользуется этим приложением!* 🤲

_Версия: 1.0.0_`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Открыть приложение', WEB_APP_URL)]
    ])
  );
});

// Текстовые команды
bot.command('library', (ctx) => {
  ctx.replyWithMarkdown(
    '📚 *Библиотека исламских книг*',
    Markup.inlineKeyboard([
      [Markup.button.webApp('📖 Открыть', `${WEB_APP_URL}/library`)]
    ])
  );
});

bot.command('nashids', (ctx) => {
  ctx.replyWithMarkdown(
    '🎵 *Нашиды и духовная музыка*',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎶 Слушать', `${WEB_APP_URL}/nashids`)]
    ])
  );
});

bot.command('qibla', (ctx) => {
  ctx.replyWithMarkdown(
    '🧭 *Определение направления киблы*',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🕋 Найти киблу', `${WEB_APP_URL}/qibla`)]
    ])
  );
});

bot.command('help', (ctx) => {
  ctx.replyWithMarkdown(`🆘 *Помощь по использованию*

*Доступные команды:*
/start - Главное меню
/library - Библиотека книг
/nashids - Коллекция нашидов
/qibla - Направление киблы
/help - Эта справка

*Как пользоваться:*
1️⃣ Нажмите на любую кнопку меню
2️⃣ Откроется мини-приложение
3️⃣ Наслаждайтесь духовным контентом!

*Проблемы?*
Напишите нам: support@mubarakway.com`);
});

// Обработка данных из Web App
bot.on('web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);
    console.log('Received Web App data:', data);

    if (data.action === 'download_audio' && data.nashid) {
      const { nashid } = data;

      // Формируем полный URL для аудиофайла
      const audioUrl = nashid.audioUrl.startsWith('http')
        ? nashid.audioUrl
        : `${WEB_APP_URL}${nashid.audioUrl}`;

      console.log('Sending audio:', audioUrl);

      // Отправляем аудиофайл пользователю
      await ctx.replyWithAudio(audioUrl, {
        title: nashid.title,
        performer: nashid.artist,
        duration: parseDuration(nashid.duration),
        caption: `🎵 *${nashid.title}*\n👤 ${nashid.artist}\n\n_Отправлено из MubarakWay_`,
        parse_mode: 'Markdown'
      });

      ctx.answerWebAppQuery(ctx.webAppData.query_id, {
        type: 'article',
        id: String(nashid.id),
        title: 'Аудиофайл отправлен',
        input_message_content: {
          message_text: `✅ Нашид "${nashid.title}" отправлен в чат`
        }
      });
    }
  } catch (error) {
    console.error('Error processing web app data:', error);
    ctx.reply('Произошла ошибка при обработке запроса 😔');
  }
});

// Вспомогательная функция для парсинга длительности (3:45 -> 225 секунд)
function parseDuration(durationStr) {
  if (!durationStr) return 0;
  const parts = durationStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
}

// Обработка любого текста
bot.on('text', (ctx) => {
  const text = ctx.message.text.toLowerCase();

  if (text.includes('салам') || text.includes('привет')) {
    ctx.reply('Ва алейкум ассалам! 🕌 Используйте /start для открытия главного меню.');
  } else if (text.includes('спасибо') || text.includes('шукран')) {
    ctx.reply('Баракаллаху фики! 🤲 Рады быть полезными.');
  } else if (text.includes('помощ') || text.includes('help')) {
    ctx.reply('Используйте /help для получения справки по командам.');
  } else {
    ctx.reply('Используйте /start для открытия главного меню MubarakWay! 🕌');
  }
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Произошла ошибка. Попробуйте позже или обратитесь в поддержку.');
});

// HTTP сервер для Render (обязательно для web service)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'MubarakWay Bot is running',
    timestamp: new Date().toISOString(),
    webApp: WEB_APP_URL
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Запуск бота
const startBot = async () => {
  try {
    // ВАЖНО: Сначала запускаем HTTP сервер для Render
    app.listen(PORT, () => {
      console.log(`🌐 HTTP server запущен на порту ${PORT}`);
      console.log('✅ Render может подключиться к боту');
    });

    // Затем запускаем Telegram бота
    await bot.launch();
    console.log('🤖 MubarakWay Bot запущен успешно!');
    console.log('🕌 Готов служить умме...');
    console.log('📱 Web App URL:', WEB_APP_URL);
  } catch (error) {
    console.error('Ошибка запуска бота:', error);
  }
};

// Graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  process.exit(0);
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  process.exit(0);
});

startBot();