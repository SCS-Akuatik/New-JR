import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist', // Semua file matang akan masuk ke folder ini saat di-build
    rollupOptions: {
      input: {
        // Jahitan 1: Aplikasi Utama (SPA)
        main: resolve(__dirname, 'index.html'),
        
        // Jahitan 2: Form Pendaftaran Event (Vanilla)
        dryland: resolve(__dirname, 'dryland.html'),
        
        // Jahitan 3: Dashboard Admin Event (Vanilla)
        eventdash: resolve(__dirname, 'event_dashboard.html')
      }
    }
  }
})
