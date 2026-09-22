import TelegramBot from 'node-telegram-bot-api'

const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM
const CHAT_ID = process.env.CHAT_ID

const escapeMarkdownV2 = (text) => text.replace(/[_*[\\]()~`>#+=|{}.!\\-\\]/g, '\\$&')
const escapeMarkdownV2Url = (url) => url.replace(/([)\\])/g, '\\$1')

export const sendToTelegram = async ({ title, url }) => {
  if (!TOKEN_TELEGRAM || !CHAT_ID) {
    console.error('TOKEN_TELEGRAM o CHAT_ID no están definidos en las variables de entorno.')
    return
  }

  const bot = new TelegramBot(TOKEN_TELEGRAM)
  const fullUrl = new URL(url, 'https://www.aesan.gob.es').href
  const referenceMatch = title.match(/Ref\\.\\s*(ES\\d{4}\\/\\d+)/i)
  const reference = referenceMatch?.[1] ?? ''
  const cleanTitle = title.replace(/\\s*\\(Ref\\.\\s*ES\\d{4}\\/\\d+\\)\\s*$/i, '').trim()

  const msg = [
    '🚨 *ALERTA ALIMENTARIA — ' + escapeMarkdownV2(reference) + '*',
    '',
    escapeMarkdownV2(cleanTitle),
    '',
    '🔗 [Ver alerta completa](' + escapeMarkdownV2Url(fullUrl) + ')'
  ].join('\\n')

  await bot.sendMessage(CHAT_ID, msg, { parse_mode: 'MarkdownV2' })
}
