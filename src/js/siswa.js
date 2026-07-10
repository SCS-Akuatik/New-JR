import { sb } from './config.js';

// ... [PASTE SEMUA KODE DARI SOURCE 14 (MANAJEMEN MASTER SISWA) DI SINI] ...

// Daftarkan ke Global Scope
window.loadSiswaAdmin = loadSiswaAdmin;
window.simpanSiswa = simpanSiswa;
window.editSiswa = editSiswa;
window.filterMurid = filterMurid;
window.autoHitungExpiredSiswa = autoHitungExpiredSiswa;
window.generateInvoice = generateInvoice;
window.hitungTotalInvoice = hitungTotalInvoice;
window.submitInvoiceDatabase = submitInvoiceDatabase;
window.tutupModalInvoice = tutupModalInvoice;
window.loadDropdownMuridForWali = loadDropdownMuridForWali;
window.buatAkunWali = buatAkunWali;
window.simpanPrestasiAdmin = simpanPrestasiAdmin;
// ==========================================
// DAFTARKAN FUNGSI KE GLOBAL WINDOW (VITE FIX)
// ==========================================
window.loadSiswaAdmin = loadSiswaAdmin;
window.simpanSiswa = simpanSiswa;
window.filterMurid = filterMurid;
window.autoHitungExpiredSiswa = autoHitungExpiredSiswa;
window.buatAkunWali = buatAkunWali;
window.simpanPrestasiAdmin = simpanPrestasiAdmin;
window.loadDropdownMuridForWali = loadDropdownMuridForWali;

// Daftarin juga fungsi yang biasanya ada di tombol dalam tabel:
if (typeof editSiswa === "function") window.editSiswa = editSiswa;
if (typeof hapusSiswa === "function") window.hapusSiswa = hapusSiswa;
if (typeof bukaModalInvoice === "function") window.bukaModalInvoice = bukaModalInvoice;
