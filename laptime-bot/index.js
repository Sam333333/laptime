
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.setMyCommands([
  { command: '/start', description: 'Запустить бота' },
  { command: '/rating', description: '🏆 Рейтинг гонщиков' },
  { command: '/stages', description: '📅 Очки по этапам' },
]);

bot.onText(/\/start/, (ctx) => {
  bot.sendMessage(ctx.chat.id, 'Добро пожаловать! Выберите команду из меню.');
});

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

  ctx.replyWithMarkdown(`🏆 *Рейтинг гонщиков*

${lines.join('\n')}`);
});

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
