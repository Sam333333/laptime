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

bot.hears('🏆 Рейтинг лучших кругов', (ctx) => {
  if (!session.times || !session.dates || session.dates.length === 0) {
    return ctx.reply('❗ Нет данных или дат.');
  }

  const driverRankings = [];

  for (const [num, laps] of Object.entries(session.times)) {
    if (!laps || laps.length === 0) continue;

    const best = Math.min(...laps);
    const bestIndex = laps.findIndex(t => t === best);
    const total = laps.length;

    const sessionIndex = Math.floor(bestIndex / 14) + 1;
    const sessionLap = bestIndex % 14 + 1;
    const dayIndex = Math.floor(bestIndex / 14); // 0-based
    const date = session.dates[dayIndex] || '—';

    driverRankings.push({
      number: num,
      bestTime: best,
      bestFormatted: formatTime(best),
      session: sessionIndex,
      lap: sessionLap,
      date,
      total,
    });
  }

  if (driverRankings.length === 0) {
    return ctx.reply('❗ Нет результатов.');
  }

  driverRankings.sort((a, b) => a.bestTime - b.bestTime);

  const medals = ['🥇', '🥈', '🥉'];

  const text = '🏆 Рейтинг лучших кругов:\n\n' +
    driverRankings.map((d, i) =>
      `${medals[i] || `${i + 1}.`} №${d.number}: ${d.bestFormatted} (${d.date}, сессия ${d.session}, круг ${d.lap}) — всего ${d.total} кругов`
    ).join('\n');

  ctx.reply(text);
});
// 🏆 Рейтинг гонщиков
bot.command('rating', (ctx) => {
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

  ctx.replyWithMarkdown(`🏆 *Рейтинг гонщиков*\n\n${lines.join('\n')}`);
});


// 📅 Очки по этапам (ВСТАВЬ СЮДА ↓)
bot.command('stages', (ctx) => {
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

  ctx.replyWithHTML(text);
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
