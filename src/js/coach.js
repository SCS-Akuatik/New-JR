/* =========================================================
   FITUR CREATE MASTER & AKUN COACH (ADMIN)
========================================================= */
async function buatAkunCoach() {
    const nama = document.getElementById('form-coach-nama').value.trim();
    const wa = document.getElementById('form-coach-wa').value.trim();
    const spesialisasi = document.getElementById('form-coach-spesialisasi').value;
    const user = document.getElementById('form-coach-user').value.trim();
    const pass = document.getElementById('form-coach-pass').value.trim();

    if (!nama || !user || !pass) {
        return alert("Mohon lengkapi Nama Coach, Username, dan Password!");
    }

    if (!confirm(`Yakin ingin meregistrasi Coach ${nama} dan membuat akses login?`)) return;

    try {
        const { error: errUser } = await sb.from('users').insert([{
            username: user,
            password: pass,
            role: ['coach']
        }]);

        if (errUser) {
            if (errUser.code === '23505') alert("Gagal: Username tersebut sudah digunakan.");
            else throw errUser;
            return;
        }

        const { error: errCoach } = await sb.from('coach').insert([{
            nama_coach: nama,
            username: user,
            no_wa: wa,
            spesialisasi: spesialisasi
        }]);

        if (errCoach) throw errCoach;

        alert("Berhasil! Master data Coach dan Akun login telah dibuat.");
        
        document.getElementById('form-coach-nama').value = "";
        document.getElementById('form-coach-wa').value = "";
        document.getElementById('form-coach-user').value = "";
        document.getElementById('form-coach-pass').value = "";
        
        if (typeof initDropdownCoach === "function") initDropdownCoach();

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan sistem saat membuat akun coach.");
    }
}

/* =========================================================
   BAGIAN ADMIN JADWAL PENUGASAN COACH
========================================================= */

// Tarik data murid ke dropdown
async function loadDropdownMuridCoach() {
    const dropdown = document.getElementById('coach-murid');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Memuat Murid...</option>';

    // 🔴 UPDATE: Menarik data nama_panggilan
    const { data, error } = await sb.from('murid')
        .select('id_murid, nama_murid, nama_panggilan, sisa_sesi')
        .gt('sisa_sesi', 0)
        .order('nama_murid', { ascending: true });
    
    if (error) {
        dropdown.innerHTML = '<option value="">Gagal muat data</option>';
        return console.error(error);
    }

    dropdown.innerHTML = '<option value="">-- Pilih Murid Aktif --</option>';
    data.forEach(m => {
        // 🔴 LOGIKA CALLNAME
        const namaTampil = m.nama_panggilan ? m.nama_panggilan : m.nama_murid;
        
        dropdown.innerHTML += `<option value="${m.id_murid}" data-nama="${namaTampil}">${namaTampil} (Sisa: ${m.sisa_sesi})</option>`;
    });
}


// Keranjang Murid
function tambahMuridKeListCoach() {
    const dropdown = document.getElementById('coach-murid');
    const idMurid = dropdown.value;
    const namaMurid = dropdown.options[dropdown.selectedIndex]?.getAttribute('data-nama');

    if (!idMurid) return alert("Pilih muridnya dulu, Bos!");

    const inputNama = document.getElementById('coach-list-nama');
    const inputId = document.getElementById('coach-list-id');

    if (inputNama.value === "") {
        inputNama.value = namaMurid;
        inputId.value = idMurid;
    } else {
        if (inputNama.value.includes(namaMurid)) return alert("Murid ini udah masuk di list!");
        inputNama.value += ", " + namaMurid;
        inputId.value += "," + idMurid;
    }
    dropdown.value = "";
}

function resetListCoach() {
    document.getElementById('coach-list-nama').value = "";
    document.getElementById('coach-list-id').value = "";
}

