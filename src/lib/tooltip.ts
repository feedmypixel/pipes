import type { Action } from 'svelte/action'

/**
 * `use:tooltip={text}` — a styled tooltip that attaches to an element without wrapping it (so it
 * can't break truncation, layout, or the cursor) and positions itself edge-aware: below the
 * trigger by default, flipped above when there's no room, clamped horizontally to the viewport.
 * Replaces native `title=` (slow, unstyled, uncontrollable placement).
 */
const GAP = 8
const EDGE = 4

export const tooltip: Action<HTMLElement, string> = (node, text) => {
  let current = text
  let bubble: HTMLDivElement | null = null

  function place() {
    if (!bubble) {
      return
    }
    const trigger = node.getBoundingClientRect()
    const box = bubble.getBoundingClientRect()
    const top =
      trigger.bottom + GAP + box.height <= window.innerHeight - EDGE
        ? trigger.bottom + GAP
        : Math.max(EDGE, trigger.top - box.height - GAP)
    const left = Math.min(
      Math.max(EDGE, trigger.left + trigger.width / 2 - box.width / 2),
      window.innerWidth - box.width - EDGE
    )
    bubble.style.top = `${top}px`
    bubble.style.left = `${left}px`
  }

  function show() {
    if (bubble || !current) {
      return
    }
    bubble = document.createElement('div')
    bubble.textContent = current
    bubble.setAttribute('role', 'tooltip')
    Object.assign(bubble.style, {
      position: 'fixed',
      zIndex: '2147483647',
      pointerEvents: 'none',
      maxWidth: '18rem',
      padding: 'var(--space-xs) var(--space-md)',
      background: 'var(--surface-2)',
      color: 'var(--text)',
      border: '1px solid var(--border-2)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--font-size-2xs)',
      fontWeight: '500',
      lineHeight: '1.35',
      opacity: '0',
      transition: 'opacity 0.12s'
    })
    document.body.appendChild(bubble)
    place()
    requestAnimationFrame(() => {
      if (bubble) {
        bubble.style.opacity = '1'
      }
    })
    window.addEventListener('scroll', hide, true)
  }

  function hide() {
    window.removeEventListener('scroll', hide, true)
    bubble?.remove()
    bubble = null
  }

  node.addEventListener('mouseenter', show)
  node.addEventListener('focusin', show)
  node.addEventListener('mouseleave', hide)
  node.addEventListener('focusout', hide)

  return {
    update(next: string) {
      current = next
      if (bubble) {
        bubble.textContent = next
        place()
      }
    },
    destroy() {
      hide()
      node.removeEventListener('mouseenter', show)
      node.removeEventListener('focusin', show)
      node.removeEventListener('mouseleave', hide)
      node.removeEventListener('focusout', hide)
    }
  }
}
