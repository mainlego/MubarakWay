require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { Coordinates, CalculationMethod, PrayerTimes } = require('adhan');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEB_APP_URL = process.env.WEB_APP_URL;

// Путь к файлу с подписками
const SUBSCRIPTIONS_FILE = path.join(__dirname, 'subscriptions.json');
const NOTIFIED_FILE = path.join(__dirname, 'notified.json');

// Хранилище пользователей для уведомлений
const userSubscriptions = new Map();
const notifiedPrayers = new Set();

// Загрузка подписок из файла
function loadSubscriptions() {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
      const subscriptions = JSON.parse(data);

      subscriptions.forEach(sub => {
        userSubscriptions.set(sub.userId, sub);
      });

      console.log(`✅ Loaded ${userSubscriptions.size} subscriptions from file`);
    } else {
      console.log('📁 No subscriptions file found, starting fresh');
    }
  } catch (error) {
    console.error('❌ Error loading subscriptions:', error);
  }
}

// Загрузка уведомлений из файла
function loadNotifiedPrayers() {
  try {
    if (fs.existsSync(NOTIFIED_FILE)) {
      const data = fs.readFileSync(NOTIFIED_FILE, 'utf8');
      const notified = JSON.parse(data);

      notified.forEach(key => {
        notifiedPrayers.add(key);
      });

      console.log(`✅ Loaded ${notifiedPrayers.size} notification records`);
    }
  } catch (error) {
    console.error('❌ Error loading notified prayers:', error);
  }
}

// Сохранение подписок в файл
function saveSubscriptions() {
  try {
    const subscriptions = Array.from(userSubscriptions.values());
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2), 'utf8');
    console.log(`💾 Saved ${subscriptions.length} subscriptions to file`);
  } catch (error) {
    console.error('❌ Error saving subscriptions:', error);
  }
}

