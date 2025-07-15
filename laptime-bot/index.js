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
  const driverData = [];

  for (const [num, lapsList] of Object.entries(session.times || {})) {
    if (!lapsList || lapsList.length === 0) continue;

    const bestTime = Math.min(...lapsList);
    const bestIndex = lapsList.findIndex(t => t === bestTime) + 1;
    const formattedBest = `🥇 ${formatTime(bestTime)} (круг ${bestIndex})`;

    const otherLaps = lapsList
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t !== bestTime)
      .map(({ t, i }) => `${formatTime(t)} (круг ${i + 1})`);

    const line = `• №${num}: ${formattedBest}${otherLaps.length ? ' | ' + otherLaps.join(' | ') : ''}`;

    driverData.push({ number: num, best: bestTime, line });
  }

  if (driverData.length === 0) {
    return ctx.reply('❗ Нет зафиксированных кругов.');
  }

  driverData.sort((a, b) => a.best - b.best);

  const message = '📊 Результаты по сессиям (от быстрого к медленному):\n\n' +
    driverData.map(d => d.line).join('\n');

  ctx.reply(message);
});

bot.hears('📆 Результаты по дням', (ctx) => {
  if (!session.date || !session.times) {
    return ctx.reply('❗ Сессии ещё не проводились.');
  }

  let text = `📆 Результаты по дням:\nДата: ${session.date}\nТрасса: ${session.track || '—'}\n\n`;

  const driversWithTimes = [];

  for (const [num, lapsList] of Object.entries(session.times)) {
    if (!lapsList || lapsList.length === 0) continue;

    const best = Math.min(...lapsList);
    const bestIndex = lapsList.findIndex(t => t === best);
    const bestLap = bestIndex + 1;
    const total = lapsList.length;

    const sessionIndex = Math.floor(bestIndex / 14) + 1;
    const sessionLap = bestLap - ((sessionIndex - 1) * 14);

    driversWithTimes.push({
      number: num,
      bestTime: best,
      line: `• №${num}: 🥇 ${formatTime(best)} (сессия ${sessionIndex}, круг ${sessionLap}) — всего ${total} кругов`
    });
  }

  if (driversWithTimes.length === 0) {
    return ctx.reply('❗ Нет сохранённых результатов.');
  }

  driversWithTimes.sort((a, b) => a.bestTime - b.bestTime);

  text += driversWithTimes.map(d => d.line).join('\n');

  ctx.reply(text);
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
