require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, '👋 Добро пожаловать! Выберите опцию:', {
    reply_markup: {
      keyboard: [
        ['🏁 Начать сессию', '📊 Результаты по сессиям'],
        ['📆 Результаты по дням', '🏆 Рейтинг гонщиков']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '📊 Результаты по сессиям') {
    const resultText = `📊 Результаты по сессиям:

🥇 99 — 1:23.456 (Круг 3)
2️⃣ 101 — 1:24.789 (Круг 4)
3️⃣ 49 — 1:25.000 (Круг 2)

Для возврата нажмите кнопку «🔙 Назад».`;

    bot.sendMessage(chatId, resultText, {
      reply_markup: {
        keyboard: [['🔙 Назад']],
        resize_keyboard: true
      }
    });
  }

  else if (text === '📆 Результаты по дням') {
    const dayResults = `📆 Результаты по дням:

99 — лучший круг 1:23.456 (14.07.2025)
101 — лучший круг 1:24.789 (14.07.2025)
49 — лучший круг 1:25.000 (15.07.2025)

🔙 Назад`;

    bot.sendMessage(chatId, dayResults, {
      reply_markup: {
        keyboard: [['🔙 Назад']],
        resize_keyboard: true
      }
    });
  }

  else if (text === '🏆 Рейтинг гонщиков') {
    const rating = `🏆 Рейтинг гонщиков (по очкам):

🥇 99 — 180 очков
🥈 101 — 162 очка
🥉 49 — 150 очков`;

    bot.sendMessage(chatId, rating, {
      reply_markup: {
        keyboard: [['🔙 Назад']],
        resize_keyboard: true
      }
    });
  }

  else if (text === '🔙 Назад') {
    bot.sendMessage(chatId, 'Вы вернулись в главное меню.', {
      reply_markup: {
        keyboard: [
          ['🏁 Начать сессию', '📊 Результаты по сессиям'],
          ['📆 Результаты по дням', '🏆 Рейтинг гонщиков']
        ],
        resize_keyboard: true
      }
    });
  }
});
