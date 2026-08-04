/**
 * @file vite.config.ts
 * @system AMEVA OS Desktop Workstation - Build System Config
 * @location vite.config.ts
 * @role Vite Build bundler configuration for Electron hybrid runtime
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - 이 설정 파일은 Electron 하이브리드 데스크톱 런타임의 Main 프로세스, Preload 스크립트 및 Renderer 리액트 앱 빌드를 조정한다.
 * - [ADR - CommonJS (CJS) for Electron Main/Preload]
 *   - Electron의 `BrowserWindow` 및 `nodeIntegration` 샌드박스 환경은 CommonJS 모듈 구조와 네이티브 C++ 바인딩을 가장 안정적으로 연동한다.
 *   - 따라서 Main 프로세스와 Preload 스크립트는 번들링 포맷을 무조건 **`cjs`로 고정(MUST output format 'cjs')**한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - Main entry(`src/main/index.ts`) 및 Preload entry(`src/main/preload.ts`)의 빌드 아웃풋 형식을 지정한다.
 * - 렌더러용 React 플러그인을 바인딩하고, 절대 경로 별칭(`@` -> `./src/renderer`)을 설정한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT: Preload 스크립트 빌드 시 `external: ['electron']` 외장화 설정을 해제하지 말 것. 
 *   해제하면 Electron의 내부 API가 번들 내에 중복 임포트되어 Preload 통신 컨텍스트가 완전히 붕괴됨.
 * - MUST: `renderer()` 플러그인을 Vite 플러그인 체인 맨 마지막에 활성화하여, Electron 통합 어댑터가 렌더러 측 브라우저 API를 폴리필할 수 있도록 유도할 것.
 */

/* 
 * [IMPORT SEGMENTATION & BUILD PLUGINS]
 * - defineConfig: 타입 자동완성을 지원하는 Vite 설정 제네레이터 헬퍼.
 * - react: React Fast Refresh 및 JSX 번들링 컴파일러.
 * - electron: 메인 및 프리로드 빌드를 연계 감시 빌드하는 플러그인.
 * - renderer: 일렉트론 렌더러 측 브라우저 환경에 Node.js APIs를 가상 노출해 주는 폴리필 플러그인.
 * - resolve: 경로 문자열 합성을 위한 Node.js path 유틸.
 * - fileURLToPath: ESM URL 개체를 OS 물리 경로 문자열로 변환하는 모듈.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// ESM 환경 하에서 __dirname 절대 경로를 폴리필하기 위한 ESM-to-CJS 헬퍼
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Vite 마스터 번들 설정 정의
export default defineConfig(({ mode }) => {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `isBrowser`
   * - 자료형 / 예상 값: boolean
   * - 시나리오: 실행 모드가 브라우저 모드인지 판별하여 Electron 플러그인의 로드 여부를 조절함.
   */
  const isBrowser = mode === 'browser'

  return {
    server: {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `port`
       * - 자료형 / 예상 값: number
       * - 시나리오: 브라우저 실행 시에는 포트번호를 5174로, 일렉트론 팝업 실행 시에는 포트번호를 5173으로 할당하여 충돌을 회피함.
       */
      // port: isBrowser ? 5174 : 5173,
    },
    plugins: [
      /* 
       * [REACT BUNDLER PLUGIN]
       * - React 17+ Fast Refresh 및 JSX 트랜스파일링 지원.
       */
      react(),
      
      /* 
       * [ELECTRON COMPILATION CHAIN]
       * - Electron 메인 스레드와 프리로드 브릿지 스크립트를 빌드하기 위한 플러그인 파이프라인.
       * - 브라우저 단독 기동 모드(isBrowser === true)인 경우에는 플러그인을 활성화하지 않음.
       */
      !isBrowser && electron([
        {
          // 1. Electron Main Process 컴파일 사양 지정
          entry: 'src/main/index.ts',
          vite: {
            build: {
              rollupOptions: {
                output: {
                  // WARNING: Electron main process는 Node.js 네이티브 바인딩을 사용하므로 무조건 CJS로 출력되어야 함.
                  format: 'cjs',
                },
              },
            },
            resolve: {
              // __dirname 폴리필 관련 번들 처리 (필요시 활성화)
              /* browserField: false */
            },
          },
        },
        {
          // 2. Electron Preload Script 컴파일 사양 지정
          entry: 'src/main/preload.ts',
          onstart(options) {
            // 프리로드 소스 변경 감지 시 BrowserWindow 인스턴스를 즉각 재로드(HMR)한다
            options.reload()
          },
          vite: {
            build: {
              lib: {
                entry: 'src/main/preload.ts',
                formats: ['cjs'],
                fileName: () => 'preload.js',
              },
              rollupOptions: {
                // WARNING: electron 모듈은 런타임에 네이티브 윈도우 IPC 바인딩을 담당하므로 빌드 아웃풋에서 무조건 외장화(external) 처리할 것.
                external: ['electron'],
              },
            },
          },
        },
      ]),
      
      /* 
       * [ELECTRON RENDERER POLYFILL]
       * - 렌더러 측 리액트 앱이 window.require 등을 통해 Node.js API 및 Electron 내장 모듈에 안전하게 노출(Integration)될 수 있도록 브릿지 폴리필을 적용한다.
       * - 브라우저 단독 기동 모드(isBrowser === true)인 경우에는 플러그인을 활성화하지 않음.
       */
      !isBrowser && renderer(),
    ].filter(Boolean),
    
    resolve: {
      /* 
       * [PATH ALIAS CONTRACT]
       * - 소스 코드 내에서 `@/components/...` 처럼 깔끔하게 절대 경로 형식으로 Renderer 코드를 참조할 수 있도록 매핑한다.
       * - DOWNSTREAM DEPENDENCY: tsconfig.app.json의 "paths": { "@/*": ["./src/renderer/*"] } 설정과 반드시 1:1 싱크를 유지할 것.
       */
      alias: {
        '@': resolve(__dirname, './src/renderer'),
      },
    },
  }
})

