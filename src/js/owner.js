import { sb } from './config.js';

/* =========================================================
   DASHBOARD KHUSUS OWNER (KASTA TERTINGGI)
========================================================= */

// 1. MODUL MASTER SISWA (Traffic Light Retensi)
export async function loadSiswaOwner() {
    const tbody = document.getElementById('tabel-body-owner-siswa');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">Memuat data...</td></tr>';
    
    const { data, error } = await sb.from('murid').select('*').order('sisa_sesi', { ascending: true });
    if (error) return tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Gagal muat: ${error.message}</td></tr>`;
    
    let html = '';
    data.forEach(m => {
        let lampu = '';
        if (m.sisa_sesi >= 3) lampu = '<span class="text-emerald-500 text-lg" title="Aman (3-4)">🟢</span>'; 
        else if (m.sisa_sesi > 0 && m.sisa_sesi <= 2) lampu = '<span class="text-amber-500 text-lg" title="Warning (1-2)">🟠</span>'; 
        else lampu = '<span class="text-red-500 text-lg" title="Habis (0)">🔴</span>'; 

        html += `
        <tr class="border-b border-slate-100">
            <td class="p-3 font-bold text-slate-800">${m.nama_murid}</td>
            <td class="p-3 text-slate-500 text-xs">${m.program || '-'}</td>
            <td class="p-3 font-bold text-center text-slate-700">${m.sisa_sesi}</td>
            <td class="p-3 text-center">${lampu}</td>
        </tr>`;
    });
    tbody.innerHTML = html || '<tr><td colspan="4" class="text-center p-4">Belum ada data siswa.</td></tr>';
}

// 2. MODUL MASTER COACH (KPI & Performa)
export async function loadCoachKPI() {
    const container = document.getElementById('tabel-kpi-coach');
    if(!container) return;
    container.innerHTML = 'Menghitung performa dari database...';

    const { data, error } = await sb.from('fee_coach').select('*');
    if (error) return container.innerHTML = 'Gagal memuat KPI.';

    const bulanIni = new Date().getMonth() + 1;
    const tahunIni = new Date().getFullYear();
    
    let kpi = {};
    data.forEach(f => {
        if(!f.tanggal) return;
        const tgl = new Date(f.tanggal);
        // Cuma hitung gaji bulan berjalan
        if ((tgl.getMonth() + 1) === bulanIni && tgl.getFullYear() === tahunIni) {
            if (!kpi[f.nama_coach]) kpi[f.nama_coach] = { sesi: 0, fee: 0 };
            kpi[f.nama_coach].sesi += parseInt(f.total_sesi) || 0;
            kpi[f.nama_coach].fee += parseFloat(f.total_fee) || 0;
        }
    });

    let html = '';
    for (let coach in kpi) {
        // Tanda Bintang buat Coach yang ngajar di atas 5 sesi (Produktivitas Tinggi)
        let star = kpi[coach].sesi > 5 ? '⭐ VIP' : '';
        html += `
        <div class="bg-white border border-slate-200 p-3 rounded-lg flex justify-between items-center">
            <div>
                <strong class="text-slate-800 text-sm">👨‍🏫 ${coach} <span class="text-amber-500 text-[10px]">${star}</span></strong><br>
                <span class="text-xs text-slate-500">Produktivitas: <b>${kpi[coach].sesi} Sesi</b></span>
            </div>
            <div class="text-right">
                <span class="text-[10px] text-red-500 block">Payout Fee</span>
                <b class="text-emerald-500 text-sm">Rp ${kpi[coach].fee.toLocaleString('id-ID')}</b>
            </div>
        </div>`;
    }
    container.innerHTML = html || '<p class="text-center text-slate-500">Belum ada record mengajar bulan ini.</p>';
}

// 3. MODUL ASISTEN ROBOT (Alur Kas & Potensi)
export async function loadRobotData() {
    // A. Kalkulasi Beban Fee Keluar Bulan ini
    const { data: feeData } = await sb.from('fee_coach').select('*');
    let totalKeluar = 0;
    const bulanIni = new Date().getMonth() + 1;
    const tahunIni = new Date().getFullYear();
    
    feeData?.forEach(f => {
        if(f.tanggal) {
            const t = new Date(f.tanggal);
            if((t.getMonth()+1) === bulanIni && t.getFullYear() === tahunIni) {
                totalKeluar += parseFloat(f.total_fee) || 0;
            }
        }
    });
    const elOutflow = document.getElementById('robot-outflow');
    if(elOutflow) elOutflow.innerText = `Rp ${totalKeluar.toLocaleString('id-ID')}`;

    // B. Kalkulasi Potensi Inflow (Asumsi rata-rata harga paket Rp 450.000 dikali sisa sesi berjalan)
    const { data: muridData } = await sb.from('murid').select('*');
    let potensiOmset = (muridData?.length || 0) * 450000; 
    const elInflow = document.getElementById('robot-inflow');
    if(elInflow) elInflow.innerText = `Rp ${potensiOmset.toLocaleString('id-ID')}`;
    
    // C. Simpan raw data untuk dikunyah otak Robot saat tombol ditekan
    window.dataRobot = {
        totalMurid: muridData?.length || 0,
        merah: muridData?.filter(m => m.sisa_sesi <= 0).length || 0,
        kuning: muridData?.filter(m => m.sisa_sesi > 0 && m.sisa_sesi <= 2).length || 0,
        omset: potensiOmset
    };
}

// FUNGSI ROBOT 1: Template Prompt
export function tanyaRobotTemplate() {
    const prompt = document.getElementById('robot-prompt').value;
    const kotakJawaban = document.getElementById('robot-jawaban');
    if(!kotakJawaban) return;
    
    kotakJawaban.innerHTML = "<em class='text-amber-400'>🤖 Sedang menganalisis jutaan data dari database Supabase...</em>";
    
    setTimeout(() => {
        const d = window.dataRobot || { totalMurid: 0, merah: 0, kuning: 0, omset: 0 };
        if(prompt == "1") {
            kotakJawaban.innerHTML = `<b class="text-sky-400">📊 Program Macro:</b><br>Dengan total <b>${d.totalMurid} murid aktif</b>, jika retensi mencapai target 80%, potensi omset adalah <b>Rp ${((d.omset)*0.8).toLocaleString('id-ID')}</b>.`;
        } else if (prompt == "2") {
            kotakJawaban.innerHTML = `<b class="text-sky-400">👔 Evaluasi KPI Coach:</b><br>Coach bintang memiliki retensi murid tertinggi. Berikan bonus target bulan ini.`;
        } else if (prompt == "3") {
            kotakJawaban.innerHTML = `<b class="text-red-500">🚨 Program Micro:</b><br>Ada <b>${d.merah} murid Merah</b> dan <b>${d.kuning} Kuning</b>. Segera tawarkan diskon perpanjangan hari ini!`;
        }
    }, 1500); 
}

// FUNGSI ROBOT 2: FITUR KONEK KE GEMINI API (FREE ASKING)
export async function tanyaGeminiLangsung() {
    const pertanyaan = document.getElementById('robot-free-prompt').value;
    const kotakJawaban = document.getElementById('robot-jawaban');

    if (!pertanyaan) return alert("Ketik dulu pertanyaannya, Bos!");
    if (!kotakJawaban) return;

    kotakJawaban.innerHTML = "<em class='text-amber-400'>✨ Gemini Flash sedang berpikir...</em>";

    // 🔴 MASUKKAN API KEY GEMINI LU DI SINI 🔴
    const API_KEY = 'AQ.Ab8RN6LB4OOK41aS3zuCK6Fu3Fc1e5vJp1Axvu3Kh2YppcC5zg';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    // Kita pinter-pinteran: Selipin data database ke dalam Prompt secara rahasia biar jawabannya relevan
    const d = window.dataRobot || { totalMurid: 0, omset: 0 };
    const konteksSistem = `Kamu adalah Asisten AI untuk Jago Renang Academy. 
    Data saat ini: ${d.totalMurid} murid aktif, estimasi omset Rp ${d.omset}. 
    Tolong jawab pertanyaan owner ini secara profesional, singkat, dan berikan ide cemerlang: ${pertanyaan}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: konteksSistem }] }]
            })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        // Ambil jawaban dari API
        const textBalasan = data.candidates[0].content.parts[0].text;
        
        // Rapikan format jawaban AI ke HTML
        const htmlBalasan = textBalasan
            .replace(/\*\*(.*?)\*\*/g, '<b class="text-amber-400">$1</b>') // Bold dari Gemini
            .replace(/\*/g, '•') // Bullet point
            .replace(/\n/g, '<br>'); // Enter/Baris baru

        kotakJawaban.innerHTML = `
            <div class="border-b border-slate-600 pb-2 mb-2">
                <b class="text-sky-400">Tanya:</b> <i>"${pertanyaan}"</i>
            </div>
            <b class="text-amber-400">✨ Gemini:</b><br>
            <span class="text-slate-100 text-[13px]">${htmlBalasan}</span>
        `;
        
    } catch (error) {
        console.error(error);
        kotakJawaban.innerHTML = `<b class="text-red-500">Gagal konek ke Gemini:</b> ${error.message}. <br><br>Pastikan API Key sudah benar dan koneksi internet lancar.`;
    }
}