// Сохранение уведомлений в файл
function saveNotifiedPrayers() {
  try {
    const notified = Array.from(notifiedPrayers);
    fs.writeFileSync(NOTIFIED_FILE, JSON.stringify(notified, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error saving notified prayers:', error);
  }
}

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

  // Автоматически подписываем пользователя на уведомления о молитвах
  subscribeUser(ctx.from.id);
  saveSubscriptions();

  // Проверяем, есть ли параметр start (Deep Link)
  const startPayload = ctx.startPayload;
  console.log(`[/start] Received from user ${ctx.from.id} (${ctx.from.username || ctx.from.first_name})`);
  console.log(`[/start] Start payload:`, startPayload);

  // Если это запрос на скачивание книги
  if (startPayload && startPayload.startsWith('download_book_')) {
    const bookId = parseInt(startPayload.replace('download_book_', ''));
    console.log(`[/start] User ${ctx.from.id} requested book ${bookId}`);

    // Моковые данные книг (в продакшене загружать из БД)
    const mockBooks = [
      {
        id: 1,
        title: "Священный Коран",
        author: "Перевод смыслов",
        content: "# Священный Коран\n\nПеревод смыслов Священного Корана...\n\n## Сура Аль-Фатиха\n\n1. Во имя Аллаха, Милостивого, Милосердного...",
        description: "Полный перевод смыслов Священного Корана"
      },
      {
        id: 2,
        title: "40 хадисов Имама ан-Навави",
        author: "Имам ан-Навави",
        content: "# 40 хадисов Имама ан-Навави\n\nСборник важнейших хадисов...",
        description: "Классический сборник хадисов"
      },
      {
        id: 3,
        title: "Рияд ас-Салихин",
        author: "Имам ан-Навави",
        content: "# Рияд ас-Салихин\n\nСады праведных...",
        description: "Сборник хадисов о благих делах"
      }
    ];

    const book = mockBooks.find(b => b.id === bookId);

    if (book) {
      try {
        await ctx.reply('⏳ Отправляю книгу...');

        // Создаем текстовый файл из контента книги
        const bookContent = `${book.title}\n${'='.repeat(book.title.length)}\n\n${book.author ? `Автор: ${book.author}\n\n` : ''}${book.content}`;
        const buffer = Buffer.from('\uFEFF' + bookContent, 'utf-8'); // UTF-8 BOM для корректной кодировки

        // Отправляем документ пользователю
        await ctx.replyWithDocument(
          {
            source: buffer,
            filename: `${book.title}.txt`
          },
          {
            caption: `📖 *${book.title}*${book.author ? `\n👤 ${book.author}` : ''}\n\n_Отправлено из MubarakWay_`,
            parse_mode: 'Markdown'
          }
        );

        await ctx.reply('✅ Книга сохранена в чате! Можете читать в любое время 📚');
        return;
      } catch (error) {
        console.error('Error sending book:', error);
        await ctx.reply('❌ Произошла ошибка при отправке книги. Попробуйте позже.');
      }
    } else {
      await ctx.reply('❌ Книга не найдена. Попробуйте выбрать другую.');
    }

    return;
  }

  // Если это запрос на скачивание нашида
  if (startPayload && startPayload.startsWith('download_')) {
    const nashidId = parseInt(startPayload.replace('download_', ''));
    console.log(`[/start] User ${ctx.from.id} requested nashid ${nashidId}`);

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
    [Markup.button.callback('📍 Установить локацию', 'set_location')],
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

// Обработчик установки локации
bot.action('set_location', (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithMarkdown(
    `📍 *Установка вашей локации*

Для точного расчета времени молитв нам нужна ваша геолокация.

Нажмите кнопку ниже, чтобы поделиться своим местоположением 👇`,
    Markup.keyboard([
      [Markup.button.locationRequest('📍 Отправить местоположение')]
    ]).resize().oneTime()
  );
});

// Обработчики кнопок после уведомления о молитве

// Кнопка "Прочитал"
bot.action(/^prayer_read_/, async (ctx) => {
  try {
    // Удаляем кнопки из исходного сообщения
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    await ctx.answerCbQuery('✅ Альхамдулиллах! Да примет Аллах твой намаз!');
    await ctx.reply(
      '🤲 Не забудьте совершить дуа после намаза.\n\n' +
      'Да сделает Аллах ваши молитвы принятыми! 🌟',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '↩️ Исправить', callback_data: 'show_prayer_menu' }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Error in prayer_read action:', error);
  }
});

// Кнопка "Не прочитал"
bot.action(/^prayer_not_read_/, async (ctx) => {
  try {
    // Удаляем кнопки из исходного сообщения
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    await ctx.answerCbQuery('Не откладывайте намаз!');
    await ctx.reply(
      '⚠️ Постарайтесь совершить намаз как можно скорее.\n\n' +
      'Молитва - это столп ислама. Не пропускайте её без уважительной причины.',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '↩️ Исправить', callback_data: 'show_prayer_menu' }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Error in prayer_not_read action:', error);
  }
});

// Кнопка "Восполню"
bot.action(/^prayer_makeup_/, async (ctx) => {
  try {
    // Удаляем кнопки из исходного сообщения
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    await ctx.answerCbQuery('📝 Записано в пропущенные');
    await ctx.reply(
      '📿 Намаз записан как пропущенный.\n\n' +
      'Не забудьте восполнить его при первой возможности. ' +
      'Совершение пропущенных намазов - обязанность каждого мусульманина.',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '↩️ Исправить', callback_data: 'show_prayer_menu' }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Error in prayer_makeup action:', error);
  }
});

// Кнопка "В мечети"
bot.action(/^prayer_mosque_/, async (ctx) => {
  try {
    // Удаляем кнопки из исходного сообщения
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    await ctx.answerCbQuery('🕌 Машаллах!');
    await ctx.reply(
      '🕌 Прекрасно, что совершаете намаз в мечети!\n\n' +
      'Намаз в коллективе в 27 раз лучше намаза в одиночестве.\n\n' +
      'Да воздаст Аллах вам за это! 🤲',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '↩️ Исправить', callback_data: 'show_prayer_menu' }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Error in prayer_mosque action:', error);
  }
});

// Кнопка "Исправить" - показывает меню молитв заново
bot.action('show_prayer_menu', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const userId = ctx.from.id;
    const subscription = userSubscriptions.get(userId);

    if (!subscription || !subscription.location) {
      await ctx.reply('📍 Установите локацию для отслеживания времени молитв');
      return;
    }

    // Получаем текущее время молитв
    const prayerTimes = calculatePrayerTimes(subscription.location);
    if (!prayerTimes) {
      await ctx.reply('❌ Не удалось рассчитать время молитв');
      return;
    }

    const { currentPrayer, nextPrayer } = getCurrentAndNextPrayer(prayerTimes);

    if (nextPrayer) {
      const now = new Date();
      const timeUntil = nextPrayer.time - now;
      const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
      const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

      await ctx.reply(
        `🕌 Следующая молитва: ${nextPrayer.name}\n` +
        `🕐 Время: ${formatTime(nextPrayer.time, subscription.timezone)}\n` +
        `⏰ Через: ${hoursUntil}ч ${minutesUntil}м`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Прочитал', callback_data: `prayer_read_${nextPrayer.key}` },
                { text: '❌ Не прочитал', callback_data: `prayer_not_read_${nextPrayer.key}` }
              ],
              [
                { text: '🕌 Восполню', callback_data: `prayer_makeup_${nextPrayer.key}` },
                { text: '🕌 В мечети', callback_data: `prayer_mosque_${nextPrayer.key}` }
              ]
            ]
          }
        }
      );
    }
  } catch (error) {
    console.error('Error in show_prayer_menu action:', error);
  }
});

