import { parse } from 'node-html-parser'
import { readFile, writeFile } from './fileUtils.js'
import { sendToTelegram } from './sendToTelegram.js'

// Hay un bug que deja un enlace sin texto al principio de la página
// que provoca que no detecte nuevas entradas
const LINK_WITH_BUG = '/AECOSAN/web/seguridad_alimentaria/ampliacion/2023_16.htm'

const checkLastNew = async ({ content, index, lastPostUrlSaved }) => {
  if (!content[index]) return true

  const lastPostUrl = content[index].getAttribute('href')
  const text = content[index].innerText

  if (lastPostUrl !== lastPostUrlSaved.lastNews) {
    console.log(`Nueva noticia: ${text} - ${lastPostUrl}\n`)
    await sendToTelegram({ title: text, url: lastPostUrl })
    return lastPostUrl
  }
  return false
}

const purgeBugLink = (content) => {
  const bugLink = content[0].getAttribute('href')

  if (bugLink === LINK_WITH_BUG) {
    content.shift()
  }
}

const URL_ALERTS = 'https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/subseccion/otras_alertas_alimentarias.htm'

const res = await fetch(URL_ALERTS)
const html = await res.text()
const root = parse(html)

const content = root.querySelectorAll('.theContent > p > a')
purgeBugLink(content)
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
