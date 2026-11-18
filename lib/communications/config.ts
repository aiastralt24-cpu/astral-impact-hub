export function connectionStatus() {
  const missing = (keys: string[]) => keys.filter(key => !process.env[key]?.trim());
  return {
    ai: missing(["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"]),
    telegram: missing(["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHANNEL_ID"]),
    whatsapp: missing(["WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "META_GRAPH_VERSION"]),
    instagram: missing(["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_ACCOUNT_ID", "META_GRAPH_VERSION"])
  };
}
