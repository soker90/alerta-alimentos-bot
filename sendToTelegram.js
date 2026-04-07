import TelegramBot from 'node-telegram-bot-api'

const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM
const bot = new TelegramBot(TOKEN_TELEGRAM)
const CHAT_ID = process.env.CHAT_ID_BETA

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const sendToTelegram = async ({ title, url, summary }) => {
  if (!TOKEN_TELEGRAM || !CHAT_ID) {
    console.error('TOKEN_TELEGRAM o CHAT_ID_BETA no están definidos en las variables de entorno.')
    return
  }

  const fullUrl = `https://www.aesan.gob.es${url}`
  const disclaimer = '<i>⚠️ Resumen generado con IA, puede contener errores. Consulta el enlace para información oficial.</i>'
  const msg = summary
    ? `${summary}\n\n${disclaimer}\n\n<a href="${fullUrl}">🔗 Ver noticia completa</a>`
    : `<a href="${fullUrl}">${escapeHtml(title)}</a>`
  await bot.sendMessage(CHAT_ID, msg, { parse_mode: 'HTML' })
}