// Обработчик кнопки "Направление киблы"
bot.action('show_qibla', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const subscription = userSubscriptions.get(userId);

  if (!subscription || !subscription.location) {
    await ctx.reply(
      '📍 Сначала установите свою локацию для определения направления киблы.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📍 Установить локацию', callback_data: 'set_location' }]
          ]
        }
      }
    );
    return;
  }

  // Открываем мини-приложение на вкладке Кибла
  await ctx.reply(
    '🕌 *Направление киблы*\n\nОткройте приложение для точного определения направления.',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🧭 Открыть компас', web_app: { url: `${WEB_APP_URL}#/qibla` } }]
        ]
      }
    }
  );
});

// Обработчик кнопки "Дуа после намаза"
bot.action('show_dua', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithMarkdown(
    `🤲 *Дуа после намаза*

*أَسْتَغْفِرُ اللهَ* (3 раза)
_Астагфируллаh_ (3 раза)
«Прошу у Аллаха прощения»

*اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ، تَبَارَكْتَ يَا ذَا الْجَلاَلِ وَالإِكْرَامِ*

_Аллахумма, Анта ас-салям, ва минка ас-салям, табаракта йа заль-джаляли валь-икрам_

«О Аллах! Ты — Мир, и от Тебя — мир. Благословен Ты, о Обладатель величия и щедрости!»`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📖 Все дуа', web_app: { url: `${WEB_APP_URL}#/library` } }]
        ]
      }
    }
  );
});

// Обработчик кнопки "Расписание"
bot.action('show_schedule', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const subscription = userSubscriptions.get(userId);

  if (!subscription || !subscription.location) {
    await ctx.reply('📍 Сначала установите свою локацию.');
    return;
  }

  const prayerTimes = calculatePrayerTimes(subscription.location);
  if (!prayerTimes) {
    await ctx.reply('❌ Не удалось рассчитать время молитв.');
    return;
  }

  const today = new Date();
  const todayStr = today.toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let schedule = `📅 *Расписание намаза на ${todayStr}*\n\n`;
  schedule += `🌅 Фаджр: ${formatTime(prayerTimes.fajr, subscription.timezone)}\n`;
  schedule += `🌄 Восход: ${formatTime(prayerTimes.sunrise, subscription.timezone)}\n`;
  schedule += `☀️ Зухр: ${formatTime(prayerTimes.dhuhr, subscription.timezone)}\n`;
  schedule += `🌤 Аср: ${formatTime(prayerTimes.asr, subscription.timezone)}\n`;
  schedule += `🌆 Магриб: ${formatTime(prayerTimes.maghrib, subscription.timezone)}\n`;
  schedule += `🌙 Иша: ${formatTime(prayerTimes.isha, subscription.timezone)}\n`;

  await ctx.replyWithMarkdown(schedule, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📅 Расписание на месяц', web_app: { url: `${WEB_APP_URL}#/qibla` } }]
      ]
    }
  });
});

