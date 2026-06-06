import '../lib/styles/tokens.css'
import '../lib/styles/base.css'
import '../lib/styles/a11y.css'
import '../lib/styles/forms.css'
import { mount } from 'svelte'
import Showcase from './Showcase.svelte'

const target = document.getElementById('app')
if (target) {
  mount(Showcase, { target })
}