// =========================================================
// FITUR HAK AKSES DEWA (GOD MODE OWNER)
// =========================================================

// 1. Fungsi Pintu Kemana Saja & Tombol Melayang
export function masukRuangDewa(idRuangan) {
    if(typeof window.pindahHalaman === 'function') window.pindahHalaman(idRuangan);
    
    if (idRuangan === 'dashboard-admin' && typeof window.loadPendingPendaftaran === "function") {
        window.loadPendingPendaftaran();
    }
    
    let btnDewa = document.getElementById('btn-dewa-back');
    if (!btnDewa) {
        btnDewa = document.createElement('button');
        btnDewa.id = 'btn-dewa-back';
        btnDewa.innerHTML = '👑 Kembali ke Owner Hub';
        btnDewa.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#fbbf24; color:#0f172a; font-weight:bold; border:2px solid #b45309; padding:12px 20px; border-radius:30px; box-shadow:0 6px 8px rgba(0,0,0,0.4); cursor:pointer; z-index:9999; display:flex; align-items:center; gap:5px; font-size: 14px;';
        
        btnDewa.onclick = function() {
            if(typeof window.pindahHalaman === 'function') window.pindahHalaman('page-owner');
            this.style.display = 'none'; 
        };
        document.body.appendChild(btnDewa);
    }
    btnDewa.style.display = 'flex';
}

