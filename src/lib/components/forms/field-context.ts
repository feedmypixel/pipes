import { getContext, setContext } from 'svelte'

export interface FieldContext {
  id: string
  describedBy: string | undefined
  invalid: boolean
}

const KEY = Symbol('pipes-field')

/** Field provides a getter so Input reads the current (reactive) id/describedBy/invalid. */
export function setFieldContext(get: () => FieldContext): void {
  setContext(KEY, get)
}

export function getFieldContext(): () => FieldContext {
  const get = getContext<() => FieldContext>(KEY)
  if (!get) {
    throw new Error('<Input> / <PasswordInput> must be used inside <Field>')
  }
  return get
}
