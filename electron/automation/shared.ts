export const TARGET_URL =
  'https://www.longtermcare.or.kr/npbs/auth/login/loginForm.web?menuId=npe0000002160&rtnUrl=&zoomSize=';

export const DEFAULT_USER_NO = '123456789000';
export const DEFAULT_CERT_PW = '1111111111';
export const CHROME_EXECUTABLE =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 최소 공통 페이지 인터페이스 (Puppeteer / Playwright 호환)
export type AutomationFrameLike = {
  evaluate: (fn: (...args: any[]) => any, ...args: any[]) => Promise<any>;
  $: (selector: string) => Promise<any>;
  frames?: () => AutomationFrameLike[];
};

export type AutomationPageLike = AutomationFrameLike & {
  frames: () => AutomationFrameLike[];
};

export async function fillUserNoAndClick(page: AutomationPageLike, userNo: string) {
  const escapedUserNo = userNo.replace(/'/g, "\\'");

  await page.evaluate(async (val) => {
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
}

export async function fillCertPasswordInFramesGeneric(
  page: AutomationPageLike,
  password: string,
  timeout = 10000
) {
  const start = Date.now();
  const fillInFrame = async (target: AutomationFrameLike) => {
    const exists = await target.$('input#xwup_certselect_tek_input1.xwup-pw-box');
    if (!exists) return false;
    await target.evaluate((pw: string) => {
      const input = document.querySelector(
        'input#xwup_certselect_tek_input1.xwup-pw-box'
      ) as HTMLInputElement | null;
      if (input) {
        input.removeAttribute('readonly');
        input.value = pw;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('인증서 암호 입력 완료');
      }
    }, password);
    return true;
  };

  while (Date.now() - start < timeout) {
    if (await fillInFrame(page)) return true;
    const frames = page.frames?.() || [];
    for (const frame of frames) {
      if (await fillInFrame(frame)) return true;
    }
    await sleep(200);
  }
  return false;
}
