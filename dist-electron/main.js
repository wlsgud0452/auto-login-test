"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const shared_1 = require("./automation/shared");
const puppeteerAutomation_1 = require("./automation/puppeteerAutomation");
const playwrightAutomation_1 = require("./automation/playwrightAutomation");
const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;
function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function setupIpcHandlers() {
    electron_1.ipcMain.handle('open-login-automation', async (_event, userNo) => {
        try {
            await (0, puppeteerAutomation_1.runPuppeteerLogin)(userNo || shared_1.DEFAULT_USER_NO);
            return { success: true };
        }
        catch (error) {
            console.error('open-login-automation 실패:', error);
            return { success: false, message: error?.message || '알 수 없는 오류' };
        }
    });
    electron_1.ipcMain.handle('open-login-automation-playwright', async (_event, userNo) => {
        try {
            await (0, playwrightAutomation_1.runPlaywrightLogin)(userNo || shared_1.DEFAULT_USER_NO);
            return { success: true };
        }
        catch (error) {
            console.error('open-login-automation-playwright 실패:', error);
            return { success: false, message: error?.message || '알 수 없는 오류' };
        }
    });
}
electron_1.app.whenReady().then(() => {
    createMainWindow();
    setupIpcHandlers();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', async () => {
    try {
        await (0, puppeteerAutomation_1.disposePuppeteer)();
        await (0, playwrightAutomation_1.disposePlaywright)();
    }
    catch {
        // ignore
    }
});
//# sourceMappingURL=main.js.map