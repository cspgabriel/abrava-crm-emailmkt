import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['logo_abravacom_transparent.png'],
          workbox: {
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5 MB to prevent Vercel failure
          },
          manifest: {
            name: 'CRM ABRACON',
            short_name: 'CRM ABRACON',
            description: 'Gestão de Relacionamento e Simulações ABRACON.',
            theme_color: '#071226',
            background_color: '#f8f9fa',
            display: 'standalone',
            icons: [
              {
                src: '/logo_abravacom_transparent.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/logo_abravacom_transparent.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
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
