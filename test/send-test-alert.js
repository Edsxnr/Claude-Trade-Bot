#!/usr/bin/env node
/**
 * Test script — fires a mock TradingView alert at your deployed endpoint
 * Usage: WEBHOOK_URL=https://your-app.vercel.app WEBHOOK_SECRET=your-secret node test/send-test-alert.js
 */

const BASE_URL = process.env.WEBHOOK_URL || 'http://localhost:3000';
const SECRET = process.env.WEBHOOK_SECRET || 'test-secret';

const TEST_ALERTS = [
  {
    name: 'BTC RSI Oversold',
    payload: {
      ticker: 'BTCUSDT',
      alertType: 'rsi_oversold',
      price: 61095,
      timeframe: '1D',
      rsi: 16.1,
      volume: '38000000000',
    },
  },
  {
    name: 'BTC Price Break Down',
    payload: {
      ticker: 'BTCUSDT',
      alertType: 'price_break_down',
      price: 59800,
      timeframe: '1D',
      key_level: 60000,
      rsi: 22,
    },
  },
  {
    name: 'ETH MACD Bearish Cross',
    payload: {
      ticker: 'ETHUSDT',
      alertType: 'macd_bearish',
      price: 1910,
      timeframe: '4h',
      macd: -45,
    },
  },
  {
    name: 'PLTR RSI Overbought',
    payload: {
      ticker: 'PLTR',
      alertType: 'rsi_overbought',
      price: 142,
      timeframe: '1D',
      rsi: 71.5,
    },
  },
  {
    name: 'NVDA MACD Bullish Cross',
    payload: {
      ticker: 'NVDA',
      alertType: 'macd_bullish',
      price: 1250,
      timeframe: '1D',
      macd: 12,
    },
  },
];

async function sendAlert(test) {
  console.log(`\n→ Sending: ${test.name}`);
  console.log(`  Payload: ${JSON.stringify(test.payload)}`);

  try {
    const res = await fetch(`${BASE_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': SECRET,
      },
      body: JSON.stringify(test.payload),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`  ✅ Success: ${JSON.stringify(data)}`);
    } else {
      console.log(`  ❌ Error ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`  ❌ Network error: ${err.message}`);
  }
}

async function checkHealth() {
  console.log(`\nChecking health at ${BASE_URL}/health...`);
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    console.log('Health:', JSON.stringify(data, null, 2));
    return data.status === 'ok';
  } catch (err) {
    console.log(`Health check failed: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('=== TradingView Claude Bot — Test Runner ===');
  console.log(`Target: ${BASE_URL}`);

  const healthy = await checkHealth();
  if (!healthy && BASE_URL !== 'http://localhost:3000') {
    console.log('\n⚠️  Health check failed. Make sure your server is running.');
    process.exit(1);
  }

  const alertIndex = parseInt(process.argv[2]);
  if (!isNaN(alertIndex) && TEST_ALERTS[alertIndex]) {
    await sendAlert(TEST_ALERTS[alertIndex]);
  } else {
    console.log(`\nSending first test alert (BTC RSI Oversold)...`);
    console.log('To send a specific alert: node test/send-test-alert.js [0-4]');
    console.log('Available tests:');
    TEST_ALERTS.forEach((t, i) => console.log(`  ${i}: ${t.name}`));
    await sendAlert(TEST_ALERTS[0]);
  }
}

run();
