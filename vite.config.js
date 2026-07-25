import { defineConfig } from 'vite'
import { resolve } from 'path' // Wajib dipanggil untuk membaca letak file

export default defineConfig({
  build: {
    outDir: 'dist', // Nanti pas di-build, semua file matang akan masuk ke folder ini
    rollupOptions: {
      input: {
        // Jahitan 1: Halaman Utama
        main: resolve(__dirname, 'index.html'),
        
        // Jahitan 2: Halaman Dryland (Pastikan dryland.html sejajar dengan index.html)
        dryland: resolve(__dirname, 'dryland.html') 
      }
    }
  }
})
