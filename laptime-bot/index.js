const { Telegraf, Markup } = require('telegraf');
const moment = require('moment-timezone');

const bot = new Telegraf(process.env.BOT_TOKEN);

const drivers = ['99', '101', '49', '57', '97', '34', '50', '45', '111'];
const tracks = [
  'Автодром Moscow Raceway',
  'Автодром Игора Драйв',
  'Автодром Нижегородское кольцо',
  'Автодром Казань Ринг'
];

let session = {
  active: false,
  track: '',
  date: '',
  times: {},
  lastStart: {}
};

bot.start((ctx) => {
  ctx.reply('Добро пожаловать! Выберите действие:', Markup.keyboard([
    ['🚦 Начать сессию'],
    ['📊 Результаты по сессиям', '📆 Результаты по дням'],
    ['🏆 Рейтинг']
  ]).resize());
});

bot.hears('◀️ Назад', (ctx) => {
  ctx.reply('Главное меню:', Markup.keyboard([
    ['🚦 Начать сессию'],
    ['📊 Результаты по сессиям', '📆 Результаты по дням'],
    ['🏆 Рейтинг']
  ]).resize());
});

bot.hears('🚦 Начать сессию', (ctx) => {
  ctx.reply('Выберите трассу:', Markup.keyboard([
    ...tracks.map(track => [track]),
    ['◀️ Назад']
  ]).resize());
});

tracks.forEach(track => {
  bot.hears(track, (ctx) => {
    session.active = true;
    session.track = track;
    session.date = moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm');
    session.times = {};
    session.lastStart = {};
    drivers.forEach(n => {
      session.times[n] = [];
      session.lastStart[n] = null;
    });

    ctx.reply(
      `🏁 Сессия началась!\n📍 Трасса: ${track}\n📅 Дата: ${session.date}\n\n🔘 Нажмите номер гонщика, чтобы начать/завершить круг:`,
      Markup.keyboard([
        ['99', '101', '49'],
        ['57', '97', '34'],
        ['50', '45', '111'],
        ['🏁 Завершить сессию', '◀️ Назад']
      ]).resize()
    );
  });
});

bot.hears(drivers, (ctx) => {
  if (!session.active) {
    return ctx.reply('❗ Сначала начните сессию.', Markup.keyboard([
      ['🚦 Начать сессию']
    ]).resize());
  }

  const driver = ctx.message.text;
  const now = Date.now();

  if (!session.lastStart[driver]) {
    session.lastStart[driver] = now;
    ctx.reply(`⏱ Старт круга для №${driver}`);
  } else {
    const lapTime = now - session.lastStart[driver];
    session.lastStart[driver] = null;
    session.times[driver].push(lapTime);
    const formatted = formatTime(lapTime);
    ctx.reply(`✅ Круг завершён для №${driver}: ${formatted}`);
  }
});

bot.hears('🏁 Завершить сессию', (ctx) => {
  session.active = false;
  ctx.reply('🛑 Сессия завершена. Данные сохранены.', Markup.keyboard([
    ['🚦 Начать сессию'],
    ['📊 Результаты по сессиям', '📆 Результаты по дням'],
    ['🏆 Рейтинг']
  ]).resize());
});

bot.hears('📊 Результаты по сессиям', (ctx) => {
  let text = `📊 Все круги по сессии ${session.track} — ${session.date}\n\n`;

  for (const [num, laps] of Object.entries(session.times || {})) {
    if (laps.length === 0) continue;

    const bestTime = Math.min(...laps);
    const bestIndex = laps.indexOf(bestTime) + 1;

    text += `🏎 №${num}\n`;
    text += `🥇 Лучший круг: ${formatTime(bestTime)} (Круг ${bestIndex})\n`;
    text += `Все круги:\n`;

    laps.forEach((time, index) => {
      const lapLabel = index + 1 === bestIndex ? '⭐' : '  ';
      text += `${lapLabel} Круг ${index + 1}: ${formatTime(time)}\n`;
    });

    text += `\n`;
  }

  ctx.reply(text || 'Нет данных.');
});

bot.hears('📆 Результаты по дням', (ctx) => {
  let text = '📆 Лучшие круги по гонщикам:\n';
  for (const [num, lapsList] of Object.entries(session.times || {})) {
    const best = lapsList.length ? formatTime(Math.min(...lapsList)) : '—';
    text += `• №${num}: ${best}\n`;
  }
  ctx.reply(text || 'Нет данных.');
});

bot.hears('🏆 Рейтинг', (ctx) => {
  const bestLaps = [];

  for (const [num, lapsList] of Object.entries(session.times || {})) {
    if (lapsList.length > 0) {
      const best = Math.min(...lapsList);
      bestLaps.push({ number: num, time: best });
    }
  }

  if (bestLaps.length === 0) {
    return ctx.reply('❗ Нет зафиксированных кругов.');
  }

  bestLaps.sort((a, b) => a.time - b.time);

  let text = '🏆 Рейтинг лучших кругов:\n\n';
  bestLaps.forEach((entry, index) => {
    text += `${index + 1}. №${entry.number} — ${formatTime(entry.time)}\n`;
  });

  ctx.reply(text);
});

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

bot.launch();
console.log('🤖 Бот запущен!');
