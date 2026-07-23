import { sb } from './config.js';

// =========================================================
// SCRIPT ADMIN (GOD MODE & MASTER DATA CREATOR)
// =========================================================

/* =========================================================
   1. CREATE AKUN COACH
========================================================= */
export async function buatAkunCoach() {
    const nama = document.getElementById('form-coach-nama').value.trim();
    const wa = document.getElementById('form-coach-wa').value.trim();
    const spesialisasi = document.getElementById('form-coach-spesialisasi').value;
    const user = document.getElementById('form-coach-user').value.trim();
    const pass = document.getElementById('form-coach-pass').value.trim();

    if (!nama || !user || !pass) return alert("Mohon lengkapi Nama Coach, Username, dan Password!");
    if (!confirm(`Yakin ingin meregistrasi Coach ${nama} dan membuat akses login?`)) return;

    const btn = document.querySelector('button[onclick="buatAkunCoach()"]');
    if(btn) btn.innerText = "⏳ Memproses...";

    try {
        // 1. Simpan di tabel users (untuk login)
        const { error: errUser } = await sb.from('users').insert([{
            username: user,
            password: pass,
            role: ['coach'],
            call_name: nama.split(' ')[0] // Nama panggilan otomatis ambil kata pertama
        }]);

        if (errUser) {
            if (errUser.code === '23505') alert("Gagal: Username tersebut sudah digunakan.");
            else throw errUser;
            return;
        }

        // 2. Simpan di tabel master coach (untuk data absensi & fee)
        const { error: errCoach } = await sb.from('coach').insert([{
            nama_coach: nama,
            username: user,
            no_wa: wa,
            spesialisasi: spesialisasi
        }]);

        if (errCoach) throw errCoach;

        alert("✅ Berhasil! Master data Coach dan Akun login telah dibuat.");
        
        // Reset Form
        document.getElementById('form-coach-nama').value = "";
        document.getElementById('form-coach-wa').value = "";
        document.getElementById('form-coach-user').value = "";
        document.getElementById('form-coach-pass').value = "";
        
        // Refresh dropdown jika ada
        if (typeof initDropdownCoach === "function") initDropdownCoach();

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan sistem saat membuat akun coach.");
    } finally {
        if(btn) btn.innerText = "💾 Simpan Coach & Buat Akun";
    }
}

/* =========================================================
   2. CREATE AKUN WALI MURID
========================================================= */
export async function buatAkunWali() {
    const idMurid = document.getElementById('form-wali-murid').value;
    const user = document.getElementById('form-wali-user').value.trim();
    const pass = document.getElementById('form-wali-pass').value.trim();

    if (!idMurid || !user || !pass) return alert("Pilih Murid, isi Username, dan Password!");

    try {
        // 1. Buat akun di tabel users
        const { error: errUser } = await sb.from('users').insert([{ 
            username: user, 
            password: pass, 
            role: ['parent'] 
        }]);
        
        if (errUser) {
            if (errUser.code === '23505') return alert("Username sudah dipakai orang lain!");
            throw errUser;
        }

        // 2. Tautkan username wali ke data murid
        const { error: errMurid } = await sb.from('murid').update({ parent_username: user }).eq('id_murid', idMurid);
        if (errMurid) throw errMurid;

        alert("✅ Akun Wali Murid berhasil dibuat dan otomatis terhubung dengan data Anak!");
        document.getElementById('form-wali-user').value = '';
        document.getElementById('form-wali-pass').value = '';
    } catch (err) {
        alert("Gagal membuat akun wali: " + err.message);
    }
}

