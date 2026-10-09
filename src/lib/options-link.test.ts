import { openReplaceToken, replaceHash, replaceTarget } from './options-link'

function stubExtension(openViews: { location: { pathname: string; hash: string } }[]) {
  const calls = { openOptionsPage: 0, created: [] as string[] }
  globalThis.chrome = {
    extension: { getViews: () => openViews },
    runtime: {
      getURL: (path: string) => `chrome-extension://id/${path}`,
      openOptionsPage: async () => {
        calls.openOptionsPage++
      }
    },
    tabs: {
      create: async ({ url }: { url: string }) => {
        calls.created.push(url)
      }
    }
  } as unknown as typeof chrome
  return calls
}

afterEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome
})

test('the deep-link hash round-trips an account id', () => {
  expect(replaceTarget(replaceHash('a b/c'))).toBe('a b/c')
})

test('a hash without a replace target reads as none', () => {
  expect(replaceTarget('')).toBeNull()
  expect(replaceTarget('#other=1')).toBeNull()
})

test('with no Options tab open, opens one at the replace deep link', async () => {
  const calls = stubExtension([])
  await openReplaceToken('a1')
  expect(calls.created).toEqual(['chrome-extension://id/src/options/index.html#replace=a1'])
  expect(calls.openOptionsPage).toBe(0)
})

test('an open Options tab is pointed at the account and focused, not duplicated', async () => {
  const optionsView = { location: { pathname: '/src/options/index.html', hash: '' } }
  const otherView = { location: { pathname: '/src/showcase/index.html', hash: '' } }
  const calls = stubExtension([otherView, optionsView])
  await openReplaceToken('a1')
  expect(optionsView.location.hash).toBe('#replace=a1')
  expect(otherView.location.hash).toBe('')
  expect(calls.openOptionsPage).toBe(1)
  expect(calls.created).toEqual([])
})
