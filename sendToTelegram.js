import TelegramBot from 'node-telegram-bot-api'

const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM
const bot = new TelegramBot(TOKEN_TELEGRAM)
const CHAT_ID = process.env.CHAT_ID

export const sendToTelegram = async ({ title, url }) => {
  const msg = `${title} https://www.aesan.gob.es${url}`
  await bot.sendMessage(CHAT_ID, msg)
}
