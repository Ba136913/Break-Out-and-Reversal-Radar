import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'

import viteReact from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  server: {
    port: 3000,
    allowedHosts: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  plugins: [
    ,
    tsConfigPaths(),
    tanstackStart(),
    viteReact(),
  ],
})