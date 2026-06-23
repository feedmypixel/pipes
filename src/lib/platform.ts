import browser from './browser'

type SidebarAction = { toggle: () => Promise<void> }

function sidebarAction(): SidebarAction | undefined {
  return (browser as { sidebarAction?: SidebarAction }).sidebarAction
}

export function isFirefox(): boolean {
  return Boolean(sidebarAction())
}

export async function openDashboard(): Promise<void> {
  const sidebar = sidebarAction()
  if (sidebar) {
    await sidebar.toggle()
    return
  }
  const win = await browser.windows.getCurrent()
  if (win.id !== undefined) {
    await browser.sidePanel.open({ windowId: win.id })
  }
}
