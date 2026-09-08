# MemeGod Community Bot

The bot answers common questions about the official contract address, buying,
the website, and the X account. It also welcomes new members, runs a private
two-minute CAPTCHA for join requests, and applies conservative 24-hour bans to
strong solicitation or link-spam matches.

For CAPTCHA approvals, grant the bot only the **Invite Users** administrator
right. To enforce spam removal and temporary bans, also grant **Delete Messages**
and **Ban Users**. Do not grant Add Admins or Change Group Info.

## Run

Requires Node.js 18 or newer and a `TELEGRAM_BOT_TOKEN` environment variable.

```powershell
$env:TELEGRAM_BOT_TOKEN = '<token from @BotFather>'
node .\telegram-bot\bot.js
```

The token must never be committed to GitHub. For continuous service, deploy the
bot to an always-on host or configure it to run when the community computer is
online.
