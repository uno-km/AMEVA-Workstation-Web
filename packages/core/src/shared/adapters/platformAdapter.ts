/**
 * @file platformAdapter.ts
 * @system AMEVA OS - Platform Integration Layer
 * @location packages/core/src/shared/adapters/platformAdapter.ts
 * @role Defines structural interfaces for File I/O and AI engines to abstract desktop/mobile environments.
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 임포트처: 
 *   - `packages/core/src/renderer/hooks/useWorkspaceStore.ts` (파일 로드/저장 시 FileSystemAdapter 호출)
 *   - `packages/core/src/renderer/hooks/useLocalAIEngine.ts` (AI 스트리밍 시 AIEngineAdapter 호출)
 */

/* 
 * [IMPORT SEGMENTATION]
 * - 이 모듈은 순수 TypeScript 인터페이스와 싱글톤 인스턴스 팩토리만을 가지므로,
 *   프론트엔드 외부 라이브러리 의존성을 배제하고 100% 런타임 독립적으로 컴파일됩니다.
 */

/**
 * @interface FileSystemAdapter
 * @description OS 물리 파일 및 디렉토리에 접근하기 위한 규격을 정의합니다.
 */
export interface FileSystemAdapter {
  /**
   * 물리 주소로부터 파일 텍스트 데이터를 읽어옵니다.
   * @param path 파일의 절대 경로 또는 URI
   */
  readFile(path: string): Promise<string>;

  /**
   * 지정된 물리 주소에 파일 내용을 덮어씁니다.
   * @param path 파일의 절대 경로 또는 URI
   * @param content 작성할 파일 내용
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * 파일이 실제로 존재하는지 판별합니다.
   * @param path 파일의 절대 경로 또는 URI
   */
  exists(path: string): Promise<boolean>;

  /**
   * 사용자로부터 디렉토리를 물리적으로 선택받아 해당 절대 경로를 반환합니다.
   */
  selectDirectory(): Promise<string>;
}

/**
 * @interface AIEngineAdapter
 * @description 로컬/온디바이스 LLM 모델과의 대화 추론 및 스트리밍을 제어하는 규격입니다.
 */
export interface AIEngineAdapter {
  /**
   * 지정된 모델을 이용해 토큰 생성을 스트리밍 구동합니다.
   * @param prompt 입력 프롬프트
   * @param modelPath 모델의 파일 경로 또는 식별 이름
   * @param onToken 토큰 생성 시 호출될 콜백 함수
   */
  runAIStream(
    prompt: string,
    modelPath: string,
    onToken: (token: string) => void
  ): Promise<void>;

  /**
   * 구동 중인 AI 추론을 강제 중단합니다.
   */
  stopAI(): Promise<void>;

  /**
   * 현재 사용 가능한 로컬 모델 파일 목록을 나열합니다.
   */
  getModels(): Promise<string[]>;
}

/**
 * @interface PlatformAdapter
 * @description 각 플랫폼별(Desktop, Mobile, Web) 어댑터의 묶음 구현체 인터페이스입니다.
 */
export interface PlatformAdapter {
  fs: FileSystemAdapter;
  ai: AIEngineAdapter;
}

/*
 * [RUN-TIME STATE / INVARIANT]
 * - 변수 명: `activeAdapter`
 *   - 자료형: PlatformAdapter | null
 *   - 시나리오: 앱 초기화 단계에서 `registerPlatformAdapter()`를 통해 등록된 플랫폼 어댑터 인스턴스를 유지합니다.
 */
let activeAdapter: PlatformAdapter | null = null;

/**
 * 런타임 플랫폼에 호환되는 어댑터 구현체를 전역 등록합니다.
 * @param adapter 플랫폼 구현 어댑터 인스턴스
 */
export function registerPlatformAdapter(adapter: PlatformAdapter): void {
  /*
   * [제어 구문 명세]
   * - 조건: `activeAdapter`가 이미 등록되어 있는 경우
   * - 만족 시: 이미 어댑터가 주입되었으므로 중복 주입 경고 로그를 출력합니다.
   * - 불만족 시: 전달된 어댑터를 전역 변수에 안전하게 주입합니다.
   * - Example: registerPlatformAdapter(electronAdapterInstance);
   */
  if (activeAdapter) {
    console.warn("⚠️ PlatformAdapter has already been registered.");
  }
  activeAdapter = adapter;
}

/**
 * 현재 기기 플랫폼에서 활성화된 어댑터 묶음을 반환합니다.
 */
export function getPlatformAdapter(): PlatformAdapter {
  /*
   * [제어 구문 명세]
   * - 조건: `activeAdapter`가 null로 등록되어 있지 않은 경우
   * - 만족 시: 초기화 에러 예외를 강제 발생시켜 런타임 크래시를 방지하고 오작동 경로를 알립니다.
   * - 불만족 시: 정상 등록된 `activeAdapter` 인스턴스를 반환합니다.
   * - Example: const content = await getPlatformAdapter().fs.readFile("/path/to/doc.adc");
   */
  if (!activeAdapter) {
    throw new Error(
      "🔥 PlatformAdapter is not registered! Please call registerPlatformAdapter() at app startup."
    );
  }
  return activeAdapter;
}
