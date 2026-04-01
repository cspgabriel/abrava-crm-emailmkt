import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3001,
        host: '0.0.0.0',
        watch: {
          // ignore large or transient folders to avoid constant rebuilds
          ignored: ['**/.wwebjs_auth/**', '**/.whatsapp_profile/**', '**/launcher/**', '**/node_modules/**/.cache/**', '**/**/dist/**']
        },
        // Explicit allowlist for tunnel hosts used in testing and production
        allowedHosts: ['abravacom.com.br', 'wpp-api.abravacom.com.br', 'localhost', '127.0.0.1']
      },
      preview: {
        port: 3001,
        host: '0.0.0.0',
        allowedHosts: ['abravacom.com.br', 'wpp-api.abravacom.com.br', 'localhost', '127.0.0.1']
      },
      plugins: [
        react(),
        // PWA desativado temporariamente para evitar cache de bundles antigos
        // durante estabilização de deploy (tela branca por assets desatualizados).
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
          'framer-motion/dist/cjs/index.js': path.resolve(__dirname, 'node_modules/framer-motion/dist/cjs/index.js'),
        }
      },
      optimizeDeps: {
        include: ['framer-motion']
      },
      ssr: {
        noExternal: ['framer-motion']
      }
    };
});
