import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 支持通过环境变量配置后端地址
const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // 允许外部访问
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      }
    }
  },
  preview: {
    port: 4173,
    host: true,
  }
})
