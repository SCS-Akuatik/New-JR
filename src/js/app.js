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

    // SEMBUNYIKAN SEMUA HALAMAN & SAPU BERSIH INLINE STYLE LAMA
    document.querySelectorAll('.dashboard, .card, .dashboard-wide, [id^="page-"], [id^="dashboard-"], [id^="admin-modul-"], [id^="owner-modul-"], [id^="coach-modul-"], [id^="parent-modul-"]')
        .forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none'; 
        });

    // TAMPILKAN HALAMAN TARGET
    const target = document.getElementById(idTarget);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = ''; 
    }

    // ============================================================
    // 👇👇 FINAL BOSS FIX: WAJIB PAKAI "window." DI VITE! 👇👇
    // ============================================================
    if (idTarget === 'admin-modul-coach' && typeof window.loadCoachAdmin === "function") window.loadCoachAdmin();
    if (idTarget === 'admin-modul-katalog' && typeof window.loadKatalogAdmin === "function") window.loadKatalogAdmin();
    
    // Ini yang bikin Beginner Class lu berhasil narik data!
    if (idTarget === 'admin-modul-beginner' && typeof window.loadJadwalAdmin === "function") {
        window.loadJadwalAdmin();
    }
    
    if (idTarget === 'admin-modul-akunting') {
        if (typeof window.loadAkuntingAdmin === "function") window.loadAkuntingAdmin();
        if (typeof window.loadRekapAkunting === "function") window.loadRekapAkunting();
        if (typeof window.loadInvoiceTercetak === "function") window.loadInvoiceTercetak(); 
    }
    // 👆👆 ==================================================== 👆👆

    // HISTORY API
    if (pushState) {
        history.pushState({ page: idTarget }, "", "#" + idTarget);
    }
}

// ===================================================
// FITUR TAMBAHAN (Dari Helper Lama)
// ===================================================
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

export async function hapusData(tabel, idData, callback) {
    if(!confirm("Hapus data ini dari database secara permanen?")) return;
    const primaryKey = tabel === 'murid' ? 'id_murid' : 'id';
    const { error } = await sb.from(tabel).delete().eq(primaryKey, idData);
    if (error) {
        console.error(error);
        alert("Gagal menghapus data: " + error.message);
    } else {
        if(typeof callback === "function") callback();
    }
}

// ===================================================
// EVENT LISTENER BROWSER
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
window.chatAdmin = chatAdmin;
window.hitungKelompokUmur = hitungKelompokUmur;
window.hapusData = hapusData;
