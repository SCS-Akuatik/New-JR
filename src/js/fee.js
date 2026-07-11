import { sb } from './config.js';

export async function loadFeeAdmin() {
    // Dropdown Coach buat filter
    const sel = document.getElementById('fee-coach-filter');
    if (sel) {
        const { data } = await sb.from('users').select('username').eq('role', 'coach');
        sel.innerHTML = '<option value="all">Semua Coach</option>' + 
            data?.map(c => `<option value="${c.username}">${c.username}</option>`).join('');
    }
    loadRekapFee();
}

export async function loadRekapFee() {
    const list = document.getElementById('admin-fee-list');
    const filter = document.getElementById('fee-coach-filter')?.value || 'all';
    if(!list) return;

    try {
        let query = sb.from('jadwal_coach').select('*');
        if(filter !== 'all') query = query.eq('nama_coach', filter);
        
        const { data } = await query;
        let html = '';
        data?.forEach(j => {
            html += `
            <div class="bg-slate-800 text-white p-3 rounded-lg mb-2 flex justify-between text-xs">
                <span>👨‍🏫 ${j.nama_coach} - ${j.hari}</span>
                <span class="font-bold text-emerald-400">✅ OK</span>
            </div>`;
        });
        list.innerHTML = html || '<p class="text-xs text-slate-400">Belum ada rekap.</p>';
        document.getElementById('fee-total-kelas').innerText = data?.length || 0;
    } catch(e) { console.error(e); }
}

window.loadFeeAdmin = loadFeeAdmin;
window.loadRekapFee = loadRekapFee;
