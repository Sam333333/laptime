
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

bot.hears(tracks, (ctx) => {
  const selectedTrack = ctx.message.text;
  session.active = true;
  session.track = selectedTrack;
  session.date = moment().tz("Europe/Moscow").format("YYYY-MM-DD HH:mm:ss");
  session.times = {};
  session.lastStart = {};
  ctx.reply(`Трасса: ${selectedTrack}\nДата: ${session.date}`, Markup.keyboard([
    ['99', '101', '49'],
    ['57', '97', '34'],
    ['50', '45', '111'],
    ['◀️ Назад']
  ]).resize());
});

drivers.forEach(driver => {
  bot.hears(driver, (ctx) => {
    const now = moment();
    const last = session.lastStart[driver];
    if (!last) {
      session.lastStart[driver] = now;
      ctx.reply(`🚦 Старт круга для гонщика ${driver}`);
    } else {
      const duration = moment.duration(now.diff(last));
      const formatted = `${Math.floor(duration.asMinutes())}:${(duration.seconds()).toString().padStart(2, '0')}.${duration.milliseconds().toString().padStart(3, '0')}`;
      session.lastStart[driver] = null;
      if (!session.times[driver]) session.times[driver] = [];
      session.times[driver].push(formatted);
      ctx.reply(`🏁 Круг завершён для ${driver}: ${formatted}`);
    }
  });
});

bot.hears('📊 Результаты по сессиям', (ctx) => {
  if (!session.active) return ctx.reply('Нет активной сессии.');
  const table = Object.entries(session.times)
    .filter(([_, laps]) => laps.length > 0)
    .map(([driver, laps]) => {
      const best = laps.reduce((a, b) => a < b ? a : b);
      const bestIndex = laps.indexOf(best) + 1;
      return { driver, best, bestIndex };
    })
    .sort((a, b) => a.best.localeCompare(b.best))
    .map((row, index) => `${index === 0 ? '🥇' : ''} ${row.driver}: ${row.best} (Круг ${row.bestIndex})`)
    .join('\n');

  ctx.reply(`📊 Результаты по сессиям:\n${table}`);
});

bot.hears('📆 Результаты по дням', (ctx) => {
  if (!session.active) return ctx.reply('Нет данных по дням.');
  const table = Object.entries(session.times)
    .filter(([_, laps]) => laps.length > 0)
    .map(([driver, laps]) => {
      const best = laps.reduce((a, b) => a < b ? a : b);
      return `${driver} — лучший круг: ${best} (📅 ${session.date})`;
    })
    .join('\n');

  ctx.reply(`📆 Результаты по дням:\n${table}`);
});

bot.hears('🏁 Завершить сессию', (ctx) => {
  session.active = false;
  ctx.reply('Сессия завершена ✅. Данные сохранены.');
});

bot.hears('🏆 Рейтинг', (ctx) => {
  const points = {
    '99': 102,
    '101': 98,
    '49': 85,
    '57': 80,
    '97': 75,
    '34': 72,
    '50': 68,
    '45': 60,
    '111': 50
  };

  const sorted = Object.entries(points)
    .sort((a, b) => b[1] - a[1])
    .map(([driver, pts], i) => `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''} ${driver} — ${pts} очков`)
    .join('\n');

  ctx.reply(`🏆 Рейтинг гонщиков:\n${sorted}`);
});

bot.launch();
