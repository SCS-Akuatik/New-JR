import { sb } from './config.js';

// ===================================================
// 1. LOAD JADWAL UNTUK NON-MEMBER (HALAMAN DEPAN)
// ===================================================
export async function bukaJadwalUser() {
    if(typeof window.pindahHalaman === 'function') window.pindahHalaman('page-jadwal');
    
    const container = document.getElementById('jadwal-container');
    const sub = document.getElementById('jadwal-sub');
    if(!container) return;

    try {
        const { data: cfg } = await sb.from('pengaturan').select('nilai').eq('kunci', 'sub_judul_jadwal').single();
        if (cfg && sub) sub.innerText = cfg.nilai;

        const { data, error } = await sb.from('jadwal_kelas').select('*').order('id', { ascending: true });
        if (error) throw error;

        let html = '';
        data.forEach(row => {
            let isKosong = row.peserta.toLowerCase().includes('kosong');
            let textColor = isKosong ? 'text-emerald-600' : 'text-red-500';
            let statusText = isKosong ? 'Slot Tersedia' : 'Siswa: ' + row.peserta;

            html += `
            <div class="bg-white border border-slate-200 rounded-xl p-4 mb-3 text-left shadow-sm">
                <div class="flex justify-between items-center mb-2">
                    <span class="bg-sky-600 text-white px-2 py-1 rounded-md text-[11px] font-bold">${row.hari} (${row.jam})</span>
                    <span class="${textColor} text-[11px] font-bold">${statusText}</span>
                </div>
                <h3 class="m-0 text-[15px] font-bold text-slate-800">📍 ${row.lokasi}</h3>
            </div>`;
        });
        container.innerHTML = html || '<p class="text-slate-500 text-sm">Jadwal kosong.</p>';
    } catch(e) { 
        container.innerHTML = '<p class="text-red-500">Gagal memuat jadwal.</p>'; 
    }
}

// ===================================================
// 2. LOAD JADWAL UNTUK ADMIN
// ===================================================
export async function loadJadwalAdmin() {
    const list = document.getElementById('admin-jadwal-list');
    if(!list) return;

    list.innerHTML = '<p class="text-slate-500 text-sm">Memuat jadwal...</p>';
    const { data, error } = await sb.from('jadwal_kelas').select('*').order('id', { ascending: true });
    
    if(error) return list.innerHTML = '<p class="text-red-500">Gagal load data: ' + error.message + '</p>';

    let html = '';
    data?.forEach(j => {
        html += `
        <div class="bg-white border border-slate-200 rounded-xl p-4 mb-3 shadow-sm flex justify-between items-center">
            <div>
                <strong class="text-sky-800 text-sm">${j.hari} - ${j.jam}</strong><br>
                <span class="text-xs text-slate-600">📍 ${j.lokasi}</span><br>
                <span class="text-xs font-bold text-slate-700">👤 ${j.peserta}</span>
            </div>
            <div class="flex gap-2">
                <button class="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-2 rounded-lg text-xs font-bold transition" onclick="editJadwalAdmin('${j.id}', '${j.hari}', '${j.lokasi}', '${j.jam}', '${j.peserta}')">✏️</button>
                <button class="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-lg text-xs font-bold transition" onclick="hapusData('jadwal_kelas', '${j.id}', loadJadwalAdmin)">❌</button>
            </div>
        </div>`;
    });
    list.innerHTML = html || '<p class="text-slate-500 text-sm">Belum ada jadwal.</p>';
}

// ===================================================
// 3. EDIT & SIMPAN JADWAL ADMIN
// ===================================================
export function editJadwalAdmin(id, hari, lokasi, jam, peserta) {
    document.getElementById('jadwal-edit-id').value = id;
    document.getElementById('form-hari').value = hari;
    document.getElementById('form-lokasi').value = lokasi;
    document.getElementById('form-jam').value = jam;
    document.getElementById('form-peserta').value = peserta;
    
    document.getElementById('murid-to-deduct').value = ''; 
    document.getElementById('btn-jadwal').innerText = "💾 Update Jadwal";
    
    window.scrollTo({ top: 0, behavior: "smooth" });
}

