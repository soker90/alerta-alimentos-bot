import { parse } from 'node-html-parser'
import { readFile, writeFile } from './fileUtils.js'
import { sendToTelegram } from './sendToTelegram.js'

const URL_ALERTS = 'https://www.aesan.gob.es/alertas/buscador-alertas?type=b5c27f12-7f21-4d2e-bc5c-d5186b4d6259'

const getAlerts = html => {
  const root = parse(html)

  return root
    .querySelectorAll('a')
    .map(link => ({
      title: link.text.trim().replace(/\s+/g, ' '),
      url: link.getAttribute('href')
    }))
    .filter(({ title, url }) => {
      return url && url.includes('/alertas/') && /Ref\.\s*ES\d{4}\/\d+/i.test(title)
    })
}

const checkLastNew = async ({ content, index, lastPostUrlSaved }) => {
  if (!content[index]) return true

  const { title, url } = content[index]

  if (url !== lastPostUrlSaved.lastNews) {
    console.log(`Nueva alerta: ${title} - ${url}\n`)
    await sendToTelegram({ title, url })
    return url
  }

  return false
}

const res = await fetch(URL_ALERTS)

if (!res.ok) {
  throw new Error(`Error al descargar las alertas de AESAN: HTTP ${res.status}`)
}

const html = await res.text()
const content = getAlerts(html)

if (content.length === 0) {
  throw new Error('No se encontraron alertas de interés general en AESAN')
}

const lastPostUrlSaved = await readFile()

const lastNews = await checkLastNew({ content, index: 0, lastPostUrlSaved })

let i = 1
if (lastNews) {
  while (await checkLastNew({ content, index: i, lastPostUrlSaved })) {
    i++
  }
}

if (lastNews) {
  await writeFile({ lastNews })
}
