import { sb } from './config.js';

// =========================================================
// SCRIPT DASHBOARD WALIMURID (PARENTS HUB)
// =========================================================

let listAnakParent = [];
let idAnakAktif = null;

// ---------------------------------------------------
// INISIALISASI & PILIH ANAK
// ---------------------------------------------------
export async function initParentDashboard() {
    const parentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
    document.getElementById('parent-main-menu').style.display = 'none';
    document.getElementById('parent-area-sertifikat').innerHTML = ''; 
    
    try {
        const { data, error } = await sb.from('murid')
            .select('*')
            .eq('parent_username', parentUser);

        if (error) throw error;

        listAnakParent = data || [];
        const dropdown = document.getElementById('parent-pilih-anak');
        if(!dropdown) return;
        
        dropdown.innerHTML = '<option value="">-- Pilih Jagoan Anda --</option>';

        if (listAnakParent.length === 0) {
            dropdown.innerHTML = '<option value="">Anak belum terdaftar. Hubungi Admin.</option>';
            return;
        }

        listAnakParent.forEach(anak => {
            dropdown.innerHTML += `<option value="${anak.id_murid}">${anak.nama_murid}</option>`;
        });

    } catch (err) {
        console.error(err);
        alert("Gagal memuat data anak. Coba muat ulang halaman.");
    }
}

export function gantiAnakAktif() {
    const val = document.getElementById('parent-pilih-anak').value;
    if (!val) {
        document.getElementById('parent-main-menu').style.display = 'none';
        document.getElementById('parent-area-sertifikat').innerHTML = ''; 
        idAnakAktif = null;
        return;
    }
    
    idAnakAktif = parseInt(val); 
    document.getElementById('parent-main-menu').style.display = 'block';
    
    if (typeof cekSertifikatLevel1 === "function") cekSertifikatLevel1();
}

// ---------------------------------------------------
// 1. DATA PERENANG & UPLOAD DOKUMEN
// ---------------------------------------------------
export async function loadProfilAnak() {
    const anak = listAnakParent.find(x => x.id_murid === idAnakAktif);
    if (!anak) return;

    document.getElementById('parent-nama-anak').innerText = anak.nama_murid;
    document.getElementById('parent-info-paket').innerText = `Paket: ${anak.jenis_paket || '-'} | Sisa Sesi: ${anak.sisa_sesi || 0}`;
    document.getElementById('parent-view-foto').src = anak.foto_profil || 'images/default-avatar.png';
    
    const statusAkta = document.getElementById('parent-status-akta');
    if (anak.akta_lahir) {
        statusAkta.innerText = "Status Akta: Tersedia (Sudah Terupload)";
        statusAkta.style.color = "#16a34a"; 
    } else {
        statusAkta.innerText = "Status Akta: Belum Tersedia (Mohon Upload)";
        statusAkta.style.color = "#ef4444"; 
    }
}

