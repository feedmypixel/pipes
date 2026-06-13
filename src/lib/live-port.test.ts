import { holdLivePort } from './live-port'

interface FakePort {
  disconnectListeners: Array<() => void>
  disconnect: ReturnType<typeof vi.fn>
}

let ports: FakePort[]
let connect: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.useFakeTimers()
  ports = []
  connect = vi.fn(() => {
    const port: FakePort & { onDisconnect: { addListener: (cb: () => void) => void } } = {
      disconnectListeners: [],
      onDisconnect: { addListener: (cb) => port.disconnectListeners.push(cb) },
      disconnect: vi.fn()
    }
    ports.push(port)
    return port
  })
  globalThis.chrome = { runtime: { connect } } as unknown as typeof chrome
})

afterEach(() => {
  vi.useRealTimers()
})

function fireDisconnect(index: number) {
  ports[index].disconnectListeners.forEach((cb) => cb())
}

test('reconnects after the port disconnects (worker recycled mid-session)', () => {
  holdLivePort()
  expect(connect).toHaveBeenCalledTimes(1)
  fireDisconnect(0)
  vi.advanceTimersByTime(1000)
  expect(connect).toHaveBeenCalledTimes(2)
})

test('teardown disconnects the port and stops reconnecting', () => {
  const stop = holdLivePort()
  stop()
  expect(ports[0].disconnect).toHaveBeenCalled()
  // A disconnect after teardown must not schedule a reconnect.
  fireDisconnect(0)
  vi.advanceTimersByTime(5000)
  expect(connect).toHaveBeenCalledTimes(1)
})
