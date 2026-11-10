import TelegramBot from 'node-telegram-bot-api'

const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM
const CHAT_ID = process.env.CHAT_ID

const escapeHtml = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

export const sendToTelegram = async ({ title, url }) => {
  if (!TOKEN_TELEGRAM || !CHAT_ID) {
    throw new Error('TOKEN_TELEGRAM o CHAT_ID no están definidos en las variables de entorno.')
  }

  const bot = new TelegramBot(TOKEN_TELEGRAM)
  const fullUrl = new URL(url, 'https://www.aesan.gob.es').href
  const referenceMatch = title.match(/Ref\.\s*(ES\d{4}\/\d+)/i)
  const reference = referenceMatch?.[1] ?? ''
  const cleanTitle = title
    .replace(/\berror_outline\b/gi, '')
    .replace(/\s*\(Ref\.\s*ES\d{4}\/\d+\)/i, '')
    .replace(/\bVer más\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?]{2,}$/u, (punctuation) => punctuation[0])
    .trim()

  const dateMatch = cleanTitle.match(/^(\d{1,2}\s+[\p{L}]+\s+\d{4})\s+(.+)$/u)
  const date = dateMatch?.[1]
  const alertTitle = dateMatch?.[2] ?? cleanTitle

  const msg = [
    '🚨 <b>ALERTA ALIMENTARIA — ' + escapeHtml(reference) + '</b>',
    '',
    date ? '<i>' + escapeHtml(date) + '</i>' : null,
    date ? escapeHtml(alertTitle) : escapeHtml(cleanTitle),
    '',
    '<a href="' + escapeHtml(fullUrl) + '">🔗 Ver alerta completa</a>'
  ].filter((line) => line !== null).join('\n')

  await bot.sendMessage(CHAT_ID, msg, { parse_mode: 'HTML' })
}
