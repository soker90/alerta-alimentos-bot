import { chromium } from 'playwright-chromium'
import { readFile, writeFile } from './fileUtils.js'

const checkLastNew = async ({ content, index, lastPostUrlSaved }) => {
  const lastPostUrl = await content[index].getAttribute('href')
  if (lastPostUrl !== lastPostUrlSaved.lastNews) {
    console.log(`Nueva noticia ${lastPostUrl}`)
    return lastPostUrl
  }
  return false
}

const URL_ALERTS = 'https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/alertas_alimentarias/listado/aecosan_listado_alertas_alimentarias.htm'
const browser = await chromium.launch({ headless: true })

const page = await browser.newPage()
await page.goto(URL_ALERTS)

const content = await page.$$('.theContent > div > p > a')
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
