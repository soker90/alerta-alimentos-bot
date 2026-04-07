import TelegramBot from 'node-telegram-bot-api'

const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM
const bot = new TelegramBot(TOKEN_TELEGRAM)
const CHAT_ID = process.env.CHAT_ID

const escapeMarkdownV2 = (text) => text.replace(/[_*[\]()~`>#+=|{}.!\-\\]/g, '\\$&')

export const sendToTelegram = async ({ title, url }) => {
  if (!TOKEN_TELEGRAM || !CHAT_ID) {
    console.error('TOKEN_TELEGRAM o CHAT_ID no están definidos en las variables de entorno.')
    return
  }

  const fullUrl = `https://www.aesan.gob.es${url}`
  const msg = `[${escapeMarkdownV2(title)}](${fullUrl})`
  await bot.sendMessage(CHAT_ID, msg, { parse_mode: 'MarkdownV2' })
}
