import * as notify from './notify'
import type { Change, Pipeline, Repo } from '../providers/types'

let store: Record<string, Record<string, string>>
let created: Array<{ id: string; opts: chrome.notifications.NotificationOptions }>
let badge: { text?: string; color?: string }
let opened: string[]
let cleared: string[]

beforeEach(() => {
  store = {}
  created = []
  badge = {}
  opened = []
  cleared = []
  ;(globalThis as { chrome?: unknown }).chrome = {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: store[key] }),
        set: async (items: Record<string, unknown>) => Object.assign(store, items)
      }
    },
    notifications: {
      create: async (id: string, opts: chrome.notifications.NotificationOptions) => {
        created.push({ id, opts })
      },
      clear: async (id: string) => {
        cleared.push(id)
      }
    },
    action: {
      setBadgeText: async ({ text }: { text: string }) => {
        badge.text = text
      },
      setBadgeBackgroundColor: async ({ color }: { color: string }) => {
        badge.color = color
      }
    },
    tabs: {
      create: async ({ url }: { url: string }) => {
        opened.push(url)
      }
    }
  }
})

const repo: Repo = {
  id: 'o/r',
  accountId: 'a',
  name: 'o/r',
  defaultBranch: 'main',
  webUrl: 'https://x'
}
const pipeline: Pipeline = {
  id: '1',
  ref: 'main',
  isDefaultBranch: true,
  status: 'failed',
  webUrl: 'https://x/run/1',
  sha: 's',
  title: 't',
  updatedAt: '2026-06-07T00:00:00Z'
}
const change: Change = {
  number: 9,
  title: 'Add things',
  headRef: 'feat',
  headSha: 's9',
  status: 'failed',
  webUrl: 'https://x/pull/9',
  isDraft: false,
  isBot: false
}

test('setBadge shows the count, then clears at 0', async () => {
  await notify.setBadge(3)
  expect(badge.text).toBe('3')
  expect(badge.color).toBeTruthy()
  await notify.setBadge(0)
  expect(badge.text).toBe('')
})

test('default-branch failure is sticky + high priority and stores its link', async () => {
  await notify.notifyMainFailed({ repo, pipeline })
  expect(created).toHaveLength(1)
  expect(created[0].opts.requireInteraction).toBe(true)
  expect(created[0].opts.priority).toBe(2)
  expect(store.notifLinks[created[0].id]).toBe('https://x/run/1')
})

test('a PR check failure stores its link, opening clears + forgets it', async () => {
  await notify.notifyChangeFailed({ repo, change })
  const id = created[0].id
  await notify.openNotificationLink(id)
  expect(opened).toEqual(['https://x/pull/9'])
  expect(cleared).toEqual([id])
  expect(store.notifLinks[id]).toBeUndefined()
})

test('opening an unknown notification id is a no-op', async () => {
  await notify.openNotificationLink('pw-fail-nope')
  expect(opened).toEqual([])
})

test('forgetNotificationLink drops a stored link', async () => {
  await notify.notifyRecovered({ repo, key: 'default', label: 'main', url: 'https://x/run/1' })
  const id = created[0].id
  await notify.forgetNotificationLink(id)
  expect(store.notifLinks[id]).toBeUndefined()
})
