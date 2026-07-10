// src/js/login.js
import { sb } from './config.js';
import { pindahHalaman } from './app.js'; // Import fungsi routing

export async function prosesLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    
    if (!user || !pass) return alert("Isi form login!");
    
    try {
        const { data, error } = await sb.from('users')
            .select('role')
            .eq('username', user)
            .eq('password', pass)
            .single();

        if (error || !data) return alert("Kombinasi User/Pass salah!");

        let primaryRole = "unknown";
        if (Array.isArray(data.role)) {
            primaryRole = data.role[0];
        } else if (typeof data.role === 'string') {
            try {
                let parsed = JSON.parse(data.role);
                primaryRole = Array.isArray(parsed) ? parsed[0] : parsed;
            } catch(e) {
                primaryRole = data.role;
            }
        } else {
            primaryRole = String(data.role);
        }

        localStorage.setItem('userRole', primaryRole); 
        localStorage.setItem('loggedInUser', user);

        const { error: logErr } = await sb.from('login_logs').insert([{ 
            username: user,
            role: primaryRole
        }]);
        
        if (logErr) console.error("Gagal merekam CCTV:", logErr.message);

        // Logic Redirect Terpadu
        if (primaryRole === 'owner') {
            pindahHalaman('page-owner');
            if (typeof window.loadSiswaOwner === "function") window.loadSiswaOwner();
        } else if (primaryRole === 'admin') {
            pindahHalaman('dashboard-admin');
        } else if (primaryRole === 'coach') {
            pindahHalaman('dashboard-coach');
        } else if (primaryRole === 'parent' || primaryRole === 'ortu' || primaryRole === 'walimurid') {
            pindahHalaman('dashboard-parent');
        } else {
            alert("Akun terdaftar, tapi tidak punya akses ke dashboard!");
        }

    } catch (err) { 
        console.error(err);
        alert("Gangguan sistem, coba lagi nanti."); 
    }
}

// Daftarkan ke Global Scope!
window.prosesLogin = prosesLogin;
