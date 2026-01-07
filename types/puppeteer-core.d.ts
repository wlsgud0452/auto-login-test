declare module 'puppeteer-core' {
  // 최소 선언으로 TS 모듈 해소
  export interface Browser {
    newPage(): Promise<Page>;
    pages(): Promise<Page[]>;
    close(): Promise<void>;
  }

  export interface Frame {
    $(selector: string): Promise<any>;
    evaluate<T>(fn: (...args: any[]) => T, ...args: any[]): Promise<T>;
  }

  export interface Page {
    isClosed(): boolean;
    close(): Promise<void>;
    bringToFront(): Promise<void>;
    waitForTimeout(ms: number): Promise<void>;
    goto(url: string, options?: any): Promise<void>;
    evaluate<T>(fn: (...args: any[]) => T, ...args: any[]): Promise<T>;
    frames(): Frame[];
  }

  const puppeteer: {
    launch(options: any): Promise<Browser>;
  };

  export default puppeteer;
}
