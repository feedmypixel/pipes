import { render } from 'vitest-browser-svelte'
import Author from './Author.svelte'
import type { Author as AuthorType } from '../../providers/types'

const full: AuthorType = {
  login: 'octocat',
  name: 'The Octocat',
  avatarUrl: 'https://avatars/octocat.png',
  profileUrl: 'https://github.com/octocat'
}

describe('Author', () => {
  test('links to the profile, names the person, shows login + avatar', () => {
    const screen = render(Author, { props: { author: full } })
    const link = screen.container.querySelector('a.author') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('https://github.com/octocat')
    expect(link.getAttribute('aria-label')).toContain('The Octocat')
    expect(link.getAttribute('title')).toBe('The Octocat')
    expect(screen.container.querySelector('img')?.getAttribute('src')).toBe(
      'https://avatars/octocat.png'
    )
    expect(screen.container.querySelector('.author-name')?.textContent).toBe('octocat')
  })

  test('falls back to initials when there is no avatar', () => {
    const screen = render(Author, { props: { author: { login: 'dev', name: 'Dev Eloper' } } })
    expect(screen.container.querySelector('img')).toBeNull()
    expect(screen.container.querySelector('.ini')?.textContent).toBe('DE')
  })

  test('renders a non-link when there is no profile url', () => {
    const screen = render(Author, { props: { author: { login: 'dev' } } })
    expect(screen.container.querySelector('a.author')).toBeNull()
    expect(screen.container.querySelector('span.author')).not.toBeNull()
  })

  test('renders nothing for an empty author', () => {
    const screen = render(Author, { props: { author: undefined } })
    expect(screen.container.querySelector('.author')).toBeNull()
  })
})
