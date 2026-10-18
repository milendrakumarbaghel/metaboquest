import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// A portable, no-network quiz artifact. No server credentials are embedded.
export default defineConfig({
  base: './', publicDir: false,
  define: { 'import.meta.env.VITE_APP_MODE': JSON.stringify('standalone'), 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('') },
  plugins: [react(), tailwindcss(), {
    name: 'portable-playable', enforce: 'post',
    generateBundle: { order: 'post', handler(_, bundle) {
      const html = bundle['index.html']
      if (!html || html.type !== 'asset') throw new Error('Playable HTML missing')
      let source = String(html.source).replace(/<link[^>]+rel="icon"[^>]*>/g, '')
      for (const [name, asset] of Object.entries(bundle)) {
        if (asset.type === 'chunk') {
          if (!asset.isEntry) throw new Error('Playable must have one inline bundle')
          source = source.replace(/<script\b[^>]*src="[^"]+"[^>]*><\/script>/, () => `<script type="module">${asset.code.replace(/<\/script/gi, '<\\/script')}</script>`)
          delete bundle[name]
        } else if (name.endsWith('.css')) {
          source = source.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/, () => `<style>${String(asset.source)}</style>`)
          delete bundle[name]
        }
      }
      html.source = source
    } },
  }],
  build: { outDir: 'dist-playable', cssCodeSplit: false, assetsInlineLimit: 10000000, rolldownOptions: { output: { codeSplitting: false } } },
})
