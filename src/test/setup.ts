import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/*
 * localStorage polyfill for the test environment.
 *
 * Under Node 26 + jsdom, the DOM Storage API is not reliably exposed (Node ships
 * an experimental global `localStorage` that shadows jsdom's, leaving it
 * undefined). The app treats storage as best-effort (all access is wrapped in
 * try/catch), but tests need a real, resettable in-memory store. Install one on
 * both `window` and `globalThis` so bare `localStorage` and `window.localStorage`
 * resolve to the same object.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

if (typeof window.localStorage === 'undefined' || window.localStorage === null) {
  const storage = new MemoryStorage();
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
}

/*
 * Object URL stubs. jsdom does not implement URL.createObjectURL/revokeObjectURL,
 * which the media layer uses to play local files. Provide counting stubs so tests
 * can load media and assert URL lifecycle without a real Blob URL.
 */
if (typeof URL.createObjectURL === 'undefined') {
  let counter = 0;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: () => `blob:mock/${++counter}`,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: () => {},
  });
}

// Unmount React trees between tests to prevent cross-test DOM leakage.
afterEach(() => {
  cleanup();
});
