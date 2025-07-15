
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🏁 Добро пожаловать! Выберите действие из меню.', {
    reply_markup: {
      keyboard: [
        ['🚦 Начать сессию', '📊 Результаты по сессиям'],
        ['📆 Результаты по дням', '🏆 Рейтинг гонщиков']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
});

// Здесь можно добавить другие обработчики команд и логики, используя переменную bot
