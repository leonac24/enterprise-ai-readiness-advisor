import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Minimal Vite setup using the official React plugin.
export default defineConfig({
  plugins: [react()],
})