// Simpan Jadwal (TANPA potong sesi langsung, dipotong saat assessment)
async function simpanJadwalCoach() {
    const id = document.getElementById('coach-edit-id').value;
    const listNama = document.getElementById('coach-list-nama').value; 

    const dataObj = {
        nama_coach: document.getElementById('coach-nama').value,
        hari: document.getElementById('coach-hari').value,
        lokasi: document.getElementById('coach-lokasi').value,
        jam: document.getElementById('coach-jam').value,
        tipe_class: document.getElementById('coach-tipe').value,
        nama_murid: listNama 
    };

    if (!dataObj.nama_coach || !dataObj.lokasi || !listNama) {
        return alert("Pilih Coach, Isi Lokasi, & Masukkan minimal 1 Murid ke list!");
    }

    document.getElementById('btn-coach').innerHTML = "⏳ Memproses...";

    if (id) { 
        const { error } = await sb.from('jadwal_coach').update(dataObj).eq('id', id);
        if (error) {
            document.getElementById('btn-coach').innerHTML = "⚡ Simpan Penugasan";
            return alert("Gagal update: " + error.message);
        }
        alert("Data jadwal berhasil diupdate!");
    } else { 
        const { error } = await sb.from('jadwal_coach').insert([dataObj]);
        if (error) {
            document.getElementById('btn-coach').innerHTML = "⚡ Simpan Penugasan";
            return alert("Gagal simpan: " + error.message);
        }
        alert("Jadwal sukses dibuat! (Sesi murid aman, baru akan dipotong oleh Coach setelah kelas selesai)");
    }

    document.getElementById('coach-edit-id').value = '';
    document.getElementById('btn-coach').innerHTML = "⚡ Simpan Penugasan";
    document.getElementById('coach-lokasi').value = '';
    document.getElementById('coach-jam').value = '';
    resetListCoach(); 
    document.getElementById('coach-murid').value = '';
    
    loadCoachAdmin();
    loadDropdownMuridCoach(); 
}

