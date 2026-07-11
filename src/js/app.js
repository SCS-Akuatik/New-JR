import { sb } from './config.js';

// ===================================================
// FASE 1: NAVIGASI MURNI (Hanya Pindah Halaman)
// ===================================================
export function pindahHalaman(idTarget, pushState = true) {
    // 1. SEMBUNYIKAN SEMUA HALAMAN
    document.querySelectorAll('.dashboard, .card, .dashboard-wide, [id^="page-"], [id^="dashboard-"], [id^="admin-modul-"], [id^="owner-modul-"], [id^="coach-modul-"], [id^="parent-modul-"]')
        .forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none'; 
        });

    // 2. TAMPILKAN HALAMAN TARGET
    const target = document.getElementById(idTarget);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = ''; 
    }

    // 3. HISTORY API (Biar tombol back HP berfungsi)
    if (pushState) {
        history.pushState({ page: idTarget }, "", "#" + idTarget);
    }
}

// ===================================================
// EVENT LISTENER BROWSER (Tombol Back/Forward)
// ===================================================
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.page) {
        pindahHalaman(event.state.page, false);
    } else {
        pindahHalaman('page-login', false);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    history.replaceState({ page: 'page-login' }, "", "#page-login");
});

// ===================================================
// DAFTARKAN KE GLOBAL WINDOW
// ===================================================
window.pindahHalaman = pindahHalaman;
