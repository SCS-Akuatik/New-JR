import { sb } from './config.js';

// ========================================================
// SCRIPT AKUNTING (ARUS KAS & REKAPITULASI)
// VERSION: FULL ANTI ZONA WAKTU + REMINDER WA + VOID HISTORY + ASSIGNEE
// ========================================================

export async function tambahAkunting() {
    const tgl = document.getElementById('akun-tanggal').value;
    const ket = document.getElementById('akun-ket').value;
    const jenis = document.getElementById('akun-jenis').value;
    const jumlah = document.getElementById('akun-jumlah').value;

    if (!tgl || !ket || !jumlah) return alert("Isi tanggal, keterangan, dan jumlah!");

    const { error } = await sb.from('akunting').insert([{ 
        tanggal: tgl,
        keterangan: ket, 
        jenis: jenis, 
        jumlah: parseFloat(jumlah)
    }]);

    if (error) {
        console.error("Error Detail:", error);
        alert("Gagal simpan: " + error.message);
    } else {
        document.getElementById('akun-tanggal').value = '';
        document.getElementById('akun-ket').value = '';
        document.getElementById('akun-jumlah').value = '';
        
        loadAkuntingAdmin(); 
        loadRekapAkunting(); 
    }
}

export async function loadAkuntingAdmin() {
    const list = document.getElementById('admin-akunting-list');
    if (!list) return;
    list.innerHTML = 'Memuat...';

    const { data, error } = await sb.from('akunting').select('*').order('tanggal', { ascending: false });

    if (error) {
        list.innerHTML = 'Error: ' + error.message;
        return;
    }

    let html = '';
    let totalSaldo = 0;

    data?.forEach(a => {
        let val = parseFloat(a.jumlah);
        totalSaldo += (a.jenis === 'Pemasukan' ? val : -val);
        
        let tglIndo = 'Tanpa Tanggal';
        if (a.tanggal) {
            const parts = a.tanggal.split('T')[0].split('-');
            if (parts.length === 3) {
                const bulanArr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
                tglIndo = `${parseInt(parts[2])} ${bulanArr[parseInt(parts[1]) - 1]} ${parts[0]}`;
            }
        }
        
        html += `<div class="list-item-admin">
            <div>
                <span style="font-size:10px; color:#94a3b8; font-weight:bold;">📅 ${tglIndo}</span><br>
                <strong>${a.keterangan}</strong><br>
                <span style="color:${a.jenis === 'Pemasukan' ? '#10b981' : '#ef4444'}">${a.jenis}: Rp ${val.toLocaleString('id-ID')}</span>
            </div>
            <button class="btn-danger" onclick="hapusData('akunting', ${a.id}, function(){ loadAkuntingAdmin(); loadRekapAkunting(); })">❌</button>
        </div>`;
    });

    list.innerHTML = html || 'Belum ada transaksi.';
    const saldoEl = document.getElementById('saldo-terkini');
    if (saldoEl) saldoEl.innerText = 'Rp ' + totalSaldo.toLocaleString('id-ID');
}

