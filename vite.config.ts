import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      generateScopedName: 'abrcp_[local]_[hash:base64:4]',
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReactColorPicker',
      fileName: 'react-color-picker',
      cssFileName: 'style',
      formats: ['es'],
    },
    minify: true,
    cssMinify: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
})
