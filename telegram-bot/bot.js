const fs = require('node:fs');
const path = require('node:path');

const MARKET_TEST = process.argv.includes('--market-test');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN && !MARKET_TEST) {
  console.error('Missing TELEGRAM_BOT_TOKEN.');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;
const CA = '9Jx9ULUf9bvshu2grDaxYwYRqKarP4awF9N2iAyepump';
const BUY = `https://pump.fun/coin/${CA}`;
const SITE = 'https://studi0413.github.io/memegod-emergent-ready/';
const X = 'https://x.com/memegodcoinz';
const COMMUNITY_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1004303584990';
const MARKET_API = `https://api.dexscreener.com/token-pairs/v1/solana/${CA}`;
const MARKET_STATE_PATH = process.env.MARKET_STATE_PATH || path.join(__dirname, '.market-state.json');
const MARKET_CHECK_INTERVAL_MS = Number(process.env.MARKET_CHECK_INTERVAL_MS) || 5 * 60 * 1000;
const MARKET_SUMMARY_INTERVAL_MS = Number(process.env.MARKET_SUMMARY_INTERVAL_MS) || 4 * 60 * 60 * 1000;
const MARKET_CAP_MILESTONES = [5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000];
const VOLUME_MILESTONES = [10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];
const CAPTCHA_TTL_MS = 2 * 60 * 1000;
const TEMP_BAN_SECONDS = 24 * 60 * 60;
const challenges = new Map();
const recentMessages = new Map();

const OFFICIAL_LINKS = [BUY.toLowerCase(), SITE.toLowerCase(), X.toLowerCase()];
const SOLICITATION = /\b(dm me|message me|contact me|guaranteed returns?|double your|send (?:me )?(?:sol|crypto)|claim (?:your )?airdrop|presale|private sale|investment opportunity)\b/i;

const HELP = [
  '👑 MemeGod Community Bot',
  '',
  '/ca — official contract address',
  '/buy — official Pump.fun link',
  '/website — official website',
  '/x — official X account',
  '/stats — latest market snapshot',
  '/help — show this menu',
  '',
  '⚠️ Admins will never ask for your seed phrase or private keys.',
].join('\n');

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatUsd(value, price = false) {
  const number = asNumber(value);
  if (price && number > 0 && number < 0.01) {
    return `$${number.toLocaleString('en-US', { maximumFractionDigits: 10 })}`;
  }
  return `$${number.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatPercent(value) {
  const number = asNumber(value);
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`;
}

async function fetchMarket() {
  const response = await fetch(MARKET_API, {
    headers: { accept: 'application/json', 'user-agent': 'MemeGodCommunityBot/1.0' },
  });
  if (!response.ok) throw new Error(`Market API returned ${response.status}`);

  const pairs = await response.json();
  if (!Array.isArray(pairs) || pairs.length === 0) {
    throw new Error('No MemeGod market pair is indexed yet.');
  }

  const graduatedPair = pairs.find((pair) => pair.dexId === 'pumpswap');
  const pair = graduatedPair || [...pairs].sort((left, right) => {
    const leftActivity = asNumber(left.volume?.h24) + asNumber(left.liquidity?.usd);
    const rightActivity = asNumber(right.volume?.h24) + asNumber(right.liquidity?.usd);
    return rightActivity - leftActivity;
  })[0];

  return {
    buys24h: asNumber(pair.txns?.h24?.buys),
    chartUrl: pair.url || BUY,
    dexId: pair.dexId || 'pumpfun',
    graduated: Boolean(graduatedPair),
    liquidityUsd: asNumber(pair.liquidity?.usd),
    marketCap: asNumber(pair.marketCap || pair.fdv),
    priceChange24h: asNumber(pair.priceChange?.h24),
    priceUsd: asNumber(pair.priceUsd),
    sells24h: asNumber(pair.txns?.h24?.sells),
    volume24h: asNumber(pair.volume?.h24),
  };
}

function marketSummary(market, heading = '👑 MemeGod 4-hour market update') {
  const status = market.graduated ? 'Graduated to PumpSwap ✅' : 'Trading on the Pump.fun bonding curve';
  const lines = [
    heading,
    '',
    `Price: ${formatUsd(market.priceUsd, true)}`,
    `Market cap: ${formatUsd(market.marketCap)}`,
    `24h volume: ${formatUsd(market.volume24h)}`,
    `24h change: ${formatPercent(market.priceChange24h)}`,
    `24h trades: ${market.buys24h} buys / ${market.sells24h} sells`,
  ];
  if (market.liquidityUsd > 0) lines.push(`Liquidity: ${formatUsd(market.liquidityUsd)}`);
  lines.push(`Status: ${status}`, '', `Chart: ${market.chartUrl}`, '', 'Market data via DEX Screener. Informational only.');
  return lines.join('\n');
}

function loadMarketState() {
  try {
    return JSON.parse(fs.readFileSync(MARKET_STATE_PATH, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Market state read failed:', error.message);
    return null;
  }
}

function saveMarketState(state) {
  fs.writeFileSync(MARKET_STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

function reachedMilestones(value, thresholds) {
  return thresholds.filter((threshold) => value >= threshold);
}

async function checkMarket() {
  const market = await fetchMarket();
  let state = loadMarketState();

  if (!state) {
    state = {
      graduated: market.graduated,
      marketCapMilestones: reachedMilestones(market.marketCap, MARKET_CAP_MILESTONES),
      volumeMilestones: reachedMilestones(market.volume24h, VOLUME_MILESTONES),
      lastSummaryAt: Date.now(),
    };
    saveMarketState(state);
    console.log('Market tracker baseline created; prior milestones will not be announced.');
    return;
  }

  const newMarketCaps = reachedMilestones(market.marketCap, MARKET_CAP_MILESTONES)
    .filter((value) => !state.marketCapMilestones.includes(value));
  const newVolumes = reachedMilestones(market.volume24h, VOLUME_MILESTONES)
    .filter((value) => !state.volumeMilestones.includes(value));

  if (newMarketCaps.length > 0) {
    const milestone = Math.max(...newMarketCaps);
    await telegram('sendMessage', {
      chat_id: COMMUNITY_CHAT_ID,
      text: marketSummary(market, `🚀 MemeGod milestone unlocked: ${formatUsd(milestone)} market cap!`),
      disable_web_page_preview: true,
    });
    state.marketCapMilestones.push(...newMarketCaps);
  }

  if (newVolumes.length > 0) {
    const milestone = Math.max(...newVolumes);
    await telegram('sendMessage', {
      chat_id: COMMUNITY_CHAT_ID,
      text: marketSummary(market, `🔥 MemeGod crossed ${formatUsd(milestone)} in 24-hour volume!`),
      disable_web_page_preview: true,
    });
    state.volumeMilestones.push(...newVolumes);
  }

  if (market.graduated && !state.graduated) {
    await telegram('sendMessage', {
      chat_id: COMMUNITY_CHAT_ID,
      text: marketSummary(market, '🎓 MemeGod has graduated to PumpSwap! 👑'),
      disable_web_page_preview: true,
    });
    state.graduated = true;
  }

  if (Date.now() - asNumber(state.lastSummaryAt) >= MARKET_SUMMARY_INTERVAL_MS) {
    await telegram('sendMessage', {
      chat_id: COMMUNITY_CHAT_ID,
      text: marketSummary(market),
      disable_web_page_preview: true,
    });
    state.lastSummaryAt = Date.now();
  }

  saveMarketState(state);
}

async function marketLoop() {
  while (true) {
    try {
      await checkMarket();
    } catch (error) {
      console.error('Market update failed:', error.message);
    }
    await new Promise((resolve) => setTimeout(resolve, MARKET_CHECK_INTERVAL_MS));
  }
}

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

function challengeKey(chatId, userId) {
  return `${chatId}:${userId}`;
}

function shuffled(values) {
  return values
    .map((value) => ({ value, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ value }) => value);
}

async function createCaptcha(request) {
  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 2;
  const answer = left + right;
  const key = challengeKey(request.chat.id, request.from.id);

  const choices = shuffled([answer, answer + 1, Math.max(1, answer - 2)]);
  const challenge = {
    answer,
    attempts: 0,
    chatId: request.chat.id,
    expiresAt: Date.now() + CAPTCHA_TTL_MS,
    userChatId: request.user_chat_id,
    userId: request.from.id,
  };
  challenges.set(key, challenge);

  await telegram('sendMessage', {
    chat_id: request.user_chat_id,
    text: `Welcome to MemeGod Community, ${request.from.first_name}! 👑\n\nHuman check: What is ${left} + ${right}?\n\nThis challenge expires in 2 minutes.`,
    reply_markup: {
      inline_keyboard: [choices.map((choice) => ({
        text: String(choice),
        callback_data: `verify:${request.chat.id}:${request.from.id}:${choice}`,
      }))],
    },
  });

  setTimeout(async () => {
    const pending = challenges.get(key);
    if (!pending || pending.expiresAt > Date.now()) return;
    challenges.delete(key);
    try {
      await telegram('declineChatJoinRequest', {
        chat_id: pending.chatId,
        user_id: pending.userId,
      });
      await telegram('sendMessage', {
        chat_id: pending.userChatId,
        text: 'Your MemeGod verification expired. Please request to join again for a new challenge.',
      });
    } catch (error) {
      console.error('Captcha expiry failed:', error.message);
    }
  }, CAPTCHA_TTL_MS + 1000);
}

async function handleCaptcha(callback) {
  const parts = callback.data?.split(':');
  if (parts?.[0] !== 'verify' || parts.length !== 4) return;

  const chatId = Number(parts[1]);
  const userId = Number(parts[2]);
  const choice = Number(parts[3]);
  const key = challengeKey(chatId, userId);
  const challenge = challenges.get(key);

  if (!challenge || callback.from.id !== userId || challenge.expiresAt < Date.now()) {
    await telegram('answerCallbackQuery', {
      callback_query_id: callback.id,
      text: 'This verification has expired. Please request to join again.',
      show_alert: true,
    });
    return;
  }

  if (choice !== challenge.answer) {
    challenge.attempts += 1;
    await telegram('answerCallbackQuery', {
      callback_query_id: callback.id,
      text: challenge.attempts >= 3 ? 'Verification failed.' : 'Not quite. Try again.',
      show_alert: true,
    });
    if (challenge.attempts >= 3) {
      challenges.delete(key);
      await telegram('declineChatJoinRequest', { chat_id: chatId, user_id: userId });
      await telegram('editMessageText', {
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
        text: 'Verification failed. You may request to join again later.',
      });
    }
    return;
  }

  challenges.delete(key);
  await telegram('approveChatJoinRequest', { chat_id: chatId, user_id: userId });
  await telegram('answerCallbackQuery', {
    callback_query_id: callback.id,
    text: 'Verified! Welcome to MemeGod Community.',
  });
  await telegram('editMessageText', {
    chat_id: callback.message.chat.id,
    message_id: callback.message.message_id,
    text: '✅ Human verification passed. Welcome to MemeGod Community! 👑',
  });
}

async function isGroupAdmin(chatId, userId) {
  const member = await telegram('getChatMember', { chat_id: chatId, user_id: userId });
  return member.status === 'creator' || member.status === 'administrator';
}

function looksLikeSpam(message) {
  const text = message.text || message.caption || '';
  const lower = text.toLowerCase();
  const urls = text.match(/https?:\/\/\S+|t\.me\/\S+/gi) || [];
  const externalUrls = urls.filter((url) => !OFFICIAL_LINKS.some((official) => url.toLowerCase().startsWith(official)));

  const userKey = `${message.chat.id}:${message.from.id}`;
  const now = Date.now();
  const history = (recentMessages.get(userKey) || []).filter((entry) => now - entry.at < 60_000);
  history.push({ at: now, text: lower });
  recentMessages.set(userKey, history);

  const repeatedLinkPost = externalUrls.length > 0 && history.filter((entry) => entry.text === lower).length >= 3;
  return externalUrls.length >= 3 || (externalUrls.length > 0 && SOLICITATION.test(text)) || repeatedLinkPost;
}

async function moderateSpam(message) {
  if (!message.from || message.from.is_bot || !looksLikeSpam(message)) return false;
  if (await isGroupAdmin(message.chat.id, message.from.id)) return false;

  await telegram('deleteMessage', {
    chat_id: message.chat.id,
    message_id: message.message_id,
  });
  await telegram('banChatMember', {
    chat_id: message.chat.id,
    user_id: message.from.id,
    until_date: Math.floor(Date.now() / 1000) + TEMP_BAN_SECONDS,
    revoke_messages: true,
  });
  await telegram('sendMessage', {
    chat_id: message.chat.id,
    text: `Spam protection removed a solicitation post and temporarily banned ${message.from.first_name} for 24 hours.`,
  });
  return true;
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
  if (update.chat_join_request) {
    await createCaptcha(update.chat_join_request);
    return;
  }

  if (update.callback_query) {
    await handleCaptcha(update.callback_query);
    return;
  }

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

  if (await moderateSpam(message)) return;
  if (!message.text || message.from?.is_bot) return;
  if (/^\/stats(@\w+)?\b/i.test(message.text.trim())) {
    try {
      await reply(message, marketSummary(await fetchMarket(), '👑 MemeGod market snapshot'));
    } catch (error) {
      console.error('Market snapshot failed:', error.message);
      await reply(message, 'Market data is temporarily unavailable. Please try again shortly.');
    }
    return;
  }
  const response = responseFor(message.text);
  if (response) await reply(message, response);
}

async function run() {
  let offset = 0;
  console.log('MemeGod bot is running.');
  void marketLoop();
  while (true) {
    try {
      const updates = await telegram('getUpdates', {
        offset,
        timeout: 50,
        allowed_updates: ['message', 'chat_join_request', 'callback_query'],
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

if (MARKET_TEST) {
  fetchMarket()
    .then((market) => console.log(marketSummary(market, 'MemeGod market feed test')))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
} else {
  run();
}
