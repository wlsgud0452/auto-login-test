import {
  Browser as PlaywrightBrowser,
  BrowserContext as PlaywrightBrowserContext,
  Page as PlaywrightPage,
  Frame as PlaywrightFrame,
  chromium,
} from 'playwright';
import {
  CHROME_EXECUTABLE,
  DEFAULT_CERT_PW,
  DEFAULT_USER_NO,
  TARGET_URL,
  sleep,
  fillUserNoAndClick,
  fillCertPasswordInFramesGeneric,
} from './shared';

let playwrightBrowser: PlaywrightBrowser | null = null;
let playwrightContext: PlaywrightBrowserContext | null = null;
let playwrightPage: PlaywrightPage | null = null;

async function ensurePlaywrightPage() {
  if (playwrightBrowser && playwrightPage && !playwrightPage.isClosed()) return;

  if (!playwrightBrowser) {
    playwrightBrowser = await chromium.launch({
      executablePath: CHROME_EXECUTABLE,
      headless: false,
      args: [
        '--start-maximized',
        '--disable-infobars',
        '--disable-blink-features=AutomationControlled',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    });
  }

  if (!playwrightContext) {
    playwrightContext = await playwrightBrowser.newContext({ viewport: null });
  }

  const pages = playwrightContext.pages();
  if (pages.length > 0) {
    playwrightPage = pages[0];
  } else {
    playwrightPage = await playwrightContext.newPage();
  }

  const extraPages = playwrightContext.pages().filter((p) => p !== playwrightPage);
  await Promise.all(extraPages.map((p) => p.close().catch(() => {})));
}

export async function runPlaywrightLogin(userNo: string = DEFAULT_USER_NO) {
  await ensurePlaywrightPage();
  if (!playwrightPage) throw new Error('Playwright 자동화 페이지 생성 실패');

  await playwrightPage.bringToFront();
  await sleep(200);
  await playwrightPage.goto(TARGET_URL, { waitUntil: 'load' });
  await sleep(500);

  await fillUserNoAndClick(playwrightPage, userNo);

  const certFilled = await fillCertPasswordInFramesGeneric(
    playwrightPage,
    DEFAULT_CERT_PW,
    15000
  );
  if (!certFilled) {
    console.log('Playwright: 인증서 암호 입력 필드를 프레임에서 찾지 못했습니다.');
  }
}

export async function disposePlaywright() {
  try {
    await playwrightPage?.close();
    await playwrightContext?.close();
    await playwrightBrowser?.close();
  } catch {
    // ignore
  } finally {
    playwrightPage = null;
    playwrightContext = null;
    playwrightBrowser = null;
  }
}
