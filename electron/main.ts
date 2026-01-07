import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer-core';

const isDev = process.env.NODE_ENV === 'development';
const TARGET_URL = 'https://www.longtermcare.or.kr/npbs/auth/login/loginForm.web?menuId=npe0000002160&rtnUrl=&zoomSize=';
const DEFAULT_USER_NO = '123456789000';
const DEFAULT_CERT_PW = '1111111111';
const CHROME_EXECUTABLE =
  process.env.CHROME_PATH ||
  'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let mainWindow: BrowserWindow | null = null;
let automationBrowser: Browser | null = null;
let automationPage: Page | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function ensureChrome() {
  if (automationBrowser && automationPage && !automationPage.isClosed()) return;

  if (!automationBrowser) {
    automationBrowser = await puppeteer.launch({
      executablePath: CHROME_EXECUTABLE,
      headless: false,
      defaultViewport: null,
      devtools: true, // 요청: 개발자도구가 열린 상태로 실행
      // 자동화 배너 제거: --enable-automation 제거 + infobar/automation 플래그 비활성
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--start-maximized',
        '--disable-infobars',
        '--disable-blink-features=AutomationControlled',
      ],
    });
  }

  const pages = await automationBrowser.pages();
  if (pages.length > 0) {
    // 첫 페이지(about:blank 포함)를 재사용
    automationPage = pages[0];
  } else {
    automationPage = await automationBrowser.newPage();
  }

  // 불필요한 추가 blank 탭 제거
  const extraPages = (await automationBrowser.pages()).filter((p) => p !== automationPage);
  await Promise.all(extraPages.map((p) => p.close().catch(() => {})));
}

async function runLoginAutomation(userNo: string = DEFAULT_USER_NO) {
  await ensureChrome();
  if (!automationPage) throw new Error('자동화 페이지 생성 실패');

  await automationPage.bringToFront();
  // 페이지가 준비될 시간을 짧게 부여한 뒤 이동
  await sleep(200);
  await automationPage.goto(TARGET_URL, { waitUntil: 'load' });
  await sleep(500);

  const escapedUserNo = userNo.replace(/'/g, "\\'");

  await automationPage.evaluate(async (val) => {
    const sleepInPage = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await sleepInPage(2000);
    const input = document.querySelector('input#userNo') as HTMLInputElement | null;
    if (input) {
      input.value = val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('사용자번호 입력 완료');
    } else {
      console.log('input#userNo not found');
    }
    await sleepInPage(2000);
    const loginBtn = document.querySelector('a#btn_login_A2.btn_pink3') as HTMLAnchorElement | null;
    if (loginBtn) {
      loginBtn.click();
      console.log('법인인증서 로그인 버튼 클릭');
    } else {
      console.log('a#btn_login_A2.btn_pink3 not found');
    }
  }, escapedUserNo);

  const certFilled = await fillCertPasswordInFrames(automationPage, DEFAULT_CERT_PW, 15000);
  if (!certFilled) {
    console.log('인증서 암호 입력 필드를 프레임에서 찾지 못했습니다.');
  }
}

async function fillCertPasswordInFrames(page: Page, password: string, timeout = 10000) {
  const start = Date.now();
  const fillInFrame = async (target: Page | any) => {
    const exists = await target.$('input#xwup_certselect_tek_input1.xwup-pw-box');
    if (!exists) return false;
    await target.evaluate((pw: string) => {
      const input = document.querySelector('input#xwup_certselect_tek_input1.xwup-pw-box') as HTMLInputElement | null;
      if (input) {
        input.removeAttribute('readonly');
        input.value = pw;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('인증서 암호 입력 완료');
      }
      const okBtn = document.querySelector('#xwup_OkButton') as HTMLButtonElement | null;
      if (okBtn) {
        okBtn.click();
        console.log('인증서 확인 버튼 클릭');
      }
    }, password);
    return true;
  };

  while (Date.now() - start < timeout) {
    // 메인 프레임 우선 시도
    if (await fillInFrame(page)) return true;
    const frames = page.frames();
    for (const frame of frames) {
      if (await fillInFrame(frame)) return true;
    }
    await sleep(200);
  }
  return false;
}

function setupIpcHandlers() {
  ipcMain.handle('open-login-automation', async (_event, userNo?: string) => {
    try {
      await runLoginAutomation(userNo || DEFAULT_USER_NO);
      return { success: true };
    } catch (error: any) {
      console.error('open-login-automation 실패:', error);
      return { success: false, message: error?.message || '알 수 없는 오류' };
    }
  });
}

app.whenReady().then(() => {
  createMainWindow();
  setupIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  try {
    await automationPage?.close();
    await automationBrowser?.close();
  } catch {
    // ignore
  }
});
