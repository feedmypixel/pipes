// TEMPORARY: an intentional failure so #38's CI goes red, to demo the enriched
// PR-failure notification. Reverted once the notification has been seen.
test('TEMP demo: intentional CI failure (delete me)', () => {
  expect('pipes-notification-demo').toBe('green')
})
