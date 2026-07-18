import { sb } from './config.js';

// ===================================================
// MANTRA PEMBUNUH SERVICE WORKER LAMA (AUTO-CLEAR CACHE)
// ===================================================
// ===================================================
// PEMBERSIH CACHE LAMA (SILUMAN - ANTI RELOAD LOOP)
// ===================================================
// Menghapus sisa cache/memori dari web lama tanpa membunuh Service Worker baru
if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
        cacheNames.forEach(function(cacheName) {
            caches.delete(cacheName); // Hapus semua ingatan masa lalu
        });
    });
}

export function pindahHalaman(idTarget, pushState = true) {
    // 1. Sembunyikan semua halaman terlebih dahulu
    document.querySelectorAll('.dashboard, .card, .dashboard-wide, [id^="page-"], [id^="dashboard-"], [id^="admin-modul-"], [id^="owner-modul-"], [id^="coach-modul-"], [id^="parent-modul-"]')
        .forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none'; 
        });

    // 2. Tampilkan halaman target
    const target = document.getElementById(idTarget);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = ''; 

        // ===================================================
        // 🪄 GSAP MAGIC ANIMATION (SUNTIKAN VISUAL PREMIUM)
        // ===================================================
        if (typeof gsap !== 'undefined') {
            
            // Animasi untuk Halaman Utama Non-Member
            if (idTarget === 'page-nonmember') {
                gsap.killTweensOf("#page-nonmember, #page-nonmember .gsap-item"); 
                gsap.set("#page-nonmember .gsap-item", { opacity: 0, y: 35 });
                
                gsap.timeline()
                    .fromTo("#page-nonmember", 
                        { scale: 0.94, opacity: 0 }, 
                        { scale: 1, opacity: 1, duration: 0.45, ease: "power3.out" }
                    )
                    .to("#page-nonmember .gsap-item", {
                        opacity: 1,
                        y: 0,
                        duration: 0.4,
                        stagger: 0.08, // Efek berjatuhan satu per satu
                        ease: "power2.out"
                    }, "-=0.25");
            }
            
            // Animasi untuk Halaman Katalog
            else if (idTarget === 'page-katalog') {
                gsap.killTweensOf("#page-katalog, #page-katalog .gsap-katalog-item");
                gsap.set("#page-katalog .gsap-katalog-item", { opacity: 0, y: 25 });
                
                gsap.timeline()
                    .fromTo("#page-katalog", 
                        { scale: 0.96, opacity: 0 }, 
                        { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }
                    )
                    .to("#page-katalog .gsap-katalog-item", { 
                        opacity: 1, 
                        y: 0, 
                        duration: 0.35, 
                        stagger: 0.1, 
                        ease: "power1.out" 
                    }, "-=0.2");
            }
            
            // Animasi untuk Halaman Jadwal (jika ada id page-jadwal nantinya)
            else if (idTarget === 'page-jadwal') {
                gsap.killTweensOf("#page-jadwal, #page-jadwal .gsap-jadwal-item");
                gsap.set("#page-jadwal .gsap-jadwal-item", { opacity: 0, y: 25 });
                
                gsap.timeline()
                    .fromTo("#page-jadwal", 
                        { scale: 0.96, opacity: 0 }, 
                        { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }
                    )
                    .to("#page-jadwal .gsap-jadwal-item", { 
                        opacity: 1, 
                        y: 0, 
                        duration: 0.35, 
                        stagger: 0.1, 
                        ease: "power1.out" 
                    }, "-=0.2");
            }
        }
        // ===================================================
    }

    // 👇 SENSOR PEMATIK SEMUA MODUL ADMIN 👇
    
    // --- TRIGGER BARU DITAMBAHKAN DI SINI ---
    if (idTarget === 'dashboard-admin' && typeof window.loadPendingPendaftaran === "function") {
        window.loadPendingPendaftaran();
    }
    // ----------------------------------------

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
        if(typeof window.loadInvoiceHistory === "function") window.loadInvoiceHistory(); 
    }
    
    if (idTarget === 'coach-modul-jadwal' && typeof window.loadCoachJadwal === "function") window.loadCoachJadwal();
    
    if (idTarget === 'coach-modul-assessment' && typeof window.loadCoachAssessment === "function") window.loadCoachAssessment();
    
    if (idTarget === 'coach-modul-fee' && typeof window.loadCoachFee === "function") window.loadCoachFee();
    
    if (idTarget === 'coach-modul-profil' && typeof window.loadProfilCoach === "function") window.loadProfilCoach();
    
    // 👇 SENSOR PEMATIK DASHBOARD PARENT 👇
    if (idTarget === 'dashboard-parent' && typeof window.initParentDashboard === "function") {
        window.initParentDashboard();
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

// SAAT WEB PERTAMA KALI DIBUKA (SUNTIKAN DETEKSI LINK DIRECT)
document.addEventListener("DOMContentLoaded", () => { 
    // Tangkap kalau ada link pakai hashtag (contoh: #page-nonmember atau #page-katalog)
    let hash = window.location.hash.replace('#', '');
    
    if (hash) {
        // Kalau ada hashtag, langsung arahkan ke halaman tersebut 
        // (Tenang, kalau ada yg iseng nembak #dashboard-admin tetep bakal ke-blokir sama sistem keamanan kasta di atas)
        pindahHalaman(hash, false);
        history.replaceState({ page: hash }, "", "#" + hash);
    } else {
        // Kalau url bersih tanpa hashtag, default masuk ke landing page login
        history.replaceState({ page: 'page-login' }, "", "#page-login"); 
        pindahHalaman('page-login', false);
    }
});


// DAFTARKAN SEMUA KE WINDOW
window.pindahHalaman = pindahHalaman;
window.bukaKatalog = bukaKatalog;
window.bukaModalDaftarBeginner = bukaModalDaftarBeginner;
window.tutupModalDaftarBeginner = tutupModalDaftarBeginner;
window.chatAdmin = chatAdmin;
