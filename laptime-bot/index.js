
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Добро пожаловать! Выберите действие:', {
    reply_markup: {
      keyboard: [
        ['🏁 Начать сессию'],
        ['📊 Результаты по сессиям', '📆 Результаты по дням'],
        ['🏆 Рейтинг гонщиков']
      ],
      resize_keyboard: true
    }
  });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '🏁 Начать сессию') {
    bot.sendMessage(chatId, 'Выберите трассу:', {
      reply_markup: {
        keyboard: [
          ['Автодром Moscow Raceway'],
          ['Автодром Игора Драйв'],
          ['Автодром Нижегородское кольцо'],
          ['Автодром Казань Ринг'],
          ['🔙 Назад']
        ],
        resize_keyboard: true
      }
    });

  } else if (text === '📊 Результаты по сессиям') {
    bot.sendMessage(chatId, '📊 Результаты по сессиям:
(тут будет таблица)');

  } else if (text === '📆 Результаты по дням') {
    bot.sendMessage(chatId, '📆 Результаты по дням:
(тут будет таблица)');

  } else if (text === '🏆 Рейтинг гонщиков') {
    bot.sendMessage(chatId, '🏆 Рейтинг гонщиков:
(тут будет таблица)');

  } else if (text === '🔙 Назад') {
    bot.sendMessage(chatId, 'Вы вернулись в главное меню:', {
      reply_markup: {
        keyboard: [
          ['🏁 Начать сессию'],
          ['📊 Результаты по сессиям', '📆 Результаты по дням'],
          ['🏆 Рейтинг гонщиков']
        ],
        resize_keyboard: true
      }
    });
  }
});