// Обработчик получения локации (из Telegram чата - legacy, рекомендуется использовать веб-приложение)
bot.on('location', async (ctx) => {
  const { latitude, longitude } = ctx.message.location;
  const userId = ctx.from.id;

  console.log(`📍 [BOT] Received location from Telegram chat user ${userId}: ${latitude}, ${longitude}`);
  console.log('⚠️ Note: Location from Telegram chat is legacy. Recommend using web app instead.');

  try {
    // Определяем часовой пояс
    const timezone = getTimezoneFromCoordinates(latitude, longitude);

    // Сохраняем в MongoDB
    let user = await User.findOne({ telegramId: userId.toString() });

    if (!user) {
      user = new User({
        telegramId: userId.toString(),
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
        prayerSettings: {
          location: {
            latitude,
            longitude,
            timezone,
            updatedAt: new Date()
          },
          notifications: {
            enabled: true
          }
        }
      });
      console.log(`✅ Created new user ${userId} with location from Telegram chat`);
    } else {
      user.prayerSettings = user.prayerSettings || {};
      user.prayerSettings.location = {
        latitude,
        longitude,
        city: user.prayerSettings.location?.city,
        country: user.prayerSettings.location?.country,
        timezone,
        updatedAt: new Date()
      };
      console.log(`✅ Updated location for user ${userId} from Telegram chat`);
    }

    user.lastActive = new Date();
    await user.save();

    // Обновляем локальную подписку (для совместимости с legacy системой)
    subscribeUser(userId, { latitude, longitude }, timezone);
    saveSubscriptions();

    // Вычисляем время молитв для новой локации
    const prayerTimes = calculatePrayerTimes({ latitude, longitude });

    if (prayerTimes) {
      const { currentPrayer, nextPrayer } = getCurrentAndNextPrayer(prayerTimes);

      await ctx.replyWithMarkdown(
        `✅ *Локация успешно сохранена!*

📍 Координаты: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}
🌍 Часовой пояс: ${timezone}

⏰ *Время молитв на сегодня:*

🌅 Фаджр: ${formatTime(prayerTimes.fajr, timezone)}
🌄 Восход: ${formatTime(prayerTimes.sunrise, timezone)}
☀️ Зухр: ${formatTime(prayerTimes.dhuhr, timezone)}
🌤️ Аср: ${formatTime(prayerTimes.asr, timezone)}
🌆 Магриб: ${formatTime(prayerTimes.maghrib, timezone)}
🌙 Иша: ${formatTime(prayerTimes.isha, timezone)}

${nextPrayer ? `\n📿 Следующая молитва: *${nextPrayer.name}* в ${formatTime(nextPrayer.time, timezone)}` : ''}

🔔 Вы будете получать уведомления о времени молитв!`,
        Markup.removeKeyboard()
      );
    } else {
      await ctx.reply('❌ Не удалось рассчитать время молитв. Попробуйте еще раз.', Markup.removeKeyboard());
    }
  } catch (error) {
    console.error('Error saving location from Telegram chat:', error);
    await ctx.reply('❌ Ошибка при сохранении локации. Попробуйте использовать веб-приложение.', Markup.removeKeyboard());
  }
});

