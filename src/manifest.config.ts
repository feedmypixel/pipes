import { defineManifest } from '@crxjs/vite-plugin'
import { version } from '../package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Pipes: watch your CI/CD pipelines',
  version,
  description:
    'Watch GitHub Actions and GitLab CI/CD pipeline status across the repos you care about.',

  permissions: ['storage', 'alarms', 'notifications', 'sidePanel'],

  // SaaS hosts known at build time. Self-hosted GitLab / GitHub Enterprise
  // origins are requested at runtime via chrome.permissions.request() when an
  // account is added. See optional_host_permissions.
  host_permissions: ['https://api.github.com/*', 'https://gitlab.com/*'],
  optional_host_permissions: ['https://*/*'],

  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module'
  },

  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Pipes',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    }
  },

  side_panel: {
    default_path: 'src/sidepanel/index.html'
  },

  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true
  },

  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png'
  },

  // Status glyphs used as notification icons (not part of the manifest icon set). Declared so
  // crxjs packages them and the service worker can reference them by path.
  web_accessible_resources: [
    {
      resources: ['icons/status-success.png', 'icons/status-failed.png'],
      matches: ['<all_urls>']
    }
  ]
})