export async function simpanJadwal() {
    const id = document.getElementById('jadwal-edit-id').value;
    const btn = document.getElementById('btn-jadwal');
    const dataObj = {
        hari: document.getElementById('form-hari').value,
        lokasi: document.getElementById('form-lokasi').value,
        jam: document.getElementById('form-jam').value,
        peserta: document.getElementById('form-peserta').value
    };

    if (!dataObj.lokasi || !dataObj.jam) return alert("Pilih lokasi dan isi jam!");

    btn.innerText = "⏳ Menyimpan...";

    if (id) {
        const { error } = await sb.from('jadwal_kelas').update(dataObj).eq('id', id);
        if (error) {
            btn.innerText = "💾 Update Jadwal";
            return alert("Gagal update jadwal: " + error.message);
        }
    } else {
        const { error } = await sb.from('jadwal_kelas').insert([dataObj]);
        if (error) {
            btn.innerText = "⚡ Insert Slot";
            return alert("Gagal simpan jadwal: " + error.message);
        }
    }

    // Auto potong sisa sesi murid
    const hiddenDeduct = document.getElementById('murid-to-deduct').value;
    if(hiddenDeduct) {
        const listId = hiddenDeduct.split(',');
        for (let idMurid of listId) {
            const { data: mData } = await sb.from('murid').select('sisa_sesi').eq('id_murid', idMurid).single();
            if(mData && mData.sisa_sesi > 0) {
                await sb.from('murid').update({ sisa_sesi: mData.sisa_sesi - 1 }).eq('id_murid', idMurid);
            }
        }
    }

    alert("Jadwal tersimpan & sisa sesi murid otomatis terpotong! 🔥");

    document.getElementById('jadwal-edit-id').value = '';
    document.getElementById('form-jam').value = '';
    document.getElementById('form-peserta').value = 'Kosong';
    document.getElementById('murid-to-deduct').value = '';
    btn.innerText = "⚡ Insert Slot";

    loadJadwalAdmin();
    loadDropdownMuridBeginner();
}

export async function simpanSubJudul() {
    const teks = document.getElementById('input-sub-jadwal').value;
    if(!teks) return alert("Isi teks terlebih dahulu!");
    const { error } = await sb.from('pengaturan').update({ nilai: teks }).eq('kunci', 'sub_judul_jadwal');
    if(error) alert('Gagal simpan sub judul: ' + error.message);
    else alert('Sub judul berhasil diperbarui!');
}

// ===================================================
// 4. DROPDOWN MURID & INSERT KE SLOT JADWAL
// ===================================================
export async function loadDropdownMuridBeginner() {
    const select = document.getElementById('dropdown-murid-aktif');
    if(!select) return;
    
    select.innerHTML = '<option value="">Pilih Murid (Sisa Sesi > 0)...</option>';
    
    // Perbaikan: Pakai nama_lengkap sesuai skema database di siswa.js
    const { data } = await sb.from('murid')
                           .select('id_murid, nama_lengkap, sisa_sesi')
                           .gt('sisa_sesi', 0)
                           .order('nama_lengkap');

    data?.forEach(m => {
        select.innerHTML += `<option value="${m.id_murid}" data-nama="${m.nama_lengkap}">
            ${m.nama_lengkap} (Sisa: ${m.sisa_sesi})
        </option>`;
    });
}

export function tambahMuridKeJadwal() {
    const select = document.getElementById('dropdown-murid-aktif');
    const idMurid = select.value;
    
    if(!idMurid) return alert("Pilih jagoan (murid) dulu dari dropdown!");

    const namaMurid = select.options[select.selectedIndex].getAttribute('data-nama');
    const formPeserta = document.getElementById('form-peserta');
    const hiddenDeduct = document.getElementById('murid-to-deduct');

    if(formPeserta.value === 'Kosong' || formPeserta.value.trim() === '') {
        formPeserta.value = namaMurid;
    } else {
        if(!formPeserta.value.includes(namaMurid)) {
            formPeserta.value += ", " + namaMurid;
        } else {
            return alert("Murid ini sudah ada di daftar slot!");
        }
    }

    let deductList = hiddenDeduct.value ? hiddenDeduct.value.split(',') : [];
    if(!deductList.includes(idMurid)) {
        deductList.push(idMurid);
        hiddenDeduct.value = deductList.join(',');
    }
}

// ==========================================
// DAFTARKAN KE GLOBAL WINDOW (VITE FIX)
// ==========================================
window.bukaJadwalUser = bukaJadwalUser;
window.loadJadwalAdmin = loadJadwalAdmin;
window.editJadwalAdmin = editJadwalAdmin;
window.simpanJadwal = simpanJadwal;
window.simpanSubJudul = simpanSubJudul;
window.loadDropdownMuridBeginner = loadDropdownMuridBeginner;
window.tambahMuridKeJadwal = tambahMuridKeJadwal;
