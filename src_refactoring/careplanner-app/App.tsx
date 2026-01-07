import React, { useState } from 'react';
import styles from './App.module.css';

const TARGET_URL = 'https://www.longtermcare.or.kr/npbs/auth/login/loginForm.web?menuId=npe0000002160&rtnUrl=&zoomSize=';

const App: React.FC = () => {
  const [status, setStatus] = useState<string>('');

  const getIpcRenderer = () => {
    try {
      return (window as any)?.require?.('electron')?.ipcRenderer;
    } catch {
      return null;
    }
  };

  const handleButtonOne = async () => {
    const ipcRenderer = getIpcRenderer();

    if (!ipcRenderer) {
      setStatus('IPC를 사용할 수 없습니다. Electron 환경을 확인해주세요.');
      return;
    }

    setStatus('Chrome(Chromium) 창을 열고 자동 입력을 실행합니다...');

    try {
      const result = await ipcRenderer.invoke('open-login-automation');
      if (result?.success) {
        setStatus('로그인 페이지에서 사용자번호 입력 및 로그인 버튼 클릭을 완료했습니다.');
      } else {
        setStatus(result?.message || '실패했습니다. 다시 시도해주세요.');
      }
    } catch (error: any) {
      setStatus(`오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`);
    }
  };

  const handleButtonTwo = () => {
    setStatus('2번 버튼 기능은 추후 안내 예정입니다.');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>자동 로그인 테스트</h1>
      <p className={styles.subtitle}>버튼 1을 누르면 지정된 페이지를 열어 자동 입력을 실행합니다.</p>

      <div className={styles.buttonRow}>
        <button className={styles.primaryButton} onClick={handleButtonOne}>
          1번 버튼: Chrome 열기 + 자동 입력
        </button>
        <button className={styles.secondaryButton} onClick={handleButtonTwo}>
          2번 버튼: 추후 제공
        </button>
      </div>

      <div className={styles.infoBox}>
        <p>접속 URL: <span className={styles.url}>{TARGET_URL}</span></p>
        <p>자동 동작: 사용자번호 123456789000 입력 후 법인인증서 로그인 버튼 클릭</p>
      </div>

      {status && <div className={styles.status}>{status}</div>}
    </div>
  );
};

export default App;