/* =========================================================
   3. CREATE AKUN ADMIN (VIA PROMPT)
========================================================= */
export async function buatAkunAdmin() {
    // Karena ini rahasia, kita tembak lewat prompt popup aja biar ga menuhin form HTML
    const user = prompt("🛡️ BIKIN AKUN ADMIN BARU\n\nMasukkan Username Admin Baru:");
    if(!user) return;
    const pass = prompt("Masukkan Password Login:");
    if(!pass) return;
    const nama = prompt("Masukkan Nama Panggilan (Biar keren di Header):");

    try {
        const { error } = await sb.from('users').insert([{ 
            username: user, 
            password: pass, 
            role: ['admin'], 
            call_name: nama || 'Admin Master',
            role_label: 'Admin System & Marketing'
        }]);
        if (error) throw error;
        
        alert(`✅ SAKTI! Akun Admin [${user}] berhasil diaktifkan ke sistem!`);
    } catch (err) {
        alert("Gagal membuat admin: " + err.message);
    }
}

/* =========================================================
   4. MASTER DATA: INPUT SISWA BARU
========================================================= */
export function autoHitungExpiredSiswa() {
    const tglSesi1 = document.getElementById('sis-sesi-1').value;
    const expEl = document.getElementById('sis-expired');
    
    if(!tglSesi1) return;
    
    // Logika Default: Expired adalah 1 bulan dari sesi pertama
    let date = new Date(tglSesi1);
    date.setMonth(date.getMonth() + 1);
    expEl.value = date.toISOString().split('T')[0];
}

export async function simpanSiswa() {
    const id = document.getElementById('sis-edit-id').value;
    const nama = document.getElementById('sis-nama').value;
    const panggilan = document.getElementById('sis-panggilan').value;
    const wa = document.getElementById('sis-wa').value;
    const tglLahir = document.getElementById('sis-tgl-lahir').value;
    const status = document.getElementById('sis-status').value;
    const paket = document.getElementById('sis-paket').value;
    const sesi = document.getElementById('sis-sesi').value;
    const exp = document.getElementById('sis-expired').value;

    if(!nama) return alert("Nama lengkap wajib diisi ya Bos!");

    const payload = {
        nama_murid: nama,
        nama_panggilan: panggilan,
        no_wa: wa,
        tanggal_lahir: tglLahir,
        status_aktif: status,
        jenis_paket: paket,
        sisa_sesi: parseInt(sesi) || 0,
        expired_sesi: exp
    };

    const btn = document.getElementById('btn-simpan-siswa');
    if(btn) btn.innerText = "⏳ Menyimpan...";

    try {
        if(id) {
            await sb.from('murid').update(payload).eq('id_murid', id);
            alert("✅ Data siswa berhasil diupdate!");
        } else {
            await sb.from('murid').insert([payload]);
            alert("✅ Jagoan (Siswa) baru berhasil ditambahkan!");
        }
        
        // Clear form
        document.getElementById('sis-edit-id').value = '';
        document.getElementById('sis-nama').value = '';
        document.getElementById('sis-panggilan').value = '';
        document.getElementById('sis-wa').value = '';
        document.getElementById('sis-tgl-lahir').value = '';
        document.getElementById('sis-paket').value = '';
        document.getElementById('sis-sesi').value = '';
        document.getElementById('sis-expired').value = '';
        document.getElementById('sis-sesi-1').value = '';

        // Reload data UI
        if(typeof window.loadSiswaAdmin === "function") window.loadSiswaAdmin();
        loadDropdownMuridMaster(); // Refresh list wali & prestasi
    } catch(err) {
        alert("Gagal simpan data siswa: " + err.message);
    } finally {
        if(btn) btn.innerText = "⚡ Simpan Siswa";
    }
}

// Helper untuk ngisi dropdown Wali & Prestasi setelah input siswa
export async function loadDropdownMuridMaster() {
    const dpWali = document.getElementById('form-wali-murid');
    const dpPrestasi = document.getElementById('prestasi-murid');
    if(!dpWali && !dpPrestasi) return;

    const { data } = await sb.from('murid').select('id_murid, nama_murid').order('nama_murid', { ascending: true });
    
    let opt = '<option value="">Pilih Murid...</option>';
    data?.forEach(m => {
        opt += `<option value="${m.id_murid}">${m.nama_murid}</option>`;
    });
    
    if(dpWali) dpWali.innerHTML = opt;
    if(dpPrestasi) dpPrestasi.innerHTML = opt;
}

