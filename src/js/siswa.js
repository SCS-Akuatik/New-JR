import { sb } from './config.js';

// ========================================================
// SCRIPT MANAJEMEN MASTER SISWA (ADMIN)
// ========================================================
let tempDurasiMinggu = 0;
let tempWaMurid = ""; 

export async function loadSiswaAdmin() {
    const list = document.getElementById('admin-siswa-list');
    if(!list) return;
    list.innerHTML = '<p>Memuat data jagoan...</p>';
    
    const { data, error } = await sb.from('murid').select('*').order('id_murid', { ascending: true });
    
    if (error) {
        console.error("Error load siswa:", error);
        return list.innerHTML = '<p style="color:red;">Error load data.</p>';
    }
    
    let html = '';
    data?.forEach(m => {
        let statusBadge = m.status === 'Aktif' ? '#10b981' : '#64748b';
        let kuTampil = typeof window.hitungKelompokUmur === "function" ? window.hitungKelompokUmur(m.tanggal_lahir) : '';
        let tglIndo = m.tanggal_lahir ? m.tanggal_lahir.split('-').reverse().join('/') : '-';
        
        let expTampil = m.expired_sesi ? m.expired_sesi.split('-').reverse().join('/') : 'Belum di-set';
        let warnaExp = m.expired_sesi ? '#ef4444' : '#64748b';
        
        let aktaHTML = "";
        if (m.akta_lahir) {
            aktaHTML = `<a href="${m.akta_lahir}" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 5px; height: 32px; font-size: 11px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; width: 100%; box-sizing: border-box; transition: 0.2s;">📄 Lihat Akta</a>`;
        } else {
            aktaHTML = `<span style="display: flex; align-items: center; justify-content: center; gap: 5px; height: 32px; font-size: 11px; background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 6px; font-weight: bold; width: 100%; box-sizing: border-box;">❌ Akta Kosong</span>`;
        }

        html += `
        <div class="list-item-admin murid-item" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); box-sizing: border-box;">
            <div style="flex: 1; padding-right: 15px; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 4px;">
                    <strong style="color: #0284c7; font-size: 15px; word-break: break-word;" class="nama-siswa">${m.nama_murid}</strong> 
                    <span style="background: ${statusBadge}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; white-space: nowrap;">${m.status || 'Aktif'}</span>
                </div>
                <div style="font-size: 12px; color: #334155; line-height: 1.6;">
                    <span>📅 Lahir: ${tglIndo} | <b>${kuTampil}</b></span><br>
                    <span style="color: #0284c7; font-weight: bold;">📦 ${m.jenis_paket || 'Belum Set'} (${m.sisa_sesi ?? 0} Sesi Sisa)</span><br>
                    <span style="color: ${warnaExp}; font-size: 11px; font-weight: bold;">⏳ Expired: ${expTampil}</span><br>
                    <span style="color: #64748b; font-size: 11px;">👨‍👩‍👧 Ortu: ${m.parent_username || 'Belum ditautkan'}</span><br>
                    <span style="color: #f59e0b; font-size: 11px; font-weight: bold;">🏷️ Panggilan: ${m.nama_panggilan || '-'} | 📱 WA: ${m.no_wa || '-'}</span>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; width: 115px; flex-shrink: 0; box-sizing: border-box;">
                ${aktaHTML}
                <button style="display: flex; align-items: center; justify-content: center; gap: 5px; height: 32px; font-size: 11px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; box-sizing: border-box; transition: 0.2s;" 
                    onclick="generateInvoice(${m.id_murid}, '${m.nama_murid}', '${m.jenis_paket || 'Kelas'}', '${m.no_wa || ''}')">
                    🧾 Invoice
                </button>
                <button style="display: flex; align-items: center; justify-content: center; gap: 5px; height: 32px; font-size: 11px; background: #f59e0b; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; box-sizing: border-box; transition: 0.2s;" 
                    onclick="editSiswa(${m.id_murid}, '${m.nama_murid}', '${m.nama_panggilan || ''}', '${m.no_wa || ''}', '${m.tanggal_lahir || ''}', '${m.status}', '${m.jenis_paket || ''}', ${m.sisa_sesi || 0}, '${m.expired_sesi || ''}')">
                    ✏️ Edit
                </button>
            </div>
        </div>`;
    });
    
    list.innerHTML = html || '<p>Belum ada data murid.</p>';
}

