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
        // Tarik data dari tabel rekap fee / gaji coach lu
        const { data, error } = await sb.from('rekap_fee').select('*').order('id', { ascending: false });
        
        if (error) {
            list.innerHTML = `<p class="text-red-400 text-xs">Menunggu tabel rekap_fee dibuat.</p>`;
            return;
        }

        let html = '';
        data?.forEach(f => {
            let uang = f.total_fee || f.total || f.nominal || 0;
            html += `
            <div class="bg-slate-800 text-slate-200 p-3 rounded-lg mb-2 flex justify-between items-center text-xs border border-slate-700 shadow-sm">
                <div>
                    <strong class="text-sky-400 font-bold">👨‍🏫 Coach ${f.nama_coach || '-'}</strong>
                    <p class="m-0 mt-1 text-[10px] text-slate-400">Murid: ${f.nama_murid || '-'} (${f.jml_sesi || 0} Sesi)</p>
                </div>
                <div class="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                    ${formatRp(uang)}
                </div>
            </div>`;
        });
        
        list.innerHTML = html || '<p class="text-xs text-slate-400">Belum ada rekap fee terbaru.</p>';
    } catch(e) { console.error(e); }
}

window.loadFeeAdmin = loadFeeAdmin;
window.loadRekapFee = loadRekapFee;
