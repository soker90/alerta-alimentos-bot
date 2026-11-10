import { parse } from 'node-html-parser'
import { readFile, writeFile } from './fileUtils.js'
import { getNewAlerts } from './alertUtils.js'
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

const res = await fetch(URL_ALERTS)

if (!res.ok) {
  throw new Error(`Error al descargar las alertas de AESAN: HTTP ${res.status}`)
}

const html = await res.text()
const content = getAlerts(html)

if (content.length === 0) {
  throw new Error('No se encontraron alertas de interés general en AESAN')
}

const { lastNews } = await readFile()
const newAlerts = getNewAlerts(content, lastNews)

if (newAlerts.length === 0) {
  console.log(`No hay alertas nuevas. Última alerta registrada: ${lastNews}`)
} else {
  for (const alert of newAlerts) {
    console.log(`Nueva alerta: ${alert.title} - ${alert.url}\n`)
    await sendToTelegram(alert)
    await writeFile({ lastNews: alert.url })
  }
}
