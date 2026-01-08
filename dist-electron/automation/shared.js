"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.CHROME_EXECUTABLE = exports.DEFAULT_CERT_PW = exports.DEFAULT_USER_NO = exports.TARGET_URL = void 0;
exports.TARGET_URL = 'https://www.longtermcare.or.kr/npbs/auth/login/loginForm.web?menuId=npe0000002160&rtnUrl=&zoomSize=';
exports.DEFAULT_USER_NO = '123456789000';
exports.DEFAULT_CERT_PW = '1111111111';
exports.CHROME_EXECUTABLE = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
//# sourceMappingURL=shared.js.map