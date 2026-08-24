import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve(process.cwd(), '.tempmediaStorage');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('Vercel 배포 대기 중... (35초 대기)');
  await sleep(35000);

  console.log('Puppeteer 브라우저 기동...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 1. 다크 모드 (기본 한국어) 로딩
  console.log('Vercel 접속...');
  await page.goto('https://ameva-workstation-web.vercel.app/', { waitUntil: 'networkidle2' });
  await sleep(4000);

  // 로컬 스토리지 초기화 및 페이지 새로고침으로 완전 클린 상태 확인
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(3000);

  // 1. 한국어 다크모드 캡처
  const koDarkPath = path.join(outDir, '01_ko_dark_mode.png');
  await page.screenshot({ path: koDarkPath, fullPage: false });
  console.log('1. 한국어 다크 모드 캡처 완료:', koDarkPath);

  // 2. 언어 버튼 클릭 -> ENG (영어)로 전환
  console.log('ENG 언어 버튼 탐색 및 클릭...');
  const clickedLang = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const langBtn = buttons.find(b => b.textContent && (b.textContent.includes('KOR') || b.textContent.includes('ENG') || b.title?.includes('Language') || b.title?.includes('언어')));
    if (langBtn) {
      langBtn.click();
      return langBtn.textContent?.trim();
    }
    return null;
  });
  console.log('클릭된 언어 버튼:', clickedLang);
  await sleep(2500);

  // 2. 영어 다크모드 캡처 (가이드북 본문, 사이드바, 메뉴바 전수 영문화 확인)
  const enDarkPath = path.join(outDir, '02_en_dark_mode.png');
  await page.screenshot({ path: enDarkPath, fullPage: false });
  console.log('2. 영어 다크 모드 캡처 완료:', enDarkPath);

  // 3. 에디터 진입 (Start Interactive Tour 또는 Start Editing 클릭)
  console.log('에디터 진입 버튼 클릭...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const startBtn = buttons.find(b => b.textContent && (b.textContent.includes('Start Interactive Tour') || b.textContent.includes('기능 체험 시작하기') || b.textContent.includes('Start Experience')));
    if (startBtn) startBtn.click();
  });
  await sleep(2000);

  // 3. 영어 에디터 뷰 캡처
  const enEditorPath = path.join(outDir, '03_en_editor_mode.png');
  await page.screenshot({ path: enEditorPath, fullPage: false });
  console.log('3. 영어 에디터 모드 캡처 완료:', enEditorPath);

  // 4. 화이트 모드로 전환
  console.log('화이트 모드로 테마 전환...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const themeBtn = buttons.find(b => b.title && (b.title.includes('Theme') || b.title.includes('테마') || b.title.includes('theme')));
    if (themeBtn) themeBtn.click();
  });
  await sleep(1500);

  const enWhitePath = path.join(outDir, '04_en_white_theme.png');
  await page.screenshot({ path: enWhitePath, fullPage: false });
  console.log('4. 영어 화이트 모드 캡처 완료:', enWhitePath);

  // 5. 레트로 모드로 전환
  console.log('레트로 모드로 테마 전환...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const themeBtn = buttons.find(b => b.title && (b.title.includes('Theme') || b.title.includes('테마') || b.title.includes('theme')));
    if (themeBtn) themeBtn.click();
  });
  await sleep(1500);

  const enRetroPath = path.join(outDir, '05_en_retro_theme.png');
  await page.screenshot({ path: enRetroPath, fullPage: false });
  console.log('5. 영어 레트로 모드 캡처 완료:', enRetroPath);

  await browser.close();
  console.log('모든 검증 캡처 완료!');
})();