export async function simpanProfilAnak() {
    if (!idAnakAktif) return alert("Pilih anak terlebih dahulu!");
    
    const fileFoto = document.getElementById('parent-upload-foto').files[0];
    const fileAkta = document.getElementById('parent-upload-akta').files[0];
    
    let urlFoto = null;
    let urlAkta = null;

    try {
        if (fileFoto) {
            const ext = fileFoto.name.split('.').pop();
            const path = `foto_${idAnakAktif}_${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('parent-files').upload(path, fileFoto);
            if (upErr) throw upErr;
            urlFoto = sb.storage.from('parent-files').getPublicUrl(path).data.publicUrl;
        }

        if (fileAkta) {
            const ext = fileAkta.name.split('.').pop();
            const path = `akta_${idAnakAktif}_${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('parent-files').upload(path, fileAkta);
            if (upErr) throw upErr;
            urlAkta = sb.storage.from('parent-files').getPublicUrl(path).data.publicUrl;
        }

        const updateData = {};
        if (urlFoto) updateData.foto_profil = urlFoto;
        if (urlAkta) updateData.akta_lahir = urlAkta;

        if (Object.keys(updateData).length > 0) {
            const { error: dbErr } = await sb.from('murid')
                .update(updateData)
                .eq('id_murid', idAnakAktif); 

            if (dbErr) throw dbErr;
            alert("Data dan dokumen jagoan berhasil diperbarui!");
            await initParentDashboard(); 
            loadProfilAnak(); 
        } else {
            alert("Tidak ada file baru yang dipilih.");
        }

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan sistem saat mengunggah berkas. Pastikan ukuran file tidak terlalu besar.");
    }
}

// ---------------------------------------------------
// 2. ASSESSMENT & PROGRESS REPORT
// ---------------------------------------------------
export async function loadAssessmentAnak() {
    const container = document.getElementById('parent-assessment-score');
    const catatanBox = document.getElementById('parent-assessment-catatan');
    if(!container || !catatanBox) return;

    container.innerHTML = "Memuat data...";
    
    try {
        const { data, error } = await sb.from('assessment_log')
            .select('*')
            .eq('id_murid', idAnakAktif)
            .order('id_assessment', { ascending: false }) 
            .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = "<p style='grid-column: span 2; color:#64748b;'>Belum ada rekapan nilai dari pelatih.</p>";
            catatanBox.innerText = "Belum ada catatan.";
            return;
        }

        const ass = data[0];
        
        container.innerHTML = `
            <div>🟢 Floating: ${ass.floating_streamline ?? 0}%</div>
            <div>🔵 Breathing: ${ass.breathing_control ?? 0}%</div>
            <div>🟢 Free Kicking: ${ass.freestyle_kicking ?? 0}%</div>
            <div>🔵 Free Stroke: ${ass.freestyle_stroke ?? 0}%</div>
            <div>🟢 Breaststroke: ${ass.breaststroke ?? 0}%</div>
            <div>🔵 Backstroke: ${ass.backstroke ?? 0}%</div>
            <div>🟢 Butterfly: ${ass.butterfly_stroke ?? 0}%</div>
        `;
        
        catatanBox.innerText = ass.catatan_coach || "Tidak ada catatan khusus dari pelatih.";

    } catch (err) {
        console.error(err);
        container.innerHTML = "Gagal memuat data assessment.";
    }
}

