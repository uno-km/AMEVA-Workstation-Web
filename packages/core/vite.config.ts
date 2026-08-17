import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/AMEVA-Workstation-Web/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'AMEVA Markdown Editor & Viewer',
        short_name: 'AMEVA Web',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [
          {
            src: process.env.GITHUB_PAGES ? '/AMEVA-Workstation-Web/favicon.png' : '/favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: process.env.GITHUB_PAGES ? '/AMEVA-Workstation-Web/favicon.png' : '/favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB (에디터 코어, WASM, WebLLM 엔진 등 무거운 청크 강제 캐싱 허용)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,json}'], // 생성된 모든 정적 에셋 무조건 캐시
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i, // 외부 무료 CDN(Pretendard 폰트 등) 캐싱
            handler: 'CacheFirst',
            options: {
              cacheName: 'jsdelivr-cdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1년 영구 박제
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/renderer'),
    },
  },
  optimizeDeps: {
    include: ['react-is', 'recharts']
  },
  build: {
    outDir: resolve(__dirname, '../../dist'),
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('zustand')) {
              return 'react-vendor';
            }
            if (id.includes('@blocknote') || id.includes('yjs') || id.includes('y-websocket')) {
              return 'editor-vendor';
            }
            if (id.includes('@mlc-ai') || id.includes('@xenova') || id.includes('onnxruntime')) {
              return 'ml-vendor';
            }
            if (id.includes('pdfjs-dist') || id.includes('pdf-lib') || id.includes('pdf-parse')) {
              return 'pdf-vendor';
            }
            if (id.includes('recharts') || id.includes('mermaid') || id.includes('exceljs')) {
              return 'chart-vendor';
            }
            if (id.includes('@mantine') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            return 'vendor'; // 나머지는 기본 벤더 청크로 분류
          }
        }
      }
    }
  }
})
