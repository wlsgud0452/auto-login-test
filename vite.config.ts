import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src_refactoring'),
    },
  },
  base: './', // Electron에서 파일 경로 문제 해결을 위해 상대 경로 사용
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})

