const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN.');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;
const CA = '9Jx9ULUf9bvshu2grDaxYwYRqKarP4awF9N2iAyepump';
const BUY = `https://pump.fun/coin/${CA}`;
const SITE = 'https://studi0413.github.io/memegod-emergent-ready/';
const X = 'https://x.com/memegodcoinz';

const HELP = [
  '👑 MemeGod Community Bot',
  '',
  '/ca — official contract address',
  '/buy — official Pump.fun link',
  '/website — official website',
  '/x — official X account',
  '/help — show this menu',
  '',
  '⚠️ Admins will never ask for your seed phrase or private keys.',
].join('\n');

async function telegram(method, body) {
  const response = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!result.ok) throw new Error(`${method}: ${result.description}`);
  return result.result;
}

async function reply(message, text, options = {}) {
  return telegram('sendMessage', {
    chat_id: message.chat.id,
    reply_to_message_id: message.message_id,
    text,
    disable_web_page_preview: true,
    ...options,
  });
}

function responseFor(text) {
  const value = text.toLowerCase().trim();
  if (/^\/(start|help)(@\w+)?\b/.test(value)) return HELP;
  if (/^\/ca(@\w+)?\b/.test(value) || /\b(contract|contract address|\bca\b)\b/.test(value)) {
    return `Official MemeGod contract address:\n${CA}\n\nAlways verify it against the official website.`;
  }
  if (/^\/buy(@\w+)?\b/.test(value) || /\b(where|how).{0,18}\bbuy\b/.test(value)) {
    return `Buy MemeGod on the official Pump.fun page:\n${BUY}`;
  }
  if (/^\/website(@\w+)?\b/.test(value) || /\b(website|official site)\b/.test(value)) {
    return `Official MemeGod website:\n${SITE}`;
  }
  if (/^\/x(@\w+)?\b/.test(value) || /\b(twitter|official x|x account)\b/.test(value)) {
    return `Official MemeGod X account:\n${X}`;
  }
  return null;
}

async function handle(update) {
  const message = update.message;
  if (!message) return;

  if (message.new_chat_members?.length) {
    const names = message.new_chat_members
      .filter((member) => !member.is_bot)
      .map((member) => member.first_name)
      .join(', ');
    if (names) {
      await reply(message, `Welcome to the throne, ${names}! 👑\n\nUse /help for official MemeGod links. Never share seed phrases or private keys.`);
    }
    return;
  }

  if (!message.text || message.from?.is_bot) return;
  const response = responseFor(message.text);
  if (response) await reply(message, response);
}

async function run() {
  let offset = 0;
  console.log('MemeGod bot is running.');
  while (true) {
    try {
      const updates = await telegram('getUpdates', {
        offset,
        timeout: 50,
        allowed_updates: ['message'],
      });
      for (const update of updates) {
        offset = update.update_id + 1;
        try {
          await handle(update);
        } catch (error) {
          console.error('Update failed:', error.message);
        }
      }
    } catch (error) {
      console.error('Polling failed:', error.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

run();
