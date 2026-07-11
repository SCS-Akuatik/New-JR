import { sb } from './config.js';

export async function loadSiswaAdmin() {
    const list = document.getElementById('admin-siswa-list');
    if(!list) return;
    list.innerHTML = '<p class="text-sky-600 text-sm font-bold animate-pulse">⏳ Memuat data master siswa...</p>';
    
    // NYALAKAN DROPDOWN WALI SEKALIGUS!
    loadDropdownMuridForWali();

    try {
        const { data, error } = await sb.from('murid').select('*').order('id_murid', { ascending: false });
        if(error) throw error;
        window.tempDataSiswa = data; 
        renderListSiswa(data);
    } catch(e) { list.innerHTML = `<p class="text-red-500">Gagal: ${e.message}</p>`; }
}

export function renderListSiswa(data) {
    const list = document.getElementById('admin-siswa-list');
    let html = '';
    data?.forEach(s => {
        const isAktif = s.status_murid === 'Aktif';
        const statusColor = isAktif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
        const warningSesi = s.sisa_sesi <= 1 ? 'text-red-600 font-bold bg-red-100 px-1 rounded' : 'text-slate-700';
        
        // Mencegah error kalau nama ada tanda kutipnya (contoh: D'Academy)
        const namaAman = (s.nama_lengkap || s.nama_murid || 'Tanpa Nama').replace(/'/g, "\\'");
        const panggilanAman = (s.nama_murid || '').replace(/'/g, "\\'");
        const paketAman = (s.jenis_paket || '').replace(/'/g, "\\'");

        html += `
        <div class="bg-white border border-slate-200 rounded-xl p-4 mb-3 shadow-sm relative">
            <div class="absolute top-3 right-3 flex gap-1">
                <button class="bg-sky-100 hover:bg-sky-200 text-sky-700 px-2 py-1 rounded text-[10px] font-bold" onclick="editSiswa('${s.id_murid}', '${namaAman}', '${panggilanAman}', '${s.no_wa_ortu || ''}', '${s.tgl_lahir || ''}', '${s.status_murid || 'Aktif'}', '${paketAman}', '${s.sisa_sesi || 0}', '${s.tgl_mulai_sesi_1 || ''}', '${s.tgl_expired || ''}')">✏️ Edit</button>
                <button class="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-[10px] font-bold" onclick="hapusData('murid', '${s.id_murid}', loadSiswaAdmin)">❌</button>
            </div>
            <h4 class="font-bold text-sky-800 m-0 text-sm pr-20">${namaAman}</h4>
            <span class="inline-block mt-1 text-[10px] ${statusColor} px-2 py-0.5 rounded-md font-bold">${s.status_murid || 'Aktif'}</span>
            
            <div class="mt-2 text-xs text-slate-500 space-y-1">
                <p>📞 WA Ortu: <span class="font-bold text-slate-700">${s.no_wa_ortu || '-'}</span></p>
                <p>🏊 Sisa Sesi: <span class="${warningSesi}">${s.sisa_sesi || 0}</span></p>
                <p>📦 Paket: <span class="font-bold text-slate-700">${paketAman || '-'}</span></p>
                <p>⏳ Expired: <span class="font-bold text-slate-700">${s.tgl_expired || '-'}</span></p>
            </div>
            <div class="mt-3 border-t border-slate-100 pt-3">
                <button class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-xs shadow-sm" onclick="bukaModalInvoice('${s.id_murid}', '${namaAman}', '${paketAman}')">🧾 Buat Invoice Tagihan</button>
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

export function editSiswa(id, nama, panggilan, wa, lahir, status, paket, sesi, tgl1, exp) {
    document.getElementById('sis-edit-id').value = id;
    document.getElementById('sis-nama').value = nama;
    document.getElementById('sis-panggilan').value = panggilan;
    document.getElementById('sis-wa').value = wa;
    document.getElementById('sis-tgl-lahir').value = lahir;
    document.getElementById('sis-status').value = status;
    document.getElementById('sis-paket').value = paket;
    document.getElementById('sis-sesi').value = sesi;
    document.getElementById('sis-sesi-1').value = tgl1;
    document.getElementById('sis-expired').value = exp;
    document.getElementById('btn-simpan-siswa').innerText = "💾 Update Data Siswa";
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    btn.innerText = "⏳ Menyimpan..."; btn.disabled = true;

    try {
        if(id) await sb.from('murid').update(dataObj).eq('id_murid', id);
        else await sb.from('murid').insert([dataObj]);
        
        alert("Data Jagoan berhasil ditambahkan!");
        
        // Reset Form
        document.getElementById('sis-edit-id').value = '';
        document.getElementById('sis-nama').value = '';
        document.getElementById('sis-panggilan').value = '';
        document.getElementById('sis-wa').value = '';
        document.getElementById('sis-paket').value = '';
        document.getElementById('sis-sesi').value = '';
        document.getElementById('btn-simpan-siswa').innerText = "⚡ Simpan Siswa";
        
        loadSiswaAdmin();
    } catch(e) { alert("Gagal simpan: " + e.message); } 
    finally { btn.disabled = false; }
}

export function autoHitungExpiredSiswa() {
    const tglMulai = document.getElementById('sis-sesi-1').value;
    if(tglMulai) {
        let d = new Date(tglMulai);
        d.setMonth(d.getMonth() + 1); // Otomatis +1 Bulan
        document.getElementById('sis-expired').value = d.toISOString().split('T')[0];
    }
}

// ==========================================
// FUNGSI DROPDOWN WALI MURID
// ==========================================
export async function loadDropdownMuridForWali() {
    const selWali = document.getElementById('form-wali-murid');
    const selPrestasi = document.getElementById('prestasi-murid');
    if(!selWali && !selPrestasi) return;

    try {
        const { data } = await sb.from('murid').select('id_murid, nama_lengkap, nama_murid');
        const options = '<option value="">-- Pilih Murid --</option>' + 
            data?.map(m => `<option value="${m.id_murid}">${m.nama_lengkap || m.nama_murid}</option>`).join('');
        
        if(selWali) selWali.innerHTML = options;
        if(selPrestasi) selPrestasi.innerHTML = options;
    } catch(e) { console.error("Gagal load dropdown murid", e); }
}

// ==========================================
// FUNGSI MODAL INVOICE
// ==========================================
export function bukaModalInvoice(idMurid, nama, paket) {
    document.getElementById('hidden-inv-murid-id').value = idMurid;
    document.getElementById('inv-input-nama').value = nama;
    document.getElementById('inv-input-paket').value = paket;
    document.getElementById('inv-nomor').innerText = "INV-" + new Date().getTime();
    
    const hariIni = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    document.getElementById('inv-tanggal').innerText = hariIni;
    
    document.getElementById('modal-invoice').classList.remove('hidden');
}

export function tutupModalInvoice() {
    document.getElementById('modal-invoice').classList.add('hidden');
}

export function hitungTotalInvoice() {
    const biaya = parseInt(document.getElementById('inv-input-biaya').value) || 0;
    const diskon = parseInt(document.getElementById('inv-input-diskon').value) || 0;
    const total = biaya - diskon;
    
    document.getElementById('inv-total-display').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(total);
    
    const tglSesi1 = document.getElementById('inv-sesi-1').value;
    if(tglSesi1) {
        let d = new Date(tglSesi1);
        d.setMonth(d.getMonth() + 1); 
        const expDateStr = d.toISOString().split('T')[0];
        document.getElementById('hidden-inv-expired-date').value = expDateStr;
        document.getElementById('inv-info-expired').innerText = "Expired pada: " + expDateStr;
        document.getElementById('inv-info-expired').classList.replace('text-amber-600', 'text-emerald-600');
    }
}

export function submitInvoiceDatabase() {
    // Tombol ini kita kasih alert sementara, nunggu nyala bareng kuli Akunting
    alert("Siap Bosku! Tagihan siap dikirim. Integrasi ke Jurnal Akunting menyusul di step selanjutnya.");
    tutupModalInvoice();
}

// DAFTARKAN KE MANDOR
window.loadSiswaAdmin = loadSiswaAdmin;
window.renderListSiswa = renderListSiswa;
window.filterMurid = filterMurid;
window.simpanSiswa = simpanSiswa;
window.editSiswa = editSiswa;
window.autoHitungExpiredSiswa = autoHitungExpiredSiswa;
window.loadDropdownMuridForWali = loadDropdownMuridForWali;
window.bukaModalInvoice = bukaModalInvoice;
window.tutupModalInvoice = tutupModalInvoice;
window.hitungTotalInvoice = hitungTotalInvoice;
window.submitInvoiceDatabase = submitInvoiceDatabase;