// Функция для определения часового пояса по координатам (улучшенная)
function getTimezoneFromCoordinates(lat, lon) {
  // Популярные регионы и их часовые пояса (более точные границы)
  const timezones = [
    { name: 'Europe/Moscow', lat: [41, 82], lon: [19, 180] }, // Россия (вся европейская часть + Москва)
    { name: 'Europe/Kaliningrad', lat: [54, 56], lon: [19, 23] }, // Калининград
    { name: 'Europe/Samara', lat: [50, 56], lon: [45, 55] }, // Самара
    { name: 'Asia/Yekaterinburg', lat: [54, 62], lon: [55, 65] }, // Екатеринбург
    { name: 'Asia/Omsk', lat: [53, 60], lon: [68, 78] }, // Омск
    { name: 'Asia/Krasnoyarsk', lat: [51, 72], lon: [84, 106] }, // Красноярск
    { name: 'Asia/Irkutsk', lat: [50, 62], lon: [100, 120] }, // Иркутск
    { name: 'Asia/Yakutsk', lat: [55, 75], lon: [115, 148] }, // Якутск
    { name: 'Asia/Vladivostok', lat: [42, 70], lon: [130, 150] }, // Владивосток
    { name: 'Asia/Tashkent', lat: [37, 46], lon: [55, 74] }, // Узбекистан
    { name: 'Asia/Almaty', lat: [40, 56], lon: [46, 88] }, // Казахстан
    { name: 'Europe/Istanbul', lat: [36, 42], lon: [25, 45] }, // Турция
    { name: 'Asia/Dubai', lat: [22, 27], lon: [51, 57] }, // ОАЭ
    { name: 'Asia/Riyadh', lat: [16, 33], lon: [34, 56] }, // Саудовская Аравия
    { name: 'Europe/London', lat: [49, 61], lon: [-11, 2] }, // Великобритания
    { name: 'Europe/Paris', lat: [41, 51], lon: [-5, 10] }, // Франция
    { name: 'Europe/Berlin', lat: [47, 55], lon: [5, 16] }, // Германия
    { name: 'Asia/Jakarta', lat: [-11, 6], lon: [95, 141] }, // Индонезия
    { name: 'Asia/Karachi', lat: [23, 38], lon: [60, 78] }, // Пакистан
    { name: 'Asia/Dhaka', lat: [20, 27], lon: [88, 93] }, // Бангладеш
    { name: 'Asia/Tehran', lat: [25, 40], lon: [44, 64] }, // Иран
    { name: 'Asia/Baghdad', lat: [29, 38], lon: [38, 49] }, // Ирак
    { name: 'Europe/Kiev', lat: [44, 53], lon: [22, 41] }, // Украина
    { name: 'Europe/Minsk', lat: [51, 57], lon: [23, 33] }, // Беларусь
  ];

  // Проверяем, попадает ли в один из регионов
  for (const tz of timezones) {
    if (lat >= tz.lat[0] && lat <= tz.lat[1] &&
        lon >= tz.lon[0] && lon <= tz.lon[1]) {
      console.log(`🌍 Timezone detected: ${tz.name} for coordinates ${lat}, ${lon}`);
      return tz.name;
    }
  }

  // Если не нашли точное совпадение, используем UTC offset
  const offset = Math.round(lon / 15);
  const tzName = offset >= 0 ? `Etc/GMT-${offset}` : `Etc/GMT+${Math.abs(offset)}`;
  console.log(`🌍 Fallback timezone: ${tzName} (offset ${offset}) for coordinates ${lat}, ${lon}`);
  return tzName;
}

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

// Команда /prayer для расписания намаза
bot.command('prayer', async (ctx) => {
  const userId = ctx.from.id;
  const subscription = userSubscriptions.get(userId);

  if (!subscription || !subscription.location) {
    await ctx.reply('📍 Сначала установите свою локацию для расчета времени молитв.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📍 Установить локацию', callback_data: 'set_location' }]
        ]
      }
    });
    return;
  }

  const prayerTimes = calculatePrayerTimes(subscription.location);
  if (!prayerTimes) {
    await ctx.reply('❌ Не удалось рассчитать время молитв.');
    return;
  }

  const today = new Date();
  const todayStr = today.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  let schedule = `🕌 *Время намаза на ${todayStr}*\n\n`;
  schedule += `🌅 Фаджр: ${formatTime(prayerTimes.fajr, subscription.timezone)}\n`;
  schedule += `🌄 Восход: ${formatTime(prayerTimes.sunrise, subscription.timezone)}\n`;
  schedule += `☀️ Зухр: ${formatTime(prayerTimes.dhuhr, subscription.timezone)}\n`;
  schedule += `🌤 Аср: ${formatTime(prayerTimes.asr, subscription.timezone)}\n`;
  schedule += `🌆 Магриб: ${formatTime(prayerTimes.maghrib, subscription.timezone)}\n`;
  schedule += `🌙 Иша: ${formatTime(prayerTimes.isha, subscription.timezone)}\n`;

  await ctx.replyWithMarkdown(schedule, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📅 Расписание на месяц', web_app: { url: `${WEB_APP_URL}#/qibla` } }],
        [{ text: '🧭 Направление киблы', callback_data: 'show_qibla' }]
      ]
    }
  });
});

