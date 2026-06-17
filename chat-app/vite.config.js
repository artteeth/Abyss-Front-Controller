import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Abyss-Front-Controller/',  // 加上这一行，名字和你仓库名一致
})
