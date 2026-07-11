import { sb } from './config.js';

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

export async function loadFeeAdmin() {
    if(typeof window.initDropdownCoach === "function") window.initDropdownCoach();
    loadRekapFee();
}

export async function loadRekapFee() {
    const list = document.getElementById('admin-fee-list');
    if(!list) return;

    try {
        // Panggil tabel fee_coach sesuai screenshot lu
        const { data, error } = await sb.from('fee_coach').select('*').order('id', { ascending: false });
        
        if (error) {
            list.innerHTML = `<p class="text-red-400 text-xs">Gagal load data: ${error.message}</p>`;
            return;
        }

        let html = '';
        data?.forEach(f => {
            html += `
            <div class="bg-slate-800 text-slate-200 p-3 rounded-lg mb-2 flex justify-between items-center text-xs border border-slate-700 shadow-sm">
                <div>
                    <strong class="text-sky-400 font-bold">👨‍🏫 Coach ${f.nama_coach || '-'}</strong>
                    <p class="m-0 mt-1 text-[10px] text-slate-400">Total Sesi: ${f.total_sesi || 0} (${f.jenis_sesi || '-'})</p>
                </div>
                <div class="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                    ${formatRp(f.total_fee || 0)}
                </div>
            </div>`;
        });
        
        list.innerHTML = html || '<p class="text-xs text-slate-400">Belum ada rekap fee terbaru.</p>';
    } catch(e) { console.error(e); }
}

window.loadFeeAdmin = loadFeeAdmin;
window.loadRekapFee = loadRekapFee;
