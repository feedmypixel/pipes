// Dev-only theme override. In any surface's console:
//   pipesTheme('dark')  pipesTheme('light')  pipesTheme('auto')
// Imported only when import.meta.env.DEV, so it never ships.

type Theme = 'dark' | 'light' | 'auto'

const setTheme = (theme: Theme): void => {
  const root = document.documentElement
  if (theme === 'auto') {
    root.removeAttribute('data-theme')
  } else {
    root.dataset.theme = theme
  }
  console.info(`[pipes] theme override: ${theme}`)
}

;(globalThis as typeof globalThis & { pipesTheme: typeof setTheme }).pipesTheme = setTheme

export {}
