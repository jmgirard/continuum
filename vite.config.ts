/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Honour a PORT assigned by the environment (e.g. the preview harness); fall
  // back to Vite's default. strictPort:false lets Vite pick the next free port.
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  // Worker bundle format — the sampling fallback timer runs in a Web Worker (Phase 1, milestone 4).
  worker: {
    format: 'es',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // A concrete (non-opaque) origin so jsdom exposes a working localStorage.
    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // The high-value modules per the Phase 1 prompt.
      include: [
        'src/sampling/**',
        'src/rating/**',
        'src/session/**',
        'src/export/**',
        'src/config/**',
      ],
    },
  },
});
