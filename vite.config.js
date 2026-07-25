import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Jahitan 1: Aplikasi Utama (SPA)
        main: resolve(__dirname, 'index.html'),
        
        // Jahitan 2: Pintu Gerbang Event (BARU DITAMBAHKAN)
        event: resolve(__dirname, 'event.html'),
        
        // Jahitan 3: Form Pendaftaran Event (Vanilla)
        dryland: resolve(__dirname, 'dryland.html'),
        
        // Jahitan 4: Dashboard Admin Event (Vanilla)
        eventdash: resolve(__dirname, 'event_dashboard.html')
      }
    }
  }
})