function editJadwalCoach(id, nama, hari, lokasi, jam, tipe, murid) {
    document.getElementById('coach-edit-id').value = id;
    document.getElementById('coach-nama').value = nama;
    document.getElementById('coach-hari').value = hari;
    document.getElementById('coach-lokasi').value = lokasi;
    document.getElementById('coach-jam').value = jam;
    document.getElementById('coach-tipe').value = tipe;
    
    document.getElementById('coach-list-nama').value = murid;
    document.getElementById('coach-list-id').value = ""; 
    
    document.getElementById('btn-coach').innerText = "💾 Update Jadwal";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadCoachAdmin() {
    const list = document.getElementById('admin-coach-list');
    list.innerHTML = '<p style="text-align:center;">Memuat data...</p>';
    
    if (document.getElementById('coach-murid') && document.getElementById('coach-murid').options.length <= 1) {
        loadDropdownMuridCoach();
    }
    
    try {
        const { data, error } = await sb.from('jadwal_coach').select('*').order('id', { ascending: true });
        if (error) throw error;
        let html = '';
        data.forEach(c => {
            html += `<div class="list-item-admin">
                <div style="flex-grow: 1;"><strong>${c.nama_coach}</strong> (${c.hari})<br>📍 ${c.lokasi} | ⏰ ${c.jam}<br>👤 ${c.nama_murid} (${c.tipe_class})</div>
                <div style="display:flex; gap:6px;"><button class="btn-warning" onclick="editJadwalCoach(${c.id}, '${c.nama_coach}', '${c.hari}', '${c.lokasi}', '${c.jam}', '${c.tipe_class}', '${c.nama_murid}')">✏️</button><button class="btn-danger" onclick="hapusData('jadwal_coach', ${c.id}, loadCoachAdmin)">❌</button></div>
            </div>`;
        });
        list.innerHTML = html;
    } catch (err) { list.innerHTML = 'Gagal memuat data.'; }
}

/* =========================================================
   MODUL COACH (DASHBOARD PELATIH)
========================================================= */

async function loadCoachJadwal() {
    const activeCoach = localStorage.getItem('loggedInUser');
    
// Cek kalau akun dewa, ambil semua data jadwal tanpa filter nama pelatih!
const roleAktif = localStorage.getItem('userRoles') || '';
let queryJadwal = sb.from('jadwal_coach').select('*');

if (!roleAktif.includes('owner')) {
    queryJadwal = queryJadwal.ilike('nama_coach', activeCoach);
}
const { data: jadwalTugas } = await queryJadwal.order('id', { ascending: false });
    let htmlTugas = 'Belum ada penugasan.';
    if(jadwalTugas?.length > 0) {
        htmlTugas = jadwalTugas.map(j => `<div style="margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;"><b style="color:#0369a1;">${j.hari}, ${j.jam}</b> - ${j.lokasi}<br><small>Kelas: ${j.tipe_class} | Murid: ${j.nama_murid}</small></div>`).join('');
    }
    document.getElementById('coach-jadwal-penugasan').innerHTML = htmlTugas;

    const { data: jadwal, error: errJadwal } = await sb.from('jadwal_kelas').select('*').order('id', { ascending: true });
    if (errJadwal) {
        document.getElementById('coach-jadwal-beginner').innerHTML = '<p style="color:red;">Gagal memuat jadwal beginner.</p>';
    } else {
        let htmlBeginner = '';
        let optJadwal = '<option value="">-- Pilih Slot Jadwal --</option>';
        if (jadwal && jadwal.length > 0) {
            jadwal.forEach(j => {
                htmlBeginner += `<div style="margin-bottom:8px; border-bottom:1px solid #bae6fd; padding-bottom:8px;">
                    <b style="color:#0284c7;">${j.hari}, ${j.jam}</b> - 📍 ${j.lokasi}<br>
                    <small>👥 Peserta: ${j.peserta || 'Kosong'}</small>
                </div>`;
                optJadwal += `<option value="${j.id}" data-peserta="${j.peserta || ''}">${j.hari} | ${j.jam} | ${j.lokasi}</option>`;
            });
        } else {
            htmlBeginner = '<p>Belum ada jadwal kelas beginner aktif.</p>';
        }
        document.getElementById('coach-jadwal-beginner').innerHTML = htmlBeginner;
        document.getElementById('coach-pilih-jadwal').innerHTML = optJadwal;
    }

    // 🔴 UPDATE: Logika Nama Panggilan di Menu Dropdown Aplikasi Coach
    const { data: murid } = await sb.from('murid').select('id_murid, nama_murid, nama_panggilan, sisa_sesi').gt('sisa_sesi', 0);
    let optMurid = '<option value="">-- Pilih Murid Aktif --</option>';
    if(murid) {
        murid.forEach(m => {
            const namaTampil = m.nama_panggilan ? m.nama_panggilan : m.nama_murid;
            optMurid += `<option value="${m.id_murid}" data-nama="${namaTampil}">[Sisa ${m.sisa_sesi}] ${namaTampil}</option>`;
        });
    }
    document.getElementById('coach-pilih-murid').innerHTML = optMurid;
}


async function coachInsertMurid() {
    const btn = event.target;
    const selectJadwal = document.getElementById('coach-pilih-jadwal');
    const selectMurid = document.getElementById('coach-pilih-murid');

    const idJadwal = selectJadwal.value;
    const idMurid = selectMurid.value;

    if (!idJadwal || !idMurid) return alert("Pilih jadwal dan murid terlebih dahulu, Coach!");

    btn.innerText = "⏳ Memproses...";
    btn.disabled = true;

    const namaMurid = selectMurid.options[selectMurid.selectedIndex].getAttribute('data-nama');
    let pesertaSaatIni = selectJadwal.options[selectJadwal.selectedIndex].getAttribute('data-peserta');

    if (pesertaSaatIni && pesertaSaatIni !== 'Kosong') {
        if (pesertaSaatIni.includes(namaMurid)) {
            btn.innerText = "⚡ Masukkan Murid & Kurangi Sesi";
            btn.disabled = false;
            return alert("Murid ini sudah ada di jadwal tersebut!");
        }
        pesertaSaatIni += ", " + namaMurid;
    } else {
        pesertaSaatIni = namaMurid;
    }

    try {
        const { error: errJadwal } = await sb.from('jadwal_kelas').update({ peserta: pesertaSaatIni }).eq('id', idJadwal);
        if (errJadwal) throw errJadwal;

        const { data: dataMurid, error: errGetMurid } = await sb.from('murid').select('sisa_sesi').eq('id_murid', idMurid).single();
        if (errGetMurid) throw errGetMurid;

        if (dataMurid.sisa_sesi > 0) {
            const { error: errUpdateMurid } = await sb.from('murid').update({ sisa_sesi: dataMurid.sisa_sesi - 1 }).eq('id_murid', idMurid);
            if (errUpdateMurid) throw errUpdateMurid;
        }

        alert("Sukses! Murid berhasil dimasukkan ke kelas dan sesi telah dikurangi.");
        if (typeof loadCoachJadwal === "function") loadCoachJadwal(); 
    } catch (error) {
        console.error("Gagal insert murid:", error);
        alert("Terjadi kesalahan sistem saat memproses data: " + error.message);
    } finally {
        btn.innerText = "⚡ Masukkan Murid & Kurangi Sesi";
        btn.disabled = false;
    }
}

/* =========================================================
   MODUL COACH: ASSESSMENT & PROGRESS
========================================================= */

async function loadCoachAssessment() {
    const { data: murid } = await sb.from('murid').select('id_murid, nama_murid').order('nama_murid');
    let opt = '<option value="">-- Pilih Murid --</option>';
    if(murid) murid.forEach(m => opt += `<option value="${m.id_murid}">${m.nama_murid}</option>`);
    document.getElementById('assess-murid').innerHTML = opt;

    loadRiwayatAssessment();
}

async function loadAssessmentDetail() {
    const idMurid = document.getElementById('assess-murid').value;
    if(!idMurid) return;

    // Reset mode edit
    let hiddenId = document.getElementById('ass-edit-id');
    if(hiddenId) hiddenId.value = ""; 

    // Cari riwayat terakhir sebagai template
    const { data } = await sb.from('assessment_log')
        .select('*')
        .eq('id_murid', idMurid)
        .order('tanggal_assessment', { ascending: false })
        .limit(1)
        .maybeSingle();

    if(data) {
        document.getElementById('ass-float').value = data.floating_streamline || '';
        document.getElementById('ass-breath').value = data.breathing_control || '';
        document.getElementById('ass-kick').value = data.freestyle_kicking || '';
        document.getElementById('ass-free').value = data.freestyle_stroke || '';
        document.getElementById('ass-breast').value = data.breaststroke || '';
        document.getElementById('ass-back').value = data.backstroke || '';
        document.getElementById('ass-fly').value = data.butterfly_stroke || '';
        document.getElementById('ass-catatan').value = data.catatan_coach || '';
    } else {
        document.getElementById('ass-float').value = '';
        document.getElementById('ass-breath').value = '';
        document.getElementById('ass-kick').value = '';
        document.getElementById('ass-free').value = '';
        document.getElementById('ass-breast').value = '';
        document.getElementById('ass-back').value = '';
        document.getElementById('ass-fly').value = '';
        document.getElementById('ass-catatan').value = '';
    }

    const btn = document.querySelector('button[onclick="simpanAssessment()"]');
    if (btn) btn.innerHTML = "💾 Simpan Assessment";
}

async function editAssessmentLog(idAssessment, idMurid) {
    const dropdown = document.getElementById('assess-murid');
    dropdown.value = idMurid;

    let hiddenId = document.getElementById('ass-edit-id');
    if (!hiddenId) {
        hiddenId = document.createElement('input');
        hiddenId.type = 'hidden';
        hiddenId.id = 'ass-edit-id';
        document.body.appendChild(hiddenId); 
    }
    hiddenId.value = idAssessment; 

    const { data } = await sb.from('assessment_log').select('*').eq('id_assessment', idAssessment).single();
    if(data) {
        document.getElementById('ass-float').value = data.floating_streamline || '';
        document.getElementById('ass-breath').value = data.breathing_control || '';
        document.getElementById('ass-kick').value = data.freestyle_kicking || '';
        document.getElementById('ass-free').value = data.freestyle_stroke || '';
        document.getElementById('ass-breast').value = data.breaststroke || '';
        document.getElementById('ass-back').value = data.backstroke || '';
        document.getElementById('ass-fly').value = data.butterfly_stroke || '';
        document.getElementById('ass-catatan').value = data.catatan_coach || '';
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    const btn = document.querySelector('button[onclick="simpanAssessment()"]');
    if (btn) btn.innerHTML = "💾 Update Assessment";
}

async function simpanAssessment() {
    const dropdown = document.getElementById('assess-murid');
    const idMurid = dropdown.value;
    
    if(!idMurid) return alert("Pilih murid!");

    // 1. Ambil semua nilai dari inputan Coach
    const valFloat = parseInt(document.getElementById('ass-float').value) || 0;
    const valBreath = parseInt(document.getElementById('ass-breath').value) || 0;
    const valKick = parseInt(document.getElementById('ass-kick').value) || 0;
    const valFree = parseInt(document.getElementById('ass-free').value) || 0;
    const valBreast = parseInt(document.getElementById('ass-breast').value) || 0;
    const valBack = parseInt(document.getElementById('ass-back').value) || 0;
    const valFly = parseInt(document.getElementById('ass-fly').value) || 0;

    const payload = {
        id_murid: idMurid,
        floating_streamline: valFloat,
        breathing_control: valBreath,
        freestyle_kicking: valKick,
        freestyle_stroke: valFree,
        breaststroke: valBreast,
        backstroke: valBack,
        butterfly_stroke: valFly,
        catatan_coach: document.getElementById('ass-catatan').value
    };

    const btn = document.querySelector('button[onclick="simpanAssessment()"]');
    btn.innerHTML = "⏳ Menganalisis Kelulusan & Menyimpan Data...";
    btn.disabled = true;

    let hiddenId = document.getElementById('ass-edit-id');
    const idAssessment = hiddenId ? hiddenId.value : "";
    let errorData;

    try {
        // 2. Simpan Rapor ke tabel assessment_log
        if (idAssessment) {
            const { error } = await sb.from('assessment_log').update(payload).eq('id_assessment', idAssessment);
            errorData = error;
        } else {
            const { error } = await sb.from('assessment_log').insert([payload]);
            errorData = error;
        }
        
        if (errorData) throw errorData;

        // =========================================================
        // 🔴 KEAJAIBAN AUTO-GRADUATION (OTOMATIS LULUS/TIDAK)
        // Syarat Level 1: Gaya Bebas min 95% DAN Gaya Dada min 100%
        // =========================================================
        let statusLulus = false;
        let pesanKelulusan = "";

        if (valFree >= 95 && valBreast >= 100) {
            statusLulus = true;
            pesanKelulusan = "\n\n🎉 SELAMAT! Nilai memenuhi syarat. Sertifikat Kelulusan Level 1 anak ini OTOMATIS TERBUKA di aplikasi Orang Tua!";
        } else {
            statusLulus = false;
            pesanKelulusan = "\n\n🔒 Nilai belum memenuhi standar kelulusan (Gaya Bebas min 95%, Dada 100%). Sertifikat otomatis terkunci.";
        }

        // 3. Tembak status LULUS (True/False) ke tabel Murid
        const { error: errLulus } = await sb.from('murid').update({ lulus_level_1: statusLulus }).eq('id_murid', idMurid);
        if (errLulus) throw errLulus;

        // 4. Urusan potong sesi
        const checkboxPotong = document.getElementById('ass-potong-sesi');
        let pesanSesi = "";
        
        if (checkboxPotong && checkboxPotong.checked) {
            const { data: dataSiswa } = await sb.from('murid').select('sisa_sesi').eq('id_murid', idMurid).single();
            if (dataSiswa && dataSiswa.sisa_sesi > 0) {
                await sb.from('murid').update({ sisa_sesi: dataSiswa.sisa_sesi - 1 }).eq('id_murid', idMurid);
                pesanSesi = "Sisa Sesi berhasil dipotong 1.";
                checkboxPotong.checked = false; 
            } else {
                pesanSesi = "Peringatan: Sisa sesi murid ini sudah habis, tidak bisa dipotong!";
                checkboxPotong.checked = false;
            }
        } else {
            pesanSesi = "Sesi tidak dipotong.";
        }
        
        // 5. Eksekusi akhir & Tampilkan Pesan ke Coach
        alert(`Mantap Coach! Rapor tersimpan.\n${pesanSesi}${pesanKelulusan}`);
        
        if (hiddenId) hiddenId.value = ""; 
        document.getElementById('ass-catatan').value = ""; 
        
        if (typeof loadRiwayatAssessment === "function") loadRiwayatAssessment(); 
        if (typeof loadBelumAssessment === "function") loadBelumAssessment(); 

    } catch (err) {
        alert("Gagal memproses data: " + err.message);
    } finally {
        btn.innerHTML = "💾 Simpan Assessment"; 
        btn.disabled = false;
    }
}


async function loadRiwayatAssessment() {
    const listEl = document.getElementById('coach-assessment-list');
    if (!listEl) return;
    
    listEl.innerHTML = '<p style="text-align:center; font-size:12px;">Memuat riwayat...</p>';

    const { data: logData, error: logError } = await sb.from('assessment_log')
        .select('*')
        .order('tanggal_assessment', { ascending: false });

    if (logError) return listEl.innerHTML = '<p style="color:red; font-size:12px;">Gagal memuat riwayat.</p>';

    const { data: muridData } = await sb.from('murid').select('id_murid, nama_murid');

    let html = '';
    logData.forEach(item => {
        const murid = muridData ? muridData.find(m => m.id_murid === item.id_murid) : null;
        const nama = murid ? murid.nama_murid : `Siswa (ID: ${item.id_murid})`; 
        
        html += `
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative;">
            
            <button onclick="editAssessmentLog(${item.id_assessment}, ${item.id_murid})" style="position: absolute; top: 12px; right: 12px; width: max-content !important; min-width: 60px; background:#f59e0b; color:white; border:none; border-radius:4px; padding:6px 10px; font-size:11px; cursor:pointer; font-weight:bold; display: inline-block;">✏️ Edit</button>

            <div style="padding-right: 80px; margin-bottom: 12px; border-bottom: 1px solid #f8fafc; padding-bottom: 8px;">
                <strong style="color:#0369a1; font-size:14px; display:block; margin-bottom:4px;">${nama}</strong>
                <span style="font-size:11px; color:#64748b; font-weight:bold;">📅 ${item.tanggal_assessment}</span>
            </div>
            
            <!-- 🔴 UPDATE: Penambahan simbol % di setiap nilai -->
            <div style="font-size:11px; color:#334155; display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                <span>Float: <b style="color:#0284c7;">${item.floating_streamline || 0}%</b></span>
                <span>Breath: <b style="color:#0284c7;">${item.breathing_control || 0}%</b></span>
                <span>Free Kick: <b style="color:#0284c7;">${item.freestyle_kicking || 0}%</b></span>
                <span>Free Stroke: <b style="color:#0284c7;">${item.freestyle_stroke || 0}%</b></span>
                <span>Breaststroke: <b style="color:#0284c7;">${item.breaststroke || 0}%</b></span>
                <span>Backstroke: <b style="color:#0284c7;">${item.backstroke || 0}%</b></span>
                <span>Butterfly: <b style="color:#0284c7;">${item.butterfly_stroke || 0}%</b></span>
            </div>
            
            ${item.catatan_coach ? `<div style="margin-top:10px; font-size:11px; font-style:italic; color:#b45309; background:#fffbeb; padding:8px; border-radius:6px; border:1px dashed #fde68a;">💬 "${item.catatan_coach}"</div>` : ''}
        </div>`;
    });

    listEl.innerHTML = html || '<p style="text-align:center; font-size:12px; color:#64748b;">Belum ada riwayat assessment.</p>';
}


/* =========================================================
   MODUL FEE, AKUNTING, & PROFIL
========================================================= */

async function tambahAkunting() {
    const tgl = document.getElementById('akun-tanggal').value;
    const ket = document.getElementById('akun-ket').value;
    const jenis = document.getElementById('akun-jenis').value;
    const jumlah = document.getElementById('akun-jumlah').value;

    if (!tgl || !ket || !jumlah) return alert("Isi tanggal, keterangan, dan jumlah!");

    const { error } = await sb.from('akunting').insert([{ 
        tanggal: tgl,
        keterangan: ket, 
        jenis: jenis, 
        jumlah: parseFloat(jumlah)
    }]);

    if (error) {
        console.error("Error Detail:", error);
        alert("Gagal simpan: " + error.message);
    } else {
        document.getElementById('akun-tanggal').value = '';
        document.getElementById('akun-ket').value = '';
        document.getElementById('akun-jumlah').value = '';
        
        loadAkuntingAdmin(); 
        loadRekapAkunting(); 
    }
}

async function loadCoachFee() {
    const totalEl = document.getElementById('coach-total-fee');
    const listEl = document.getElementById('coach-fee-list');
    if (!totalEl || !listEl) return;

    const namaCoach = localStorage.getItem("loggedInUser");
    if (!namaCoach) return listEl.innerHTML = "Coach belum login.";

    const { data, error } = await sb.from("fee_coach")
        .select("*")
        .eq("nama_coach", namaCoach) 
        .order("tanggal", { ascending: false });

    if (error) return listEl.innerHTML = "Gagal memuat data.";

    let totalFee = 0;
    let html = "";

    data.forEach(item => {
        const fee = parseInt(item.total_fee) || 0;
        totalFee += fee;

        html += `
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <strong style="color:#0369a1; font-size:14px;">${item.jenis_sesi}</strong>
                <span style="font-size:12px; color:#64748b;">${item.tanggal}</span>
            </div>
            <div style="font-size:13px; color:#334155; margin-bottom:6px;">
                Murid: <b>${item.nama_murid || 'Belum di-set'}</b><br>
                Jumlah: ${item.total_sesi} Sesi
            </div>
            <div style="font-size:15px; font-weight:bold; color:#10b981;">
                Rp ${fee.toLocaleString('id-ID')}
            </div>
        </div>`;
    });

    totalEl.innerHTML = `Total Fee: Rp ${totalFee.toLocaleString('id-ID')}`;
    listEl.innerHTML = html || "<p style='color:#64748b;'>Belum ada data rekapan mengajar.</p>";
}

async function loadProfilCoach() {
    const user = localStorage.getItem('loggedInUser');
    if (!user) return;

    try {
        const { data, error } = await sb.from('coach').select('*').eq('username', user).single();
        if (error || !data) throw new Error("Data master coach tidak ditemukan.");

        document.getElementById('coach-nama-display').innerText = data.nama_coach;
        document.getElementById('coach-info-spesialisasi').innerText = `Spesialisasi: ${data.spesialisasi || '-'}`;
        document.getElementById('coach-info-wa').innerText = `WhatsApp: ${data.no_wa || '-'}`;
        
        const img = document.getElementById('coach-view-foto');
        if (data.foto_profil) {
            img.src = data.foto_profil;
        } else {
            img.src = 'images/default-avatar.png'; 
        }

        window.activeCoachDbId = data.id;

    } catch (err) {
        console.error(err);
        alert("Gagal memuat profil. Pastikan Admin sudah membuatkan Master Data Coach untuk akun ini.");
    }
}

async function simpanProfilCoach() {
    const file = document.getElementById('coach-upload-foto').files[0];
    const coachId = window.activeCoachDbId;

    if (!file) return alert("Silakan pilih foto terlebih dahulu!");
    if (!coachId) return alert("Sistem belum memuat data profil. Silakan muat ulang halaman.");

    try {
        document.getElementById('coach-nama-display').innerText = "Mengunggah...";

        const ext = file.name.split('.').pop();
        const path = `foto_coach_${coachId}_${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from('coach-files').upload(path, file);
        
        if (upErr) throw upErr;

        const urlFoto = sb.storage.from('coach-files').getPublicUrl(path).data.publicUrl;

        const { error: dbErr } = await sb.from('coach').update({ foto_profil: urlFoto }).eq('id', coachId);
        
        if (dbErr) throw dbErr;

        alert("Foto Profil berhasil diperbarui!");
        loadProfilCoach(); 

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan sistem saat mengunggah foto.");
        loadProfilCoach();
    }
}
// =========================================================
// 1. UPDATE FUNGSI INI (Tambahan loadBelumAssessment)
// =========================================================
async function loadCoachAssessment() {
    const { data: murid } = await sb.from('murid').select('id_murid, nama_murid').order('nama_murid');
    let opt = '<option value="">-- Pilih Murid --</option>';
    if(murid) murid.forEach(m => opt += `<option value="${m.id_murid}">${m.nama_murid}</option>`);
    document.getElementById('assess-murid').innerHTML = opt;

    loadRiwayatAssessment();
    loadBelumAssessment(); // 🔴 PANGGIL FUNGSI BARU DI SINI
}

// =========================================================
// 2. FUNGSI BARU: TARIK DATA YANG BELUM PERNAH DINILAI
// =========================================================
async function loadBelumAssessment() {
    const container = document.getElementById('list-belum-assessment');
    if (!container) return;

    try {
        // Ambil murid yang MASIH AKTIF (sisa sesi > 0)
        const { data: muridAktif, error: errMurid } = await sb.from('murid').select('id_murid, nama_murid').gt('sisa_sesi', 0);
        if (errMurid) throw errMurid;

        // Ambil data dari log untuk ngecek siapa aja yang udah dinilai
        const { data: logAssessment, error: errLog } = await sb.from('assessment_log').select('id_murid');
        if (errLog) throw errLog;

        // Bikin daftar ID unik untuk anak yang SUDAH dinilai
        const idSudahDinilai = [...new Set(logAssessment.map(item => item.id_murid))];

        // Filter: Cari murid aktif yang ID-nya TIDAK ADA di log assessment
        const muridBelumDinilai = muridAktif.filter(m => !idSudahDinilai.includes(m.id_murid));

        if (muridBelumDinilai.length === 0) {
            container.innerHTML = '<span style="font-size:11px; background:#10b981; color:white; padding:4px 10px; border-radius:12px; font-weight:bold;">✨ Mantap! Semua murid aktif sudah memiliki rapor.</span>';
            return;
        }

        let html = '';
        muridBelumDinilai.forEach(m => {
            // 🔴 Tombol Chip interaktif, kalau diklik langsung auto-select di Dropdown!
            html += `<button onclick="pilihAnakBelumDinilai(${m.id_murid})" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; padding:6px 12px; border-radius:20px; font-size:11px; font-weight:bold; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,0.05); transition:0.2s;">
                + ${m.nama_murid}
            </button>`;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error("Gagal memuat To-Do Assessment:", error);
        container.innerHTML = '<span style="color:red; font-size:11px;">Gagal memuat data.</span>';
    }
}

// =========================================================
// 3. FUNGSI BARU: AUTO-SELECT DROPDOWN SAAT DIKLIK
// =========================================================
function pilihAnakBelumDinilai(idMurid) {
    const dropdown = document.getElementById('assess-murid');
    dropdown.value = idMurid; // Set dropdown ke anak tersebut
    
    // Panggil fungsi bawaan lu buat ngereset form nilainya jadi kosong (siap diisi)
    loadAssessmentDetail(); 
    
    // Auto-scroll halus ke atas biar Coach langsung fokus ke form pengisian
    window.scrollTo({ top: 0, behavior: "smooth" }); 
}
