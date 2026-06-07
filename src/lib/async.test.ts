import { mapLimit } from './async'

test('mapLimit preserves order', async () => {
  const out = await mapLimit([1, 2, 3, 4], 2, async (n) => n * 10)
  expect(out).toEqual([10, 20, 30, 40])
})

test('mapLimit never exceeds the concurrency limit', async () => {
  let inFlight = 0
  let peak = 0
  const release: Array<() => void> = []
  const items = [0, 1, 2, 3, 4, 5]

  const all = mapLimit(items, 2, async (n) => {
    inFlight++
    peak = Math.max(peak, inFlight)
    await new Promise<void>((resolve) => release.push(resolve))
    inFlight--
    return n
  })

  // Let microtasks schedule the first batch, then drain in waves.
  while (release.length < 2) {
    await Promise.resolve()
  }
  expect(peak).toBe(2)
  while (release.length > 0 || inFlight > 0) {
    release.shift()?.()
    await Promise.resolve()
  }
  expect(await all).toEqual(items)
  expect(peak).toBe(2)
})

test('mapLimit handles empty input', async () => {
  expect(await mapLimit([], 4, async (n) => n)).toEqual([])
})
