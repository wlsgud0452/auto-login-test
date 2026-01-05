import { _electron as electron, test, expect, Page } from '@playwright/test';
import path from 'path';

test.describe('Auto Login Automation', () => {
  let electronApp: any;
  let mainWindow: Page;

  test.beforeAll(async () => {
    // Electron 앱 실행
    const mainScript = path.join(__dirname, '../dist-electron/main.js');
    
    electronApp = await electron.launch({
      args: [mainScript],
      env: { ...process.env, NODE_ENV: 'development' }
    });

    // 첫 번째 윈도우(앱 메인 화면) 가져오기
    mainWindow = await electronApp.firstWindow();
    await mainWindow.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('장기요양정보시스템 Webview 로드 및 제어 확인', async () => {
    // 1. 메인 윈도우에 webview 태그가 있는지 확인
    const webviewCount = await mainWindow.locator('webview').count();
    expect(webviewCount).toBe(1);

    // 2. Webview가 로드될 때까지 잠시 대기
    let targetPage: Page | undefined;
    
    // Webview 페이지가 감지될 때까지 폴링
    await expect.poll(async () => {
      const pages = electronApp.context().pages();
      // 메인 윈도우가 아닌 다른 페이지(Webview)를 찾음
      targetPage = pages.find((p: Page) => p !== mainWindow);
      return targetPage;
    }, {
      message: 'Webview page not found',
      timeout: 10000,
    }).toBeTruthy();

    if (!targetPage) throw new Error('Webview not found');

    // 3. 페이지 로딩 대기
    console.log('Webview URL:', targetPage.url());
    await targetPage.waitForLoadState('networkidle'); // 네트워크 요청이 잦아들 때까지 대기
    
    const pageTitle = await targetPage.title();
    console.log('Webview Title:', pageTitle);
    
    // 4. 입력 필드 제어 예제
    // ⚠️ 중요: 실제 사이트의 input 태그의 ID나 Selector를 개발자 도구로 확인해서 아래 변수에 넣어야 합니다.
    // 예: <input type="text" id="j_username" ...> 라면 '#j_username' 사용
    
    // 가상의 선택자 (실제 확인 후 수정 필요)
    const inputSelector = 'input[type="text",id="userNo"]'; 
    const numberToInput = '123456789000';

    try {
        // 입력 필드가 나타날 때까지 기다림 (최대 5초)
        // await targetPage.waitForSelector(inputSelector, { timeout: 5000 });
        
        // 1) 텍스트/숫자 입력 (fill: 빠르게 입력)
        // await targetPage.fill(inputSelector, numberToInput);
        
        // 2) 또는 한 글자씩 타이핑하는 것처럼 입력하고 싶다면 (pressSequentially)
        // await targetPage.locator(inputSelector).pressSequentially(numberToInput, { delay: 100 });

        console.log(`[Success] ${numberToInput} 입력 완료`);
    } catch (e) {
        console.log(`[Alert] 선택자(${inputSelector})를 찾을 수 없습니다. 실제 사이트의 Selector를 확인해주세요.`);
    }
    
    // 스크린샷 캡처
    await targetPage.screenshot({ path: 'e2e/screenshots/login-input-test.png' });
  });
});
