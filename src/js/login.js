import { sb } from './config.js';

export async function prosesLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const btn = document.querySelector('button[onclick="prosesLogin()"]');

    if (!user || !pass) return alert("Isi username dan password dulu, Jagoan!");

    // Efek loading di tombol
    const oriText = btn.innerText;
    btn.innerText = "⏳ Mengecek data...";
    btn.disabled = true;

    try {
        const { data, error } = await sb.from('users')
            .select('*')
            .eq('username', user)
            .eq('password', pass)
            .single();

        if (error || !data) {
            alert("❌ Login Gagal! Username atau Password salah.");
        } else {
            // SIMPAN DATA SEMENTARA BUAT DIBACA SAMA TOMBOL MODAL
            window.tempUsernameLogin = data.username;
            window.tempRoleUtama = data.role[0]; // <-- INI KUNCI UTAMANYA BIAR TOMBOL ATAS GAK NYASAR!

            // CEK APAKAH ROLENYA GANDA (Lebih dari 1)
            if (data.role && data.role.length > 1) {
                // Tampilkan Pop-Up Pilih Role
                document.getElementById('modal-pilih-role').classList.remove('hidden');
            } else {
                // Jika Role-nya cuma 1, langsung lempar pakai fungsi eksekusi di bawah
                window.eksekusiMasukDashboard(data.role[0]);
            }
        } 
        
    } catch (e) {
        alert("🚨 Terjadi kesalahan sistem saat ngecek akun!");
        console.error(e);
    } finally {
        // Balikin kondisi tombol
        btn.innerText = oriText;
        btn.disabled = false;
    }
}

// =========================================================
// MESIN PENGGERAK DASHBOARD (DIPANGGIL SETELAH ROLE DIPILIH)
// =========================================================
window.eksekusiMasukDashboard = function(rolePilihan) {
    // 1. Sembunyikan modal pilih role jika tadi sempat terbuka
    const modalRole = document.getElementById('modal-pilih-role');
    if (modalRole) modalRole.classList.add('hidden');

    // 2. Simpan KTP (Sesi) permanen di memori HP
    localStorage.setItem('userRole', rolePilihan);
    localStorage.setItem('username', window.tempUsernameLogin);
    localStorage.setItem('loggedInUser', window.tempUsernameLogin); // Ekstra aman untuk fungsi lain

    // 3. Arahkan ke ruangan masing-masing menggunakan fungsi pindahHalaman bawaan aplikasi
    if (rolePilihan === 'owner') {
        window.pindahHalaman('page-owner');
    } 
    else if (rolePilihan === 'admin2') {
        window.pindahHalaman('dashboard-admin2');
        // Pancing supaya data admin2 (jam, profil) langsung ke-load
        if (typeof window.initDashboardAdmin2 === 'function') window.initDashboardAdmin2();
    } 
    else if (rolePilihan === 'admin') {
        window.pindahHalaman('dashboard-admin');
    } 
    else if (rolePilihan === 'coach') {
        window.pindahHalaman('dashboard-coach');
        // Pancing supaya data coach (jam, profil) langsung ke-load
        if (typeof window.jalankanJamCoach === 'function') window.jalankanJamCoach();
        if (typeof window.loadProfilHeaderCoach === 'function') window.loadProfilHeaderCoach();
    } 
    else if (rolePilihan === 'parent') {
        window.pindahHalaman('dashboard-parent');
    } 
    else {
        alert("Role tidak dikenali oleh sistem!");
    }
};

// Daftarkan ke Mandor (Window)
window.prosesLogin = prosesLogin;