export async function loadRekapAkunting() {
    const { data, error } = await sb.from('akunting').select('*');
    if (error) { console.error(error); return; }

    const container = document.getElementById('rekap-akunting-container');
    if (!container) return;

    const bulanEl = document.getElementById('filter-akun-bulan');
    const tahunEl = document.getElementById('filter-akun-tahun');
    const jenisEl = document.getElementById('filter-akun-jenis');

    const bulanSekarang = new Date().getMonth() + 1;
    const tahunIni = new Date().getFullYear();

    const bulan = bulanEl ? parseInt(bulanEl.value) : bulanSekarang;
    const tahun = tahunEl ? parseInt(tahunEl.value) : tahunIni;
    const filterJenis = jenisEl ? jenisEl.value : 'Semua';

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let saldoBulanSebelumnya = 0; 

    data.forEach(item => {
        if (!item.tanggal) return;
        
        const parts = item.tanggal.split('T')[0].split('-');
        const itemTahun = parseInt(parts[0]);
        const itemBulan = parseInt(parts[1]);
        
        let val = parseFloat(item.jumlah) || 0;

        if (itemTahun < tahun || (itemTahun === tahun && itemBulan < bulan)) {
            if (item.jenis === 'Pemasukan') saldoBulanSebelumnya += val;
            if (item.jenis === 'Pengeluaran') saldoBulanSebelumnya -= val;
        }

        if (itemBulan === bulan && itemTahun === tahun) {
            if (item.jenis === 'Pemasukan') totalPemasukan += val;
            if (item.jenis === 'Pengeluaran') totalPengeluaran += val;
        }
    });

    let opsiTahun = "";
    for (let t = 2024; t <= tahunIni + 1; t++) {
        opsiTahun += `<option value="${t}" ${t === tahun ? "selected" : ""}>${t}</option>`;
    }

    let html = `
    <div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #cbd5e1;">
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
            <strong style="margin-right:5px;">📅 Rekap Arus Kas</strong>
            <select id="filter-akun-bulan" style="padding:6px; font-size:12px; width:auto; border-radius:6px;" onchange="loadRekapAkunting()">
                <option value="1" ${bulan==1?"selected":""}>Jan</option>
                <option value="2" ${bulan==2?"selected":""}>Feb</option>
                <option value="3" ${bulan==3?"selected":""}>Mar</option>
                <option value="4" ${bulan==4?"selected":""}>Apr</option>
                <option value="5" ${bulan==5?"selected":""}>Mei</option>
                <option value="6" ${bulan==6?"selected":""}>Jun</option>
                <option value="7" ${bulan==7?"selected":""}>Jul</option>
                <option value="8" ${bulan==8?"selected":""}>Ags</option>
                <option value="9" ${bulan==9?"selected":""}>Sep</option>
                <option value="10" ${bulan==10?"selected":""}>Okt</option>
                <option value="11" ${bulan==11?"selected":""}>Nov</option>
                <option value="12" ${bulan==12?"selected":""}>Des</option>
            </select>
            <select id="filter-akun-tahun" style="padding:6px; font-size:12px; width:auto; border-radius:6px;" onchange="loadRekapAkunting()">
                ${opsiTahun}
            </select>
            <select id="filter-akun-jenis" style="padding:6px; font-size:12px; width:auto; border-radius:6px;" onchange="loadRekapAkunting()">
                <option value="Semua" ${filterJenis=='Semua'?"selected":""}>Semua</option>
                <option value="Pemasukan" ${filterJenis=='Pemasukan'?"selected":""}>Pemasukan</option>
                <option value="Pengeluaran" ${filterJenis=='Pengeluaran'?"selected":""}>Pengeluaran</option>
            </select>
        </div>
    </div>
    `;

    let tampilPemasukan = (filterJenis === 'Semua' || filterJenis === 'Pemasukan');
    let tampilPengeluaran = (filterJenis === 'Semua' || filterJenis === 'Pengeluaran');

    html += `<div style="font-size:14px; margin-top:10px;">`;
    
    if (filterJenis === 'Semua') {
        html += `<div style="display:flex; justify-content:space-between; color:#64748b; margin-bottom:8px; font-size:12px;">
                    <span>⏮️ Saldo Bulan Sebelumnya</span><strong>Rp ${saldoBulanSebelumnya.toLocaleString('id-ID')}</strong>
                 </div>`;
    }

    if (tampilPemasukan) {
        html += `<div style="display:flex; justify-content:space-between; color:#10b981; margin-bottom:5px;">
                    <span>📈 Pemasukan (Bulan Ini)</span><strong>Rp ${totalPemasukan.toLocaleString('id-ID')}</strong>
                 </div>`;
    }
    if (tampilPengeluaran) {
        html += `<div style="display:flex; justify-content:space-between; color:#ef4444; margin-bottom:5px;">
                    <span>📉 Pengeluaran (Bulan Ini)</span><strong>Rp ${totalPengeluaran.toLocaleString('id-ID')}</strong>
                 </div>`;
    }
    
    if (filterJenis === 'Semua') {
        let surplus = totalPemasukan - totalPengeluaran; 
        let saldoAkhir = saldoBulanSebelumnya + surplus; 
        let warnaSaldoAkhir = saldoAkhir >= 0 ? '#0284c7' : '#ef4444';
        
        html += `<hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 8px 0;">
                 <div style="display:flex; justify-content:space-between; color:#94a3b8; font-size:12px; margin-bottom:5px;">
                    <span>⚖️ Mutasi Kas Bulan Ini</span><strong>Rp ${surplus.toLocaleString('id-ID')}</strong>
                 </div>
                 <div style="display:flex; justify-content:space-between; color:${warnaSaldoAkhir}; font-weight:bold; font-size:16px; margin-top:5px; padding: 5px; background: #f0f9ff; border-radius: 4px;">
                    <span>💰 SALDO AKHIR AKTIF</span><strong>Rp ${saldoAkhir.toLocaleString('id-ID')}</strong>
                 </div>`;
    }
    html += `</div>`;

    container.innerHTML = html;
}

