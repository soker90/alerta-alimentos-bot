import { parse } from 'node-html-parser'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

const PROMPT = `Eres un asistente que analiza alertas alimentarias oficiales del Ministerio de Consumo de España.
A partir del texto de la alerta, extrae y resume la siguiente información en español, de forma concisa.
IMPORTANTE: incluye un apartado SOLO si la información aparece explícitamente en el texto. Si un dato no está, omite ese apartado completamente.

Apartados posibles:
- 🥩 <b>Producto</b>: nombre del producto afectado
- 🏭 <b>Marca/Fabricante</b>: marca o fabricante indicado
- 🔢 <b>Lotes</b>: lotes o fechas de caducidad afectadas
- ⚠️ <b>Motivo</b>: razón de la alerta (bacteria, contaminante, cuerpo extraño, etc.)
- 🏪 <b>Dónde se vendió</b>: supermercados, cadenas o establecimientos mencionados
- 📍 <b>Regiones afectadas</b>: comunidades autónomas, provincias o países donde se distribuyó
- 🛒 <b>Recomendación</b>: qué debe hacer el consumidor

Responde ÚNICAMENTE con el texto del resumen, sin bloques de código, sin etiquetas html/ul/li/div.
Usa solo etiquetas <b> para negrita. Cada apartado en su propia línea, comenzando con el emoji.`

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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    return text ? text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim() : null
  } catch (error) {
    console.error('Error al obtener resumen de IA:', error.message)
    return null
  }
}