/* =========================================================
   5. MASTER DATA: INPUT PRESTASI SISWA
========================================================= */
export async function simpanPrestasiAdmin() {
    const idMurid = document.getElementById('prestasi-murid').value;
    const event = document.getElementById('prestasi-event').value;
    const pencapaian = document.getElementById('prestasi-pencapaian').value;
    const tanggal = document.getElementById('prestasi-tanggal').value;

    if(!idMurid || !event || !pencapaian || !tanggal) return alert("Lengkapi semua form prestasi!");

    try {
        const { error } = await sb.from('prestasi').insert([{
            murid_id: idMurid,
            nama_event: event,
            pencapaian: pencapaian,
            tanggal: tanggal
        }]);
        if(error) throw error;
        
        alert("🏆 Prestasi berhasil ditambahkan ke Rapor Siswa!");
        document.getElementById('prestasi-event').value = '';
        document.getElementById('prestasi-pencapaian').value = '';
    } catch(e) {
        alert("Gagal menyimpan prestasi: " + e.message);
    }
}

/* =========================================================
   6. INVOICE MANUAL (UNTUK ORTU GAPTEK)
========================================================= */
export async function createInvoiceManual() {
    const nama = prompt("📝 BUAT TAGIHAN MANUAL\n\nMasukkan Nama Customer/Murid:");
    if(!nama) return;
    const paket = prompt("Masukkan Nama Paket/Program (Cth: Beginner 4 Sesi):");
    if(!paket) return;
    const nominal = prompt("Masukkan Nominal Tagihan (Angka Saja, cth: 350000):");
    if(!nominal) return;
    const wa = prompt("Masukkan No WhatsApp Ortu (Cth: 08123...):");

    const noInv = "INV/JR/M" + Math.floor(1000 + Math.random() * 9000);
    const currentUser = localStorage.getItem('loggedInUser') || 'Admin Master';

    try {
        const { error } = await sb.from('invoices').insert([{
            nomor_invoice: noInv,
            nama_murid: nama,
            paket: paket,
            biaya: parseInt(nominal),
            status: 'Unpaid',
            admin_id: currentUser,
            no_wa: wa || ''
        }]);
        if(error) throw error;
        
        const konfirm = confirm(`✅ Invoice Manual ${noInv} berhasil dibuat!\n\nApakah kamu mau langsung mengirimkan link/teks tagihannya via WhatsApp sekarang?`);
        
        // Refresh tabel Invoice di Admin kalau ada
        if (typeof window.loadPendingInvoiceAdmin2 === 'function') window.loadPendingInvoiceAdmin2();
        if (typeof window.loadInvoiceHistory === 'function') window.loadInvoiceHistory();
        
        // Lempar ke WA kalau di YES
        if(konfirm) {
            const pesanWA = `Halo Bunda dari *${nama}* 👋%0A%0ABerikut adalah tagihan manual untuk program Jago Renang Academy:%0A%0A🧾 *No. Invoice:* ${noInv}%0A📦 *Program:* ${paket}%0A💰 *Total Tagihan:* Rp ${parseInt(nominal).toLocaleString('id-ID')}%0A%0ASilakan lakukan transfer dan kirim bukti pembayarannya ke pesan ini ya Bun. Terima kasih! 🏊‍♂️`;
            window.open(`https://wa.me/62${(wa||'').replace(/^0/,'')}?text=${pesanWA}`, '_blank');
        }
    } catch(e) {
        alert("Gagal membuat invoice manual: " + e.message);
    }
}

// =========================================================
// REGISTER TO WINDOW
// =========================================================
window.buatAkunCoach = buatAkunCoach;
window.buatAkunWali = buatAkunWali;
window.buatAkunAdmin = buatAkunAdmin; // Tinggal dipanggil lewat console/button custom
window.simpanSiswa = simpanSiswa;
window.autoHitungExpiredSiswa = autoHitungExpiredSiswa;
window.loadDropdownMuridMaster = loadDropdownMuridMaster;
window.simpanPrestasiAdmin = simpanPrestasiAdmin;
window.createInvoiceManual = createInvoiceManual;
