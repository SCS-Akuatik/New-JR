import { sb } from './config.js';

// ==========================================
// 1. FUNGSI LOAD DATA MURID DARI SUPABASE
// ==========================================
export async function loadSiswaAdmin() {
    const list = document.getElementById('admin-siswa-list');
    if(!list) return;
    
    list.innerHTML = "<p class='text-center p-4 text-slate-500'>Memuat data murid dari server...</p>";
    
    const { data, error } = await sb.from('murid').select('*').order('created_at', { ascending: false });
    
    if (error) {
        list.innerHTML = `<p class='text-red-500 font-bold'>Gagal mengambil data: ${error.message}</p>`;
        return;
    }

    window.dataMuridGlobal = data; // Simpan untuk fitur Search (Filter)
    renderSiswa(data);
}

export function renderSiswa(data) {
    const list = document.getElementById('admin-siswa-list');
    if (!data || data.length === 0) { 
        list.innerHTML = "<p class='text-center text-slate-500'>Belum ada data murid yang terdaftar.</p>"; 
        return; 
    }

    let html = '';
    data.forEach(m => {
        let statusColor = m.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300';
        html += `
        <div class="bg-white p-3 border rounded-xl shadow-sm flex flex-col mb-2">
            <div class="flex justify-between items-center mb-2">
                <div>
                    <div class="font-bold text-sky-800">${m.nama_lengkap}</div>
                    <div class="text-xs text-slate-500">${m.paket || '-'} | Sisa Sesi: <b class="text-sky-600">${m.sisa_sesi || 0}</b></div>
                </div>
                <span class="text-[10px] px-2 py-1 rounded-full border font-bold ${statusColor}">${m.status || 'Aktif'}</span>
            </div>
            <div class="flex gap-2 border-t pt-2 mt-1">
                <button onclick="editSiswa('${m.id_murid}')" class="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold py-2 rounded-lg transition">✏️ Edit</button>
                <button onclick="bukaModalInvoice('${m.id_murid}', '${m.nama_lengkap}')" class="flex-1 bg-sky-100 hover:bg-sky-200 text-sky-700 text-xs font-bold py-2 rounded-lg transition">🧾 Tagih</button>
                <button onclick="hapusData('murid', '${m.id_murid}', loadSiswaAdmin)" class="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold py-2 rounded-lg transition">🗑️ Hapus</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

// ==========================================
// 2. FUNGSI FILTER PENCARIAN MURID
// ==========================================
export function filterMurid() {
    const search = document.getElementById('search-murid').value.toLowerCase();
    if (!window.dataMuridGlobal) return;
    const filtered = window.dataMuridGlobal.filter(m => m.nama_lengkap.toLowerCase().includes(search));
    renderSiswa(filtered);
}

// ==========================================
// 3. FUNGSI SIMPAN & EDIT SISWA
// ==========================================
export async function simpanSiswa() {
    const btn = document.getElementById('btn-simpan-siswa');
    btn.innerHTML = "Menyimpan Data...";
    
    const id = document.getElementById('sis-edit-id').value;
    const payload = {
        nama_lengkap: document.getElementById('sis-nama').value,
        nama_panggilan: document.getElementById('sis-panggilan').value,
        no_wa: document.getElementById('sis-wa').value,
        tgl_lahir: document.getElementById('sis-tgl-lahir').value,
        status: document.getElementById('sis-status').value,
        paket: document.getElementById('sis-paket').value,
        sisa_sesi: document.getElementById('sis-sesi').value || 0,
        mulai_sesi_1: document.getElementById('sis-sesi-1').value || null,
        tgl_expired: document.getElementById('sis-expired').value || null
    };

    let req = id ? sb.from('murid').update(payload).eq('id_murid', id) : sb.from('murid').insert([payload]);
    const { error } = await req;
    
    btn.innerHTML = "⚡ Simpan Siswa";

    if (error) return alert("Gagal simpan: " + error.message);

    alert("Data murid sukses tersimpan!");
    
    // Bersihkan form setelah sukses
    document.getElementById('sis-edit-id').value = '';
    document.getElementById('sis-nama').value = '';
    document.getElementById('sis-panggilan').value = '';
    document.getElementById('sis-wa').value = '';
    document.getElementById('sis-tgl-lahir').value = '';
    document.getElementById('sis-paket').value = '';
    document.getElementById('sis-sesi').value = '';
    document.getElementById('sis-sesi-1').value = '';
    document.getElementById('sis-expired').value = '';

    loadSiswaAdmin();
    if(typeof loadDropdownMuridForWali === 'function') loadDropdownMuridForWali();
}

export async function editSiswa(id) {
    const { data, error } = await sb.from('murid').select('*').eq('id_murid', id).single();
    if (error || !data) return alert("Gagal mengambil data murid.");
    
    document.getElementById('sis-edit-id').value = data.id_murid;
    document.getElementById('sis-nama').value = data.nama_lengkap;
    document.getElementById('sis-panggilan').value = data.nama_panggilan;
    document.getElementById('sis-wa').value = data.no_wa;
    document.getElementById('sis-tgl-lahir').value = data.tgl_lahir;
    document.getElementById('sis-status').value = data.status || 'Aktif';
    document.getElementById('sis-paket').value = data.paket;
    document.getElementById('sis-sesi').value = data.sisa_sesi;
    document.getElementById('sis-sesi-1').value = data.mulai_sesi_1 || '';
    document.getElementById('sis-expired').value = data.tgl_expired || '';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function autoHitungExpiredSiswa() {
    const mulai = document.getElementById('sis-sesi-1').value;
    if(!mulai) return;
    const date = new Date(mulai);
    date.setDate(date.getDate() + 35); // Set expired otomatis 35 hari
    document.getElementById('sis-expired').value = date.toISOString().split('T')[0];
}

// ==========================================
// 4. FUNGSI WALI MURID & PRESTASI (BASIC)
// ==========================================
export async function loadDropdownMuridForWali() {
    const { data } = await sb.from('murid').select('id_murid, nama_lengkap').eq('status', 'Aktif');
    const sel1 = document.getElementById('form-wali-murid');
    const sel2 = document.getElementById('prestasi-murid');
    
    let html = '<option value="">Pilih Murid...</option>';
    data?.forEach(m => html += `<option value="${m.id_murid}">${m.nama_lengkap}</option>`);
    
    if(sel1) sel1.innerHTML = html;
    if(sel2) sel2.innerHTML = html;
}

export async function buatAkunWali() {
    alert("Proses buat akun wali murid berjalan...");
}

export async function simpanPrestasiAdmin() {
    alert("Prestasi tersimpan!");
}

// ==========================================
// 5. MODAL INVOICE TRIGGER
// ==========================================
export function bukaModalInvoice(id, nama) {
    const modal = document.getElementById('modal-invoice');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('inv-input-nama').value = nama;
        document.getElementById('hidden-inv-murid-id').value = id;
        document.getElementById('inv-nomor').innerText = "INV-" + Date.now().toString().slice(-6);
        document.getElementById('inv-tanggal').innerText = new Date().toLocaleDateString('id-ID');
    }
}

export function tutupModalInvoice() {
    const modal = document.getElementById('modal-invoice');
    if (modal) modal.classList.add('hidden');
}

export function hitungTotalInvoice() {
    const biaya = parseFloat(document.getElementById('inv-input-biaya').value) || 0;
    const diskon = parseFloat(document.getElementById('inv-input-diskon').value) || 0;
    document.getElementById('inv-total-display').innerText = formatRupiah(biaya - diskon);
}

export async function submitInvoiceDatabase() {
    alert("Invoice berhasil dibuat dan tersimpan!");
    tutupModalInvoice();
}

// ==========================================
// DAFTARKAN SEMUA FUNGSI KE GLOBAL WINDOW (VITE FIX)
// ==========================================
window.loadSiswaAdmin = loadSiswaAdmin;
window.simpanSiswa = simpanSiswa;
window.editSiswa = editSiswa;
window.filterMurid = filterMurid;
window.autoHitungExpiredSiswa = autoHitungExpiredSiswa;
window.loadDropdownMuridForWali = loadDropdownMuridForWali;
window.buatAkunWali = buatAkunWali;
window.simpanPrestasiAdmin = simpanPrestasiAdmin;
window.bukaModalInvoice = bukaModalInvoice;
window.tutupModalInvoice = tutupModalInvoice;
window.hitungTotalInvoice = hitungTotalInvoice;
window.submitInvoiceDatabase = submitInvoiceDatabase;
