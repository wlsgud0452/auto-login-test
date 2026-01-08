import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { DEFAULT_USER_NO } from './automation/shared';
import { runPuppeteerLogin, disposePuppeteer } from './automation/puppeteerAutomation';
import { runPlaywrightLogin, disposePlaywright } from './automation/playwrightAutomation';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

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

function setupIpcHandlers() {
  ipcMain.handle('open-login-automation', async (_event, userNo?: string) => {
    try {
      await runPuppeteerLogin(userNo || DEFAULT_USER_NO);
      return { success: true };
    } catch (error: any) {
      console.error('open-login-automation 실패:', error);
      return { success: false, message: error?.message || '알 수 없는 오류' };
    }
  });

  ipcMain.handle('open-login-automation-playwright', async (_event, userNo?: string) => {
    try {
      await runPlaywrightLogin(userNo || DEFAULT_USER_NO);
      return { success: true };
    } catch (error: any) {
      console.error('open-login-automation-playwright 실패:', error);
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
    await disposePuppeteer();
    await disposePlaywright();
  } catch {
    // ignore
  }
});