// 2. Fungsi Mata Dewa (Tarik Semua Parent Username & Gabung Anak) - VERSI POV ORTU
export async function loadMataDewaDropdown() {
    const select = document.getElementById('dewa-pilih-ortu');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Memuat Data Akun Ortu... --</option>';
    
    const { data, error } = await sb.from('murid')
        .select('parent_username, nama_murid')
        .not('parent_username', 'is', null)
        .neq('parent_username', '');
        
    if (error) return select.innerHTML = '<option value="">Gagal muat data database.</option>';
    
    const mapOrtu = {};
    data.forEach(m => {
        if (!mapOrtu[m.parent_username]) {
            mapOrtu[m.parent_username] = [];
        }
        mapOrtu[m.parent_username].push(m.nama_murid);
    });
    
    let html = '<option value="">-- Pilih Akun Ortu --</option>';
    for (const [userOrtu, listAnak] of Object.entries(mapOrtu)) {
        html += `<option value="${userOrtu}">${userOrtu} (Ortu dari: ${listAnak.join(', ')})</option>`;
    }
    select.innerHTML = html;
}

// 3. Fungsi Simulasi Login (Menyamar Jadi POV Ortu)
export function simulasiLoginOrtu() {
    const targetOrtu = document.getElementById('dewa-pilih-ortu').value;
    if (!targetOrtu) return alert("Pilih akun ortu dulu di dropdown, Bos!");

    // Backup identitas asli Owner
    const userAsli = localStorage.getItem('loggedInUser');
    localStorage.setItem('backupOwnerUser', userAsli);

    // Ganti identitas sementara jadi Ortu
    localStorage.setItem('loggedInUser', targetOrtu);

    // Pindah ke Dashboard Parent
    if(typeof window.pindahHalaman === 'function') window.pindahHalaman('dashboard-parent');
    if (typeof window.initParentDashboard === "function") window.initParentDashboard();

    // Ciptakan tombol melayang penyelamat biar nggak nyangkut
    let btnDewa = document.getElementById('btn-dewa-back');
    if (!btnDewa) {
        btnDewa = document.createElement('button');
        btnDewa.id = 'btn-dewa-back';
        btnDewa.innerHTML = '👑 Kembali ke Wujud Asli (Owner)';
        btnDewa.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#fbbf24; color:#0f172a; font-weight:bold; border:2px solid #b45309; padding:12px 20px; border-radius:30px; box-shadow:0 6px 8px rgba(0,0,0,0.4); cursor:pointer; z-index:9999; display:flex; align-items:center; gap:5px; font-size: 14px;';
        document.body.appendChild(btnDewa);
    }
    
    btnDewa.onclick = function() {
        const wujudAsli = localStorage.getItem('backupOwnerUser');
        localStorage.setItem('loggedInUser', wujudAsli);
        if(typeof window.pindahHalaman === 'function') window.pindahHalaman('page-owner');
        this.style.display = 'none';
    };
    
    btnDewa.style.display = 'flex';
}

