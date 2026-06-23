type ExtensionApi = typeof chrome

const globals = globalThis as { browser?: ExtensionApi; chrome?: ExtensionApi }

const api = new Proxy({} as ExtensionApi, {
  get(_target, property: string | symbol) {
    const impl = globals.browser ?? globals.chrome
    return impl?.[property as keyof ExtensionApi]
  }
})

export default api
