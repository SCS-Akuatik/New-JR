import { sb } from './config.js';

/* =========================================================
   HEADER DYNAMIC: JAM, NAMA (USERS), DAN UPLOAD FOTO
========================================================= */
window.bukaModalFeeCoach = function() {
    document.getElementById('modal-fee-coach').classList.remove('hidden');
};

window.jalankanJamCoach = function() {
    const elJam = document.getElementById('coach-jam-realtime');
    const elTgl = document.getElementById('coach-tgl-realtime'); 

    const updateWaktu = () => {
        try {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            if(elJam) elJam.innerText = `${hh}:${mm}`;

            const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const blnList = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
            const namaHari = hariList[now.getDay()];
            const tgl = now.getDate();
            const namaBln = blnList[now.getMonth()];
            
            if(elTgl) elTgl.innerText = `${namaHari}, ${tgl} ${namaBln}`;
        } catch(e) {
            console.error("Jam Error:", e);
        }
    };

    updateWaktu(); 
    if(window.jamCoachInterval) clearInterval(window.jamCoachInterval);
    window.jamCoachInterval = setInterval(updateWaktu, 1000);
};

window.loadProfilHeaderCoach = async function() {
    const currentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
    if(!currentUser) return;

    const elNama = document.getElementById('header-coach-nama');
    const elFoto = document.getElementById('header-coach-avatar');

    let callName = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);
    
    if (elNama) elNama.innerText = callName;
    if (elFoto) elFoto.src = `https://ui-avatars.com/api/?name=${callName}&background=0284c7&color=fff`;

    try {
        const { data, error } = await sb.from('users').select('*').eq('username', currentUser).maybeSingle();
        
        if (data) {
            if (elNama && data.call_name) {
                elNama.innerText = data.call_name;
                if(elFoto && !data.avatar_url) elFoto.src = `https://ui-avatars.com/api/?name=${data.call_name}&background=0284c7&color=fff`;
            }
            
            if (elFoto && data.avatar_url) {
                elFoto.src = data.avatar_url;
                elFoto.onerror = () => { elFoto.src = `https://ui-avatars.com/api/?name=${data.call_name || callName}&background=0284c7&color=fff`; };
            }
        }
    } catch(e) {
        console.error("Database profil error:", e);
    }
};

window.uploadAvatarCoach = async function(event) {
    const file = event.target.files[0];
    if(!file) return;

    if(file.size > 2 * 1024 * 1024) {
        return alert("🚨 Ukuran file terlalu besar! Maksimal 2MB ya Bos.");
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if(!validTypes.includes(file.type)) {
        return alert("🚨 Format file harus JPG, PNG, atau WEBP.");
    }

    const currentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
    const elFoto = document.getElementById('header-coach-avatar');
    const oldSrc = elFoto.src; 
    
    elFoto.style.opacity = '0.5';

    try {
        const ext = file.name.split('.').pop();
        const fileName = `avatar_${Date.now()}.${ext}`;
        const filePath = `${currentUser}/${fileName}`; 

        const { error: uploadError } = await sb.storage
            .from('coach-avatars') // Bucket name, user will setup
            .upload(filePath, file, { upsert: true, cacheControl: '3600' });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = sb.storage
            .from('coach-avatars')
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // Update ke table users
        const { error: updateError } = await sb.from('users')
            .update({ avatar_url: publicUrl })
            .eq('username', currentUser);

        if (updateError) throw updateError;

        elFoto.src = publicUrl;
        alert("✅ Foto profil berhasil diperbarui!");

    } catch(e) {
        console.error("Gagal upload avatar:", e);
        alert("Gagal mengunggah foto: " + e.message);
        elFoto.src = oldSrc; 
    } finally {
        elFoto.style.opacity = '1';
    }
};



/* =========================================================
   BAGIAN ADMIN JADWAL PENUGASAN COACH
========================================================= */
export async function loadDropdownMuridCoach() {
    const dropdown = document.getElementById('coach-murid');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Memuat Murid...</option>';

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
        const namaTampil = m.nama_panggilan ? m.nama_panggilan : m.nama_murid;
        dropdown.innerHTML += `<option value="${m.id_murid}" data-nama="${namaTampil}">${namaTampil} (Sisa: ${m.sisa_sesi})</option>`;
    });
}

