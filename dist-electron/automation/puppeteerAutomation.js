"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPuppeteerLogin = runPuppeteerLogin;
exports.disposePuppeteer = disposePuppeteer;
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const shared_1 = require("./shared");
let automationBrowser = null;
let automationPage = null;
async function ensurePuppeteerPage() {
    if (automationBrowser && automationPage && !automationPage.isClosed())
        return;
    if (!automationBrowser) {
        automationBrowser = await puppeteer_core_1.default.launch({
            executablePath: shared_1.CHROME_EXECUTABLE,
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
    }
    else {
        automationPage = await automationBrowser.newPage();
    }
    const extraPages = (await automationBrowser.pages()).filter((p) => p !== automationPage);
    await Promise.all(extraPages.map((p) => p.close().catch(() => { })));
}
async function runPuppeteerLogin(userNo = shared_1.DEFAULT_USER_NO) {
    await ensurePuppeteerPage();
    if (!automationPage)
        throw new Error('자동화 페이지 생성 실패');
    await automationPage.bringToFront();
    await (0, shared_1.sleep)(200);
    await automationPage.goto(shared_1.TARGET_URL, { waitUntil: 'load' });
    await (0, shared_1.sleep)(500);
    const escapedUserNo = userNo.replace(/'/g, "\\'");
    await automationPage.evaluate(async (val) => {
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
    const certFilled = await fillCertPasswordInFrames(automationPage, shared_1.DEFAULT_CERT_PW, 15000);
    if (!certFilled) {
        console.log('인증서 암호 입력 필드를 프레임에서 찾지 못했습니다.');
    }
}
async function fillCertPasswordInFrames(page, password, timeout = 10000) {
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
async function disposePuppeteer() {
    try {
        await automationPage?.close();
        await automationBrowser?.close();
    }
    catch {
        // ignore
    }
    finally {
        automationPage = null;
        automationBrowser = null;
    }
}
//# sourceMappingURL=puppeteerAutomation.js.map