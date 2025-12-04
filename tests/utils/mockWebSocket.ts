import {
  TEST_EVENT_CLOSE,
  TEST_EVENT_ERROR,
  TEST_EVENT_OPEN,
  TEST_NUMBER_ONE,
  TEST_NUMBER_TEN,
  TEST_NUMBER_ZERO,
} from '../constants'

export class MockWebSocket {
  static CONNECTING = TEST_NUMBER_ZERO
  static OPEN = TEST_NUMBER_ONE
  static CLOSED = TEST_NUMBER_TEN

  readonly CONNECTING = MockWebSocket.CONNECTING
  readonly OPEN = MockWebSocket.OPEN
  readyState: number = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  readonly sentMessages: string[] = []

  constructor(public readonly url: string) {}

  open(): void {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.(new Event(TEST_EVENT_OPEN))
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new Event(TEST_EVENT_CLOSE))
  }

  send(data: string): void {
    this.sentMessages.push(data)
  }

  emitMessage(payload: unknown): void {
    this.onmessage?.({ data: payload } as MessageEvent)
  }

  emitError(): void {
    this.onerror?.(new Event(TEST_EVENT_ERROR))
  }
}

