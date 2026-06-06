import '../lib/dev-chrome'
import '../lib/styles/tokens.css'
import '../lib/styles/base.css'
import '../lib/styles/a11y.css'
import '../lib/styles/forms.css'
import { mount } from 'svelte'
import App from './App.svelte'

if (import.meta.env.DEV) {
  void import('../lib/dev-theme')
}

const target = document.getElementById('app')
if (target) {
  mount(App, { target })
}
