// TEMPORARY demo PR: starts green so the panel sees it pass, then we flip the
// expectation to red to fire a real pass→fail notification. Deleted afterwards.
test('demo: flip this to fire a PR-failure notification', () => {
  expect('pipes').toBe('pipes')
})
