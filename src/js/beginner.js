import { sb } from './config.js';

export async function bukaJadwalUser() {
    if(typeof window.pindahHalaman === 'function') window.pindahHalaman('page-jadwal');
    
    const container = document.getElementById('jadwal-container');
    const sub = document.getElementById('jadwal-sub');
    if(!container) return;

    container.innerHTML = '<p class="text-sky-600 text-sm font-bold animate-pulse">⏳ Menarik data jadwal dari Supabase...</p>';

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
            <div class="bg-white border border-slate-200 rounded-xl p-4 mb-3 text-left shadow-sm">
                <div class="flex justify-between items-center mb-2">
                    <span class="bg-sky-600 text-white px-2 py-1 rounded-md text-[11px] font-bold">${row.hari} (${row.jam})</span>
                    <span class="${textColor} text-[11px] font-bold">${statusText}</span>
                </div>
                <h3 class="m-0 text-[15px] font-bold text-slate-800">📍 ${row.lokasi}</h3>
            </div>`;
        });
        
        container.innerHTML = html || '<p class="text-slate-500 text-sm">Jadwal masih kosong.</p>';
        
    } catch(e) { 
        container.innerHTML = '<p class="text-red-500 font-bold">🚨 Gagal narik data. Cek RLS Supabase!</p>'; 
        console.error(e);
    }
}

window.bukaJadwalUser = bukaJadwalUser;
