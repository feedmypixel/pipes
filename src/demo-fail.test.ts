// TEMPORARY: intentional failure so this PR's CI goes red, to re-fire the
// PR-failure notification (pass→fail transition). Reverted once seen.
test('TEMP demo: intentional CI failure (delete me)', () => {
  expect('pipes-notification-demo').toBe('green')
})
