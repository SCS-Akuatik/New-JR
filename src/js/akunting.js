import { sb } from './config.js';

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

export async function loadAkuntingAdmin() {
    loadRekapAkunting();
    loadHistoryInvoice();
}

export async function loadRekapAkunting() {
    // Cari wadah list kas
    const list = document.getElementById('admin-akunting-list') || document.querySelector('[id*="jurnal"]');
    
    try {
        const { data, error } = await sb.from('akunting').select('*').order('id', { ascending: false });
        if(error) throw error;

        let html = '';
        let totalMasuk = 0;
        let totalKeluar = 0;

        data?.forEach(a => {
            let uang = Number(a.jumlah) || 0; 
            let isMasuk = a.jenis === 'Pemasukan' || a.jenis === 'Masuk';
            
            // MESIN HITUNG
            if (isMasuk) totalMasuk += uang;
            else totalKeluar += uang;

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

        if(list) list.innerHTML = html || '<p class="text-xs text-slate-400">Belum ada catatan jurnal.</p>';

        // UPDATE UI STATISTIK KAS
        let saldoAkhir = totalMasuk - totalKeluar;
        
        // Target ID di HTML lu
        const elMasuk = document.getElementById('text-pemasukan') || document.querySelector('[id*="pemasukan"]');
        const elKeluar = document.getElementById('text-pengeluaran') || document.querySelector('[id*="pengeluaran"]');
        const elSaldo = document.getElementById('text-saldo-akhir') || document.querySelector('[id*="saldo-akhir"]');

        if (elMasuk) elMasuk.innerText = formatRp(totalMasuk);
        if (elKeluar) elKeluar.innerText = formatRp(totalKeluar);
        if (elSaldo) elSaldo.innerText = formatRp(saldoAkhir);

    } catch(e) { console.error("Error Akunting:", e); }
}

export async function loadHistoryInvoice() {
    // Cari wadah invoice
    const list = document.getElementById('admin-invoice-list') || document.getElementById('history-invoice-list') || document.querySelector('.invoice-list-container');
    if(!list) return; // Kalau ID HTML ga ada, dia brenti.
    
    try {
        const { data, error } = await sb.from('invoices').select('*').order('id', { ascending: false }).limit(10);
        if(error) throw error;
        
        let html = '';
        data?.forEach(inv => {
            let nama = inv.nama_murid || inv.nama || 'Tanpa Nama';
            let total = inv.total || inv.jumlah || inv.total_tagihan || 0;
            let status = inv.status || 'Lunas';
            let statusColor = status.toLowerCase() === 'void' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600';

            // Desain Putih ala Vanilla
            html += `
            <div class="bg-white rounded-xl p-3 mb-3 border border-slate-200 shadow-sm text-xs">
                <div class="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                    <strong class="text-sky-700">${inv.nomor_invoice || inv.no_invoice || '-'}</strong>
                    <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${statusColor}">${status}</span>
                </div>
                <div class="flex justify-between items-end">
                    <div class="text-slate-500">
                        <p class="m-0 font-bold">👨‍🎓 ${nama}</p>
                        <p class="m-0 mt-1">📅 ${inv.tanggal_invoice || inv.created_at ? inv.created_at.split('T')[0] : '-'}</p>
                    </div>
                    <strong class="text-slate-800 text-sm">${formatRp(total)}</strong>
                </div>
            </div>`;
        });
        
        list.innerHTML = html || '<p class="text-xs text-slate-500">History kosong.</p>';
    } catch(e) {
        console.error("Error Invoice:", e);
        list.innerHTML = '<p class="text-xs text-red-500">Gagal memuat history.</p>';
    }
}

window.loadAkuntingAdmin = loadAkuntingAdmin;
window.loadRekapAkunting = loadRekapAkunting;
window.loadHistoryInvoice = loadHistoryInvoice;
