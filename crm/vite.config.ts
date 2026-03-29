import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/crm/',
      server: {
        port: 3001,
        host: '0.0.0.0',
        // Allowlist used by tunnels and Cloudflare workers — include both domains and localhost
        allowedHosts: ['abravacom.com.br', 'wpp-api.abravacom.com.br', 'localhost', '127.0.0.1'],
        hmr: { overlay: false },
        proxy: {
          '/api/whatsapp': {
            target: 'http://127.0.0.1:8787',
            changeOrigin: true,
          },
        },
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
