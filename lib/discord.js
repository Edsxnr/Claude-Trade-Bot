const ALERT_COLORS = {
  rsi_oversold:     0x1D9E75,
  rsi_overbought:   0xE24B4A,
  price_break_up:   0x1D9E75,
  price_break_down: 0xE24B4A,
  macd_bullish:     0x1D9E75,
  macd_bearish:     0xE24B4A,
  ema_cross_bullish:0x1D9E75,
  ema_cross_bearish:0xE24B4A,
  default:          0xBA7517,
};

const ALERT_EMOJIS = {
  rsi_oversold:     '🟢',
  rsi_overbought:   '🔴',
  price_break_up:   '⬆️',
  price_break_down: '⬇️',
  macd_bullish:     '📈',
  macd_bearish:     '📉',
  ema_cross_bullish:'✅',
  ema_cross_bearish:'❌',
  default:          '⚡',
};

const ALERT_LABELS = {
  rsi_oversold:     'RSI Oversold (<30)',
  rsi_overbought:   'RSI Overbought (>70)',
  price_break_up:   'Price Break — Upside',
  price_break_down: 'Price Break — Downside',
  macd_bullish:     'MACD Bullish Cross',
  macd_bearish:     'MACD Bearish Cross',
  ema_cross_bullish:'EMA Bullish Cross',
  ema_cross_bearish:'EMA Bearish Cross',
  default:          'Alert',
};

const BIAS_COLORS = {
  BULLISH: '🟢 BULLISH',
  BEARISH: '🔴 BEARISH',
  NEUTRAL: '🟡 NEUTRAL',
};

const CONFIDENCE_BADGES = {
  HIGH:   '🔥 HIGH',
  MEDIUM: '⚡ MEDIUM',
  LOW:    '⚠️ LOW',
};

const TYPE_BADGES = {
  crypto: '₿ CRYPTO',
  stock:  '📊 STOCK',
};

function formatAnalysisForDiscord(rawText) {
  return rawText
    .replace(/\*\*/g, '')
    .replace(/#{1,3} /g, '')
    .trim()
    .split('\n')
    .filter(l => l.trim())
    .map(line => {
      if (/^\d+\.\s+(SIGNAL READ|BIAS|TRADE SETUP|OPTIONS PLAY|RISK|CONFIDENCE)/i.test(line)) {
        return `\n**${line.trim()}**`;
      }
      return line;
    })
    .join('\n');
}

export async function sendDiscordAlert(alert, analysis) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('DISCORD_WEBHOOK_URL not set');

  const color = ALERT_COLORS[alert.alertType] || ALERT_COLORS.default;
  const emoji = ALERT_EMOJIS[alert.alertType] || ALERT_EMOJIS.default;
  const label = ALERT_LABELS[alert.alertType] || ALERT_LABELS.default;
  const biasDisplay = BIAS_COLORS[analysis.bias] || analysis.bias;
  const confDisplay = CONFIDENCE_BADGES[analysis.confidence] || analysis.confidence;
  const typeDisplay = TYPE_BADGES[analysis.assetType] || analysis.assetType?.toUpperCase() || '';

  const formattedAnalysis = formatAnalysisForDiscord(analysis.raw);
  const truncated = formattedAnalysis.length > 3800
    ? formattedAnalysis.slice(0, 3800) + '\n...'
    : formattedAnalysis;

  const timestamp = new Date(analysis.timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/New_York', timeZoneName: 'short',
  });

  const embed = {
    color,
    author: {
      name: `${emoji} ${label} — ${analysis.assetName}`,
    },
    title: `$${Number(analysis.price).toLocaleString()} · ${analysis.timeframe} · ${typeDisplay}`,
    description: truncated,
    fields: [
      {
        name: 'Bias',
        value: biasDisplay,
        inline: true,
      },
      {
        name: 'Confidence',
        value: confDisplay,
        inline: true,
      },
      {
        name: 'Ticker',
        value: `\`${alert.ticker}\``,
        inline: true,
      },
    ],
    footer: {
      text: `TradingView → Claude · ${timestamp}`,
    },
  };

  if (alert.rsi) {
    embed.fields.push({ name: 'RSI', value: String(alert.rsi), inline: true });
  }
  if (alert.keyLevel) {
    embed.fields.push({ name: 'Key Level', value: `$${Number(alert.keyLevel).toLocaleString()}`, inline: true });
  }

  const payload = {
    username: 'Trade Intel Bot',
    avatar_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Bitcoin_logo.svg/640px-Bitcoin_logo.svg.png',
    embeds: [embed],
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Discord webhook failed ${res.status}: ${txt}`);
  }
}
