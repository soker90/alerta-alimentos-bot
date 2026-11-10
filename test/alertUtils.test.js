import test from 'node:test'
import assert from 'node:assert/strict'
import { compareAlertSequences, getAlertSequence, getNewAlerts } from '../alertUtils.js'

test('getAlertSequence parses AESAN alert identifiers', () => {
  assert.deepEqual(getAlertSequence('/alertas/2026_81'), { year: 2026, number: 81 })
  assert.deepEqual(getAlertSequence('https://www.aesan.gob.es/alertas/2025_120'), { year: 2025, number: 120 })
})

test('getAlertSequence rejects URLs without a valid alert identifier', () => {
  assert.throws(() => getAlertSequence('/alertas/not-an-id'), /No se pudo determinar/)
})

test('compareAlertSequences compares year and then sequence number', () => {
  assert.equal(compareAlertSequences({ year: 2026, number: 79 }, { year: 2026, number: 80 }), -1)
  assert.equal(compareAlertSequences({ year: 2026, number: 80 }, { year: 2026, number: 80 }), 0)
  assert.equal(compareAlertSequences({ year: 2027, number: 1 }, { year: 2026, number: 999 }), 1)
})

test('getNewAlerts ignores older and already published alerts, returning new alerts oldest first', () => {
  const alerts = [
    { title: 'New 82', url: '/alertas/2026_82' },
    { title: 'Old 79', url: '/alertas/2026_79' },
    { title: 'Current 80', url: '/alertas/2026_80' },
    { title: 'New 81', url: '/alertas/2026_81' }
  ]

  assert.deepEqual(
    getNewAlerts(alerts, '/alertas/2026_80').map(({ url }) => url),
    ['/alertas/2026_81', '/alertas/2026_82']
  )
})

test('getNewAlerts returns an empty list when AESAN only shows older alerts', () => {
  const alerts = [
    { title: 'Old 79', url: '/alertas/2026_79' },
    { title: 'Current 80', url: '/alertas/2026_80' }
  ]

  assert.deepEqual(getNewAlerts(alerts, '/alertas/2026_80'), [])
})
