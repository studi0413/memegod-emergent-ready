# MemeGod Community Bot

The bot answers common questions about the official contract address, buying,
the website, and the X account. It also welcomes new members, runs a private
two-minute CAPTCHA for join requests, and applies conservative 24-hour bans to
strong solicitation or link-spam matches.

It also tracks the official MemeGod token through DEX Screener. The bot checks
market data every five minutes, posts a summary every four hours, and announces
new market-cap, 24-hour-volume, and PumpSwap graduation milestones. Existing
milestones are recorded silently on first startup so the group is not flooded
with old announcements. Members can request a current snapshot with `/stats`.

For CAPTCHA approvals, grant the bot only the **Invite Users** administrator
right. To enforce spam removal and temporary bans, also grant **Delete Messages**
and **Ban Users**. Do not grant Add Admins or Change Group Info.

## Run

Requires Node.js 18 or newer and a `TELEGRAM_BOT_TOKEN` environment variable.

```powershell
$env:TELEGRAM_BOT_TOKEN = '<token from @BotFather>'
node .\telegram-bot\bot.js
```

The community chat defaults to `-1004303584990`. It and the intervals can be
overridden with `TELEGRAM_CHAT_ID`, `MARKET_CHECK_INTERVAL_MS`, and
`MARKET_SUMMARY_INTERVAL_MS`. To verify the public market feed without a bot
token or Telegram message, run:

```powershell
node .\telegram-bot\bot.js --market-test
```

The token must never be committed to GitHub. For continuous service, deploy the
bot to an always-on host or configure it to run when the community computer is
online.
