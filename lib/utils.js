const SUPPORTED_TICKERS = new Set([
  'BTCUSDT','BTCUSD','BTC',
  'ETHUSDT','ETHUSD','ETH',
  'SOLUSDT','SOLUSD','SOL',
  'XRPUSDT','XRPUSD','XRP',
  'BNBUSDT','ADAUSDT','DOGEUSDT',
  'PLTR','NVDA','INTC','MSFT','AAPL','TSLA',
  'SPY','QQQ','IWM','DIA',
  'GLD','USO','SLV',
]);

const VALID_ALERT_TYPES = new Set([
  'rsi_oversold',
  'rsi_overbought',
  'price_break_up',
  'price_break_down',
  'macd_bullish',
  'macd_bearish',
  'ema_cross_bullish',
  'ema_cross_bearish',
]);

const VALID_TIMEFRAMES = new Set([
  '1m','3m','5m','15m','30m',
  '1h','2h','4h','6h','12h',
  '1D','1W','1M',
]);

export function validateAlert(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, reason: 'Body must be a JSON object' };
  }

  const { ticker, alertType, price } = body;

  if (!ticker || typeof ticker !== 'string') {
    return { valid: false, reason: 'Missing or invalid ticker' };
  }

  if (!alertType || typeof alertType !== 'string') {
    return { valid: false, reason: 'Missing alertType' };
  }

  if (!VALID_ALERT_TYPES.has(alertType)) {
    return {
      valid: false,
      reason: `Unknown alertType "${alertType}". Valid: ${[...VALID_ALERT_TYPES].join(', ')}`,
    };
  }

  if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
    return { valid: false, reason: 'price must be a positive number' };
  }

  return { valid: true };
}

export function enrichAlert(body) {
  const ticker = body.ticker.toUpperCase().trim();

  return {
    ticker,
    alertType: body.alertType,
    price: typeof body.price === 'number' ? body.price : parseFloat(body.price) || null,
    timeframe: VALID_TIMEFRAMES.has(body.timeframe) ? body.timeframe : '1D',
    rsi: body.rsi ? parseFloat(body.rsi) : null,
    macd: body.macd ? parseFloat(body.macd) : null,
    volume: body.volume || null,
    keyLevel: body.key_level ? parseFloat(body.key_level) : null,
    exchange: body.exchange || null,
    receivedAt: new Date().toISOString(),
  };
}

export function normalizeTicker(ticker) {
  const t = ticker?.toUpperCase().trim();
  const cryptoMap = {
    BTC: 'BTCUSDT', ETH: 'ETHUSDT',
    SOL: 'SOLUSDT', XRP: 'XRPUSDT',
    BNB: 'BNBUSDT',
  };
  return cryptoMap[t] || t;
}