export function tambahMuridKeListCoach() {
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

export function resetListCoach() {
    document.getElementById('coach-list-nama').value = "";
    document.getElementById('coach-list-id').value = "";
}

export async function simpanJadwalCoach() {
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
        await sb.from('jadwal_coach').update(dataObj).eq('id', id);
        alert("Data jadwal berhasil diupdate!");
    } else { 
        await sb.from('jadwal_coach').insert([dataObj]);
        alert("Jadwal penugasan berhasil dibuat! (Sesi baru terpotong jika tombol Selesai diklik)");
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

export function editJadwalCoach(id, nama, hari, lokasi, jam, tipe, murid) {
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

export async function loadCoachAdmin() {
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
            html += `<div class="list-item-admin" style="display:flex; flex-direction:column; gap:10px; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:12px;">
                <div>
                    <strong style="color:#0284c7; font-size:14px;">${c.nama_coach}</strong> <span style="font-size:12px; color:#64748b;">(${c.hari})</span><br>
                    📍 ${c.lokasi} | ⏰ ${c.jam}<br>
                    👤 ${c.nama_murid} <span style="font-size:11px; color:#f59e0b; font-weight:bold;">(${c.tipe_class})</span>
                </div>
                
                <div style="display:flex; gap:6px; width:100%;">
                    <button style="flex:1; background:#f59e0b; color:white; border:none; padding:8px 0; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;" onclick="editJadwalCoach(${c.id}, '${c.nama_coach}', '${c.hari}', '${c.lokasi}', '${c.jam}', '${c.tipe_class}', '${c.nama_murid}')">✏️ Edit</button>
                    
                    <button style="flex:1.5; background:#10b981; color:white; border:none; padding:8px 0; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;" onclick="selesaiTugasJadwal(${c.id}, '${c.nama_murid}', 'admin')">✅ Selesai</button>
                    
                    <button style="flex:1; background:#ef4444; color:white; border:none; padding:8px 0; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;" onclick="batalTugasJadwal(${c.id}, 'admin')">❌ Hapus</button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    } catch (err) { list.innerHTML = 'Gagal memuat data.'; }
}

/* =========================================================
   MODUL COACH (DASHBOARD PELATIH) - FIXED IDENTITAS
========================================================= */
export async function loadCoachJadwal() {
    const userSesi = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
    
    const { data: masterCoach } = await sb.from('coach')
        .select('nama_coach')
        .eq('username', userSesi)
        .maybeSingle();
        
    const namaAsliCoach = masterCoach ? masterCoach.nama_coach : userSesi;

    const { data: jadwalTugas } = await sb.from('jadwal_coach')
        .select('*')
        .ilike('nama_coach', `%${namaAsliCoach}%`)
        .order('id', { ascending: false });

    let htmlTugas = 'Belum ada penugasan.';
    if(jadwalTugas?.length > 0) {
        htmlTugas = jadwalTugas.map(j => `
        <div style="margin-bottom:12px; border:1px solid #e2e8f0; border-radius:8px; padding:12px; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <b style="color:#0369a1; font-size:14px;">${j.hari}, ${j.jam}</b> - ${j.lokasi}<br>
            <small style="display:block; margin-bottom:12px; color:#475569;">Kelas: ${j.tipe_class} | Murid: <b>${j.nama_murid}</b></small>
            
            <div style="display:flex; gap:8px;">
                <button onclick="selesaiTugasJadwal(${j.id}, '${j.nama_murid}', 'coach')" style="flex:1; background:#10b981; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px; white-space:nowrap;">✅ Selesai</button>
                
                <button onclick="batalTugasJadwal(${j.id}, 'coach')" style="flex:1; background:#ef4444; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px; white-space:nowrap;">❌ Batal</button>
            </div>
        </div>`).join('');
    }
    document.getElementById('coach-jadwal-penugasan').innerHTML = htmlTugas;

    // Load Jadwal Beginner
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

    // Load Murid Beginner
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

/* =========================================================
   FITUR INSERT MURID BEGINNER & AUTO KIRIM FEE KE ADMIN
========================================================= */
export async function coachInsertMurid(event) {
    const btn = event ? event.target : document.querySelector('button[onclick*="coachInsertMurid"]');
    const selectJadwal = document.getElementById('coach-pilih-jadwal');
    const selectMurid = document.getElementById('coach-pilih-murid');

    const idJadwal = selectJadwal.value;
    const idMurid = selectMurid.value;

    if (!idJadwal || !idMurid) return alert("Pilih jadwal dan murid terlebih dahulu, Coach!");

    if(btn) { btn.innerText = "⏳ Memproses..."; btn.disabled = true; }

    const namaMurid = selectMurid.options[selectMurid.selectedIndex].getAttribute('data-nama');
    let pesertaSaatIni = selectJadwal.options[selectJadwal.selectedIndex].getAttribute('data-peserta');
    
    const userSesi = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
    const { data: masterCoach } = await sb.from('coach').select('nama_coach').eq('username', userSesi).maybeSingle();
    const namaAsliCoach = masterCoach ? masterCoach.nama_coach : userSesi;

    const teksJadwal = selectJadwal.options[selectJadwal.selectedIndex].text;
    let lokasiKelas = teksJadwal.split('|')[2] ? teksJadwal.split('|')[2].trim() : 'Kolam Beginner';

    if (pesertaSaatIni && pesertaSaatIni !== 'Kosong') {
        if (pesertaSaatIni.includes(namaMurid)) {
            if(btn) { btn.innerText = "⚡ Masukkan Murid & Kurangi Sesi"; btn.disabled = false; }
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

        const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        await sb.from('antrean_fee').insert([{
            nama_coach: namaAsliCoach,
            nama_murid: namaMurid,
            tipe_class: 'Beginner',
            lokasi: lokasiKelas,
            tanggal_selesai: today
        }]);

        alert("✅ Sukses! Nama masuk jadwal, sesi terpotong, dan Laporan Fee masuk ke Inbox Admin.");
        
        if (typeof loadCoachJadwal === "function") loadCoachJadwal(); 
    } catch (error) {
        console.error("Gagal insert murid:", error);
        alert("Terjadi kesalahan sistem saat memproses data: " + error.message);
    } finally {
        if(btn) { btn.innerText = "⚡ Masukkan Murid & Kurangi Sesi"; btn.disabled = false; }
    }
}

/* =========================================================
   FITUR EKSEKUTOR SELESAI & BATAL PENUGASAN COACH
========================================================= */
export async function selesaiTugasJadwal(idJadwal, namaMuridStr, source) {
    if (!confirm(`🚀 Tandai kelas ini SELESAI?\nSisa sesi murid akan dipotong 1 dan laporan akan masuk ke Inbox Admin untuk pencairan Fee.`)) return;

    try {
        const arrNama = namaMuridStr.split(',').map(n => n.trim());
        for (let nama of arrNama) {
            const { data: muridMatch } = await sb.from('murid')
                .select('id_murid, sisa_sesi')
                .or(`nama_murid.ilike.%${nama}%,nama_panggilan.ilike.%${nama}%`);
            
            if (muridMatch && muridMatch.length > 0) {
                const target = muridMatch[0];
                if (target.sisa_sesi > 0) {
                    await sb.from('murid').update({ sisa_sesi: target.sisa_sesi - 1 }).eq('id_murid', target.id_murid);
                }
            }
        }

        const { data: jadwal } = await sb.from('jadwal_coach').select('*').eq('id', idJadwal).single();

        if (jadwal) {
            const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            await sb.from('antrean_fee').insert([{
                nama_coach: jadwal.nama_coach,
                nama_murid: jadwal.nama_murid,
                tipe_class: jadwal.tipe_class,
                lokasi: jadwal.lokasi,
                tanggal_selesai: today
            }]);
        }

        await sb.from('jadwal_coach').delete().eq('id', idJadwal);
        
        alert("✅ Kelas Selesai! Sesi terpotong & Laporan dikirim ke Admin untuk pencairan Fee.");

        if (source === 'coach' && typeof loadCoachJadwal === 'function') loadCoachJadwal();
        if (source === 'admin' && typeof loadCoachAdmin === 'function') loadCoachAdmin();

    } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan saat memproses submit selesai.");
    }
}

export async function batalTugasJadwal(idJadwal, source) {
    if (!confirm("❌ Yakin ingin MEMBATALKAN jadwal ini?\nJadwal akan dihapus dan sesi murid TIDAK akan dipotong.")) return;
    
    try {
        await sb.from('jadwal_coach').delete().eq('id', idJadwal);
        
        if (source === 'coach' && typeof loadCoachJadwal === 'function') loadCoachJadwal();
        if (source === 'admin' && typeof loadCoachAdmin === 'function') loadCoachAdmin();
    } catch (error) {
        console.error(error);
        alert("Gagal membatalkan jadwal.");
    }
}

/* =========================================================
   FITUR ANTREAN FEE COACH (ADMIN DASHBOARD)
========================================================= */
export async function loadAntreanFeeAdmin() {
    const list = document.getElementById('admin-antrean-fee-list');
    if(!list) return;
    list.innerHTML = '<p style="text-align:center; font-size:12px;">Memuat laporan masuk...</p>';

    const { data, error } = await sb.from('antrean_fee').select('*').order('id', { ascending: true });
    if (error) return list.innerHTML = '<p style="color:red; text-align:center;">Gagal memuat data.</p>';

    let html = '';
    data.forEach(item => {
        html += `
        <div style="background:#ffffff; border:1px solid #10b981; border-radius:8px; padding:12px; margin-bottom:12px; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            <div style="margin-bottom:12px; border-bottom:1px dashed #e2e8f0; padding-bottom:8px;">
                <strong style="color:#047857; font-size:14px;">Coach ${item.nama_coach}</strong><br>
                <small style="color:#475569; font-weight:bold;">${item.tipe_class} | Murid: ${item.nama_murid}</small><br>
                <small style="color:#64748b;">📅 Selesai: ${item.tanggal_selesai}</small>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; align-items:center; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:0 10px;">
                    <span style="font-weight:bold; color:#64748b; margin-right:8px;">Rp</span>
                    <input type="number" id="input-fee-${item.id}" placeholder="Ketik nominal fee..." style="flex:1; border:none; background:transparent; padding:10px 0; font-size:14px; outline:none;">
                </div>
                <button onclick="accFeeCoach(${item.id}, '${item.nama_coach}', '${item.nama_murid}', '${item.tipe_class}', '${item.tanggal_selesai}', event)" style="width:100%; background:#10b981; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:13px;">✅ Cairkan Fee</button>
            </div>
        </div>`;
    });
    list.innerHTML = html || '<p style="text-align:center; color:#64748b; font-size:13px; font-style:italic;">✨ Belum ada laporan kelas selesai. Inbox bersih!</p>';
}

export async function accFeeCoach(idAntrean, namaCoach, namaMurid, tipeClass, tglSelesai, event) {
    const nominal = document.getElementById(`input-fee-${idAntrean}`).value;
    
    if (!nominal || nominal <= 0) return alert("Masukkan nominal fee yang valid!");

    const btn = event ? event.target : null;
    if(btn) { btn.innerText = "⏳..."; btn.disabled = true; }

    try {
        if (parseInt(nominal) === 1) {
            await sb.from('antrean_fee').delete().eq('id', idAntrean);
            alert("🗑️ Laporan dihapus! (Sistem mendeteksi input 1 Rupiah)");
        } 
        else {
            await sb.from('fee_coach').insert([{
                nama_coach: namaCoach,
                jenis_sesi: tipeClass,
                nama_murid: namaMurid,
                total_sesi: 1, 
                total_fee: parseInt(nominal),
                tanggal: tglSelesai
            }]);

            await sb.from('antrean_fee').delete().eq('id', idAntrean);
            alert("✅ Cair! Fee berhasil diinput ke data Coach.");
        }

        loadAntreanFeeAdmin(); 
        if (typeof window.loadRekapFee === 'function') window.loadRekapFee();

    } catch (err) {
        console.error(err);
        alert("Gagal memproses laporan: " + err.message);
        if(btn) { btn.innerText = "✅ Cairkan Fee"; btn.disabled = false; }
    }
}


/* =========================================================
   FITUR AUTOCOMPLETE PENCARIAN MURID (ASSESSMENT)
========================================================= */
let debounceTimerMurid;

export function debounceSearchMurid() {
    clearTimeout(debounceTimerMurid);
    const keyword = document.getElementById('search-assess-murid').value.trim();
    const clearBtn = document.getElementById('clear-search-murid');
    const dropdown = document.getElementById('dropdown-assess-murid');

    if (keyword.length > 0) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
        dropdown.classList.add('hidden');
        return;
    }

    debounceTimerMurid = setTimeout(() => {
        cariMuridAssessment(keyword);
    }, 300);
}

export async function cariMuridAssessment(keyword) {
    const dropdown = document.getElementById('dropdown-assess-murid');
    dropdown.innerHTML = '<div class="p-3 text-xs text-slate-500 italic text-center">🔄 Mencari di database...</div>';
    dropdown.classList.remove('hidden');

    try {
        const { data, error } = await sb.from('murid')
            .select('id_murid, nama_murid, nama_panggilan')
            .or(`nama_murid.ilike.%${keyword}%,nama_panggilan.ilike.%${keyword}%`)
            .limit(10); 

        if (error) throw error;

        if (data.length === 0) {
            dropdown.innerHTML = '<div class="p-3 text-xs text-red-500 font-bold text-center">❌ Tidak ada murid yang cocok</div>';
            return;
        }

        let html = '';
        data.forEach(m => {
            const panggilan = m.nama_panggilan ? m.nama_panggilan : m.nama_murid.split(' ')[0];
            html += `
            <div onclick="pilihMuridAutocomplete(${m.id_murid}, '${panggilan}', '${m.nama_murid}')" class="p-3 border-b border-slate-100 hover:bg-sky-50 cursor-pointer transition">
                <div class="font-bold text-sky-700 text-sm">${panggilan}</div>
                <div class="text-[10px] text-slate-500">👤 ${m.nama_murid}</div>
            </div>`;
        });
        dropdown.innerHTML = html;

    } catch (error) {
        console.error("Gagal mencari murid:", error);
        dropdown.innerHTML = '<div class="p-3 text-xs text-red-500 text-center">⚠️ Terjadi gangguan jaringan</div>';
    }
}

export function pilihMuridAutocomplete(id, panggilan, namaLengkap) {
    document.getElementById('search-assess-murid').value = `${panggilan} (${namaLengkap})`;
    document.getElementById('assess-murid').value = id; 
    document.getElementById('dropdown-assess-murid').classList.add('hidden'); 
    
    loadAssessmentDetail(); 
}

export function clearSearchMurid() {
    document.getElementById('search-assess-murid').value = '';
    document.getElementById('assess-murid').value = '';
    document.getElementById('dropdown-assess-murid').classList.add('hidden');
    document.getElementById('clear-search-murid').classList.add('hidden');
    
    loadAssessmentDetail();
}

/* =========================================================
   MODUL COACH: ASSESSMENT & PROGRESS
========================================================= */
export async function loadCoachAssessment() {
    loadRiwayatAssessment();
    loadBelumAssessment(); 
}

export async function loadBelumAssessment() {
    const container = document.getElementById('list-belum-assessment');
    if (!container) return;

    try {
        const { data: muridAktif, error: errMurid } = await sb.from('murid').select('id_murid, nama_murid').gt('sisa_sesi', 0);
        if (errMurid) throw errMurid;

        const { data: logAssessment, error: errLog } = await sb.from('assessment_log').select('id_murid');
        if (errLog) throw errLog;

        const idSudahDinilai = [...new Set(logAssessment.map(item => item.id_murid))];
        const muridBelumDinilai = muridAktif.filter(m => !idSudahDinilai.includes(m.id_murid));

        if (muridBelumDinilai.length === 0) {
            container.innerHTML = '<span style="font-size:11px; background:#10b981; color:white; padding:4px 10px; border-radius:12px; font-weight:bold;">✨ Mantap! Semua murid aktif sudah memiliki rapor.</span>';
            return;
        }

        let html = '';
        muridBelumDinilai.forEach(m => {
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

export async function pilihAnakBelumDinilai(idMurid) {
    document.getElementById('assess-murid').value = idMurid; 
    
    const { data } = await sb.from('murid').select('nama_murid, nama_panggilan').eq('id_murid', idMurid).maybeSingle();
    if(data) {
        const panggilan = data.nama_panggilan || data.nama_murid.split(' ')[0];
        document.getElementById('search-assess-murid').value = `${panggilan} (${data.nama_murid})`;
        document.getElementById('clear-search-murid').classList.remove('hidden');
    }
    
    loadAssessmentDetail(); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
}

export async function loadAssessmentDetail() {
    const idMurid = document.getElementById('assess-murid').value;
    if(!idMurid) return;

    let hiddenId = document.getElementById('ass-edit-id');
    if(hiddenId) hiddenId.value = ""; 

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

    const btn = document.querySelector('button[onclick*="simpanAssessment"]');
    if (btn) btn.innerHTML = "💾 Simpan Assessment";
}

export async function editAssessmentLog(idAssessment, idMurid) {
    document.getElementById('assess-murid').value = idMurid;

    const { data: dataMurid } = await sb.from('murid').select('nama_murid, nama_panggilan').eq('id_murid', idMurid).maybeSingle();
    if(dataMurid) {
        const panggilan = dataMurid.nama_panggilan || dataMurid.nama_murid.split(' ')[0];
        document.getElementById('search-assess-murid').value = `${panggilan} (${dataMurid.nama_murid})`;
        document.getElementById('clear-search-murid').classList.remove('hidden');
    }

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
    const btn = document.querySelector('button[onclick*="simpanAssessment"]');
    if (btn) btn.innerHTML = "💾 Update Assessment";
}

export async function simpanAssessment() {
    const idMurid = document.getElementById('assess-murid').value;
    if(!idMurid) return alert("Cari dan pilih murid terlebih dahulu!");

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

    const btn = document.querySelector('button[onclick*="simpanAssessment"]');
    if(btn) { btn.innerHTML = "⏳ Menganalisis Kelulusan & Menyimpan Data..."; btn.disabled = true; }

    let hiddenId = document.getElementById('ass-edit-id');
    const idAssessment = hiddenId ? hiddenId.value : "";
    let errorData;

    try {
        if (idAssessment) {
            const { error } = await sb.from('assessment_log').update(payload).eq('id_assessment', idAssessment);
            errorData = error;
        } else {
            const { error } = await sb.from('assessment_log').insert([payload]);
            errorData = error;
        }
        
        if (errorData) throw errorData;

        let statusLulus = false;
        let pesanKelulusan = "";

        if (valFree >= 95 && valBreast >= 100) {
            statusLulus = true;
            pesanKelulusan = "\n\n🎉 SELAMAT! Nilai memenuhi syarat. Sertifikat Kelulusan Level 1 otomatis TERBUKA!";
        } else {
            statusLulus = false;
            pesanKelulusan = "\n\n🔒 Nilai belum memenuhi standar kelulusan (Bebas 95%, Dada 100%).";
        }

        const { error: errLulus } = await sb.from('murid').update({ lulus_level_1: statusLulus }).eq('id_murid', idMurid);
        if (errLulus) throw errLulus;

        const checkboxPotong = document.getElementById('ass-potong-sesi');
        let pesanSesi = "";
        
        if (checkboxPotong && checkboxPotong.checked) {
            const { data: dataSiswa } = await sb.from('murid').select('sisa_sesi').eq('id_murid', idMurid).single();
            if (dataSiswa && dataSiswa.sisa_sesi > 0) {
                await sb.from('murid').update({ sisa_sesi: dataSiswa.sisa_sesi - 1 }).eq('id_murid', idMurid);
                pesanSesi = "Sisa Sesi berhasil dipotong 1.";
                checkboxPotong.checked = false; 
            } else {
                pesanSesi = "Peringatan: Sisa sesi murid sudah habis!";
                checkboxPotong.checked = false;
            }
        } else {
            pesanSesi = "Sesi tidak dipotong.";
        }
        
        alert(`Mantap Coach! Rapor tersimpan.\n${pesanSesi}${pesanKelulusan}`);
        
        if (hiddenId) hiddenId.value = ""; 
        document.getElementById('ass-catatan').value = ""; 
        clearSearchMurid(); 
        
        if (typeof loadRiwayatAssessment === "function") loadRiwayatAssessment(); 
        if (typeof loadBelumAssessment === "function") loadBelumAssessment(); 

    } catch (err) {
        alert("Gagal memproses data: " + err.message);
    } finally {
        if(btn) { btn.innerHTML = "💾 Simpan Assessment"; btn.disabled = false; }
    }
}

export async function loadRiwayatAssessment() {
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
        const safeNama = nama.replace(/'/g, "\\'");
        
        html += `
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative;">
            
            <button onclick="editAssessmentLog(${item.id_assessment}, ${item.id_murid})" style="position: absolute; top: 12px; right: 12px; width: max-content !important; min-width: 50px; background:#f59e0b; color:white; border:none; border-radius:4px; padding:6px 10px; font-size:11px; cursor:pointer; font-weight:bold; display: inline-block;">✏️ Edit</button>

            <!-- TOMBOL PDF YANG UDAH DIRAPIKAN -->
            <button onclick="downloadRaporPDF(${item.id_assessment}, '${safeNama}')" style="position: absolute; top: 12px; right: 75px; width: max-content !important; min-width: 50px; background:#4f46e5; color:white; border:none; border-radius:4px; padding:6px 10px; font-size:11px; cursor:pointer; font-weight:bold; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">📥 PDF</button>

            <div style="padding-right: 140px; margin-bottom: 12px; border-bottom: 1px solid #f8fafc; padding-bottom: 8px;">
                <strong style="color:#0369a1; font-size:14px; display:block; margin-bottom:4px;">${nama}</strong>
                <span style="font-size:11px; color:#64748b; font-weight:bold;">📅 ${item.tanggal_assessment}</span>
            </div>
            
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
   🔥 OBAT FINAL: JEDA WAKTU (DELAY PAINTING) 🔥
========================================================= */
export async function downloadRaporPDF(idAssessment, namaSiswa) {
    try {
        const { data, error } = await sb.from('assessment_log').select('*').eq('id_assessment', idAssessment).single();
        if(error || !data) throw error;

        const isLulus = (data.freestyle_stroke >= 95 && data.breaststroke >= 100);
        const statusText = isLulus ? "LULUS LEVEL 1 (GRADUATED)" : "DALAM PROSES (IN PROGRESS)";
        const statusColor = isLulus ? "#059669" : "#d97706"; 

        const pdfContainer = document.createElement('div');
        pdfContainer.id = "temp-pdf-rapor";
        // Kita taruh di belakang layar (z-index -9999) biar HP tetap merender warnanya secara fisik, tapi gak nutupin layar aslimu
        pdfContainer.style.position = 'fixed';
        pdfContainer.style.top = '0';
        pdfContainer.style.left = '0';
        pdfContainer.style.width = '800px';
        pdfContainer.style.backgroundColor = '#ffffff';
        pdfContainer.style.zIndex = '-9999';
        pdfContainer.style.padding = '40px';
        pdfContainer.style.boxSizing = 'border-box';

        // Isi HTML (Sama persis)
        pdfContainer.innerHTML = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000000;">
                <div style="text-align: center; border-bottom: 3px solid #0284c7; padding-bottom: 15px; margin-bottom: 30px;">
                    <h1 style="color: #0284c7; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">JAGO RENANG ACADEMY</h1>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px; font-weight: bold; letter-spacing: 2px;">STUDENT PROGRESS REPORT</p>
                </div>
                <div style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold;">Nama Atlet / Siswa:</p>
                        <h2 style="margin: 0; color: #1e293b; font-size: 20px;">${namaSiswa}</h2>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold;">Tanggal Evaluasi:</p>
                        <h2 style="margin: 0; color: #1e293b; font-size: 16px;">${data.tanggal_assessment}</h2>
                    </div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px;">
                    <thead>
                        <tr style="background-color: #f0f9ff; border-top: 2px solid #bae6fd; border-bottom: 2px solid #bae6fd;">
                            <th style="padding: 12px; text-align: left; font-size: 13px; color: #0369a1; width: 75%;">MATERI EVALUASI KETERAMPILAN</th>
                            <th style="padding: 12px; text-align: center; font-size: 13px; color: #0369a1; width: 25%;">PENCAPAIAN</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e0f2fe;">
                            <td style="padding: 10px 12px; font-size: 13px; color: #334155;">1. Floating & Streamline (Mengapung)</td>
                            <td style="padding: 10px 12px; text-align: center; font-size: 14px; font-weight: bold; color: #0284c7;">${data.floating_streamline || 0}%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e0f2fe;">
                            <td style="padding: 10px 12px; font-size: 13px; color: #334155;">2. Breathing Control (Pernapasan)</td>
                            <td style="padding: 10px 12px; text-align: center; font-size: 14px; font-weight: bold; color: #0284c7;">${data.breathing_control || 0}%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e0f2fe;">
                            <td style="padding: 10px 12px; font-size: 13px; color: #334155;">3. Freestyle Kicking (Kaki Bebas)</td>
                            <td style="padding: 10px 12px; text-align: center; font-size: 14px; font-weight: bold; color: #0284c7;">${data.freestyle_kicking || 0}%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e0f2fe;">
                            <td style="padding: 10px 12px; font-size: 13px; color: #334155;">4. Freestyle Stroke (Tangan Bebas)</td>
                            <td style="padding: 10px 12px; text-align: center; font-size: 14px; font-weight: bold; color: #0284c7;">${data.freestyle_stroke || 0}%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e0f2fe;">
                            <td style="padding: 10px 12px; font-size: 13px; color: #334155;">5. Breaststroke (Gaya Dada)</td>
                            <td style="padding: 10px 12px; text-align: center; font-size: 14px; font-weight: bold; color: #0284c7;">${data.breaststroke || 0}%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e0f2fe;">
                            <td style="padding: 10px 12px; font-size: 13px; color: #334155;">6. Backstroke (Gaya Punggung)</td>
                            <td style="padding: 10px 12px; text-align: center; font-size: 14px; font-weight: bold; color: #0284c7;">${data.backstroke || 0}%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e0f2fe;">
                            <td style="padding: 10px 12px; font-size: 13px; color: #334155;">7. Butterfly Stroke (Gaya Kupu-kupu)</td>
                            <td style="padding: 10px 12px; text-align: center; font-size: 14px; font-weight: bold; color: #0284c7;">${data.butterfly_stroke || 0}%</td>
                        </tr>
                    </tbody>
                </table>
                <div style="margin-bottom: 40px; display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block; margin-bottom: 6px;">Status Program:</span>
                        <span style="background-color: ${statusColor}15; color: ${statusColor}; padding: 8px 16px; border-radius: 6px; font-weight: 900; font-size: 15px; border: 1px solid ${statusColor}40; display: inline-block;">
                            ${statusText}
                        </span>
                    </div>
                    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 16px; border-radius: 8px;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block; margin-bottom: 6px;">Catatan & Evaluasi Pelatih:</span>
                        <p style="margin: 0; font-size: 13px; color: #334155; font-style: italic; line-height: 1.6;">
                            "${data.catatan_coach || 'Terus semangat berlatih dan pertahankan konsistensi!'}"
                        </p>
                    </div>
                </div>
                <div style="margin-top: 60px; text-align: right; color: #334155;">
                    <p style="margin: 0 0 70px 0; font-size: 13px;">Disahkan oleh,</p>
                    <p style="margin: 0; font-weight: bold; text-decoration: underline; font-size: 15px;">Coach ${localStorage.getItem('loggedInUser') || 'Instruktur JR'}</p>
                    <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Instruktur Penilai</p>
                </div>
            </div>
        `;

        document.body.appendChild(pdfContainer);

        // 🔥 KUNCI OBATNYA DI SINI: Kasih jeda 1 detik biar HP Android-mu sempet ngegambar semua tabel & warna sebelum dijepret!
        alert("⏳ Menggambar PDF... Tunggu 1 Detik ya!");
        await new Promise(resolve => setTimeout(resolve, 1000));

        const opt = {
            margin:       0,
            filename:     `Rapor_${namaSiswa.replace(/\s+/g, '_')}_${data.tanggal_assessment}.pdf`,
            image:        { type: 'jpeg', quality: 1 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true,
                windowWidth: 800
            }, 
            jsPDF:        { unit: 'px', format: [800, 1131], orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(pdfContainer).save();
        
        document.body.removeChild(pdfContainer);
        
    } catch(e) {
        console.error(e);
        alert("Gagal mencetak Rapor: " + e.message);
        const temp = document.getElementById('temp-pdf-rapor');
        if(temp) document.body.removeChild(temp);
    }
}

/* =========================================================
   MODUL FEE, AKUNTING, & PROFIL - FIXED IDENTITAS
========================================================= */
export async function tambahAkunting() {
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
        
        if (typeof window.loadAkuntingAdmin === "function") window.loadAkuntingAdmin(); 
        if (typeof window.loadRekapAkunting === "function") window.loadRekapAkunting(); 
    }
}

export async function loadCoachFee() {
    const totalEl = document.getElementById('coach-total-fee');
    const listEl = document.getElementById('coach-fee-list');
    if (!totalEl || !listEl) return;

    const userSesi = localStorage.getItem("loggedInUser") || localStorage.getItem("username");
    if (!userSesi) return listEl.innerHTML = "Coach belum login.";

    try {
        const { data: masterCoach } = await sb.from('coach')
            .select('nama_coach')
            .eq('username', userSesi)
            .maybeSingle();

        const namaAsli = masterCoach ? masterCoach.nama_coach : userSesi;

        const { data, error } = await sb.from("fee_coach")
            .select("*")
            .eq("nama_coach", namaAsli) 
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

    } catch (err) {
        console.error(err);
        listEl.innerHTML = "Terjadi kesalahan sistem.";
    }
}

export async function loadProfilCoach() {
    const user = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
    if (!user) return;

    try {
        const { data, error } = await sb.from('coach').select('*').eq('username', user).single();
        if (error || !data) throw new Error("Data master coach tidak ditemukan.");

        const namaDisplay = document.getElementById('coach-nama-display');
        const infoSpesialisasi = document.getElementById('coach-info-spesialisasi');
        const infoWa = document.getElementById('coach-info-wa');
        const img = document.getElementById('coach-view-foto');

        if(namaDisplay) namaDisplay.innerText = data.nama_coach;
        if(infoSpesialisasi) infoSpesialisasi.innerText = `Spesialisasi: ${data.spesialisasi || '-'}`;
        if(infoWa) infoWa.innerText = `WhatsApp: ${data.no_wa || '-'}`;
        
        if(img) {
            if (data.foto_profil) img.src = data.foto_profil;
            else img.src = 'images/default-avatar.png'; 
        }

        window.activeCoachDbId = data.id;

    } catch (err) {
        console.error(err);
        alert("Gagal memuat profil. Pastikan Admin sudah membuatkan Master Data Coach untuk akun ini.");
    }
}

export async function simpanProfilCoach() {
    const uploadFoto = document.getElementById('coach-upload-foto');
    if(!uploadFoto) return;
    
    const file = uploadFoto.files[0];
    const coachId = window.activeCoachDbId;

    if (!file) return alert("Silakan pilih foto terlebih dahulu!");
    if (!coachId) return alert("Sistem belum memuat data profil. Silakan muat ulang halaman.");

    try {
        const namaDisplay = document.getElementById('coach-nama-display');
        if(namaDisplay) namaDisplay.innerText = "Mengunggah...";

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
// REGISTER TO WINDOW (BIAR ONCLICK HTML TETAP JALAN)
// =========================================================
window.loadDropdownMuridCoach = loadDropdownMuridCoach;
window.tambahMuridKeListCoach = tambahMuridKeListCoach;
window.resetListCoach = resetListCoach;
window.simpanJadwalCoach = simpanJadwalCoach;
window.editJadwalCoach = editJadwalCoach;
window.loadCoachAdmin = loadCoachAdmin;
window.loadCoachJadwal = loadCoachJadwal;
window.coachInsertMurid = coachInsertMurid;
window.selesaiTugasJadwal = selesaiTugasJadwal;
window.batalTugasJadwal = batalTugasJadwal;
window.loadAntreanFeeAdmin = loadAntreanFeeAdmin;
window.accFeeCoach = accFeeCoach;

// Autocomplete Register
window.debounceSearchMurid = debounceSearchMurid;
window.cariMuridAssessment = cariMuridAssessment;
window.pilihMuridAutocomplete = pilihMuridAutocomplete;
window.clearSearchMurid = clearSearchMurid;

// Assessment Register
window.loadCoachAssessment = loadCoachAssessment;
window.loadBelumAssessment = loadBelumAssessment;
window.pilihAnakBelumDinilai = pilihAnakBelumDinilai;
window.loadAssessmentDetail = loadAssessmentDetail;
window.editAssessmentLog = editAssessmentLog;
window.simpanAssessment = simpanAssessment;
window.loadRiwayatAssessment = loadRiwayatAssessment;
window.downloadRaporPDF = downloadRaporPDF; // <-- Fungsi sakti DFF TAHAP 1

// Fee & Profil
window.tambahAkunting = tambahAkunting;
window.loadCoachFee = loadCoachFee;
window.loadProfilCoach = loadProfilCoach;
window.simpanProfilCoach = simpanProfilCoach;

// REGISTER HEADER DINAMIS COACH
window.bukaModalFeeCoach = bukaModalFeeCoach;
window.jalankanJamCoach = jalankanJamCoach;
window.loadProfilHeaderCoach = loadProfilHeaderCoach;
window.uploadAvatarCoach = uploadAvatarCoach;

// TRIGGER AWAL SAAT DASHBOARD DIBUKA
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if(document.getElementById('coach-jam-realtime')) jalankanJamCoach();
        if(document.getElementById('header-coach-nama')) loadProfilHeaderCoach();
    }, 500);
});
