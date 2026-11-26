import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3690,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3088',
        changeOrigin: true,
      },
    },
  },
});
