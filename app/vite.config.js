import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built site work from any URL path (GitHub Pages serves it from /<repo>/).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      // `npm run dev` forwards compile requests to `npm run serve` (the local g++ server).
      '/api': {
        target: 'http://127.0.0.1:5270',
        changeOrigin: true,
        configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin')),
      },
    },
  },
  build: { chunkSizeWarningLimit: 4000 },
});
