import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import styleZx from './src/vite-plugin-style-zx'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), styleZx()],
})
