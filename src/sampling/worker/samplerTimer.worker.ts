/// <reference lib="webworker" />

/**
 * A bare timer running in a Web Worker. Worker timers are not throttled the way
 * `setTimeout`/`setInterval` and `requestAnimationFrame` are on a backgrounded
 * tab, so this keeps the ~100 Hz audio/fallback sampler ticking even when the
 * page is not focused. It only posts "tick" messages; the main thread reads
 * `media.currentTime` (the DOM is not reachable from here).
 */

const ctx = self as unknown as DedicatedWorkerGlobalScope;

interface StartMessage {
  type: 'start';
  intervalMs: number;
}
interface StopMessage {
  type: 'stop';
}
type IncomingMessage = StartMessage | StopMessage;

let intervalId: ReturnType<typeof setInterval> | null = null;

function stop(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

ctx.onmessage = (event: MessageEvent<IncomingMessage>) => {
  const message = event.data;
  if (message.type === 'start') {
    stop();
    intervalId = setInterval(() => ctx.postMessage({ type: 'tick' }), message.intervalMs);
  } else if (message.type === 'stop') {
    stop();
  }
};
