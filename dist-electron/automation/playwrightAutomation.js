"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPlaywrightLogin = runPlaywrightLogin;
exports.disposePlaywright = disposePlaywright;
const playwright_1 = require("playwright");
const shared_1 = require("./shared");
let playwrightBrowser = null;
let playwrightContext = null;
let playwrightPage = null;
async function ensurePlaywrightPage() {
    if (playwrightBrowser && playwrightPage && !playwrightPage.isClosed())
        return;
    if (!playwrightBrowser) {
        playwrightBrowser = await playwright_1.chromium.launch({
            executablePath: shared_1.CHROME_EXECUTABLE,
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
    }
    else {
        playwrightPage = await playwrightContext.newPage();
    }
    const extraPages = playwrightContext.pages().filter((p) => p !== playwrightPage);
    await Promise.all(extraPages.map((p) => p.close().catch(() => { })));
}
async function runPlaywrightLogin(userNo = shared_1.DEFAULT_USER_NO) {
    await ensurePlaywrightPage();
    if (!playwrightPage)
        throw new Error('Playwright 자동화 페이지 생성 실패');
    await playwrightPage.bringToFront();
    await (0, shared_1.sleep)(200);
    await playwrightPage.goto(shared_1.TARGET_URL, { waitUntil: 'load' });
    await (0, shared_1.sleep)(500);
    const escapedUserNo = userNo.replace(/'/g, "\\'");
    await playwrightPage.evaluate(async (val) => {
        const sleepInPage = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        await sleepInPage(2000);
        const input = document.querySelector('input#userNo');
        if (input) {
            input.value = val;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('사용자번호 입력 완료');
        }
        else {
            console.log('input#userNo not found');
        }
        await sleepInPage(2000);
        const loginBtn = document.querySelector('a#btn_login_A2.btn_pink3');
        if (loginBtn) {
            loginBtn.click();
            console.log('법인인증서 로그인 버튼 클릭');
        }
        else {
            console.log('a#btn_login_A2.btn_pink3 not found');
        }
    }, escapedUserNo);
    const certFilled = await fillCertPasswordInFramesPlaywright(playwrightPage, shared_1.DEFAULT_CERT_PW, 15000);
    if (!certFilled) {
        console.log('Playwright: 인증서 암호 입력 필드를 프레임에서 찾지 못했습니다.');
    }
}
async function fillCertPasswordInFramesPlaywright(page, password, timeout = 10000) {
    const start = Date.now();
    const fillInFrame = async (target) => {
        const exists = await target.$('input#xwup_certselect_tek_input1.xwup-pw-box');
        if (!exists)
            return false;
        await target.evaluate((pw) => {
            const input = document.querySelector('input#xwup_certselect_tek_input1.xwup-pw-box');
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
        if (await fillInFrame(page))
            return true;
        const frames = page.frames();
        for (const frame of frames) {
            if (await fillInFrame(frame))
                return true;
        }
        await (0, shared_1.sleep)(200);
    }
    return false;
}
async function disposePlaywright() {
    try {
        await playwrightPage?.close();
        await playwrightContext?.close();
        await playwrightBrowser?.close();
    }
    catch {
        // ignore
    }
    finally {
        playwrightPage = null;
        playwrightContext = null;
        playwrightBrowser = null;
    }
}
//# sourceMappingURL=playwrightAutomation.js.map