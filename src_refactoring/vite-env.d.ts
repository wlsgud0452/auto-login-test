/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { src?: string; nodeintegration?: string; webpreferences?: string }, HTMLElement>;
  }
}
