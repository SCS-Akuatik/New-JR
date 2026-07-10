// src/js/app.js
import { sb } from './config.js';

// ===================================================
// FUNGSI NAVIGASI & HISTORY API
// ===================================================
export function pindahHalaman(idTarget, pushState = true) {
    const userRole = localStorage.getItem('userRole'); 

    // SATPAM PENJAGA GERBANG
    if (idTarget.includes('admin') && userRole !== 'admin' && userRole !== 'owner') {
        alert("🚨 Akses Ditolak! Lu bukan Admin, Bos.");
        return pindahHalaman('page-login', false);
    }
    if (idTarget.includes('owner') && userRole !== 'owner') {
        alert("🚨 Akses Ditolak! Ini Ruang Khusus Bos Besar.");
        return pindahHalaman('page-login', false);
    }
    if ((idTarget.startsWith('coach-') || idTarget === 'dashboard-coach') && userRole !== 'coach' && userRole !== 'owner') {
        alert("🚨 Akses Ditolak! Lu bukan Coach.");
        return pindahHalaman('page-login', false);
    }

    // SEMBUNYIKAN SEMUA HALAMAN (TAILWIND WAY)
    document.querySelectorAll('.dashboard, .card, .dashboard-wide, [id^="page-"], [id^="dashboard-"], [id^="admin-modul-"], [id^="owner-modul-"], [id^="coach-modul-"], [id^="parent-modul-"]')
        .forEach(el => el.classList.add('hidden')); // <-- PERUBAHAN TAILWIND

    // TAMPILKAN HALAMAN TARGET
    const target = document.getElementById(idTarget);
    if (target) target.classList.remove('hidden'); // <-- PERUBAHAN TAILWIND

    // Panggil fungsi spesifik sesuai halaman
    if (idTarget === 'admin-modul-coach' && typeof loadCoachAdmin === "function") loadCoachAdmin();
    if (idTarget === 'admin-modul-katalog' && typeof loadKatalogAdmin === "function") loadKatalogAdmin();
    if (idTarget === 'admin-modul-beginner' && typeof loadJadwalAdmin === "function") {
        loadJadwalAdmin();
    }
    // ... dst sesuai kebutuhan

    // HISTORY API
    if (pushState) {
        history.pushState({ page: idTarget }, "", "#" + idTarget);
    }
}

// Fitur Lainnya (Dari file helper lama)
export function chatAdmin() {
    window.location.href = "https://wa.me/6289678159835?text=Halo%20Admin%20JR%20Academy";
}

export function hitungKelompokUmur(tanggalLahirStr) {
    if (!tanggalLahirStr) return 'KU Belum Set';
    const tahunLahir = new Date(tanggalLahirStr).getFullYear();
    const tahunSekarang = 2026; 
    const usiaKU = tahunSekarang - tahunLahir;
    if (usiaKU <= 9) return `KU 5 (${usiaKU} Thn)`;
    if (usiaKU >= 10 && usiaKU <= 11) return `KU 4 (${usiaKU} Thn)`;
    if (usiaKU >= 12 && usiaKU <= 13) return `KU 3 (${usiaKU} Thn)`;
    if (usiaKU >= 14 && usiaKU <= 15) return `KU 2 (${usiaKU} Thn)`;
    if (usiaKU >= 16 && usiaKU <= 18) return `KU 1 (${usiaKU} Thn)`;
    return `Senior (${usiaKU} Thn)`;
}

// Mendaftarkan fungsi ke global window agar HTML bisa mengeksekusi onclick="..."
window.pindahHalaman = pindahHalaman;
window.chatAdmin = chatAdmin;
window.hitungKelompokUmur = hitungKelompokUmur;