export async function simpanSiswa() {
    const id = document.getElementById('sis-edit-id').value;
    const nama = document.getElementById('sis-nama').value.trim();
    const panggilan = document.getElementById('sis-panggilan').value.trim();
    const wa = document.getElementById('sis-wa').value.trim(); 
    const tglLahir = document.getElementById('sis-tgl-lahir').value; 
    const status = document.getElementById('sis-status').value;
    const paket = document.getElementById('sis-paket').value.trim();
    const sesi = document.getElementById('sis-sesi').value;
    const expired = document.getElementById('sis-expired').value; 

    if (!nama) return alert("Nama murid wajib diisi!");

    const dataObj = {
        nama_murid: nama, 
        nama_panggilan: panggilan || null, 
        no_wa: wa || null, 
        tanggal_lahir: tglLahir || null, 
        status: status, 
        jenis_paket: paket || 'Private Class', 
        sisa_sesi: sesi ? parseInt(sesi) : 4,
        expired_sesi: expired || null 
    };

    if (id) {
        const { error } = await sb.from('murid').update(dataObj).eq('id_murid', id);
        if(error) return alert("Gagal update: " + error.message);
        alert("Data siswa diupdate!");
    } else {
        const { error } = await sb.from('murid').insert([{ ...dataObj, tipe_kelas: 'Beginner' }]);
        if(error) return alert("Gagal tambah: " + error.message);
        alert("Siswa ditambahkan!");
    }

    document.getElementById('sis-edit-id').value = '';
    document.getElementById('sis-nama').value = '';
    document.getElementById('sis-panggilan').value = ''; 
    document.getElementById('sis-wa').value = ''; 
    document.getElementById('sis-tgl-lahir').value = '';
    document.getElementById('sis-paket').value = '';
    document.getElementById('sis-sesi').value = '';
    
    if(document.getElementById('sis-sesi-1')) document.getElementById('sis-sesi-1').value = ''; 
    document.getElementById('sis-expired').value = ''; 
    document.getElementById('btn-simpan-siswa').innerText = "⚡ Simpan Siswa";
    
    loadSiswaAdmin();
    if(typeof window.loadDropdownMuridForWali === 'function') window.loadDropdownMuridForWali(); 
}

