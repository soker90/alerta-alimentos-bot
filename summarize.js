import { parse } from 'node-html-parser'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

const PROMPT = `Eres un asistente que analiza alertas alimentarias oficiales del Ministerio de Consumo de España.
A partir del texto de la alerta, extrae y resume la siguiente información en español, de forma concisa.
IMPORTANTE: incluye un apartado SOLO si la información aparece explícitamente en el texto. Si un dato no está, omite ese apartado completamente.

Apartados posibles:
- 🥩 *Producto*: nombre del producto afectado
- 🏭 *Marca/Fabricante*: marca o fabricante indicado
- 🔢 *Lotes*: lotes o fechas de caducidad afectadas
- ⚠️ *Motivo*: razón de la alerta (bacteria, contaminante, cuerpo extraño, etc.)
- 🏪 *Dónde se vendió*: supermercados, cadenas o establecimientos mencionados
- 📍 *Regiones afectadas*: comunidades autónomas, provincias o países donde se distribuyó
- 🛒 *Recomendación*: qué debe hacer el consumidor

Responde solo con el resumen estructurado, sin texto adicional.`

export const summarizeAlert = async (url) => {
  if (!GEMINI_API_KEY) return null

  try {
    const pageRes = await fetch(`https://www.aesan.gob.es${url}`)
    const root = parse(await pageRes.text())
    const pageText = root.querySelector('.theContent')?.text.trim()

    if (!pageText) return null

    const body = {
      contents: [{
        parts: [{ text: `${PROMPT}\n\nTEXTO DE LA ALERTA:\n${pageText}` }]
      }]
    }

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      if (res.status === 429) {
        console.error('Error Gemini 429: límite de peticiones alcanzado. Espera 60 segundos antes de volver a ejecutar.')
      } else {
        console.error(`Error Gemini: ${res.status} ${res.statusText}`)
      }
      return null
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  } catch (error) {
    console.error('Error al obtener resumen de IA:', error.message)
    return null
  }
}
