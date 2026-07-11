import { sb } from './config.js';

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

export async function loadAkuntingAdmin() {
    loadRekapAkunting();
    loadHistoryInvoice();
}

export async function loadRekapAkunting() {
    const list = document.getElementById('admin-akunting-list');
    if(!list) return;

    try {
        const { data, error } = await sb.from('akunting').select('*').order('id', { ascending: false });
        if(error) throw error;

        let html = '';
        data?.forEach(a => {
            // Pakai kolom JENIS dan JUMLAH sesuai screenshot lu!
            let uang = a.jumlah || 0; 
            let isMasuk = a.jenis === 'Pemasukan';
            let color = isMasuk ? 'text-emerald-500' : 'text-red-500';
            let sign = isMasuk ? '+' : '-';
            
            html += `
            <div class="bg-slate-800 p-3 mb-2 rounded border border-slate-700 flex justify-between items-center text-xs">
                <div>
                    <strong class="block text-slate-200">${a.keterangan || '-'}</strong>
                    <span class="text-[10px] text-slate-400">${a.tanggal || '-'}</span>
                </div>
                <div class="${color} font-bold">${sign} ${formatRp(uang)}</div>
            </div>`;
        });

        document.querySelectorAll('div, p, span').forEach(el => {
            if(el.textContent.trim() === 'Memuat rekap...') el.style.display = 'none';
        });

        list.innerHTML = html || '<p class="text-xs text-slate-400">Belum ada catatan jurnal.</p>';
    } catch(e) { console.error(e); }
}

export async function loadHistoryInvoice() {
    const list = document.getElementById('admin-invoice-list'); // Pastikan ID ini ada di HTML lu
    if(!list) return;
    
    try {
        // Panggil tabel 'invoices' pakai S
        const { data, error } = await sb.from('invoices').select('*').order('id', { ascending: false }).limit(5);
        if(error || !data) throw error;
        
        let html = '';
        data.forEach(inv => {
            let nama = inv.nama_murid || inv.nama || 'Tanpa Nama';
            let total = inv.total || inv.jumlah || inv.total_tagihan || 0;
            html += `<div class="text-xs text-slate-300 p-2 border-b border-slate-700">${inv.nomor_invoice || inv.no_invoice || '-'} | ${nama} | <span class="text-emerald-400 font-bold">${formatRp(total)}</span></div>`;
        });
        
        // Hapus teks loading nyangkut
        document.querySelectorAll('div, p, span').forEach(el => {
            if(el.textContent.trim() === 'Memuat invoice...') el.style.display = 'none';
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
