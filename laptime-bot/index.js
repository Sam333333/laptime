
const { Telegraf, Markup } = require('telegraf');
const moment = require('moment-timezone');

const bot = new Telegraf(process.env.BOT_TOKEN);

let session = null;
let laps = {};
let timers = {};

const drivers = [99, 101, 49, 57, 97, 34, 50, 45, 111];
const tracks = [
  'Автодром Moscow Raceway',
  'Автодром Игора Драйв',
  'Автодром Нижегородское кольцо',
  'Автодром Казань Ринг'
];

bot.start((ctx) => {
  ctx.reply('Добро пожаловать! Нажмите «Начать сессию»', Markup.keyboard([
    ['Начать сессию']
  ]).resize());
});

bot.hears('Начать сессию', (ctx) => {
  ctx.reply('Выберите трассу:', Markup.keyboard(tracks.map(t => [t])).resize());
});

bot.hears(tracks, (ctx) => {
  const track = ctx.message.text;
  const time = moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
  session = { track, start: time };
  laps = {}; timers = {};
  ctx.reply(`✅ Сессия на трассе "${track}" начата в ${time}`, Markup.keyboard([
    [ 'Завершить сессию', 'Результаты по сессиям' ],
    [ 'Результаты по дням' ],
    ...chunk(drivers, 3).map(row => row.map(d => `${d}`)),
    [ 'Назад' ]
  ]).resize());
});

bot.hears(drivers.map(String), (ctx) => {
  const num = ctx.message.text;
  const now = Date.now();
  if (!timers[num]) {
    timers[num] = now;
    ctx.reply(`⏱ Старт круга для №${num}`);
  } else {
    const diff = now - timers[num];
    const formatted = formatMs(diff);
    delete timers[num];
    if (!laps[num]) laps[num] = [];
    laps[num].push(formatted);
    ctx.reply(`🏁 Круг завершён №${num}: ${formatted}`);
  }
});

bot.hears('Завершить сессию', (ctx) => {
  ctx.reply('✅ Сессия завершена. Результаты сохранены.');
});

bot.hears('Результаты по сессиям', (ctx) => {
  let text = '📊 Результаты по сессиям:
';
  for (const [num, list] of Object.entries(laps)) {
    list.forEach((time, i) => {
      text += `№${num} — Сессия ${i + 1}: ${time}
`;
    });
  }
  ctx.reply(text || 'Нет данных.');
});

bot.hears('Результаты по дням', (ctx) => {
  let text = '📆 Результаты по дням:
';
  for (const [num, list] of Object.entries(laps)) {
    const best = list.sort()[0];
    text += `№${num} — лучший круг: ${best}
`;
  }
  ctx.reply(text || 'Нет данных.');
});

bot.launch();

function formatMs(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const msLeft = ms % 1000;
  return `${min}:${String(sec).padStart(2, '0')}.${String(msLeft).padStart(3, '0')}`;
}

function chunk(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}
