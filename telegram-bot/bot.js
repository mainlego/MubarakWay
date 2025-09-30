require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEB_APP_URL = process.env.WEB_APP_URL;

// Вспомогательная функция для парсинга длительности (3:45 -> 225 секунд)
function parseDuration(durationStr) {
  if (!durationStr) return 0;
  const parts = durationStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
}

// Middleware для логирования
bot.use((ctx, next) => {
  console.log(`${new Date().toISOString()} - ${ctx.updateType} from ${ctx.from?.username || ctx.from?.first_name}`);
  return next();
});

// Команда /start
bot.start(async (ctx) => {
  const firstName = ctx.from.first_name || 'Друг';

  // Проверяем, есть ли параметр start (Deep Link)
  const startPayload = ctx.startPayload;

  // Если это запрос на скачивание нашида
  if (startPayload && startPayload.startsWith('download_')) {
    const nashidId = parseInt(startPayload.replace('download_', ''));
    console.log(`User ${ctx.from.id} requested nashid ${nashidId}`);

    // Находим нашид по ID (здесь нужна база данных или API, но пока используем моковые данные)
    const mockNashids = [
      {
        id: 1,
        title: "يا قلب من حديد",
        titleTransliteration: "Ya Qalb Min Hadid",
        artist: "Fadil Muhammad",
        duration: "3:45",
        audioUrl: "/audio/Nasheed_Azan_1.mp3"
      },
      {
        id: 2,
        title: "سوف أعود يا أمي",
        titleTransliteration: "Sauf A'ood Ya Ommi",
        artist: "Al-Baraah Group",
        duration: "4:20",
        audioUrl: "/audio/Nasheed_Azan_1.mp3"
      },
      {
        id: 3,
        title: "رحب بذه النعمه",
        titleTransliteration: "Rahib Bidhihi An-Ni'mah",
        artist: "Hamzah Adel",
        duration: "2:58",
        audioUrl: "/audio/Nasheed_Azan_1.mp3"
      },
      {
        id: 4,
        title: "Tala'al Badru 'Alayna",
        titleTransliteration: "Tala'al Badru 'Alayna",
        artist: "Zain",
        duration: "5:12",
        audioUrl: "/audio/Nasheed_Azan_1.mp3"
      },
      {
        id: 5,
        title: "الطريق إلى الجنة",
        titleTransliteration: "At-Tariq ila al-Jannah",
        artist: "Abu Ali",
        duration: "4:15",
        audioUrl: "/audio/Nasheed_Azan_1.mp3"
      },
      {
        id: 6,
        title: "لا إله إلا الله",
        titleTransliteration: "La Ilaha Illa Allah",
        artist: "Ahmad Nashid",
        duration: "3:30",
        audioUrl: "/audio/Nasheed_Azan_1.mp3"
      }
    ];

    const nashid = mockNashids.find(n => n.id === nashidId);

    if (nashid) {
      try {
        await ctx.reply('⏳ Отправляю нашид...');

        // Формируем полный URL для аудиофайла
        const audioUrl = `${WEB_APP_URL}${nashid.audioUrl}`;

        console.log('Sending audio:', audioUrl);

        // Отправляем аудиофайл пользователю
        await ctx.replyWithAudio(audioUrl, {
          title: nashid.title,
          performer: nashid.artist,
          duration: parseDuration(nashid.duration),
          caption: `🎵 *${nashid.title}*\n👤 ${nashid.artist}\n\n_Отправлено из MubarakWay_`,
          parse_mode: 'Markdown'
        });

        await ctx.reply('✅ Нашид сохранён в чате! Можете слушать прямо здесь 🎧');
        return;
      } catch (error) {
        console.error('Error sending audio:', error);
        await ctx.reply('❌ Произошла ошибка при отправке аудиофайла. Попробуйте позже.');
      }
    } else {
      await ctx.reply('❌ Нашид не найден. Попробуйте выбрать другой.');
    }

    return;
  }

  // Обычное приветствие при /start без параметров
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

// Note: web_app_data обработчик убран - используем Deep Links вместо этого

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
    const server = app.listen(PORT, () => {
      console.log(`🌐 HTTP server запущен на порту ${PORT}`);
      console.log('✅ Render может подключиться к боту');
    });

    // На продакшене используем Webhook вместо Polling
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

    if (isProduction && WEB_APP_URL) {
      console.log('🔧 Режим: Webhook (Production)');

      // Удаляем старые webhook и обновления
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      console.log('🧹 Старый webhook удалён');

      // Устанавливаем новый webhook
      const webhookPath = '/webhook';
      const webhookUrl = `${WEB_APP_URL.replace('mubarak-way.onrender.com', 'mubarak-way-bot.onrender.com')}${webhookPath}`;

      app.use(bot.webhookCallback(webhookPath));

      await bot.telegram.setWebhook(webhookUrl, {
        drop_pending_updates: true,
        allowed_updates: ['message', 'callback_query']
      });

      console.log('✅ Webhook установлен:', webhookUrl);
      console.log('🤖 MubarakWay Bot запущен успешно (Webhook режим)!');
      console.log('🕌 Готов служить умме...');
      console.log('📱 Web App URL:', WEB_APP_URL);

    } else {
      // В разработке используем Polling
      console.log('🔧 Режим: Polling (Development)');

      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      console.log('🧹 Webhook удалён');

      await bot.launch({
        dropPendingUpdates: true,
        allowedUpdates: ['message', 'callback_query']
      });

      console.log('🤖 MubarakWay Bot запущен успешно (Polling режим)!');
      console.log('🕌 Готов служить умме...');
    }

  } catch (error) {
    console.error('💥 Критическая ошибка запуска бота:', error);
    console.error('Stack:', error.stack);
    // Не выходим из процесса, чтобы HTTP сервер продолжал работать для health checks
  }
};

// Graceful stop
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Получен сигнал ${signal}. Graceful shutdown...`);

  try {
    // Останавливаем бота
    await bot.stop(signal);
    console.log('✅ Бот остановлен');
  } catch (error) {
    console.error('❌ Ошибка при остановке бота:', error);
  }

  // Даём время на завершение всех операций
  setTimeout(() => {
    console.log('👋 Процесс завершён');
    process.exit(0);
  }, 1000);
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Обработка uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

startBot();