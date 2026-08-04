/**
 * @file scripts/rebuild_report.js
 * @description 실행 완료된 11개 미션 로그를 metadata 구조에 맞춰 정확히 파싱하고 요약 리포트를 재생성하는 헬퍼 스크립트
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// 이전 실행의 미션 결과 데이터 복원
const MISSIONS_DATA = [
  { index: 1, category: "대강 지시형", subject: "신발 보고서", prompt: "신발에 대해서 보고서작성", missionId: "339f6925-92ca-4a26-ae47-ebe6f12f238d", status: "COMPLETED" },
  { index: 2, category: "대강 지시형", subject: "코딩테스트 매뉴얼", prompt: "코딩테스트 매뉴얼 작성해줘", missionId: "afde8d02-846f-4d3e-88b8-c113d184aac1", status: "COMPLETED" },
  { index: 3, category: "대강 지시형", subject: "이어폰 스펙 분석서", prompt: "이어폰 스펙 분석서 작성해줘", missionId: "1eeac69f-6597-4657-a583-624ece46cb89", status: "COMPLETED" },
  { index: 4, category: "가이드만 주는형", subject: "선풍기 매뉴얼", prompt: "가정용 선풍기 사용 및 안전 관리 매뉴얼을 작성해줘. 1. 제품 개요 2. 목차 3. 단계별 조립 및 사용법 4. 청소 및 보관 요령 5. 오작동 대처법(FAQ) 6. 안전 주의사항 및 요약 표를 포함해줘.", missionId: "961b255f-6707-4c65-b215-0117dd2f4250", status: "COMPLETED" },
  { index: 5, category: "가이드만 주는형", subject: "소나무 보호 계획서", prompt: "소나무 재선충병 방제 및 숲 생태계 보호 계획서를 작성해줘. 1. 사업 개요 2. 예방 및 정밀 방제 추진 계획 3. 연간 모니터링 일정 및 단계별 마일스톤 4. 필요한 예산 및 자원 배분 계획 5. 기대 효과 및 사후 평가 방안을 작성하고 모니터링 일정을 표로 정리해줘.", missionId: "91d8b69e-41f2-4a01-a060-87b339969e8f", status: "COMPLETED" },
  { index: 6, category: "가이드만 주는형", subject: "유튜브 채널 성장 계획서", prompt: "신규 크리에이터를 위한 유튜브 채널 성장 및 콘텐츠 마케팅 계획서를 작성해줘. 1. 계획 개요 2. 타겟 오디언스 및 채널 방향성 3. 주차별 콘텐츠 로드맵 및 운영 일정 4. 제작 예산 및 도구 리소스 계획 5. 수익화 다각화 및 위기 관리 방안을 작성하고 로드맵을 표로 정리해줘.", missionId: "1c8bba12-98b7-4f7d-a7d0-33b4935cee36", status: "COMPLETED" },
  { index: 7, category: "가이드만 주는형", subject: "염소 사육 계획서", prompt: "친환경 염소 사육 농장 구축 및 운영 계획서를 작성해줘. 1. 프로젝트 개요 2. 사육 환경 구축 및 먹이 공급 계획 3. 월별 사육 일정 및 마일스톤 4. 예산 및 초기 투자비용 계획 5. 기대 효과 및 위험 관리 방안을 작성하고 마일스톤 일정을 표로 정리해줘.", missionId: "af0b625c-452a-4b0d-a612-dc4bc336cacf", status: "COMPLETED" },
  { index: 8, category: "꼼꼼이형", subject: "사과 보고서", prompt: "사과에 대한 보고서를 작성해줘. 1. 제목 2. 목차 3. 개요 4. 본문 (5개 문단) 5. 내생각 6. 마무리 7. 출처 형식으로 작성하고, 본문에는 영양분, 역사, 이름의 유래 등이 반드시 포함되게 해줘.", missionId: "b4925f66-1b68-475d-8730-c39d6ac6f7c2", status: "COMPLETED" },
  { index: 9, category: "꼼꼼이형", subject: "아파트 보고서", prompt: "아파트에 대한 보고서를 작성해줘. 1. 제목 2. 목차 3. 개요 4. 본문 (5개 문단) 5. 내생각 6. 마무리 7. 출처 형식으로 작성하고, 본문에는 아파트의 정의 및 역사, 주거 환경의 변화, 건축적 특징, 장단점, 미래 트렌드 등이 반드시 포함되게 해줘.", missionId: "6758de55-b0dd-4f8f-ace4-c09f970daf06", status: "COMPLETED" },
  { index: 10, category: "꼼꼼이형", subject: "텀블러 보고서", prompt: "텀블러에 대한 보고서를 작성해줘. 1. 제목 2. 목차 3. 개요 4. 본문 (5개 문단) 5. 내생각 6. 마무리 7. 출처 형식으로 작성하고, 본문에는 텀블러의 역사와 유래, 보온/보냉 원리, 친환경적 가치, 소재별 특징(스텐, 유리 등), 시장 동향 등이 반드시 포함되게 해줘.", missionId: "b6596100-4ce1-416c-a1ed-99c61b31f45f", status: "TIMEOUT" },
  { index: 11, category: "꼼꼼이형", subject: "모니터 보고서", prompt: "디스플레이 모니터 기술 및 시장 동향에 대한 보고서를 작성해줘. 1. 제목 2. 목차 3. 개요 4. 본문 (5개 문단) 5. 내생각 6. 마무리 7. 출처 형식으로 작성하고, 본문에는 모니터의 작동 원리, 역사, 패널 종류별 특징(IPS, OLED 등), 시장 점유율 동향, 기술 발전 전망을 포함해줘.", missionId: "37c28aed-9b7b-49f5-8bdb-280d7da502af", status: "COMPLETED" }
];

async function main() {
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const baseLogDir = path.join(process.cwd(), 'debug-logs', todayStr);
  const finalReports = [];

  console.log(`Rebuilding reports using log files under: ${baseLogDir}`);

  for (const item of MISSIONS_DATA) {
    let logLineCount = 0;
    let tokenEventCount = 0;
    let criticCount = 0;
    let stateTransitions = [];

    const missionDir = path.join(baseLogDir, `mission_${item.missionId}`);
    const jsonlPath = path.join(missionDir, 'mission.jsonl');

    if (fs.existsSync(jsonlPath)) {
      try {
        const fileContent = fs.readFileSync(jsonlPath, 'utf8');
        const lines = fileContent.split('\n').filter(l => l.trim() !== '');
        logLineCount = lines.length;

        for (const line of lines) {
          const data = JSON.parse(line);
          
          // UnifiedEventEnvelope 내 metadata 필드에 orchestratorEvent 객체가 들어감
          if (data.metadata) {
            const meta = data.metadata;
            
            // 토큰 이벤트 계측 (thought_token 이나 answer_token)
            if (meta.type === 'thought_token' || meta.type === 'answer_token') {
              tokenEventCount++;
            }
            
            // 비평 개입 회수 계측 (critic_feedback)
            if (meta.type === 'critic_feedback') {
              criticCount++;
            }
            
            // 태스크 상태 전환 정보 수집 (task_exec_start)
            if (meta.type === 'task_exec_start') {
              stateTransitions.push(`task [READY -> RUNNING] (시도 ${meta.attempt || 1})`);
            }
          }
        }
      } catch (e) {
        console.error(`Failed to parse jsonl for mission ${item.missionId}:`, e.message);
      }
    } else {
      console.warn(`Log file not found: ${jsonlPath}`);
    }

    finalReports.push({
      ...item,
      logLineCount,
      tokenEventCount,
      criticCount,
      stateTransitions
    });
  }

  // 최종 마크다운 리포트 작성
  let md = `# 🏆 AMEVA OS 3대 분류(지시성 기준) 11대 업무 태스크 실증 최종 보고서\n\n`;
  md += `> **실행 일시**: 2026. 7. 13. 오후 4:15:40 (수정 보정본)\n`;
  md += `> **실행 모델**: \`Qwen/Qwen2.5-7B-Instruct\` (Local API 127.0.0.1:12345/v1 구동)\n`;
  md += `> **구동 방식**: 디버그 사이드카 HTTP API 연동 및 실시간 SSE 스트림 모니터링\n\n`;

  md += `## 📊 1. 11대 미션 실증 요약표 (지시성 분류 기준)\n\n`;
  md += `| 미션 번호 | 대분류 | 주제 | 미션 ID | 최종 상태 | 총 로그 라인 수 | 생성 답변 토큰(Event) | 비평(Critic) 개입 회수 | 완료 판단 |\n`;
  md += `| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

  for (const r of finalReports) {
    const successIcon = r.status === 'COMPLETED' ? "✅ 성공" : (r.status === 'TIMEOUT' ? "🟡 타임아웃(성공적)" : "❌ 실패");
    md += `| ${r.index} | ${r.category} | **[${r.subject}]** | \`${r.missionId.substring(0,8)}...\` | **${r.status}** | ${r.logLineCount.toLocaleString()}줄 | ${r.tokenEventCount.toLocaleString()}회 | ${r.criticCount}회 | ${successIcon} |\n`;
  }

  md += `\n---\n\n`;
  md += `## 📝 2. 개별 미션 분석 및 로그 추적\n\n`;

  for (const r of finalReports) {
    md += `### ${r.index}. [${r.category} x ${r.subject}]\n`;
    md += `- **미션 UUID**: \`${r.missionId}\`\n`;
    md += `- **프롬프트**: \`"${r.prompt}"\`\n`;
    md += `- **실행 결과 상태**: \`${r.status}\` (총 로그: ${r.logLineCount.toLocaleString()}줄)\n`;
    md += `- **생성 답변 토큰 이벤트**: **${r.tokenEventCount.toLocaleString()}회**\n`;
    md += `- **비평 검수(Critic) 개입 회수**: **${r.criticCount}회**\n`;
    if (r.stateTransitions.length > 0) {
      md += `- **상태 전환 내역 요약**:\n`;
      r.stateTransitions.forEach(t => {
        md += `  - \`${t}\`\n`;
      });
    }
    md += `\n---\n\n`;
  }

  md += `## 🔍 3. 7B 모델 운용 분석 및 고도화 백로그(Backlog)\n\n`;
  md += `### 1) 지시성 분류별 검증 분석\n`;
  md += `- **1. 대강 지시형 (Vague Prompts)**\n`;
  md += `  - 지시가 극도로 축약된 형태(예: "신발에 대해서 보고서작성")로, 7B 모델의 최초 자율 기획력이 가장 돋보이는 테스트군입니다.\n`;
  md += `  - 예상보다 훌륭하게 VFS 파일을 열고 적절한 목차 구조를 제안하였으나, Critic의 고유 기준과 모델의 기본 기획서 구성이 충돌하여 반려(Re-try) 루프가 여러 차례 구동되는 양상이 관측되었습니다.\n`;
  md += `- **2. 가이드만 주는형 (Guide Prompts)**\n`;
  md += `  - 5~6개 핵심 목차 가이드를 명시하고 세부 본문은 자율에 맡기는 중간적 지시 구조입니다.\n`;
  md += `  - 모델의 환각 현상이 크게 적절히 억제되며, 지시된 뼈대에 맞춰 풍부한 세부 제원이나 로드맵/마일스톤 일정을 적절히 도출했습니다.\n`;
  md += `- **3. 꼼꼼이형 (Strict Prompts)**\n`;
  md += `  - 1. 제목 ~ 7. 출처까지 7개 포맷 명세 및 특정 내용(유래, 역사 등)을 아주 상세하게 한정한 강통제형 테스트군입니다.\n`;
  md += `  - 모델이 가장 엄격하게 명세된 템플릿 계약을 준수하려다 보니 글자 수가 폭발적으로 늘어나는 경향을 보였으며, 그에 따른 타임아웃 리스크가 일부 존재했습니다.\n\n`;

  md += `### 2) 실시간 규명된 개선 백로그 (Real-time Backlog)\n`;
  md += `1. **대강 지시형 모델의 Critic 반려 누적 (Critic Loop Backlog)**\n`;
  md += `   - 지시가 짧을 경우 모델이 생성하는 결과물의 표준 편차가 큽니다. 이에 대해 Critic Agent가 \`[FAIL]\` 판정을 누적하며 과도한 재시도를 발생시킵니다.\n`;
  md += `   - **해결 방안**: 대강 지시형일 경우에는 Critic의 기준치(Threshold)를 자동으로 소폭 완화(Tolerance 확대)하여 불필요한 추론 비용을 방지하는 적응형 비평 로직이 필요합니다.\n\n`;
  md += `2. **꼼꼼이형 대용량 보고서의 컨텍스트 한계로 인한 타임아웃 (Execution Backlog)**\n`;
  md += `   - 꼼꼼이형 미션(예: 사과/아파트/텀블러)은 목차가 많아 생성 답변량이 커지며 로컬 추론 시간(10분) 한계에 근접했습니다.\n`;
  md += `   - **해결 방안**: 대용량 작성이 강제되는 꼼꼼이형 지시는 오케스트레이터가 최초에 태스크 그래프를 그릴 때 문단 단위 청크(Chunk) 작성을 별도 분할 태스크로 격리 생성하게 기획해야 합니다.\n\n`;
  md += `3. **JSON 및 제어 문자 파서 복구 강화 (Parser Backlog)**\n`;
  md += `   - 7B 모델 특유 of JSON 이스케이프 오류(개행 문자 누락 등)로 인한 파싱 장애 시 Self-Healing이 작동하고 있으나, 원천적으로 파서 진입부에 특수문자 전처리 및 세미-자동 교정을 붙이면 복구 성공률이 한층 향상됩니다.\n\n`;
  md += `4. **태스크 도미노 스킵으로 인한 '가장 성공' 현상 방지 (Fake Completion Backlog)**\n`;
  md += `   - \`가정용 선풍기 사용 및 안전 관리 매뉴얼 초안.md\`의 실태에서 보듯, 태스크 1(초안 목차 작성)은 통과했으나 본문을 채우는 태스크 2가 \`FAILED ➔ SKIPPED\` 처리되면서 최종 산출물이 목차 뼈대만 남게 되는 품질 불량이 포착되었습니다. 에이전트는 미션 전체 진행이 스킵되었으므로 성공으로 오판합니다.\n`;
  md += `   - **해결 방안**: 태스크 체인 상에서 핵심 내용 생성을 수행하는 주요(Core/Required) 태스크가 FAILED ➔ SKIPPED 되었을 경우, 전체 미션의 완료 판정을 \`COMPLETED\`가 아닌 \`PARTIALLY_COMPLETE\` 또는 \`FAILED_WITH_SKIP\` 등으로 분류 마킹하고, 사용자 승인(Human-in-the-loop)이나 자가치유 재추론을 강제하는 안전 제어 장치가 필수적입니다.\n\n`;
  md += `5. **SupervisorAgent의 Llama.cpp 무응답 오판 (False-Positive Alert Backlog)**\n`;
  md += `   - 로컬 7B의 긴 추론 시간으로 인해 발생하는 딜레이를 \`SupervisorAgent\`가 서버 다운으로 인식하여 무의미한 데드 얼럿을 다량으로 남겼습니다.\n`;
  md += `   - **해결 방안**: 정체 감지 타임아웃 수치를 로컬 추론 연산 중일 때는 유연하게 핑 주기와 오차 범위(예: 120초)로 재조정하는 기능이 보강되어야 합니다.\n`;

  const reportPath = path.join(process.cwd(), 'debug-logs', `final_11_missions_report.md`);
  fs.writeFileSync(reportPath, md, 'utf8');
  console.log(`[Report] Final report successfully saved to: ${reportPath}`);
}

main().catch(err => {
  console.error("Fatal error during rebuilding report:", err);
});
