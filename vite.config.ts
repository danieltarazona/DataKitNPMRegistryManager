import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import build from '@hono/vite-build/cloudflare-workers'

export default defineConfig(({ mode }) => {
    if (mode === 'client') {
        return {
            plugins: [react()],
            build: {
                outDir: 'dist',
                emptyOutDir: true,
            },
        }
    }
    return {
        plugins: [
            build({
                entry: 'src/server/index.ts',
            }),
        ],
    }
})
