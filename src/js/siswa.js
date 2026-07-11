import { sb } from './config.js';

export async function loadSiswaAdmin() {
    const list = document.getElementById('admin-siswa-list');
    if(!list) return;
    list.innerHTML = '<p class="text-sky-600 text-sm font-bold animate-pulse">⏳ Memuat data master siswa...</p>';

    try {
        const { data, error } = await sb.from('murid').select('*').order('id_murid', { ascending: false });
        if(error) throw error;
        
        // Simpan data di memory biar bisa dicari (fitur search)
        window.tempDataSiswa = data; 
        renderListSiswa(data);
    } catch(e) {
        list.innerHTML = `<p class="text-red-500">Gagal: ${e.message}</p>`;
    }
}

export function renderListSiswa(data) {
    const list = document.getElementById('admin-siswa-list');
    let html = '';
    data?.forEach(s => {
        const isAktif = s.status_murid === 'Aktif';
        const statusColor = isAktif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
        const warningSesi = s.sisa_sesi <= 1 ? 'text-red-600 font-bold bg-red-100 px-1 rounded' : 'text-slate-700';
        
        html += `
        <div class="bg-white border border-slate-200 rounded-xl p-4 mb-3 shadow-sm relative">
            <div class="absolute top-3 right-3">
                <button class="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-[10px] font-bold" onclick="hapusData('murid', '${s.id_murid}', loadSiswaAdmin)">❌ Hapus</button>
            </div>
            <h4 class="font-bold text-sky-800 m-0 text-sm pr-16">${s.nama_lengkap || s.nama_murid || 'Tanpa Nama'}</h4>
            <span class="inline-block mt-1 text-[10px] ${statusColor} px-2 py-0.5 rounded-md font-bold">${s.status_murid || 'Aktif'}</span>
            
            <div class="mt-2 text-xs text-slate-500 space-y-1">
                <p>📞 WA Ortu: <span class="font-bold text-slate-700">${s.no_wa_ortu || '-'}</span></p>
                <p>🏊 Sisa Sesi: <span class="${warningSesi}">${s.sisa_sesi || 0}</span></p>
                <p>📦 Paket: <span class="font-bold text-slate-700">${s.jenis_paket || '-'}</span></p>
                <p>⏳ Expired: <span class="font-bold text-slate-700">${s.tgl_expired || '-'}</span></p>
            </div>
        </div>`;
    });
    list.innerHTML = html || '<p class="text-sm text-slate-400">Belum ada murid di database.</p>';
}

export function filterMurid() {
    const input = document.getElementById('search-murid').value.toLowerCase();
    if(!window.tempDataSiswa) return;
    
    const filtered = window.tempDataSiswa.filter(s => {
        const nama = (s.nama_lengkap || s.nama_murid || '').toLowerCase();
        return nama.includes(input);
    });
    renderListSiswa(filtered);
}

export async function simpanSiswa() {
    const id = document.getElementById('sis-edit-id').value;
    const btn = document.getElementById('btn-simpan-siswa');
    
    const dataObj = {
        nama_lengkap: document.getElementById('sis-nama').value,
        nama_murid: document.getElementById('sis-panggilan').value,
        no_wa_ortu: document.getElementById('sis-wa').value,
        tgl_lahir: document.getElementById('sis-tgl-lahir').value,
        status_murid: document.getElementById('sis-status').value,
        jenis_paket: document.getElementById('sis-paket').value,
        sisa_sesi: parseInt(document.getElementById('sis-sesi').value) || 0,
        tgl_mulai_sesi_1: document.getElementById('sis-sesi-1').value,
        tgl_expired: document.getElementById('sis-expired').value,
    };

    if(!dataObj.nama_lengkap) return alert("Nama lengkap wajib diisi bos!");
    btn.innerText = "⏳ Menyimpan...";
    btn.disabled = true;

    try {
        if(id) {
            const { error } = await sb.from('murid').update(dataObj).eq('id_murid', id);
            if(error) throw error;
        } else {
            const { error } = await sb.from('murid').insert([dataObj]);
            if(error) throw error;
        }
        alert("Data Jagoan berhasil ditambahkan!");
        
        // Bersihkan Form
        document.getElementById('sis-edit-id').value = '';
        document.getElementById('sis-nama').value = '';
        document.getElementById('sis-panggilan').value = '';
        document.getElementById('sis-wa').value = '';
        document.getElementById('sis-paket').value = '';
        document.getElementById('sis-sesi').value = '';
        
        loadSiswaAdmin();
    } catch(e) { alert("Gagal simpan: " + e.message); } 
    finally { btn.innerText = "⚡ Simpan Siswa"; btn.disabled = false; }
}

export function autoHitungExpiredSiswa() {
    const tglMulai = document.getElementById('sis-sesi-1').value;
    if(tglMulai) {
        let d = new Date(tglMulai);
        d.setMonth(d.getMonth() + 1); // Otomatis +1 Bulan
        document.getElementById('sis-expired').value = d.toISOString().split('T')[0];
    }
}

// Daftarkan ke Mandor
window.loadSiswaAdmin = loadSiswaAdmin;
window.renderListSiswa = renderListSiswa;
window.filterMurid = filterMurid;
window.simpanSiswa = simpanSiswa;
window.autoHitungExpiredSiswa = autoHitungExpiredSiswa;
