/**
 * ============================================================================
 * @file OllamaWizardService.ts
 * @system AMEVA OS Desktop Workstation - LLM Automation Layer
 * @location packages/core/src/renderer/services/llm/OllamaWizardService.ts
 * @role Multi-OS One-Click Ollama Auto-Installer (Windows/Mac/Linux/Mobile) & Health-Polling Wizard
 * ============================================================================
 */

export type TargetOS = 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'unknown';

export class OllamaWizardService {
  private static pollTimer: any = null;

  /**
   * Automatically detects the client operating system from the browser
   */
  static detectOS(): TargetOS {
    if (typeof navigator === 'undefined') return 'windows';
    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator as any)?.userAgentData?.platform?.toLowerCase() || navigator.platform?.toLowerCase() || '';

    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    if (/win/i.test(platform) || /windows/i.test(ua)) return 'windows';
    if (/mac/i.test(platform) || /macintosh|mac os x/i.test(ua)) return 'mac';
    if (/linux/i.test(platform) || /linux/i.test(ua)) return 'linux';

    return 'windows';
  }

  /**
   * Generates Windows .bat script
   */
  static generateWindowsBatScript(modelName: string = 'qwen2.5:1.5b'): string {
    return `@echo off
chcp 65001 >nul
title [AMEVA Workstation] Ollama & Qwen One-Click Auto-Setup
color 0b

echo =====================================================================
echo    🚀 AMEVA Workstation - Ollama ^& Qwen 1.5B One-Click Auto-Setup (Windows)
echo =====================================================================
echo.

echo [1/3] Checking Ollama installation on your PC...
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Ollama not found. Installing via Windows Package Manager (winget)...
    winget install Ollama.Ollama --accept-source-agreements --accept-package-agreements
    if %errorlevel% neq 0 (
        echo [!] Winget install failed. Opening official Ollama download page...
        start https://ollama.ai/download
        echo Please complete Ollama installation and run this script again.
        pause
        exit /b 1
    )
    echo [*] Ollama installed successfully!
) else (
    echo [*] Ollama is already installed.
)

echo.
echo [2/3] Configuring Browser CORS permissions for AMEVA Workstation...
setx OLLAMA_ORIGINS "*" >nul
set OLLAMA_ORIGINS=*
echo [*] CORS configured (OLLAMA_ORIGINS="*")!

echo.
echo [3/3] Launching Ollama server and pulling model: %modelName%...
start "" /min ollama serve
timeout /t 3 >nul

echo [*] Pulling & Starting %modelName% in background...
start "" ollama run %modelName%

echo.
echo =====================================================================
echo    🎉 Setup Complete! AMEVA Workstation will now auto-connect!
echo =====================================================================
echo You can close this window now.
timeout /t 5 >nul
exit
`;
  }

  /**
   * Generates macOS .command / .sh script
   */
  static generateMacScript(modelName: string = 'qwen2.5:1.5b'): string {
    return `#!/bin/bash
echo "====================================================================="
echo "   🚀 AMEVA Workstation - Ollama & Qwen One-Click Setup (macOS)"
echo "====================================================================="
echo ""

echo "[1/3] Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo "[*] Ollama not found. Installing via official script..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "[*] Ollama is already installed."
fi

echo ""
echo "[2/3] Setting CORS permissions..."
export OLLAMA_ORIGINS="*"
launchctl setenv OLLAMA_ORIGINS "*" 2>/dev/null || true

echo ""
echo "[3/3] Launching Ollama and pulling ${modelName}..."
ollama serve &
sleep 3
ollama run ${modelName}

echo ""
echo "🎉 Setup Complete! You can return to AMEVA Workstation in your browser."
`;
  }

  /**
   * Generates Linux .sh script
   */
  static generateLinuxScript(modelName: string = 'qwen2.5:1.5b'): string {
    return `#!/bin/bash
echo "====================================================================="
echo "   🚀 AMEVA Workstation - Ollama & Qwen One-Click Setup (Linux)"
echo "====================================================================="
echo ""

echo "[1/3] Checking Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "[*] Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "[*] Ollama is already installed."
fi

echo ""
echo "[2/3] Configuring CORS..."
export OLLAMA_ORIGINS="*"

echo ""
echo "[3/3] Launching Ollama server & pulling ${modelName}..."
ollama serve &
sleep 3
ollama run ${modelName}

echo ""
echo "🎉 Setup Complete! AMEVA Workstation is now connected!"
`;
  }

  /**
   * Triggers the appropriate setup script download or instruction based on detected OS
   */
  static triggerAutoSetup(modelName: string = 'qwen2.5:1.5b'): { os: TargetOS; isMobile: boolean; filename?: string } {
    const os = this.detectOS();

    if (os === 'android' || os === 'ios') {
      return { os, isMobile: true };
    }

    let scriptContent = '';
    let filename = '';

    if (os === 'mac') {
      scriptContent = this.generateMacScript(modelName);
      filename = `setup_ollama_mac_${modelName.replace(/[^a-zA-Z0-9]/g, '_')}.command`;
    } else if (os === 'linux') {
      scriptContent = this.generateLinuxScript(modelName);
      filename = `setup_ollama_linux_${modelName.replace(/[^a-zA-Z0-9]/g, '_')}.sh`;
    } else {
      scriptContent = this.generateWindowsBatScript(modelName);
      filename = `setup_ollama_win_${modelName.replace(/[^a-zA-Z0-9]/g, '_')}.bat`;
    }

    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { os, isMobile: false, filename };
  }

  /**
   * Checks if local Ollama instance is alive and healthy
   */
  static async checkOllamaHealth(endpoint: string = 'http://localhost:11434/api/tags'): Promise<boolean> {
    try {
      const res = await fetch(endpoint, { method: 'GET', signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Starts background polling until Ollama is up and running
   */
  static startAutoConnectPolling(
    onSuccess: () => void,
    onStatusUpdate?: (msg: string) => void,
    maxAttempts: number = 30
  ): void {
    if (this.pollTimer) clearInterval(this.pollTimer);

    let attempts = 0;
    onStatusUpdate?.('Ollama 로컬 서버 연결 대기 중...');

    this.pollTimer = setInterval(async () => {
      attempts++;
      const isAlive = await this.checkOllamaHealth();

      if (isAlive) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
        onStatusUpdate?.('🎉 Ollama 연결 성공! API 모드로 자동 전환되었습니다.');
        onSuccess();
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
        onStatusUpdate?.('연결 시간 초과 (수동으로 스크립트를 실행해 주세요).');
      } else {
        onStatusUpdate?.(`Ollama 기동 감지 중 (${attempts}/${maxAttempts})...`);
      }
    }, 2000);
  }

  static stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
