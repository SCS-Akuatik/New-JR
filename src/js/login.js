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
            // Simpan KTP (Sesi) di memori HP
            localStorage.setItem('userRole', data.role[0]);
            localStorage.setItem('username', data.username);

            // Arahkan ke ruangan masing-masing
            if (data.role.includes('owner')) {
                window.pindahHalaman('page-owner');
            } 
            else if (data.role.includes('admin2')) {
                window.pindahHalaman('dashboard-admin2');
            } 
            else if (data.role.includes('admin')) {
                window.pindahHalaman('dashboard-admin');
            } 
            else if (data.role.includes('coach')) {
                window.pindahHalaman('dashboard-coach');
            } 
            else if (data.role.includes('parent')) {
                window.pindahHalaman('dashboard-parent');
            } 
            else {
                alert("Role tidak dikenali!");
            }
        } // <-- INI KURUNG KURAWAL YANG TADI HILANG UNTUK MENUTUP BLOK ELSE
        
    } catch (e) {
        alert("🚨 Terjadi kesalahan sistem saat ngecek akun!");
        console.error(e);
    } finally {
        // Balikin kondisi tombol
        btn.innerText = oriText;
        btn.disabled = false;
    }
}

// Daftarkan ke Mandor (Window)
window.prosesLogin = prosesLogin;
