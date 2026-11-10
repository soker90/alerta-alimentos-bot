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

const getAlertSequence = url => {
  const match = url.match(/\/alertas\/(\d{4})_(\d+)(?:[/?#]|$)/)

  if (!match) {
    throw new Error(`No se pudo determinar la antigüedad de la alerta: ${url}`)
  }

  return {
    year: Number(match[1]),
    number: Number(match[2])
  }
}

const compareAlertSequences = (first, second) => {
  return first.year - second.year || first.number - second.number
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
const lastSequence = getAlertSequence(lastPostUrlSaved.lastNews)

const newAlerts = content
  .filter(({ url }) => compareAlertSequences(getAlertSequence(url), lastSequence) > 0)
  .sort((first, second) => {
    return compareAlertSequences(getAlertSequence(first.url), getAlertSequence(second.url))
  })

if (newAlerts.length === 0) {
  console.log(`No hay alertas nuevas. Última alerta registrada: ${lastPostUrlSaved.lastNews}`)
} else {
  for (const alert of newAlerts) {
    console.log(`Nueva alerta: ${alert.title} - ${alert.url}\n`)
    await sendToTelegram(alert)
  }

  const latestAlert = newAlerts[newAlerts.length - 1]
  await writeFile({ lastNews: latestAlert.url })
}
