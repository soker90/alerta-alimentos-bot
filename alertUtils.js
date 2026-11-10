export const getAlertSequence = (url) => {
  const pathname = new URL(url, 'https://www.aesan.gob.es').pathname
  const match = pathname.match(/^\/alertas\/(\d{4})_(\d+)$/)

  if (!match) {
    throw new Error(`No se pudo determinar la antigüedad de la alerta: ${url}`)
  }

  return {
    year: Number(match[1]),
    number: Number(match[2])
  }
}

export const compareAlertSequences = (first, second) => {
  return first.year - second.year || first.number - second.number
}

export const getNewAlerts = (alerts, lastNewsUrl) => {
  const lastSequence = getAlertSequence(lastNewsUrl)

  return alerts
    .filter(({ url }) => compareAlertSequences(getAlertSequence(url), lastSequence) > 0)
    .toSorted((first, second) => {
      return compareAlertSequences(getAlertSequence(first.url), getAlertSequence(second.url))
    })
}
