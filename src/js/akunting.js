import { sb } from './config.js';

// MESIN RUPIAH
const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

export async function loadAkuntingAdmin() {
    loadRekapAkunting();
    loadHistoryInvoice(); // Biar tulisan "Memuat invoice..." ilang
}

export async function loadRekapAkunting() {
    const list = document.getElementById('admin-akunting-list');
    if(!list) return;

    try {
        const { data, error } = await sb.from('akunting').select('*').order('id', { ascending: false });
        if(error) throw error;

        let html = '';
        data?.forEach(a => {
            // Antisipasi nama kolom: jumlah / nominal / total
            let uang = a.jumlah || a.nominal || a.total || 0; 
            let color = (a.tipe === 'Pemasukan' || a.tipe === 'Masuk') ? 'text-emerald-500' : 'text-red-500';
            let sign = (a.tipe === 'Pemasukan' || a.tipe === 'Masuk') ? '+' : '-';
            
            html += `
            <div class="bg-slate-800 p-3 mb-2 rounded border border-slate-700 flex justify-between items-center text-xs">
                <div>
                    <strong class="block text-slate-200">${a.keterangan || '-'}</strong>
                    <span class="text-[10px] text-slate-400">${a.tanggal || '-'}</span>
                </div>
                <div class="${color} font-bold">${sign} ${formatRp(uang)}</div>
            </div>`;
        });
        
        // Hapus teks loading nyangkut
        document.querySelectorAll('div, p, span').forEach(el => {
            if(el.textContent.trim() === 'Memuat rekap...') el.style.display = 'none';
        });

        list.innerHTML = html || '<p class="text-xs text-slate-400">Belum ada catatan jurnal.</p>';
    } catch(e) { console.error(e); }
}

export async function loadHistoryInvoice() {
    const list = document.getElementById('admin-invoice-list'); // Sesuaikan ID di HTML lu
    if(!list) return;
    
    try {
        const { data, error } = await sb.from('invoice').select('*').order('id', { ascending: false }).limit(5);
        if(error || !data) throw error;
        
        let html = '';
        data.forEach(inv => {
            html += `<div class="text-xs text-slate-300 p-2 border-b border-slate-700">${inv.nomor_invoice || '-'} | ${inv.nama_murid || '-'} | <span class="text-emerald-400 font-bold">${formatRp(inv.total)}</span></div>`;
        });
        list.innerHTML = html || '<span class="text-xs text-slate-500">Belum ada history invoice.</span>';
    } catch(e) {
        list.innerHTML = '<span class="text-xs text-slate-500">History kosong.</span>';
    }
}

// Daftarkan ke mandor
window.loadAkuntingAdmin = loadAkuntingAdmin;
window.loadRekapAkunting = loadRekapAkunting;
window.loadHistoryInvoice = loadHistoryInvoice;