export function editSiswa(id, nama, panggilan, wa, tgl, status, paket, sesi, expired) {
    document.getElementById('sis-edit-id').value = id;
    document.getElementById('sis-nama').value = nama;
    document.getElementById('sis-panggilan').value = panggilan; 
    document.getElementById('sis-wa').value = wa; 
    document.getElementById('sis-tgl-lahir').value = tgl;
    document.getElementById('sis-status').value = status;
    document.getElementById('sis-paket').value = paket;
    document.getElementById('sis-sesi').value = sesi;
    
    if(document.getElementById('sis-sesi-1')) document.getElementById('sis-sesi-1').value = ''; 
    document.getElementById('sis-expired').value = (!expired || expired === 'null') ? '' : expired; 
    
    document.getElementById('btn-simpan-siswa').innerText = "💾 Update Siswa";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

export function filterMurid() {
    const input = document.getElementById('search-murid').value.toLowerCase();
    const items = document.querySelectorAll('.murid-item');
    items.forEach(item => {
        const nama = item.querySelector('.nama-siswa').innerText.toLowerCase();
        item.style.display = nama.includes(input) ? "flex" : "none";
    });
}

export function autoHitungExpiredSiswa() {
    const tglSesi1 = document.getElementById('sis-sesi-1')?.value;
    const paket = document.getElementById('sis-paket')?.value.toLowerCase() || "";
    
    if (!tglSesi1) return; 

    let durasiMinggu = 5; 
    
    if (paket.includes("beginner") && (paket.includes("8") || paket.includes("delapan"))) {
        durasiMinggu = 10; 
    } else if (paket.includes("beginner")) {
        durasiMinggu = 6;  
    } else if (paket.includes("8") || paket.includes("delapan")) {
        durasiMinggu = 9;  
    } else {
        durasiMinggu = 5;  
    }

    let dateSesi1 = new Date(tglSesi1);
    dateSesi1.setDate(dateSesi1.getDate() + (durasiMinggu * 7));
    
    document.getElementById('sis-expired').value = dateSesi1.toISOString().split('T')[0];
}

export async function generateInvoice(idMurid, namaSiswa, jenisPaket, noWa) {
    tempWaMurid = noWa || ""; 
    
    const modal = document.getElementById('modal-invoice');
    if(modal) modal.style.display = 'flex';
    document.getElementById('inv-nomor').innerText = "Sedang generate...";
    
    let hargaDasar = 750000;
    let paketClean = jenisPaket.toLowerCase();
    
    if (paketClean.includes("beginner") && paketClean.includes("8")) {
        hargaDasar = 900000; 
        tempDurasiMinggu = 8 + 2; 
    } else if (paketClean.includes("beginner")) {
        hargaDasar = 450000; 
        tempDurasiMinggu = 4 + 2; 
    } else if (paketClean.includes("8") || paketClean.includes("delapan")) {
        hargaDasar = 1500000; 
        tempDurasiMinggu = 8 + 1; 
    } else {
        hargaDasar = 750000;
        tempDurasiMinggu = 4 + 1; 
    }

    const now = new Date();
    const bulan = String(now.getMonth() + 1).padStart(2, '0');
    const tahun = String(now.getFullYear()).slice(-2);
    
    try {
        const { data, error } = await sb.from('invoices')
            .select('no_invoice')
            .like('no_invoice', `INV-${bulan}-%-${tahun}`)
            .order('id', { ascending: false })
            .limit(1);
            
        let urut = 51; 
        
        if (data && data.length > 0) {
            const lastInv = data[0].no_invoice; 
            const parts = lastInv.split('-');
            if(parts.length === 4) {
                urut = parseInt(parts[2]) + 1; 
            }
        }
        
        const noInvoiceBaru = `INV-${bulan}-${String(urut).padStart(4, '0')}-${tahun}`;
        document.getElementById('inv-nomor').innerText = noInvoiceBaru;

    } catch (err) {
        console.error("Gagal get invoice ID:", err);
        document.getElementById('inv-nomor').innerText = `INV-${bulan}-9999-${tahun}`; 
    }

    const tanggalHariIni = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    document.getElementById('inv-tanggal').innerText = tanggalHariIni;
    
    document.getElementById('hidden-inv-murid-id').value = idMurid;
    document.getElementById('inv-input-nama').value = namaSiswa;
    document.getElementById('inv-input-paket').value = jenisPaket;
    document.getElementById('inv-input-biaya').value = hargaDasar;
    document.getElementById('inv-input-diskon').value = 0;
    
    document.getElementById('inv-sesi-1').value = "";
    document.getElementById('inv-sesi-2').value = "";
    document.getElementById('inv-sesi-3').value = "";
    document.getElementById('inv-sesi-4').value = "";
    document.getElementById('hidden-inv-expired-date').value = "";

    hitungTotalInvoice();
}

export function hitungTotalInvoice() {
    let biaya = parseInt(document.getElementById('inv-input-biaya').value) || 0;
    let diskon = parseInt(document.getElementById('inv-input-diskon').value) || 0;
    let total = biaya - diskon;
    if (total < 0) total = 0;
    document.getElementById('inv-total-display').innerText = `Rp ${total.toLocaleString('id-ID')}`;

    const tglSesi1 = document.getElementById('inv-sesi-1').value;
    const infoText = document.getElementById('inv-info-expired');
    
    if (tglSesi1) {
        let dateSesi1 = new Date(tglSesi1);
        dateSesi1.setDate(dateSesi1.getDate() + (tempDurasiMinggu * 7));
        
        document.getElementById('hidden-inv-expired-date').value = dateSesi1.toISOString().split('T')[0];
        
        const strExpired = dateSesi1.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        infoText.style.color = "#16a34a"; 
        infoText.innerHTML = `✅ Expired Sesi Otomatis pada: <b>${strExpired}</b>`;
    } else {
        document.getElementById('hidden-inv-expired-date').value = "";
        infoText.style.color = "#d97706";
        infoText.innerHTML = `Masa Aktif: ${tempDurasiMinggu} Minggu (Isi Sesi 1 untuk hitung expired)`;
    }
}

export async function submitInvoiceDatabase(event) {
    const btn = event ? event.target : document.querySelector('button[onclick*="submitInvoiceDatabase"]');
    if(btn) { btn.innerText = "⏳ Menyimpan..."; btn.disabled = true; }

    const noInv = document.getElementById('inv-nomor').innerText;
    const tglTerbitRaw = new Date().toISOString().split('T')[0]; 
    const idMurid = document.getElementById('hidden-inv-murid-id').value;
    const nama = document.getElementById('inv-input-nama').value;
    const paket = document.getElementById('inv-input-paket').value;
    
    const biaya = parseInt(document.getElementById('inv-input-biaya').value) || 0;
    const diskon = parseInt(document.getElementById('inv-input-diskon').value) || 0;
    const total = biaya - diskon;
    
    const s1 = document.getElementById('inv-sesi-1').value || null;
    const s2 = document.getElementById('inv-sesi-2').value || null;
    const s3 = document.getElementById('inv-sesi-3').value || null;
    const s4 = document.getElementById('inv-sesi-4').value || null;
    const expDate = document.getElementById('hidden-inv-expired-date').value || null;

    if (!s1) {
        alert("Tanggal Sesi 1 wajib diisi!");
        if(btn) { btn.innerText = "💾 Submit & Kirim WA"; btn.disabled = false; }
        return;
    }

    try {
        const { error } = await sb.from('invoices').insert([{
            no_invoice: noInv,
            murid_id: parseInt(idMurid),
            nama_murid: nama,
            paket: paket,
            biaya: biaya,
            diskon: diskon,
            total: total,
            tanggal_terbit: tglTerbitRaw,
            sesi_1: s1,
            sesi_2: s2,
            sesi_3: s3,
            sesi_4: s4,
            expired_sesi: expDate,
            status: 'Unpaid'
        }]);

        if (error) {
            if(error.code === '23505') throw new Error("Nomor invoice sudah terpakai, silakan tutup dan generate ulang.");
            throw error;
        }

        const dateOpt = { day: '2-digit', month: 'short', year: 'numeric' };
        const tglCantikTerbit = new Date().toLocaleDateString('id-ID', dateOpt);
        const tglCantikS1 = new Date(s1).toLocaleDateString('id-ID', dateOpt);
        const tglCantikExp = new Date(expDate).toLocaleDateString('id-ID', dateOpt);
        
        let teksDiskon = diskon > 0 ? `\n🎁 *Diskon:* - Rp ${diskon.toLocaleString('id-ID')}` : "";
        let barisSesi = `\n🗓️ *Sesi 1:* ${tglCantikS1}`;
        if(s2) barisSesi += `\n🗓️ *Sesi 2:* ${new Date(s2).toLocaleDateString('id-ID', dateOpt)}`;
        if(s3) barisSesi += `\n🗓️ *Sesi 3:* ${new Date(s3).toLocaleDateString('id-ID', dateOpt)}`;
        if(s4) barisSesi += `\n🗓️ *Sesi 4:* ${new Date(s4).toLocaleDateString('id-ID', dateOpt)}`;

        const pesanWA = encodeURIComponent(
`Halo Ayah/Bunda dari ${nama}! 👋

Berikut rincian tagihan resmi program *Jago Renang Academy* 🏊‍♂️:

📝 *No Invoice:* ${noInv}
📅 *Tgl Terbit:* ${tglCantikTerbit}
📦 *Paket:* ${paket}
-----------------------------
💵 *Biaya:* Rp ${biaya.toLocaleString('id-ID')}${teksDiskon}
💰 *TOTAL TAGIHAN: Rp ${total.toLocaleString('id-ID')}*
-----------------------------${barisSesi}
⏳ *Batas Expired Sesi:* ${tglCantikExp}
-----------------------------

💳 *Metode Pembayaran:*
Silakan lakukan pembayaran melalui *QRIS Jago Renang Academy* (Barcode gambar QRIS akan dikirimkan Admin setelah pesan ini) atau via *Transfer Bank*:

*BCA* a.n Fajar Aditya
No. Rekening: *6720242697*

Mohon konfirmasi dengan mengirimkan bukti pembayaran. Terima kasih! 🌟`
        );

        let linkWA = `https://wa.me/?text=${pesanWA}`; 
        
        if (tempWaMurid && tempWaMurid.trim() !== '') {
            let waClean = tempWaMurid.replace(/\D/g, ''); 
            if (waClean.startsWith('0')) {
                waClean = '62' + waClean.substring(1);
            }
            linkWA = `https://wa.me/${waClean}?text=${pesanWA}`;
        }

        window.open(linkWA, '_blank');
        
        tutupModalInvoice();
        alert("Invoice berhasil disimpan ke Database!");

    } catch (err) {
        console.error("Error Simpan Invoice:", err);
        alert(`Gagal menyimpan: ${err.message}`);
    } finally {
        if(btn) { btn.innerText = "💾 Submit & Kirim WA"; btn.disabled = false; }
    }
}

export function tutupModalInvoice() {
    const modal = document.getElementById('modal-invoice');
    if(modal) modal.style.display = 'none';
}

export async function loadDropdownMuridForWali() {
    const dropWali = document.getElementById('form-wali-murid');
    const dropPrestasi = document.getElementById('prestasi-murid'); 
    
    if (!dropWali || !dropPrestasi) return;

    try {
        const { data, error } = await sb.from('murid')
            .select('id_murid, nama_murid')
            .order('nama_murid', { ascending: true });

        if (error) throw error;

        dropWali.innerHTML = '<option value="">-- Pilih Murid --</option>';
        dropPrestasi.innerHTML = '<option value="">-- Pilih Murid untuk Prestasi --</option>'; 
        
        if (data) {
            data.forEach(m => {
                const option = `<option value="${m.id_murid}">${m.nama_murid}</option>`;
                dropWali.innerHTML += option;
                dropPrestasi.innerHTML += option; 
            });
        }
    } catch (err) {
        console.error("Gagal load dropdown murid:", err);
    }
}

export async function buatAkunWali() {
    const muridId = document.getElementById('form-wali-murid').value;
    const user = document.getElementById('form-wali-user').value.trim();
    const pass = document.getElementById('form-wali-pass').value.trim();

    if (!muridId || !user) {
        return alert("Mohon lengkapi pilihan murid dan username!");
    }

    try {
        const { error: errUser } = await sb.from('users').insert([{
            username: user,
            password: pass || '123456', 
            role: ['parent']
        }]);

        if (errUser) {
            if (errUser.code === '23505') {
                const confirmLink = confirm(`Username "${user}" sudah ada (Mungkin akun untuk anak pertamanya).\n\nMau langsung hubungkan anak ini ke akun wali tersebut?`);
                if (!confirmLink) return; 
            } else {
                throw errUser; 
            }
        }

        const { error: errMurid } = await sb.from('murid')
            .update({ parent_username: user })
            .eq('id_murid', muridId);

        if (errMurid) throw errMurid;

        alert(`Berhasil! Anak telah dihubungkan ke akun wali murid: ${user}`);
        
        document.getElementById('form-wali-user').value = "";
        document.getElementById('form-wali-pass').value = "";
        
        loadSiswaAdmin(); 

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan sistem saat membuat/menghubungkan akun.");
    }
}

export async function simpanPrestasiAdmin() {
    const muridId = document.getElementById('prestasi-murid').value;
    const namaEvent = document.getElementById('prestasi-event').value.trim();
    const pencapaian = document.getElementById('prestasi-pencapaian').value.trim();
    const tanggal = document.getElementById('prestasi-tanggal').value;

    if (!muridId || !namaEvent || !pencapaian || !tanggal) {
        return alert("Mohon lengkapi semua data prestasi (Nama, Event, Pencapaian, dan Tanggal)!");
    }

    try {
        const { error } = await sb.from('prestasi').insert([{
            murid_id: parseInt(muridId),
            nama_event: namaEvent,
            pencapaian: pencapaian,
            tanggal: tanggal
        }]);

        if (error) throw error;

        alert("Prestasi Jagoan berhasil ditambahkan ke database!");
        
        document.getElementById('prestasi-event').value = "";
        document.getElementById('prestasi-pencapaian').value = "";
        document.getElementById('prestasi-tanggal').value = "";
        
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan saat menyimpan prestasi.");
    }
}

// REGISTER TO WINDOW
window.loadSiswaAdmin = loadSiswaAdmin;
window.simpanSiswa = simpanSiswa;
window.editSiswa = editSiswa;
window.filterMurid = filterMurid;
window.autoHitungExpiredSiswa = autoHitungExpiredSiswa;
window.generateInvoice = generateInvoice;
window.hitungTotalInvoice = hitungTotalInvoice;
window.submitInvoiceDatabase = submitInvoiceDatabase;
window.tutupModalInvoice = tutupModalInvoice;
window.loadDropdownMuridForWali = loadDropdownMuridForWali;
window.buatAkunWali = buatAkunWali;
window.simpanPrestasiAdmin = simpanPrestasiAdmin;
