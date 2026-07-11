import { sb } from './config.js';

// ===================================================
// 1. LOAD JADWAL COACH (LIVE)
// ===================================================
export async function loadCoachAdmin() {
    const list = document.getElementById('admin-coach-list');
    if (!list) return;
    list.innerHTML = '<p class="text-sky-600 text-sm font-bold animate-pulse">⏳ Memuat jadwal penugasan...</p>';

    try {
        const { data, error } = await sb.from('jadwal_coach').select('*').order('id', { ascending: false });
        if (error) throw error;

        let html = '';
        data?.forEach(j => {
            html += `
            <div class="bg-white border border-slate-200 rounded-xl p-4 mb-3 shadow-sm">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <strong class="text-sky-700 text-sm">👨‍🏫 Coach ${j.nama_coach}</strong>
                        <span class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold ml-2">${j.tipe_kelas}</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded text-xs font-bold transition" onclick="hapusData('jadwal_coach', '${j.id}', loadCoachAdmin)">❌ Hapus</button>
                    </div>
                </div>
                <p class="text-xs text-slate-500 m-0">🗓️ ${j.hari}, Jam ${j.jam} | 📍 ${j.lokasi}</p>
                <p class="text-xs font-bold text-slate-700 mt-1">👥 Jagoan: ${j.murid || 'Belum ada murid di-assign'}</p>
            </div>`;
        });
        list.innerHTML = html || '<p class="text-slate-400 text-sm">Belum ada penugasan coach.</p>';
    } catch (e) {
        list.innerHTML = `<p class="text-red-500 text-sm">Gagal muat data: ${e.message}</p>`;
    }
}

// ===================================================
// 2. INIT DROPDOWN (COACH & MURID)
// ===================================================
export async function initDropdownCoach() {
    const selCoach = document.getElementById('coach-nama');
    const selMurid = document.getElementById('coach-murid');
    
    if (selCoach) {
        try {
            const { data } = await sb.from('users').select('username').eq('role', 'coach');
            selCoach.innerHTML = '<option value="">-- Pilih Coach Aktif --</option>';
            data?.forEach(c => {
                selCoach.innerHTML += `<option value="${c.username}">${c.username}</option>`;
            });
        } catch(e) { console.error("Gagal load coach", e); }
    }

    if (selMurid) {
        try {
            // Pakai select * biar nembus walaupun kolom nama_lengkap blm lu bikin
            const { data } = await sb.from('murid').select('*').gt('sisa_sesi', 0);
            selMurid.innerHTML = '<option value="">-- Pilih Murid (Sisa > 0) --</option>';
            data?.forEach(m => {
                let nama = m.nama_murid || m.nama_lengkap || 'Tanpa Nama';
                selMurid.innerHTML += `<option value="${m.id_murid}" data-nama="${nama}">${nama} (Sisa: ${m.sisa_sesi})</option>`;
            });
        } catch(e) { 
            selMurid.innerHTML = '<option value="">Gagal muat murid (Data Kosong)</option>';
        }
    }
}

// ===================================================
// 3. TAMBAH MURID KE LIST
// ===================================================
export function tambahMuridKeListCoach() {
    const select = document.getElementById('coach-murid');
    if(!select.value) return alert("Pilih jagoan (murid) dulu dari dropdown!");
    
    const nama = select.options[select.selectedIndex].getAttribute('data-nama');
    const idMurid = select.value;
    
    const inputNama = document.getElementById('coach-list-nama');
    const inputId = document.getElementById('coach-list-id');
    
    if (inputNama.value === '') {
        inputNama.value = nama;
        inputId.value = idMurid;
    } else {
        if(inputNama.value.includes(nama)) return alert("Murid ini udah lu masukin ke list!");
        inputNama.value += ", " + nama;
        inputId.value += "," + idMurid;
    }
}

// ===================================================
// 4. RESET LIST MURID
// ===================================================
export function resetListCoach() {
    document.getElementById('coach-list-nama').value = '';
    document.getElementById('coach-list-id').value = '';
}

// ===================================================
// 5. SIMPAN JADWAL COACH & POTONG SESI
// ===================================================
export async function simpanJadwalCoach() {
    const btn = document.getElementById('btn-coach');
    const dataObj = {
        nama_coach: document.getElementById('coach-nama').value,
        hari: document.getElementById('coach-hari').value,
        jam: document.getElementById('coach-jam').value,
        lokasi: document.getElementById('coach-lokasi').value,
        tipe_kelas: document.getElementById('coach-tipe').value,
        murid: document.getElementById('coach-list-nama').value,
    };
    
    const listIdMurid = document.getElementById('coach-list-id').value;

    if (!dataObj.nama_coach || !dataObj.jam || !dataObj.lokasi) {
        return alert("Wajib isi Coach, Jam, dan Lokasi Kolam bray!");
    }

    btn.innerText = "⏳ Menyimpan Penugasan...";
    btn.disabled = true;

    try {
        const { error } = await sb.from('jadwal_coach').insert([dataObj]);
        if (error) throw error;
        
        // Fitur Dewa: Otomatis potong sisa sesi semua murid yang ada di list
        if (listIdMurid) {
            const ids = listIdMurid.split(',');
            for (let idM of ids) {
                const { data: mData } = await sb.from('murid').select('sisa_sesi').eq('id_murid', idM).single();
                if (mData && mData.sisa_sesi > 0) {
                    await sb.from('murid').update({ sisa_sesi: mData.sisa_sesi - 1 }).eq('id_murid', idM);
                }
            }
        }
        
        alert("🔥 Jadwal Coach sukses disimpan & Sesi murid otomatis terpotong!");
        
        // Bersih-bersih Form
        document.getElementById('coach-jam').value = '';
        document.getElementById('coach-lokasi').value = '';
        resetListCoach();
        loadCoachAdmin();
        
    } catch (e) {
        alert("Gagal nyimpen jadwal: " + e.message);
    } finally {
        btn.innerText = "⚡ Simpan Penugasan";
        btn.disabled = false;
    }
}

// ===================================================
// DAFTARKAN KE MANDOR
// ===================================================
window.loadCoachAdmin = loadCoachAdmin;
window.initDropdownCoach = initDropdownCoach;
window.tambahMuridKeListCoach = tambahMuridKeListCoach;
window.resetListCoach = resetListCoach;
window.simpanJadwalCoach = simpanJadwalCoach;
