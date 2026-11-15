import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@common': fileURLToPath(new URL('../backend/src/common/schemas.ts', import.meta.url)),
      'zod': fileURLToPath(new URL('./node_modules/zod', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: ['..']
    }
  }
})