// Команда /location для установки геолокации
bot.command('location', (ctx) => {
  ctx.replyWithMarkdown(
    `📍 *Установка локации*

Для точного расчета времени молитв нам нужна ваша геолокация.

Нажмите кнопку ниже, чтобы поделиться местоположением 👇`,
    Markup.keyboard([
      [Markup.button.locationRequest('📍 Отправить местоположение')]
    ]).resize().oneTime()
  );
});

bot.command('help', (ctx) => {
  ctx.replyWithMarkdown(`🆘 *Помощь по использованию*

*Доступные команды:*
/start - Главное меню
/prayer - Время намаза
/qibla - Направление киблы
/library - Библиотека книг
/nashids - Коллекция нашидов
/location - Установить локацию
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

// Запуск бота
const startBot = async (expressApp = null) => {
  try {
    // На продакшене используем Webhook вместо Polling
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

    if (isProduction && WEB_APP_URL && expressApp) {
      console.log('🔧 Режим: Webhook (Production)');

      // Удаляем старые webhook и обновления
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      console.log('🧹 Старый webhook удалён');

      // Устанавливаем новый webhook
      const webhookPath = '/webhook';
      // Определяем URL бэкенда на основе WEB_APP_URL
      const backendUrl = WEB_APP_URL.includes('mubarakway-frontend')
        ? 'https://mubarakway-backend.onrender.com'
        : process.env.BACKEND_URL || 'https://mubarakway-backend.onrender.com';
      const webhookUrl = `${backendUrl}${webhookPath}`;

      // Создаём webhook handler
      const webhookHandler = bot.webhookCallback(webhookPath);

      // Регистрируем webhook с логированием
      expressApp.post(webhookPath, async (req, res, next) => {
        console.log('🔔 Webhook received');
        console.log('📝 Update type:', req.body.message ? 'message' : req.body.callback_query ? 'callback_query' : 'other');
        try {
          await webhookHandler(req, res, next);
          console.log('✅ Webhook handled');
        } catch (error) {
          console.error('❌ Webhook error:', error);
          next(error);
        }
      });

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

    // Запускаем систему уведомлений о времени молитв
    console.log('⏰ Запуск системы уведомлений о времени молитв...');
    console.log(`📊 Текущих подписчиков: ${userSubscriptions.size}`);

    // Проверяем каждую минуту
    setInterval(checkPrayerTimes, 60000);
    // Первая проверка сразу
    console.log('🔄 Выполняю первую проверку времени молитв...');
    await checkPrayerTimes();

    // Загружаем сохраненные подписки и уведомления
    loadSubscriptions();
    loadNotifiedPrayers();

    // Устанавливаем постоянное меню бота
    await bot.telegram.setMyCommands([
      { command: 'start', description: '🏠 Главное меню' },
      { command: 'prayer', description: '🕌 Время намаза' },
      { command: 'qibla', description: '🧭 Направление киблы' },
      { command: 'library', description: '📚 Библиотека' },
      { command: 'nashids', description: '🎵 Нашиды' },
      { command: 'location', description: '📍 Установить локацию' }
    ]);
    console.log('✅ Команды бота установлены');

    // Очищаем старые уведомления раз в день (в полночь)
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        notifiedPrayers.clear();
        saveNotifiedPrayers();
        console.log('🧹 Cleared old prayer notifications');
      }
    }, 60000);

    console.log('✅ Система уведомлений о молитвах запущена');
    console.log('💡 Пользователи будут автоматически подписаны при /start');

  } catch (error) {
    console.error('💥 Критическая ошибка запуска бота:', error);
    console.error('Stack:', error.stack);
    // Пробрасываем ошибку чтобы server.js мог решить продолжать работу или нет
    throw error;
  }
};

// Функция для добавления пользователя в подписки
function subscribeUser(userId, location = null, timezone = null) {
  userSubscriptions.set(userId, {
    userId,
    location: location || { latitude: 55.7558, longitude: 37.6173 }, // По умолчанию Москва
    timezone: timezone || 'Europe/Moscow', // Часовой пояс пользователя
    subscribedAt: Date.now()
  });
  console.log(`✅ User ${userId} subscribed to prayer notifications (timezone: ${timezone || 'Europe/Moscow'})`);
}

// Функция для расчета времени молитв
function calculatePrayerTimes(location, date = new Date()) {
  try {
    const coordinates = new Coordinates(location.latitude, location.longitude);
    const params = CalculationMethod.MuslimWorldLeague();

    // Для высоких широт (например, Санкт-Петербург) используем специальное правило
    const { HighLatitudeRule, Madhab } = require('adhan');
    if (Math.abs(location.latitude) > 48) {
      params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
    }

    // Устанавливаем мазхаб Shafi
    params.madhab = Madhab.Shafi;

    const prayerTimes = new PrayerTimes(coordinates, date, params);

    console.log(`📊 Prayer times calculated for ${location.latitude}, ${location.longitude}:`, {
      fajr: prayerTimes.fajr.toLocaleTimeString('ru-RU'),
      sunrise: prayerTimes.sunrise.toLocaleTimeString('ru-RU'),
      dhuhr: prayerTimes.dhuhr.toLocaleTimeString('ru-RU'),
      asr: prayerTimes.asr.toLocaleTimeString('ru-RU'),
      maghrib: prayerTimes.maghrib.toLocaleTimeString('ru-RU'),
      isha: prayerTimes.isha.toLocaleTimeString('ru-RU')
    });

    return {
      fajr: prayerTimes.fajr,
      sunrise: prayerTimes.sunrise,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha
    };
  } catch (error) {
    console.error('Error calculating prayer times:', error);
    return null;
  }
}

// Получить текущую и следующую молитву
function getCurrentAndNextPrayer(prayerTimes) {
  const now = new Date();
  const prayers = [
    { name: 'Фаджр', time: prayerTimes.fajr, key: 'fajr' },
    { name: 'Восход', time: prayerTimes.sunrise, key: 'sunrise', skipNotification: true },
    { name: 'Зухр', time: prayerTimes.dhuhr, key: 'dhuhr' },
    { name: 'Аср', time: prayerTimes.asr, key: 'asr' },
    { name: 'Магриб', time: prayerTimes.maghrib, key: 'maghrib' },
    { name: 'Иша', time: prayerTimes.isha, key: 'isha' }
  ];

  let currentPrayer = null;
  let nextPrayer = null;

  // Находим текущую и следующую молитву
  for (let i = 0; i < prayers.length; i++) {
    if (now < prayers[i].time) {
      nextPrayer = prayers[i];
      currentPrayer = i > 0 ? prayers[i - 1] : prayers[prayers.length - 1];
      break;
    }
  }

  // Если время после Иша, следующая молитва - Фаджр следующего дня
  if (!nextPrayer) {
    currentPrayer = prayers[prayers.length - 1];
    nextPrayer = prayers[0];
  }

  return { currentPrayer, nextPrayer };
}

// Форматировать время с учетом часового пояса пользователя
function formatTime(date, timezone = 'Europe/Moscow') {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  });
}

// Проверка времени молитв и отправка уведомлений (читает из MongoDB)
async function checkPrayerTimes() {
  try {
    const now = new Date();

    // Получаем пользователей из MongoDB с включенными уведомлениями
    const users = await User.find({
      'prayerSettings.notifications.enabled': true,
      'prayerSettings.location.latitude': { $exists: true }
    });

    console.log(`🔍 Checking prayer times for ${users.length} users from MongoDB at ${now.toISOString()}`);

    if (users.length === 0) {
      console.log('⚠️ No users with notifications enabled in MongoDB');
      return;
    }

    for (const user of users) {
      try {
        const userId = user.telegramId;
        const location = user.prayerSettings?.location;
        const timezone = location?.timezone || 'Europe/Moscow';

        if (!location || !location.latitude || !location.longitude) {
          console.warn(`❌ No location for user ${userId}`);
          continue;
        }

        // Синхронизируем с legacy системой (для совместимости)
        if (!userSubscriptions.has(userId)) {
          userSubscriptions.set(userId, {
            userId,
            location: {
              latitude: location.latitude,
              longitude: location.longitude
            },
            timezone: timezone
          });
        }

        const prayerTimes = calculatePrayerTimes({
          latitude: location.latitude,
          longitude: location.longitude
        });

        if (!prayerTimes) {
          console.warn(`❌ Could not calculate prayer times for user ${userId}`);
          continue;
        }

        const { currentPrayer, nextPrayer } = getCurrentAndNextPrayer(prayerTimes);
        if (!nextPrayer) {
          console.warn(`❌ No next prayer found for user ${userId}`);
          continue;
        }

        const timeUntilNext = nextPrayer.time - now;
        const minutesUntilNext = Math.floor(timeUntilNext / (1000 * 60));

        if (minutesUntilNext <= 15) {
          console.log(`⏱️ User ${userId}: ${minutesUntilNext} min until ${nextPrayer.name} at ${formatTime(nextPrayer.time, timezone)}`);
        }

        // Уведомление за 10 минут до молитвы
        if (minutesUntilNext === 10) {
          const warningKey = `${userId}_${nextPrayer.key}_10min_${nextPrayer.time.getTime()}`;
          if (!notifiedPrayers.has(warningKey) && !nextPrayer.skipNotification) {
            await bot.telegram.sendMessage(
              userId,
              `⏰ <b>Осталось 10 минут до молитвы ${nextPrayer.name}</b>\n\n` +
              `🕌 Время: ${formatTime(nextPrayer.time, timezone)}\n\n` +
              `Приготовьтесь к намазу.`,
              { parse_mode: 'HTML' }
            );
            notifiedPrayers.add(warningKey);
            saveNotifiedPrayers();
            console.log(`📢 Sent 10-min warning to user ${userId} for ${nextPrayer.name}`);
          }
        }

        // Уведомление при наступлении времени молитвы
        if (minutesUntilNext === 0) {
          const prayerKey = `${userId}_${nextPrayer.key}_now_${nextPrayer.time.getTime()}`;
          if (!notifiedPrayers.has(prayerKey) && !nextPrayer.skipNotification) {
            await bot.telegram.sendMessage(
              userId,
              `🕌 <b>Наступило время молитвы ${nextPrayer.name}</b>\n\n` +
              `🕐 ${formatTime(nextPrayer.time, timezone)}\n\n` +
              `Не откладывайте намаз!`,
              {
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: '✅ Прочитал', callback_data: `prayer_read_${nextPrayer.key}` },
                      { text: '❌ Не прочитал', callback_data: `prayer_not_read_${nextPrayer.key}` }
                    ],
                    [
                      { text: '📿 Восполню', callback_data: `prayer_makeup_${nextPrayer.key}` },
                      { text: '🕌 В мечети', callback_data: `prayer_mosque_${nextPrayer.key}` }
                    ]
                  ]
                }
              }
            );
            notifiedPrayers.add(prayerKey);
            saveNotifiedPrayers();
            console.log(`📢 Sent prayer notification to user ${userId} for ${nextPrayer.name}`);

            // Отправляем информацию о следующей молитве через 1 минуту
            setTimeout(async () => {
              try {
                const allPrayers = [
                  { name: 'Фаджр', time: prayerTimes.fajr },
                  { name: 'Зухр', time: prayerTimes.dhuhr },
                  { name: 'Аср', time: prayerTimes.asr },
                  { name: 'Магриб', time: prayerTimes.maghrib },
                  { name: 'Иша', time: prayerTimes.isha }
                ];

                const currentTime = new Date();
                const nextPrayerIndex = allPrayers.findIndex(p => p.time > currentTime);
                const upcomingPrayer = nextPrayerIndex >= 0 ? allPrayers[nextPrayerIndex] : allPrayers[0];

                const timeUntil = upcomingPrayer.time - currentTime;
                const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
                const minutesRemaining = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

                await bot.telegram.sendMessage(
                  userId,
                  `📿 <b>Следующая молитва: ${upcomingPrayer.name}</b>\n\n` +
                  `🕐 Время: ${formatTime(upcomingPrayer.time, timezone)}\n` +
                  `⏳ Через: ${hoursUntil}ч ${minutesRemaining}м`,
                  { parse_mode: 'HTML' }
                );
                console.log(`📢 Sent next prayer info to user ${userId}: ${upcomingPrayer.name}`);
              } catch (error) {
                console.error(`Error sending next prayer info to user ${userId}:`, error);
              }
            }, 60000); // Отправляем через 1 минуту после наступления времени молитвы
          }
        }

      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in checkPrayerTimes:', error);
  }
}

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

// Экспортируем функцию запуска бота для вызова из server.js
module.exports = { startBot, bot };