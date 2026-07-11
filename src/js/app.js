import { sb } from './config.js';

// ===================================================
// FASE 3: NAVIGASI DASAR + SENSOR PEMATIK ADMIN
// ===================================================
export function pindahHalaman(idTarget, pushState = true) {
    document.querySelectorAll('.dashboard, .card, .dashboard-wide, [id^="page-"], [id^="dashboard-"], [id^="admin-modul-"], [id^="owner-modul-"], [id^="coach-modul-"], [id^="parent-modul-"]')
        .forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none'; 
        });

    const target = document.getElementById(idTarget);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = ''; 
    }

    // 👇👇 INI YANG TADI ILANG BRAY! (SENSOR PEMATIK) 👇👇
    if (idTarget === 'admin-modul-beginner') {
        if (typeof window.loadJadwalAdmin === "function") {
            window.loadJadwalAdmin();
        }
    }
    // 👆👆 ========================================= 👆👆

    if (pushState) history.pushState({ page: idTarget }, "", "#" + idTarget);
}

// FUNGSI TOMBOL ETALASE
export function bukaKatalog() {
    pindahHalaman('page-katalog');
    const kat = document.getElementById('katalog-container');
    if(kat) kat.innerHTML = '<p class="text-sky-600 font-bold p-4">⏳ Sabar bosku, modul Katalog segera menyusul!</p>';
}

export function bukaModalDaftarBeginner() {
    const modal = document.getElementById('modal-daftar-beginner');
    if(modal) modal.classList.remove('hidden');
}

export function tutupModalDaftarBeginner() {
    const modal = document.getElementById('modal-daftar-beginner');
    if(modal) modal.classList.add('hidden');
}

export function chatAdmin() {
    window.location.href = "https://wa.me/6289678159835?text=Halo%20Admin%20JR%20Academy";
}

// EVENT LISTENER BROWSER
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.page) pindahHalaman(event.state.page, false);
    else pindahHalaman('page-login', false);
});
document.addEventListener("DOMContentLoaded", () => {
    history.replaceState({ page: 'page-login' }, "", "#page-login");
});

// DAFTARKAN SEMUA KE WINDOW
window.pindahHalaman = pindahHalaman;
window.bukaKatalog = bukaKatalog;
window.bukaModalDaftarBeginner = bukaModalDaftarBeginner;
window.tutupModalDaftarBeginner = tutupModalDaftarBeginner;
window.chatAdmin = chatAdmin;
