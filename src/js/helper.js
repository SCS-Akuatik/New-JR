import { sb } from './config.js';

export function formatRupiah(angka) {
    if (!angka) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

export function formatTanggal(tgl) {
    if (!tgl) return '-';
    const date = new Date(tgl);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function chatAdmin() {
    window.location.href = "https://wa.me/6289678159835?text=Halo%20Admin%20JR%20Academy";
}

export function hitungKelompokUmur(tanggalLahirStr) {
    if (!tanggalLahirStr) return 'KU Belum Set';
    const tahunLahir = new Date(tanggalLahirStr).getFullYear();
    const tahunSekarang = 2026; 
    const usiaKU = tahunSekarang - tahunLahir;
    if (usiaKU <= 9) return `KU 5 (${usiaKU} Thn)`;
    if (usiaKU >= 10 && usiaKU <= 11) return `KU 4 (${usiaKU} Thn)`;
    if (usiaKU >= 12 && usiaKU <= 13) return `KU 3 (${usiaKU} Thn)`;
    if (usiaKU >= 14 && usiaKU <= 15) return `KU 2 (${usiaKU} Thn)`;
    if (usiaKU >= 16 && usiaKU <= 18) return `KU 1 (${usiaKU} Thn)`;
    return `Senior (${usiaKU} Thn)`;
}

export async function loadDaftarKolam() {
    const select = document.getElementById('form-lokasi');
    if(!select) return;
    const { data } = await sb.from('kolam').select('nama_kolam');
    select.innerHTML = '<option value="">Pilih Kolam...</option>';
    data?.forEach(k => { select.innerHTML += `<option value="${k.nama_kolam}">${k.nama_kolam}</option>`; });
}

export async function hapusData(tabel, idData, callback) {
    if(!confirm("Hapus data ini dari database secara permanen?")) return;
    const primaryKey = tabel === 'murid' ? 'id_murid' : 'id';
    const { error } = await sb.from(tabel).delete().eq(primaryKey, idData);
    if (error) {
        console.error(error);
        alert("Gagal menghapus data: " + error.message);
    } else {
        if(typeof callback === "function") callback();
    }
}

// ==========================================
// DAFTARKAN SEMUA HELPER KE GLOBAL WINDOW
// ==========================================
window.formatRupiah = formatRupiah;
window.formatTanggal = formatTanggal;
window.chatAdmin = chatAdmin;
window.hitungKelompokUmur = hitungKelompokUmur;
window.loadDaftarKolam = loadDaftarKolam;
window.hapusData = hapusData;
