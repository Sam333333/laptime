require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-timezone');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

let currentSession = null;
let sessionData = {};

const tracks = [
  'Автодром Moscow Raceway',
  'Автодром Игора Драйв',
  'Автодром Нижегородское кольцо',
  'Автодром Казань Ринг'
];

const drivers = [99, 101, 49, 57, 97, 34, 50, 45, 111];

const mainMenu = {
  reply_markup: {
    keyboard: [
      ['🚦 Начать сессию'],
      ['📊 Результаты по сессиям', '📆 Результаты по дням'],
      ['🏁 Завершить сессию'],
      ['🏆 Рейтинг гонщиков']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Добро пожаловать в тайминг-систему! Выберите действие:', mainMenu);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '🚦 Начать сессию') {
    sessionData = {};
    currentSession = {
      track: null,
      date: moment().tz('Europe/Moscow').format('YYYY-MM-DD'),
      startTimes: {},
      laps: {}
    };
    return bot.sendMessage(chatId, 'Выберите трассу:', {
      reply_markup: {
        keyboard: tracks.map(t => [t]).concat([['⬅️ Назад']]),
        resize_keyboard: true
      }
    });
  }

  if (tracks.includes(text)) {
    currentSession.track = text;
    drivers.forEach(num => {
      currentSession.laps[num] = [];
    });
    return bot.sendMessage(chatId, `Сессия началась на ${text}. Нажимайте на номера гонщиков для фиксации времени круга.`, {
      reply_markup: {
        keyboard: [
          [99, 101, 49].map(String),
          [57, 97, 34].map(String),
          [50, 45, 111].map(String),
          ['⬅️ Назад']
        ],
        resize_keyboard: true
      }
    });
  }

  if (text === '🏁 Завершить сессию') {
    if (currentSession) {
      sessionData[currentSession.date + ' ' + currentSession.track] = currentSession;
      currentSession = null;
      return bot.sendMessage(chatId, 'Сессия завершена и сохранена.', mainMenu);
    }
    return bot.sendMessage(chatId, 'Нет активной сессии.', mainMenu);
  }

  if (text === '📊 Результаты по сессиям') {
    let results = '';
    Object.entries(sessionData).forEach(([key, session]) => {
      results += `\n📍 ${session.track} — ${session.date}\n`;
      const bestLaps = [];

      drivers.forEach(num => {
        const laps = session.laps[num] || [];
        if (laps.length > 0) {
          const best = laps.slice().sort((a, b) => a.time - b.time)[0];
          bestLaps.push({ num, ...best });
        }
      });

      bestLaps.sort((a, b) => a.time - b.time);
      bestLaps.forEach((lap, i) => {
        const symbol = i === 0 ? '🥇' : '  ';
        results += `${symbol} ${lap.num} — ${formatMs(lap.time)} (Круг ${lap.lapIndex + 1})\n`;
      });
    });
    return bot.sendMessage(chatId, results || 'Нет данных.');
  }

  if (text === '📆 Результаты по дням') {
    let results = '';
    Object.entries(sessionData).forEach(([key, session]) => {
      results += `\n📍 ${session.track} — ${session.date}\n`;
      drivers.forEach(num => {
        const laps = session.laps[num] || [];
        if (laps.length > 0) {
          const best = laps.slice().sort((a, b) => a.time - b.time)[0];
          results += `🔹 ${num} — ${formatMs(best.time)} (Круг ${best.lapIndex + 1})\n`;
        }
      });
    });
    return bot.sendMessage(chatId, results || 'Нет данных.');
  }

  if (drivers.map(String).includes(text)) {
    const num = parseInt(text);
    if (!currentSession) return bot.sendMessage(chatId, 'Нет активной сессии.');

    if (!currentSession.startTimes[num]) {
      currentSession.startTimes[num] = Date.now();
      return bot.sendMessage(chatId, `⏱ Гонщик ${num} стартовал круг.`);
    } else {
      const end = Date.now();
      const lapTime = end - currentSession.startTimes[num];
      delete currentSession.startTimes[num];

      currentSession.laps[num].push({
        time: lapTime,
        lapIndex: currentSession.laps[num].length
      });

      return bot.sendMessage(chatId, `✅ Гонщик ${num} завершил круг: ${formatMs(lapTime)}`);
    }
  }

  if (text === '⬅️ Назад') {
    return bot.sendMessage(chatId, 'Вы вернулись в главное меню.', mainMenu);
  }
});

function formatMs(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msRest = ms % 1000;
  return `${m}:${s.toString().padStart(2, '0')}.${msRest.toString().padStart(3, '0')}`;
}
