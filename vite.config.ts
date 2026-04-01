import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      build: {
        outDir: 'dist'
      },
      server: {
        port: 3001,
        host: '0.0.0.0',
        watch: {
          // ignore large or transient folders to avoid constant rebuilds
          ignored: ['**/.wwebjs_auth/**', '**/.whatsapp_profile/**', '**/launcher/**', '**/node_modules/**/.cache/**', '**/**/dist/**']
        },
        // Explicit allowlist for tunnel hosts used in testing and production
        allowedHosts: ['abravacom.com.br', 'wpp-api.abravacom.com.br', 'localhost', '127.0.0.1'],
        // Proxy backend API calls during local development to avoid CORS issues
        proxy: {
          // Proxy /status and /send to the production API host (change target if needed)
          '/status': {
            target: 'https://wpp-api.abravacom.com.br',
            changeOrigin: true,
            secure: false,
          },
          '/send': {
            target: 'https://wpp-api.abravacom.com.br',
            changeOrigin: true,
            secure: false,
          },
          // If your frontend calls /api/*, forward to the email-api server instead
          '^/api': {
            target: 'https://email-api.abravacom.com.br',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, '')
          }
        }
      },
      preview: {
        port: 3001,
        host: '0.0.0.0',
        allowedHosts: ['abravacom.com.br', 'wpp-api.abravacom.com.br', 'localhost', '127.0.0.1']
      },
      plugins: [
        react(),
        // VitePWA plugin disabled temporarily to avoid dependency resolution errors during build
        // VitePWA({ ... })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Use CJS entry (UMD bundle expects global React and causes runtime crash in production).
          'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion/dist/cjs/index.js'),
          // Map legacy subpath imports (some deps import the internal CJS file directly).
          'framer-motion/dist/cjs/index.js': path.resolve(__dirname, 'node_modules/framer-motion/dist/cjs/index.js'),
        }
      },
      // Ensure Vite pre-bundles and SSR treat framer-motion as expected
      optimizeDeps: {
        include: ['framer-motion']
      },
      ssr: {
        noExternal: ['framer-motion']
      }
    };
});
