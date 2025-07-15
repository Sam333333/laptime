


bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Выберите действие из меню ниже:', {
    reply_markup: {
      keyboard: [
        ['🏁 Начать сессию'],
        ['📊 Результаты по сессиям'],
        ['📆 Результаты по дням'],
        ['🏆 Рейтинг гонщиков'],
        ['📅 Очки по этапам']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '🏆 Рейтинг гонщиков') {
    bot.emit('text', { chat: { id: chatId }, text: '/rating' });
  } else if (text === '📅 Очки по этапам') {
    bot.emit('text', { chat: { id: chatId }, text: '/stages' });
  } else if (text === '📊 Результаты по сессиям') {
    bot.emit('text', { chat: { id: chatId }, text: '/results' });
  } else if (text === '📆 Результаты по дням') {
    bot.emit('text', { chat: { id: chatId }, text: '/dayresults' });
  } else if (text === '🏁 Начать сессию') {
    bot.emit('text', { chat: { id: chatId }, text: '/startsession' });
  }
});


const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.setMyCommands([
  { command: '/start', description: 'Запустить бота' },
  { command: '/rating', description: '🏆 Рейтинг гонщиков' },
  { command: '/stages', description: '📅 Очки по этапам' },
]);

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Выберите команду:', {
    reply_markup: {
      keyboard: [
        ['🏆 Рейтинг гонщиков', '📅 Очки по этапам'],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    }
  });
  bot.sendMessage(msg.chat.id, 'Добро пожаловать! Выберите команду из меню.');
});

bot.onText(/\/rating/, (msg) => {
  const standings = [
    { number: '99', points: 155 },
    { number: '97', points: 114 },
    { number: '57', points: 105 },
    { number: '49', points: 92 },
    { number: '34', points: 90 },
    { number: '50', points: 71 },
    { number: '111', points: 59 },
    { number: '45', points: 56 },
    { number: '101', points: 17 },
  ];

  const medals = ['🥇', '🥈', '🥉'];

  const sorted = standings.sort((a, b) => b.points - a.points);
  const lines = sorted.map((driver, idx) => {
    const medal = medals[idx] || '';
    return `${medal} #${driver.number} — ${driver.points} очков`;
  });

  bot.sendMessage(msg.chat.id, `🏆 *Рейтинг гонщиков*\n\n${lines.join('\n')}`, {
    parse_mode: 'Markdown'
  });
});

bot.onText(/\/stages/, (msg) => {
  const data = [
    { number: '99', stages: [51, 55, 49, 0, 0] },
    { number: '97', stages: [44, 28, 42, 0, 0] },
    { number: '57', stages: [32, 41, 32, 0, 0] },
    { number: '49', stages: [43, 38, 11, 0, 0] },
    { number: '34', stages: [25, 30, 35, 0, 0] },
    { number: '50', stages: [14, 16, 41, 0, 0] },
    { number: '111', stages: [18, 22, 19, 0, 0] },
    { number: '45', stages: [21, 18, 17, 0, 0] },
    { number: '101', stages: [0, 0, 17, 0, 0] },
  ];

  const sorted = data.map(d => ({
    ...d,
    total: d.stages.reduce((a, b) => a + b, 0)
  })).sort((a, b) => b.total - a.total);

  let text = '📅 <b>Очки по этапам</b>\n\n';
  text += '<pre>Поз  №   Итого   1   2   3   4   5</pre>\n';

  sorted.forEach((driver, i) => {
    const pos = String(i + 1).padStart(2, ' ');
    const num = driver.number.padStart(3, ' ');
    const total = String(driver.total).padStart(5, ' ');
    const stages = driver.stages.map(s => String(s).padStart(2, ' ')).join('  ');
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    text += `<pre>${pos}. ${num} ${total}   ${stages} ${medal}</pre>\n`;
  });

  bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
});

// Обработка reply-кнопок
bot.on('message', (msg) => {
  const text = msg.text;

  if (text === '🏆 Рейтинг гонщиков') {
    bot.emit('text', { text: '/rating', chat: msg.chat });
  }

  if (text === '📅 Очки по этапам') {
    bot.emit('text', { text: '/stages', chat: msg.chat });
  }
});