// ---------------------------------------------------
// 3. PRESTASI & MEDALI SISWA
// ---------------------------------------------------
export async function loadPrestasiAnak() {
    const container = document.getElementById('parent-prestasi-list');
    if(!container) return;
    container.innerHTML = "Memuat data prestasi...";

    try {
        const { data, error } = await sb.from('prestasi')
            .select('*')
            .eq('murid_id', idAnakAktif)
            .order('tanggal', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = "<p style='color:#64748b; margin:0;'>Belum ada rekam prestasi kompetisi resmi yang tercatat.</p>";
            return;
        }

        container.innerHTML = "";
        data.forEach(item => {
            container.innerHTML += `
                <div style="background:#f1f5f9; padding:10px; border-radius:8px; margin-bottom:8px; border-left:4px solid #f59e0b;">
                    <strong style="color:#b45309;">🏅 ${item.pencapaian}</strong><br>
                    <span style="font-size:13px; font-weight:bold;">🏆 Event: ${item.nama_event}</span><br>
                    <small style="color:#64748b;">📅 Tanggal: ${item.tanggal}</small>
                </div>
            `;
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "Gagal memuat riwayat prestasi.";
    }
}

// ---------------------------------------------------
// 4. SCHEDULE EVENT & LOMBA
// ---------------------------------------------------
export async function loadEventAnak() {
    const container = document.getElementById('parent-event-list');
    if(!container) return;
    container.innerHTML = "Memuat info event terdekat...";

    try {
        const { data, error } = await sb.from('events')
            .select('*')
            .order('tanggal', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = "<p style='color:#64748b; margin:0;'>Belum ada agenda event/lomba terdekat.</p>";
            return;
        }

        container.innerHTML = "";
        data.forEach(ev => {
            container.innerHTML += `
                <div style="background:#f0fdfa; padding:12px; border-radius:8px; margin-bottom:8px; border-left:4px solid #0d9488;">
                    <strong style="color:#0d9488; font-size:15px;">🔥 ${ev.nama_event}</strong><br>
                    <span style="font-size:12px; color:#334155;">📍 Lokasi: ${ev.lokasi || '-'}</span><br>
                    <span style="font-size:12px; color:#334155; display:block;">📅 Tanggal Pelaksanaan: <b>${ev.tanggal}</b></span>
                </div>
            `;
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "Gagal memuat jadwal event.";
    }
}

// ---------------------------------------------------
// 5. MODAL PENDAFTARAN ONLINE (NON-MEMBER)
// ---------------------------------------------------
export function bukaModalDaftarBeginner() {
    const modal = document.getElementById('modal-daftar-beginner');
    if(modal) modal.style.display = 'flex';
}

export function tutupModalDaftarBeginner() {
    const modal = document.getElementById('modal-daftar-beginner');
    if(modal) modal.style.display = 'none';
}

export async function submitPendaftaranOnline() {
    const nama = document.getElementById('reg-nama').value.trim();
    const tglLahir = document.getElementById('reg-tgl-lahir').value;
    const wa = document.getElementById('reg-wa').value.trim();
    const user = document.getElementById('reg-user').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();

    if (!nama || !tglLahir || !wa || !user || !pass) {
        return alert("Mohon lengkapi semua data formulir pendaftaran ya, Bunda!");
    }

    const btn = document.getElementById('btn-submit-daftar');
    if(btn) { btn.innerHTML = "⏳ Memproses..."; btn.disabled = true; }

    try {
        const { data: cekUser } = await sb.from('users').select('username').eq('username', user).maybeSingle();
        if (cekUser) {
            if(btn) { btn.innerHTML = "🚀 Daftar Sekarang"; btn.disabled = false; }
            return alert("Gagal: Username tersebut sudah terdaftar di sistem. Silakan pakai username lain!");
        }

        const { error } = await sb.from('pendaftaran_pending').insert([{
            nama: nama,
            tanggal_lahir: tglLahir,
            no_wa: wa,
            username: user,
            password: pass,
            status: 'Menunggu Invoice'
        }]);

        if (error) throw error;

        alert(`Selamat! Pendaftaran Ananda ${nama} berhasil dikirim ke Admin.\n\nMohon tunggu, Admin JR Academy akan segera menerbitkan tagihan invoice resmi via WhatsApp ke nomor ${wa}.`);
        
        document.getElementById('reg-nama').value = "";
        document.getElementById('reg-tgl-lahir').value = "";
        document.getElementById('reg-wa').value = "";
        document.getElementById('reg-user').value = "";
        document.getElementById('reg-pass').value = "";
        tutupModalDaftarBeginner();

    } catch (err) {
        console.error(err);
        alert("Terjadi gangguan jaringan saat mendaftar: " + err.message);
    } finally {
        if(btn) { btn.innerHTML = "🚀 Daftar Sekarang"; btn.disabled = false; }
    }
}

// ---------------------------------------------------
// 6. UI BADGE SISA SESI & TANGGAL EXPIRED
// ---------------------------------------------------
export async function cekSisaSesi() {
    const dropdown = document.getElementById('parent-pilih-anak'); 
    if(!dropdown) return;
    const idMurid = dropdown.value;
    const badgeBox = document.getElementById('badge-sisa-sesi');
    if(!badgeBox) return;

    if (!idMurid) {
        badgeBox.style.display = 'none';
        return;
    }

    try {
        const { data, error } = await sb.from('murid')
            .select('sisa_sesi, expired_sesi')
            .eq('id_murid', idMurid)
            .single();

        if (error) throw error;

        badgeBox.style.display = 'block';
        
        let colorAngka = "";
        if (data.sisa_sesi <= 1) {
            badgeBox.style.background = '#fee2e2';
            badgeBox.style.borderColor = '#fca5a5';
            badgeBox.style.color = '#b91c1c';
            colorAngka = '#991b1b';
        } else {
            badgeBox.style.background = '#e0f2fe';
            badgeBox.style.borderColor = '#bae6fd';
            badgeBox.style.color = '#0284c7';
            colorAngka = '#0369a1';
        }

        let expText = data.expired_sesi 
            ? `Berlaku s/d: ${data.expired_sesi.split('-').reverse().join('/')}` 
            : 'Belum di-set (Hubungi Admin)';

        badgeBox.innerHTML = `
            <div style="font-size: 13px; margin-bottom: 5px;">
                🏊‍♂️ Sisa Sesi: <span id="angka-sisa-sesi" style="font-size: 18px; color: ${colorAngka}; font-weight: 900;">${data.sisa_sesi || 0}</span> Pertemuan
            </div>
            <div style="font-size: 11px; padding: 4px; background: #fff; border-radius: 4px; border: 1px dashed #fca5a5; color: #ef4444; font-weight: bold; display: inline-block;">
                ⏳ ${expText}
            </div>
        `;

    } catch (err) {
        console.error("Gagal cek sisa sesi:", err);
    }
}

// ---------------------------------------------------
// 7. FITUR SERTIFIKAT KELULUSAN (AUTO-GENERATE)
// ---------------------------------------------------
export async function cekSertifikatLevel1() {
    const dropdown = document.getElementById('parent-pilih-anak');
    if (!dropdown) return;
    const idMurid = dropdown.value;
    const areaSertifikat = document.getElementById('parent-area-sertifikat');
    
    if (!idMurid || !areaSertifikat) return;

    const { data, error } = await sb.from('murid').select('nama_murid, lulus_level_1').eq('id_murid', idMurid).single();
    
    if (error || !data) return;

    if (data.lulus_level_1 === true) {
        areaSertifikat.innerHTML = `
        <button onclick="generateSertifikatDummy('${data.nama_murid}')" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
            <span style="font-size: 14px;">🎓 Kelulusan: Level 1 Basic</span>
            <span style="font-size: 12px; background: #fff; color: #059669; padding: 4px 10px; border-radius: 12px; font-weight: 900;">⬇️ UNDUH</span>
        </button>
        <p style="font-size:10px; color:#10b981; margin-top:5px; text-align:center;">Klik tombol di atas untuk mencetak sertifikat digital.</p>
        `;
    } else {
        areaSertifikat.innerHTML = `
        <button onclick="alert('Jagoan belum lulus Level 1. Terus semangat berlatih bersama Coach ya!')" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; border: 1px solid #fbbf24; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <span style="font-size: 14px;">🎓 Kelulusan: Level 1 Basic</span>
            <span style="font-size: 12px; background: #fffbeb; padding: 4px 8px; border-radius: 12px; color: #b45309; border: 1px solid #fcd34d;">🔒 Locked</span>
        </button>
        `;
    }
}

export function generateSertifikatDummy(namaAnak) {
    alert("⏳ Sedang mencetak sertifikat emas... Mohon tunggu sebentar.");

    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 1333; 
    const ctx = canvas.getContext('2d');

    const templateImg = new Image();
    templateImg.src = 'images/lulus1.png'; 

    templateImg.onload = () => {
        ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

        const namaCantik = namaAnak.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFF0'; 
        ctx.font = '95px "Great Vibes", cursive'; 
        
        ctx.fillText(namaCantik, canvas.width / 2, 695); 

        const today = new Date();
        const tgl = today.getDate();
        const bulan = today.toLocaleString('id-ID', { month: 'long' });
        const tglTeks = `${tgl} ${bulan}`;

        ctx.textAlign = 'center';
        ctx.fillStyle = '#f8fafc'; 
        ctx.font = '35px "Segoe UI", Arial, sans-serif'; 
        
        ctx.fillText(tglTeks, 1650, 1060); 

        const link = document.createElement('a');
        link.download = `Sertifikat_Level1_${namaAnak.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    templateImg.onerror = () => {
        alert("🚨 Gagal memuat background! Pastikan gambar 'lulus1.png' ada di folder images.");
    };
}

// REGISTER TO WINDOW
window.initParentDashboard = initParentDashboard;
window.gantiAnakAktif = gantiAnakAktif;
window.loadProfilAnak = loadProfilAnak;
window.simpanProfilAnak = simpanProfilAnak;
window.loadAssessmentAnak = loadAssessmentAnak;
window.loadPrestasiAnak = loadPrestasiAnak;
window.loadEventAnak = loadEventAnak;
window.bukaModalDaftarBeginner = bukaModalDaftarBeginner;
window.tutupModalDaftarBeginner = tutupModalDaftarBeginner;
window.submitPendaftaranOnline = submitPendaftaranOnline;
window.cekSisaSesi = cekSisaSesi;
window.cekSertifikatLevel1 = cekSertifikatLevel1;
window.generateSertifikatDummy = generateSertifikatDummy;
