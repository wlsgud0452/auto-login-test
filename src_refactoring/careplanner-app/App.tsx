import React, { useEffect, useRef } from 'react';
import styles from './App.module.css';

const TARGET_URL = "https://www.longtermcare.or.kr/npbs/auth/login/loginForm.web?menuId=npe0000002160&rtnUrl=&zoomSize=";

// 일반 Mac Chrome 브라우저 User Agent (Electron 식별자 제거)
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const App: React.FC = () => {
  // Webview 요소에 접근하기 위한 Ref
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    // Webview가 로드 완료(dom-ready)되었을 때 실행될 함수
    const handleDomReady = () => {
        // 개발자 도구 열기 (디버깅용, 필요 없으면 주석 처리)
        // webview.openDevTools();

        // ⚠️ 웹 페이지 내에서 실행될 자바스크립트 코드
        // 실제 사이트의 DOM 구조에 맞게 document.querySelector 등을 사용합니다.
        // id가 'userNo'인 요소를 찾아 값을 입력합니다.
        const script = `
            (function() {
                // 1. 요소 찾기
                // CSS 선택자: input 태그이면서 id가 userNo인 요소
                const input = document.querySelector('input#userNo'); 
                
                if (input) {
                    console.log('Target element found:', input);
                    
                    // 2. 값 입력
                    input.value = '123456789000';
                    
                    // 3. 이벤트 발생시키기 (React/Vue 등 모던 프레임워크 사이트 대응)
                    // 단순히 value만 바꾸면 내부 상태가 업데이트되지 않을 수 있어 이벤트를 날려줍니다.
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    console.log('Value inserted successfully');
                } else {
                    console.log('Target element not found: input#userNo');
                }
            })();
        `;

        webview.executeJavaScript(script)
            .then(() => console.log('Script executed successfully'))
            .catch((err: any) => console.error('Script execution failed:', err));
    };

    // 이벤트 리스너 등록
    webview.addEventListener('dom-ready', handleDomReady);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
        webview.removeEventListener('dom-ready', handleDomReady);
    };
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>자동 로그인 테스트</h1>
        <div className={styles.controls}>
             <span>대상 사이트: 장기요양정보시스템</span>
        </div>
      </header>
      <main className={styles.main}>
        <webview 
            ref={webviewRef}
            src={TARGET_URL} 
            className={styles.webview}
            useragent={USER_AGENT}
            // @ts-ignore
            allowpopups="true"
            // 중요: 보안 프로그램(AnySign 등)은 로컬 서버(HTTP)와 통신하므로 혼합 콘텐츠 허용 필요
            webpreferences="allowRunningInsecureContent=yes, contextIsolation=no"
        />
      </main>
    </div>
  );
};

export default App;
