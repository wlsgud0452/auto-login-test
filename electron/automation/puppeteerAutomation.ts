import puppeteer, { Browser, Page } from 'puppeteer-core';
import {
  CHROME_EXECUTABLE,
  DEFAULT_CERT_PW,
  DEFAULT_USER_NO,
  TARGET_URL,
  sleep,
  fillUserNoAndClick,
  fillCertPasswordInFramesGeneric,
} from './shared';

let automationBrowser: Browser | null = null;
let automationPage: Page | null = null;

async function ensurePuppeteerPage() {
  if (automationBrowser && automationPage && !automationPage.isClosed()) return;

  if (!automationBrowser) {
    automationBrowser = await puppeteer.launch({
      executablePath: CHROME_EXECUTABLE,
      headless: false,
      defaultViewport: null,
      devtools: true,
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
    automationPage = pages[0];
  } else {
    automationPage = await automationBrowser.newPage();
  }

  const extraPages = (await automationBrowser.pages()).filter((p) => p !== automationPage);
  await Promise.all(extraPages.map((p) => p.close().catch(() => {})));
}

export async function runPuppeteerLogin(userNo: string = DEFAULT_USER_NO) {
  await ensurePuppeteerPage();
  if (!automationPage) throw new Error('자동화 페이지 생성 실패');

  await automationPage.bringToFront();
  await sleep(200);
  await automationPage.goto(TARGET_URL, { waitUntil: 'load' });
  await sleep(500);

  await fillUserNoAndClick(automationPage, userNo);

  const certFilled = await fillCertPasswordInFramesGeneric(
    automationPage,
    DEFAULT_CERT_PW,
    15000
  );
  if (!certFilled) {
    console.log('인증서 암호 입력 필드를 프레임에서 찾지 못했습니다.');
  }
}

export async function disposePuppeteer() {
  try {
    await automationPage?.close();
    await automationBrowser?.close();
  } catch {
    // ignore
  } finally {
    automationPage = null;
    automationBrowser = null;
  }
}
