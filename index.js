import { parse } from 'node-html-parser'
import { readFile, writeFile } from './fileUtils.js'
import { sendToTelegram } from './sendToTelegram.js'
import { summarizeAlert } from './summarize.js'

const checkLastNew = async ({ content, index, lastPostUrlSaved }) => {
  if (!content[index]) return true

  const lastPostUrl = content[index].querySelector('a').getAttribute('href')
  const text = content[index].text.trim()

  if (lastPostUrl !== lastPostUrlSaved.lastNews) {
    console.log(`Nueva noticia: ${text} - ${lastPostUrl}\n`)
    const summary = await summarizeAlert(lastPostUrl)
    await sendToTelegram({ title: text, url: lastPostUrl, summary })
    return lastPostUrl
  }
  return false
}

const URL_ALERTS = 'https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/subseccion/otras_alertas_alimentarias.htm'

const res = await fetch(URL_ALERTS)
const html = await res.text()
const root = parse(html)

const content = root.querySelectorAll('.theContent > p').filter(el => el.querySelector('a'))
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
