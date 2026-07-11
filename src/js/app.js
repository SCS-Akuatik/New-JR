import { sb } from './config.js';

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

    // 👇 SENSOR PEMATIK SEMUA MODUL ADMIN 👇
    if (idTarget === 'admin-modul-beginner' && typeof window.loadJadwalAdmin === "function") window.loadJadwalAdmin();
    
    if (idTarget === 'admin-modul-coach' && typeof window.loadCoachAdmin === "function") {
        window.loadCoachAdmin();
        if(typeof window.initDropdownCoach === "function") window.initDropdownCoach();
    }
    
    if (idTarget === 'admin-modul-katalog' && typeof window.loadKatalogAdmin === "function") window.loadKatalogAdmin();
    
    if (idTarget === 'admin-modul-siswa' && typeof window.loadSiswaAdmin === "function") window.loadSiswaAdmin();
    
    if (idTarget === 'admin-modul-fee' && typeof window.loadFeeAdmin === "function") {
        window.loadFeeAdmin();
        if(typeof window.initDropdownCoach === "function") window.initDropdownCoach();
        if(typeof window.loadRekapFee === "function") window.loadRekapFee();
    }
    
    if (idTarget === 'admin-modul-akunting' && typeof window.loadAkuntingAdmin === "function") {
        window.loadAkuntingAdmin();
        if(typeof window.loadRekapAkunting === "function") window.loadRekapAkunting();
    }
    // 👆 ================================ 👆

    if (pushState) history.pushState({ page: idTarget }, "", "#" + idTarget);
}

// FUNGSI TOMBOL ETALASE
export function bukaKatalog() {
    pindahHalaman('page-katalog');
    // Kalau kuli katalog udah bangun, suruh nampilin ke Non-Member
    if(typeof window.loadKatalogUser === "function") {
        window.loadKatalogUser();
    } else {
        const kat = document.getElementById('katalog-container');
        if(kat) kat.innerHTML = '<p class="text-sky-600 font-bold p-4">⏳ Sabar bosku, modul Katalog segera menyusul!</p>';
    }
}
export function bukaModalDaftarBeginner() { document.getElementById('modal-daftar-beginner')?.classList.remove('hidden'); }
export function tutupModalDaftarBeginner() { document.getElementById('modal-daftar-beginner')?.classList.add('hidden'); }
export function chatAdmin() { window.location.href = "https://wa.me/6289678159835?text=Halo%20Admin%20JR%20Academy"; }

// EVENT LISTENER BROWSER
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.page) pindahHalaman(event.state.page, false);
    else pindahHalaman('page-login', false);
});
document.addEventListener("DOMContentLoaded", () => { history.replaceState({ page: 'page-login' }, "", "#page-login"); });

// DAFTARKAN SEMUA KE WINDOW
window.pindahHalaman = pindahHalaman;
window.bukaKatalog = bukaKatalog;
window.bukaModalDaftarBeginner = bukaModalDaftarBeginner;
window.tutupModalDaftarBeginner = tutupModalDaftarBeginner;
window.chatAdmin = chatAdmin;
