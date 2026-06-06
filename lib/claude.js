const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const ASSET_CONTEXT = {
  BTCUSDT: {
    name: 'Bitcoin (BTC)',
    type: 'crypto',
    thesis: `Current thesis: STRONGLY BEARISH. BTC broke below $70K, $68K, $65K support. Record 13-day ETF outflow streak totaling $4.4B. NFP came in 172K vs 85K forecast pushing Fed rate cuts to 2027. RSI hit 16 — deeply oversold but no divergence yet. Key levels: resistance at $65.5K/$67.8K/$70.5K (EMA20). Support at $60.4K. Stop loss on any long below $58.8K daily close. Bear target $55K if $60K breaks. Longer-term accumulation zone: $55K–$60K for Oct/Nov bull call spreads.`,
  },
  ETHUSDT: {
    name: 'Ethereum (ETH)',
    type: 'crypto',
    thesis: `ETH has also been under pressure tracking BTC downside. ETF outflows affected ETH products too (-$241M weekly). Watch BTC correlation — if BTC bounces ETH typically outperforms. Key support: $1,800–$1,900 zone. Standard Chartered long-term target $40K by 2030.`,
  },
  SOLUSDT: {
    name: 'Solana (SOL)',
    type: 'crypto',
    thesis: `High-beta crypto asset. Tracks broader crypto sentiment with amplified moves. In risk-off environments SOL underperforms BTC. Watch for relative strength vs BTC as a risk appetite signal.`,
  },
  XRPUSDT: {
    name: 'XRP',
    type: 'crypto',
    thesis: `Regulatory-sensitive. Digital Asset Market Clarity Act progress is the key catalyst. Trump has expressed pro-crypto stance. Any regulatory clarity would be a strong bull catalyst for XRP specifically.`,
  },
  PLTR: {
    name: 'Palantir (PLTR)',
    type: 'stock',
    thesis: `Trump-promoted stock. Trump posted on Truth Social in April that Palantir has "proven great war-fighting capabilities." Stock ran ~33% from $122 low to ~$142. Now showing signs of pullback/consolidation. AI software for US military and intelligence. $9.7B Pentagon contracts. Bull flag forming — watch for continuation or breakdown.`,
  },
  INTC: {
    name: 'Intel (INTC)',
    type: 'stock',
    thesis: `Trump administration holds a stake. Q1 2026 earnings drove 15% jump, stock broke August 2000 record high. Ran from $40 to peak near $133 (+200%+). Now showing profit-taking from late May. Bull flag pattern. Nvidia competition is key risk — Nvidia unveiled chip targeting Intel's core business.`,
  },
  NVDA: {
    name: 'Nvidia (NVDA)',
    type: 'stock',
    thesis: `AI/semiconductor bellwether. Institutional rotation INTO AI stocks and away from crypto is a key theme driving BTC weakness. Nvidia strength = crypto headwind (capital rotation). Watch for correlation signals.`,
  },
  SPY: {
    name: 'S&P 500 ETF (SPY)',
    type: 'stock',
    thesis: `Macro risk barometer. NFP 172K beat (2x consensus) sent SPY lower — strong jobs = delayed rate cuts = risk-off. Iran war pressure on oil prices adding inflationary concern. Fed June 17-18 FOMC is next major catalyst. Hawkish tone = SPY lower, crypto lower.`,
  },
  QQQ: {
    name: 'Nasdaq 100 ETF (QQQ)',
    type: 'stock',
    thesis: `Tech/growth proxy. Most sensitive to rate cut expectations. NFP beat sent QQQ -1.94% on the day. Institutional rotation from crypto to AI stocks (SpaceX IPO hype, Nvidia strength) is a key theme.`,
  },
  DEFAULT: {
    name: 'Asset',
    type: 'unknown',
    thesis: 'No specific thesis on file for this asset. Analyze based on technical signals provided.',
  },
};

function getAssetContext(ticker) {
  const clean = ticker?.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return ASSET_CONTEXT[clean] || { ...ASSET_CONTEXT.DEFAULT, name: ticker };
}

function buildPrompt(alert) {
  const ctx = getAssetContext(alert.ticker);
  const alertTypeDescriptions = {
    rsi_oversold: `RSI has crossed BELOW 30 — entering oversold territory`,
    rsi_overbought: `RSI has crossed ABOVE 70 — entering overbought territory`,
    price_break_up: `Price has broken ABOVE a key level`,
    price_break_down: `Price has broken BELOW a key level`,
    macd_bullish: `MACD line has crossed ABOVE the signal line — bullish momentum crossover`,
    macd_bearish: `MACD line has crossed BELOW the signal line — bearish momentum crossover`,
    ema_cross_bullish: `Price / EMA bullish crossover detected`,
    ema_cross_bearish: `Price / EMA bearish crossover detected`,
  };

  const alertDesc = alertTypeDescriptions[alert.alertType] || alert.alertType;

  return `You are an expert crypto and equities trader analyzing a real-time alert. Be concise, direct, and actionable. No fluff.

ALERT: ${alertDesc}
ASSET: ${ctx.name} (${alert.ticker})
TIMEFRAME: ${alert.timeframe || '1D'}
CURRENT PRICE: $${alert.price?.toLocaleString() || 'unknown'}
${alert.rsi ? `RSI: ${alert.rsi}` : ''}
${alert.macd ? `MACD: ${alert.macd}` : ''}
${alert.volume ? `Volume: ${alert.volume}` : ''}
${alert.keyLevel ? `Key level triggered: $${alert.keyLevel}` : ''}

CURRENT THESIS ON THIS ASSET:
${ctx.thesis}

Provide a trading analysis with these exact sections:
1. SIGNAL READ (1-2 sentences: what this alert means in context of the current thesis)
2. BIAS (one word: BULLISH / BEARISH / NEUTRAL, then 1 sentence why)
3. TRADE SETUP (specific entry zone, stop loss, and 1-2 targets in dollar terms)
4. OPTIONS PLAY (specific structure e.g. "Bear put spread: buy $X put / sell $Y put, [expiry]" or "Bull call spread: buy $X call / sell $Y call, [expiry]")
5. RISK (one key risk to this trade in 1 sentence)
6. CONFIDENCE (LOW / MEDIUM / HIGH — based on how well signal aligns with thesis)

Keep the entire response under 200 words. Be direct. Use $ amounts not percentages where possible.`;
}

export async function analyzeAlert(alert) {
  const prompt = buildPrompt(alert);

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text;
  if (!text) throw new Error('No text in Claude response');

  return parseAnalysis(text, alert);
}

function parseAnalysis(text, alert) {
  const ctx = getAssetContext(alert.ticker);
  return {
    raw: text,
    ticker: alert.ticker,
    assetName: ctx.name,
    assetType: ctx.type,
    alertType: alert.alertType,
    price: alert.price,
    timeframe: alert.timeframe || '1D',
    timestamp: new Date().toISOString(),
    confidence: extractField(text, 'CONFIDENCE') || 'MEDIUM',
    bias: extractField(text, 'BIAS') || 'NEUTRAL',
  };
}

function extractField(text, field) {
  const regex = new RegExp(`${field}[:\\s]+([A-Z]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].toUpperCase() : null;
}
