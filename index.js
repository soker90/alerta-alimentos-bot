import { chromium } from 'playwright-chromium'
import { readFile, writeFile } from './fileUtils.js'
import { sendToTelegram } from './sendToTelegram.js'

// Hay un bug que deja un enlace sin texto al principio de la página
// que provoca que no detecte nuevas entradas
const LINK_WITH_BUG = '/AECOSAN/web/seguridad_alimentaria/ampliacion/2023_16.htm'

const checkLastNew = async ({ content, index, lastPostUrlSaved }) => {
  let lastPostUrl
  try {
    lastPostUrl = await content[index].getAttribute('href')
  } catch (error) {
    return true
  }

  const text = await content[index].innerText()

  if (lastPostUrl !== lastPostUrlSaved.lastNews) {
    console.log(`Nueva noticia: ${text} - ${lastPostUrl}`)
    await sendToTelegram({ title: text, url: lastPostUrl })
    return lastPostUrl
  }
  return false
}

const purgeBugLink = async (content) => {
  const bugLink = await content[0].getAttribute('href')

  if (bugLink === LINK_WITH_BUG) {
    content.shift()
  }
}

const URL_ALERTS = 'https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/subseccion/otras_alertas_alimentarias.htm'
const browser = await chromium.launch({ headless: true })

const page = await browser.newPage()
await page.goto(URL_ALERTS)

const content = await page.$$('.theContent > p > a')
await purgeBugLink(content)
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

await page.close()

await browser.close()
