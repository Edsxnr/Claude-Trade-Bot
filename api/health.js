export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'tradingview-claude-bot',
    timestamp: new Date().toISOString(),
    env: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      discord: !!process.env.DISCORD_WEBHOOK_URL,
      secret: !!process.env.WEBHOOK_SECRET,
    },
  });
}
