import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { siteMetadata } from './scripts/site-metadata.js';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const configuredApi = env.VITE_API_URL;
  if (
    command === 'build' &&
    env.VITE_SITE_URL &&
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(env.VITE_CONTACT_EMAIL || '')
  ) {
    throw new Error(
      'Configure VITE_CONTACT_EMAIL com o contacto público de privacidade antes de publicar.',
    );
  }
  const devProxy = process.env.NEXO_DEV_API_PROXY || 'http://localhost:5000';
  let apiOrigin = '';
  if (configuredApi && /^https?:\/\//.test(configuredApi))
    apiOrigin = new URL(configuredApi).origin;
  const socketHttpOrigin = env.VITE_SOCKET_URL ? new URL(env.VITE_SOCKET_URL).origin : apiOrigin;
  const socketOrigin = socketHttpOrigin.replace(/^http/, 'ws');
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: https: http:",
    `connect-src 'self' ${apiOrigin} ${socketHttpOrigin} ${socketOrigin}`,
    'frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com',
    "form-action 'self'",
  ].join('; ');
  return {
    plugins: [
      react(),
      siteMetadata(env.VITE_SITE_URL),
      {
        name: 'production-content-security-policy',
        apply: 'build',
        transformIndexHtml() {
          return [
            {
              tag: 'meta',
              attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
              injectTo: 'head-prepend',
            },
          ];
        },
      },
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (
              /node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)
            )
              return 'vendor-react';
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target: devProxy, changeOrigin: true },
        '/socket.io': { target: devProxy, ws: true },
      },
    },
  };
});
