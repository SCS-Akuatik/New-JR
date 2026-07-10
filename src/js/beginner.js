import { sb } from './config.js';

// ===================================================
// 1. LOAD JADWAL UNTUK NON-MEMBER (HALAMAN DEPAN)
// ===================================================
export async function bukaJadwalUser() {
    if(typeof window.pindahHalaman === 'function') window.pindahHalaman('page-jadwal');
    
    const container = document.getElementById('jadwal-container');
    const sub = document.getElementById('jadwal-sub');
    if(!container) return;

    container.innerHTML = '<p class="text-slate-400 text-sm">Memuat jadwal...</p>';

    try {
        const { data: cfg } = await sb.from('pengaturan').select('nilai').eq('kunci', 'sub_judul_jadwal').single();
        if (cfg && sub) sub.innerText = cfg.nilai;

        const { data, error } = await sb.from('jadwal_kelas').select('*').order('id', { ascending: true });
        if (error) throw error;

        let html = '';
        data.forEach(row => {
            let isKosong = row.peserta.toLowerCase().includes('kosong');
            let textColor = isKosong ? 'text-emerald-500' : 'text-red-500';
            let statusText = isKosong ? 'Slot Tersedia' : 'Siswa: ' + row.peserta;

            html += `
            <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-3 text-left shadow-sm">
                <div class="flex justify-between items-center mb-2">
                    <span class="bg-sky-600 text-white px-2 py-1 rounded-md text-[11px] font-bold">${row.hari} (${row.jam})</span>
                    <span class="${textColor} text-[11px] font-bold">${statusText}</span>
                </div>
                <h3 class="m-0 text-[15px] font-bold text-white">📍 ${row.lokasi}</h3>
            </div>`;
        });
        container.innerHTML = html || '<p class="text-slate-400 text-sm">Jadwal kosong.</p>';
    } catch(e) { 
        container.innerHTML = '<p class="text-red-500">Gagal memuat jadwal.</p>'; 
    }
}

// ===================================================
// 2. LOAD JADWAL & DROPDOWN ADMIN
// ===================================================
export async function loadJadwalAdmin() {
    const list = document.getElementById('admin-jadwal-list');
    if(!list) return;

    list.innerHTML = '<p class="text-slate-400 text-sm">Memuat jadwal...</p>';
    
    // TRICK BIAYA CEPAT: Panggil dropdown berbarengan di sini!
    loadDropdownMuridBeginner();
    if (typeof window.loadDaftarKolam === 'function') {
        window.loadDaftarKolam();
    }

    const { data, error } = await sb.from('jadwal_kelas').select('*').order('id', { ascending: true });
    
    if(error) return list.innerHTML = '<p class="text-red-500">Gagal load data: ' + error.message + '</p>';

    let html = '';
    data?.forEach(j => {
        html += `
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-3 shadow-sm flex justify-between items-center">
            <div>
                <strong class="text-sky-400 text-sm">${j.hari} - ${j.jam}</strong><br>
                <span class="text-xs text-slate-300">📍 ${j.lokasi}</span><br>
                <span class="text-xs font-bold text-slate-200">👤 ${j.peserta}</span>
            </div>
            <div class="flex gap-2">
                <button class="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer" onclick="editJadwalAdmin('${j.id}', '${j.hari}', '${j.lokasi}', '${j.jam}', '${j.peserta}')">✏️</button>
                <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer" onclick="hapusData('jadwal_kelas', '${j.id}', loadJadwalAdmin)">❌</button>
            </div>
        </div>`;
    });
    list.innerHTML = html || '<p class="text-slate-400 text-sm">Belum ada jadwal.</p>';
}

// ===================================================
// 3. DROPDOWN MURID (SISA SESI > 0)
// ===================================================
export async function loadDropdownMuridBeginner() {
    const select = document.getElementById('dropdown-murid-aktif');
    if(!select) return;
    
    select.innerHTML = '<option value="">Sedang memuat data murid...</option>';
    
    // CATATAN: Di kode lama lu pakai 'nama_murid', tapi di DB biasanya 'nama_lengkap'. 
    // Kita panggil keduanya biar aman nggak error!
    const { data, error } = await sb.from('murid')
                           .select('id_murid, nama_lengkap, nama_murid, sisa_sesi')
                           .gt('sisa_sesi', 0);

    if(error) {
        select.innerHTML = '<option value="">Gagal muat data</option>';
        return;
    }

    select.innerHTML = '<option value="">Pilih Murid (Sisa Sesi > 0)...</option>';
    data?.forEach(m => {
        // Handle perbedaan nama kolom dari vanilla ke vite
        let namaFinal = m.nama_lengkap || m.nama_murid || 'Tanpa Nama';
        select.innerHTML += `<option value="${m.id_murid}" data-nama="${namaFinal}">
            ${namaFinal} (Sisa: ${m.sisa_sesi})
        </option>`;
    });
}

// ===================================================
// 4. EDIT, INSERT & SIMPAN JADWAL ADMIN
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

    // Reset Form
    document.getElementById('jadwal-edit-id').value = '';
    document.getElementById('form-jam').value = '';
    document.getElementById('form-peserta').value = 'Kosong';
    document.getElementById('murid-to-deduct').value = '';
    btn.innerText = "⚡ Insert Slot";

    loadJadwalAdmin();
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

export async function simpanSubJudul() {
    const teks = document.getElementById('input-sub-jadwal').value;
    if(!teks) return alert("Isi teks terlebih dahulu!");
    const { error } = await sb.from('pengaturan').update({ nilai: teks }).eq('kunci', 'sub_judul_jadwal');
    if(error) alert('Gagal simpan sub judul: ' + error.message);
    else alert('Sub judul berhasil diperbarui!');
}

// ==========================================
// 5. DAFTARKAN KE GLOBAL WINDOW (VITE FIX)
// ==========================================
window.bukaJadwalUser = bukaJadwalUser;
window.loadJadwalAdmin = loadJadwalAdmin;
window.editJadwalAdmin = editJadwalAdmin;
window.simpanJadwal = simpanJadwal;
window.simpanSubJudul = simpanSubJudul;
window.loadDropdownMuridBeginner = loadDropdownMuridBeginner;
window.tambahMuridKeJadwal = tambahMuridKeJadwal;