// ========================================================
// FUNGSI LOAD DAFTAR INVOICE TERCETAK & HISTORY
// ========================================================
export async function loadInvoiceHistory() {
    const listContainer = document.getElementById('admin-invoice-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '<p style="text-align:center;">Memuat data invoice...</p>';

    try {
        const { data, error } = await sb.from('invoices')
            .select('*')
            .order('id', { ascending: false })
            .limit(40);

        if (error) throw error;

        if (!data || data.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; color:#64748b;">Belum ada invoice aktif yang diterbitkan.</p>';
            return;
        }

        let html = '';
        data.forEach(inv => {
            let badgeColor = '#f59e0b'; 
            let badgeText = 'Unpaid';
            let reminderBtn = ''; 

            if (inv.status === 'Paid') {
                badgeColor = '#10b981'; 
                badgeText = 'Lunas';
            } else if (inv.status === 'Batal' || inv.status === 'Void') {
                badgeColor = '#ef4444'; 
                badgeText = 'Void';
            }

            if (inv.status === 'Unpaid' || !inv.status) {
                reminderBtn = `<button onclick="kirimReminder('${inv.nomor_invoice || inv.no_invoice}', '${inv.nama_murid || inv.nama_wali}', '${inv.paket || '-'}', ${inv.total || inv.biaya || 0})" style="display:flex; align-items:center; justify-content:center; height:24px; box-sizing:border-box; margin:0; background:#3b82f6; color:white; border:none; padding:0 10px; border-radius:12px; font-size:10px; font-weight:bold; cursor:pointer; line-height:1; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">🔔 WA</button>`;
            }

            let totalVal = inv.total || inv.biaya || 0;
            let totalRp = totalVal.toLocaleString('id-ID');
            let invTgl = inv.tanggal_terbit || inv.tanggal || inv.created_at || '-';
            let tglFormat = invTgl !== '-' ? new Date(invTgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

            // 🔥 TAMPILKAN NAMA ADMIN PEMBUAT INVOICE (JIKA ADA) 🔥
            let labelAdmin = inv.admin_id ? `<span style="font-size:9px; background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-weight:bold;">👤 By: ${inv.admin_id}</span>` : '';

            let actionButtons = '';
            if (inv.status === 'Unpaid' || !inv.status) {
                actionButtons = `
                <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <!-- Di tombol lunas, kita juga bypass admin_id biar divalidasi -->
                    <button onclick="lunasiInvoice(${inv.id}, '${inv.nomor_invoice || inv.no_invoice}', '${inv.nama_murid || inv.nama_wali}', ${totalVal}, '${inv.admin_id || ''}')" style="flex: 1; background: #10b981; color: white; border: none; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">✅ Lunas</button>
                    <button onclick="batalkanInvoice(${inv.id}, '${inv.nomor_invoice || inv.no_invoice}')" style="flex: 1; background: #ef4444; color: white; border: none; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">❌ Void</button>
                </div>`;
            }

            let opacityStyle = (inv.status === 'Batal' || inv.status === 'Void') ? 'opacity: 0.5;' : '';
            let strikeStyle = (inv.status === 'Batal' || inv.status === 'Void') ? 'text-decoration: line-through;' : '';

            html += `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); ${opacityStyle}">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <strong style="color:#0369a1; font-size:12px; ${strikeStyle}">${inv.nomor_invoice || inv.no_invoice || 'INV-XXX'}</strong>
                        ${labelAdmin}
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:5px;">
                        ${reminderBtn}
                        <span style="display:flex; align-items:center; justify-content:center; height:24px; box-sizing:border-box; font-size:10px; background:${badgeColor}; color:white; padding:0 10px; border-radius:12px; font-weight:bold; line-height:1; margin:0;">${badgeText}</span>
                    </div>
                </div>

                <div style="font-size:12px; color:#334155; line-height: 1.5;">
                    👨‍🎓 <b>${inv.nama_murid || inv.nama_wali || 'Tanpa Nama'}</b><br>
                    📦 ${inv.paket || '-'}<br>
                    <div style="display:flex; justify-content:space-between; margin-top:4px;">
                        <span>📅 ${tglFormat}</span>
                        <strong style="color:#0f172a; ${strikeStyle}">Rp ${totalRp}</strong>
                    </div>
                </div>
                ${actionButtons}
            </div>`;
        });
        
        listContainer.innerHTML = html;

    } catch (err) {
        console.error("Gagal load invoice:", err);
        listContainer.innerHTML = '<p style="color:red; text-align:center;">Terjadi kesalahan saat memuat invoice.</p>';
    }
}

// ========================================================
// FUNGSI AKSI INVOICE (LUNAS, VOID, & REMINDER)
// ========================================================

export async function batalkanInvoice(idInvoice, noInvoice) {
    if (!confirm(`⚠️ Yakin ingin membatalkan (Void) Invoice ${noInvoice}? Data akan disembunyikan dari daftar aktif.`)) return;

    try {
        const { error } = await sb.from('invoices').update({ status: 'Batal' }).eq('id', idInvoice);
        if (error) throw error;
        
        loadInvoiceHistory(); 
    } catch (err) {
        alert("Gagal membatalkan invoice: " + err.message);
    }
}

export async function lunasiInvoice(idInvoice, noInvoice, namaSiswa, total, adminPembuat) {
    const currentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
    
    // VALIDASI KEAMANAN: Cek apakah yang klik Lunas adalah admin yang membuat, JIKA admin tersebut di-set.
    if (adminPembuat && adminPembuat !== currentUser) {
        if (!confirm(`⚠️ PERINGATAN!\nInvoice ini dibuat oleh [${adminPembuat}]. Jika kamu tandai lunas, bonus akan tetap masuk ke ${adminPembuat}.\nLanjutkan?`)) return;
    } else {
        if (!confirm(`✅ Tandai Invoice ${noInvoice} (${namaSiswa}) sebagai LUNAS?\n\nNominal Rp ${total.toLocaleString('id-ID')} akan OTOMATIS masuk ke Catatan Pemasukan Arus Kas dan BONUS kamu akan bertambah!`)) return;
    }

    try {
        const { error: errInv } = await sb.from('invoices').update({ status: 'Paid' }).eq('id', idInvoice);
        if (errInv) throw errInv;

        const now = new Date();
        const tglHariIni = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        
        const { error: errKas } = await sb.from('akunting').insert([{
            tanggal: tglHariIni,
            keterangan: `Pembayaran ${noInvoice} - ${namaSiswa}`,
            jenis: 'Pemasukan',
            jumlah: parseInt(total)
        }]);
        if (errKas) throw errKas;

        alert("Berhasil! Invoice Lunas & Arus Kas otomatis bertambah! 💰");
        
        // Refresh tabel tampilan & Trigger Update Bonus Real-time!
        loadInvoiceHistory(); 
        if (typeof window.loadAkuntingAdmin === "function") window.loadAkuntingAdmin(); 
        if (typeof window.loadRekapAkunting === "function") window.loadRekapAkunting(); 
        
        // 🔥 TRIGGER UPDATE BONUS (Jika dipanggil dari halaman Admin 2) 🔥
        if (typeof window.hitungMyBonus === "function") {
            // Update UI Score Gamification
            let paidScoreEl = document.getElementById('score-paid');
            if (paidScoreEl) {
                let paidScore = parseInt(paidScoreEl.innerText);
                paidScoreEl.innerText = paidScore + 1;
            }
            window.hitungMyBonus(); 
        }
        
    } catch (err) {
        alert("Gagal memproses pembayaran: " + err.message);
    }
}

export function kirimReminder(noInvoice, namaMurid, paket, total) {
    const teksWA = `Halo Ayah/Bunda dari *${namaMurid}*! 👋%0A%0AMohon izin menginformasikan dari Admin *Jago Renang Academy*. Mengingatkan kembali terdapat tagihan yang masih *pending/belum diselesaikan* dengan rincian berikut:%0A%0A🧾 *No Invoice:* ${noInvoice}%0A📦 *Paket:* ${paket}%0A💰 *Total Tagihan:* Rp ${total.toLocaleString('id-ID')}%0A%0AApakah ada kendala terkait pembayaran? Jika sudah melakukan transfer, mohon berkenan mengirimkan bukti pembayarannya ya Ayah/Bunda untuk segera kami proses pembaruan sisa sesi ananda.%0A%0ATerima kasih banyak atas kerjasamanya! 🙏`;
    
    window.open(`https://wa.me/?text=${teksWA}`, '_blank');
}

// =========================================================
// REGISTER TO WINDOW
// =========================================================
window.tambahAkunting = tambahAkunting;
window.loadAkuntingAdmin = loadAkuntingAdmin;
window.loadRekapAkunting = loadRekapAkunting;
window.loadInvoiceHistory = loadInvoiceHistory;
window.batalkanInvoice = batalkanInvoice;
window.lunasiInvoice = lunasiInvoice;
window.kirimReminder = kirimReminder;
