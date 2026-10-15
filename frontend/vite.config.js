import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const configuredApi = env.VITE_API_URL;
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
            if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id))
              return 'vendor-motion';
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: 'http://localhost:5000', changeOrigin: true },
        '/socket.io': { target: 'http://localhost:5000', ws: true },
      },
    },
  };
});