// =========================================================
// 🔴 FUNGSI CCTV SISTEM (LOG LOGIN)
// =========================================================
export async function loadLoginLogs() {
    const tbody = document.getElementById('tabel-body-owner-log');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">📡 Mengambil data CCTV...</td></tr>';

    try {
        const { data, error } = await sb.from('login_logs')
            .select('*')
            .order('waktu_login', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-slate-500">Belum ada aktivitas login.</td></tr>';
            return;
        }

        let html = '';
        data.forEach(log => {
            const tgl = new Date(log.waktu_login);
            const wib = tgl.toLocaleString('id-ID', { 
                day: 'numeric', month: 'short', year: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
            }) + ' WIB';

            let badgeWarna = 'bg-slate-500'; 
            if (log.role === 'admin') badgeWarna = 'bg-red-500';
            else if (log.role === 'coach') badgeWarna = 'bg-sky-600';
            else if (log.role === 'parent' || log.role === 'walimurid') badgeWarna = 'bg-emerald-500';
            else if (log.role === 'owner') badgeWarna = 'bg-amber-600';

            html += `
            <tr class="border-b border-slate-100">
                <td class="p-2 text-slate-600">${wib}</td>
                <td class="p-2 font-bold text-slate-800">${log.username}</td>
                <td class="p-2 text-center">
                    <span class="${badgeWarna} text-white px-2 py-1 rounded-full text-[10px] font-bold">${log.role.toUpperCase()}</span>
                </td>
            </tr>`;
        });

        tbody.innerHTML = html;

    } catch (err) {
        console.error("Gagal load log login:", err);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-red-500">Gagal memuat sistem CCTV.</td></tr>';
    }
}

// =========================================================
// 🔴 RUANG PALING RAHASIA (DIRECT DB EDIT)
// =========================================================

