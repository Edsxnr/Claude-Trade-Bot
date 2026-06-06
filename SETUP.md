# TradingView → Claude → Discord — Setup Guide

## What this does
TradingView fires an alert → your Vercel server receives it → Claude analyzes it using your trading thesis → a rich embed lands in your Discord channel.

---

## Step 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/tradingview-claude-bot.git
cd tradingview-claude-bot
npm install
```

---

## Step 2 — Get your keys

### Anthropic API Key
1. Go to https://console.anthropic.com
2. Click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`)

### Discord Webhook URL
1. Open Discord → go to your trading channel
2. Click **Edit Channel** (gear icon) → **Integrations** → **Webhooks**
3. Click **New Webhook** → give it a name like "Trade Intel Bot"
4. Click **Copy Webhook URL**

### Webhook Secret (you create this)
Just make up a random string — e.g. `tv_secret_abc123xyz`. You'll use this in TradingView alerts to authenticate.

---

## Step 3 — Deploy to Vercel

### First time setup
```bash
npx vercel login        # log in with your GitHub account
npx vercel              # creates the project, follow prompts
```

### Add environment variables (run each one)
```bash
npx vercel env add ANTHROPIC_API_KEY
# paste your sk-ant-... key when prompted, select all environments

npx vercel env add DISCORD_WEBHOOK_URL
# paste your Discord webhook URL

npx vercel env add WEBHOOK_SECRET
# paste your secret string e.g. tv_secret_abc123xyz
```

### Deploy to production
```bash
npx vercel --prod
```

Your webhook URL will be: `https://your-project-name.vercel.app/webhook`

---

## Step 4 — Test it works

```bash
# Test locally first
npx vercel dev &
WEBHOOK_SECRET=your-secret node test/send-test-alert.js

# Test production
WEBHOOK_URL=https://your-project.vercel.app WEBHOOK_SECRET=your-secret node test/send-test-alert.js
```

You should see a Discord embed appear in your channel within a few seconds.

---

## Step 5 — Set up TradingView alerts

In TradingView, create an alert on any chart. In the **Notifications** tab:

- Check **Webhook URL**
- Enter: `https://your-project.vercel.app/webhook`

In the **Message** field, paste the appropriate JSON template:

---

### Alert templates — copy/paste these into TradingView

#### RSI Oversold (RSI crosses below 30)
```json
{
  "ticker": "{{ticker}}",
  "alertType": "rsi_oversold",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "rsi": {{plot_0}},
  "volume": "{{volume}}"
}
```

#### RSI Overbought (RSI crosses above 70)
```json
{
  "ticker": "{{ticker}}",
  "alertType": "rsi_overbought",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "rsi": {{plot_0}},
  "volume": "{{volume}}"
}
```

#### Price breaks below key level
```json
{
  "ticker": "{{ticker}}",
  "alertType": "price_break_down",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "key_level": 60000
}
```
*(Change `key_level` to whatever level you're watching — 70000, 65568, 60411, etc.)*

#### Price breaks above key level
```json
{
  "ticker": "{{ticker}}",
  "alertType": "price_break_up",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "key_level": 65568
}
```

#### MACD Bearish Cross
```json
{
  "ticker": "{{ticker}}",
  "alertType": "macd_bearish",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "macd": {{plot_0}}
}
```

#### MACD Bullish Cross
```json
{
  "ticker": "{{ticker}}",
  "alertType": "macd_bullish",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "macd": {{plot_0}}
}
```

---

### Adding the secret header in TradingView
TradingView doesn't support custom headers natively on free plans. Two options:

**Option A (free):** Append secret as query param — update your webhook route to check `?secret=xxx` instead of the header. Change `api/webhook.js` line:
```js
const secret = req.query.secret;
```
Then your webhook URL becomes:
`https://your-project.vercel.app/webhook?secret=tv_secret_abc123xyz`

**Option B (TradingView Pro+):** Use the "Add header" feature in webhook settings to add:
`x-webhook-secret: tv_secret_abc123xyz`

---

## Supported tickers

| Crypto | Stocks | ETFs |
|--------|--------|------|
| BTCUSDT | PLTR | SPY |
| ETHUSDT | NVDA | QQQ |
| SOLUSDT | INTC | IWM |
| XRPUSDT | MSFT | GLD |
| BNBUSDT | AAPL | USO |
| ADAUSDT | TSLA | SLV |

Any unlisted ticker will still work — Claude will analyze it without a pre-built thesis.

---

## What the Discord alert looks like

```
⚡ RSI Oversold (<30) — Bitcoin (BTC)
$61,095 · 1D · ₿ CRYPTO

1. SIGNAL READ
RSI at 16.1 confirms deepest oversold reading this cycle...

2. BIAS
🔴 BEARISH — oversold in a downtrend, not a reversal signal yet...

3. TRADE SETUP
Entry: $60,000–$62,704 zone on reversal candle...
Stop: $58,811 daily close
T1: $65,568 | T2: $67,774

4. OPTIONS PLAY
Bull call spread: buy $62K call / sell $67K call, 2-week expiry...

5. RISK
NFP beat pushes rate cuts to 2027 — macro headwind persists...

6. CONFIDENCE
⚡ MEDIUM

Bias: 🔴 BEARISH   Confidence: ⚡ MEDIUM   Ticker: BTCUSDT
RSI: 16.1
TradingView → Claude · Jun 5, 11:32 PM ET
```

---

## Updating the trading thesis

The thesis for each asset lives in `lib/claude.js` in the `ASSET_CONTEXT` object. Update it weekly when you run your market intel dashboard. Each asset has a `thesis` field — just edit the string with your current read.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Wrong WEBHOOK_SECRET — check it matches in Vercel env vars |
| 500 error | Check Vercel logs: `npx vercel logs` |
| No Discord message | Verify DISCORD_WEBHOOK_URL is correct and channel exists |
| "Invalid alertType" | Check your TradingView JSON message matches exactly |
| Claude not responding | Check ANTHROPIC_API_KEY and account has credits |