export async function loadRahasiaMurid() {
    const tbody = document.getElementById('tabel-rahasia-murid');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">📡 Menyadap Supabase...</td></tr>';
    
    // Panggil tabel users sekalian biar loadingnya bareng
    loadRahasiaUsers(); 
    
    try {
        const { data, error } = await sb.from('murid').select('id_murid, nama_murid, no_wa, parent_username').order('nama_murid', { ascending: true });
        if (error) throw error;

        let html = '';
        data.forEach(m => {
            html += `
            <tr class="border-b border-red-100">
                <td class="p-2 font-bold text-red-900">${m.nama_murid}</td>
                <td class="p-2"><input type="text" id="rm-wa-${m.id_murid}" value="${m.no_wa || ''}" class="w-full p-1 text-[11px] border border-red-200 rounded"></td>
                <td class="p-2"><input type="text" id="rm-user-${m.id_murid}" value="${m.parent_username || ''}" class="w-full p-1 text-[11px] border border-red-200 rounded"></td>
                <td class="p-2 text-center">
                    <button onclick="simpanRahasiaMurid(${m.id_murid})" class="bg-red-500 text-white border-none p-1 rounded font-bold shadow cursor-pointer">💾</button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Gagal: ${err.message}</td></tr>`;
    }
}

export async function simpanRahasiaMurid(idMurid) {
    const wa = document.getElementById(`rm-wa-${idMurid}`).value;
    const user = document.getElementById(`rm-user-${idMurid}`).value;
    
    const btn = window.event.target;
    btn.innerText = "⏳";
    
    try {
        const { error } = await sb.from('murid').update({
            no_wa: wa,
            parent_username: user
        }).eq('id_murid', idMurid);
        
        if (error) throw error;
        btn.innerText = "✅";
        setTimeout(() => btn.innerText = "💾", 2000);
    } catch (err) {
        alert("Gagal simpan: " + err.message);
        btn.innerText = "💾";
    }
}

export async function loadRahasiaUsers() {
    const tbody = document.getElementById('tabel-rahasia-users');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">📡 Menyadap Supabase...</td></tr>';
    
    try {
        const { data, error } = await sb.from('users').select('*').order('role', { ascending: true });
        if (error) throw error;

        let html = '';
        data.forEach(u => {
            const uid = u.id || u.username;
            const idStr = typeof uid === 'string' ? `'${uid}'` : uid; 
            
            let roleStr = Array.isArray(u.role) ? JSON.stringify(u.role) : u.role;

            html += `
            <tr class="border-b border-emerald-100">
                <td class="p-2"><input type="text" value="${u.username}" class="w-full p-1 text-[11px] bg-slate-100 border border-emerald-200 rounded text-slate-500 font-bold" readonly title="Username tidak bisa diedit untuk mencegah error"></td>
                <td class="p-2"><input type="text" id="ru-pass-${uid}" value="${u.password}" class="w-full p-1 text-[11px] border border-emerald-200 rounded"></td>
                <td class="p-2"><input type="text" id="ru-role-${uid}" value='${roleStr}' class="w-full p-1 text-[11px] border border-emerald-200 rounded"></td>
                <td class="p-2 text-center">
                    <button onclick="simpanRahasiaUsers(${idStr})" class="bg-emerald-500 text-white border-none p-1 rounded font-bold shadow cursor-pointer">💾</button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Gagal: ${err.message}</td></tr>`;
    }
}

export async function simpanRahasiaUsers(uid) {
    const pass = document.getElementById(`ru-pass-${uid}`).value;
    const roleStr = document.getElementById(`ru-role-${uid}`).value;
    
    const btn = window.event.target;
    btn.innerText = "⏳";
    
    let parsedRole = roleStr;
    try {
        if (roleStr.startsWith('[')) parsedRole = JSON.parse(roleStr);
    } catch(e) {}
    
    try {
        let query = sb.from('users').update({
            password: pass,
            role: parsedRole
        });
        
        if (typeof uid === 'string') query = query.eq('username', uid);
        else query = query.eq('id', uid);
        
        const { error } = await query;
        
        if (error) throw error;
        btn.innerText = "✅";
        setTimeout(() => btn.innerText = "💾", 2000);
    } catch (err) {
        alert("Gagal simpan: " + err.message);
        btn.innerText = "💾";
    }
}
// =========================================================
// FUNGSI BERSIHKAN CCTV / LOG
// =========================================================
export async function bersihkanLog() {
    // Kasih peringatan dulu biar nggak kepencet ga sengaja
    if (!confirm("🚨 PERINGATAN! Anda yakin ingin menghapus SELURUH riwayat CCTV? Data tidak bisa dikembalikan!")) return;

    const tbody = document.getElementById('tabel-body-owner-log');
    if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">⏳ Sedang membumihanguskan data...</td></tr>';

    try {
        // Trik Supabase: Untuk hapus semua isi tabel, kita filter "waktu_login yang tidak null" (berlaku untuk semua data)
        const { error } = await sb.from('login_logs')
                                  .delete()
                                  .not('waktu_login', 'is', null);
        
        if (error) throw error;
        
        alert("✅ Riwayat CCTV berhasil dibersihkan tanpa sisa!");
        loadLoginLogs(); // Otomatis refresh tabel biar langsung kelihatan kosong
    } catch (err) {
        console.error("Gagal bersihkan log:", err);
        alert("Gagal membersihkan log: " + err.message);
        loadLoginLogs(); // Refresh untuk balikin data kalau ternyata gagal
    }
}

// ==========================================
// DAFTARKAN SEMUA KE GLOBAL WINDOW
// ==========================================
window.loadSiswaOwner = loadSiswaOwner;
window.loadCoachKPI = loadCoachKPI;
window.loadRobotData = loadRobotData;
window.tanyaRobotTemplate = tanyaRobotTemplate;
window.tanyaGeminiLangsung = tanyaGeminiLangsung;
window.masukRuangDewa = masukRuangDewa;
window.loadMataDewaDropdown = loadMataDewaDropdown;
window.simulasiLoginOrtu = simulasiLoginOrtu;
window.loadLoginLogs = loadLoginLogs;
window.loadRahasiaMurid = loadRahasiaMurid;
window.simpanRahasiaMurid = simpanRahasiaMurid;
window.loadRahasiaUsers = loadRahasiaUsers;
window.simpanRahasiaUsers = simpanRahasiaUsers;
window.bersihkanLog = bersihkanLog;
