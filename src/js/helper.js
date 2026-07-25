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
// =========================================================
// FITUR ACC PENDAFTARAN & AUTO INVOICE WA (VITE FIX)
// =========================================================

// 1. Fungsi Tarik Data Antrean
window.loadPendingPendaftaran = async function() {
    const container = document.getElementById('admin-notif-pending');
    const list = document.getElementById('list-pendaftar-pending');
    if(!container || !list) return;

    const { data, error } = await sb.from('pendaftaran_pending')
        .select('*')
        .eq('status', 'Menunggu Invoice')
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        container.classList.add('hidden'); 
        return;
    }

    container.classList.remove('hidden'); 
    let html = '';
    data.forEach(p => {
        // 🔥 TANGKAP ADMIN ID / NAMA SALES DARI DATABASE 🔥
        const salesAsli = p.admin_id || p.nama_sales || 'Pusat / Organik';

        html += `
        <div class="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-2 mb-2">
            <div>
                <strong class="text-red-700 text-sm">${p.nama}</strong><br>
                <span class="text-xs text-slate-500">WA: ${p.no_wa} | User: ${p.username}</span>
                <span class="block text-[10px] text-indigo-500 font-bold mt-0.5">Sales: ${salesAsli}</span>
            </div>
            <!-- 🔥 LEMPAR salesAsli SEBAGAI PARAMETER KE-7 🔥 -->
            <button onclick="approvePendaftar(${p.id}, '${p.nama}', '${p.tanggal_lahir}', '${p.no_wa}', '${p.username}', '${p.password}', '${salesAsli}')" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded text-xs w-full md:w-auto">✅ ACC & Tagih</button>
        </div>`;
    });
    list.innerHTML = html;
};

// Auto-refresh buat Admin 2
if (typeof window.loadLeadsInbox === 'function') {
    window.loadLeadsInbox();
}

// 2. Trik Auto-Refresh Notif setiap 5 detik (Live Tracker)
setInterval(() => {
    const adminHub = document.getElementById('dashboard-admin');
    if (adminHub && !adminHub.classList.contains('hidden')) {
        window.loadPendingPendaftaran();
    }
}, 5000);

// 3. Fungsi Mengeksekusi (Approve) Calon Murid (TAMBAHAN PARAMETER salesAsli)
window.approvePendaftar = async function(idPending, nama, tglLahir, wa, user, pass, salesAsli) {
    if(!confirm(`Approve pendaftaran ${nama}? (Sistem otomatis membuat Akun & Data)`)) return;

    const { error: errUser } = await sb.from('users').insert([{ username: user, password: pass, role: ['parent'] }]);
    
    if (errUser && errUser.code !== '23505') {
        return alert("Gagal buat akun (Username mungkin bermasalah): " + errUser.message);
    }

    const { data: muridBaru, error: errMurid } = await sb.from('murid').insert([{
        nama_murid: nama,
        tanggal_lahir: tglLahir,
        no_wa: wa, 
        parent_username: user, 
        sisa_sesi: 0,
        jenis_paket: 'Kelas Beginner (Baru)' 
    }]).select('id_murid').single();

    if (errMurid) return alert("Gagal simpan data murid: " + errMurid.message);

    await sb.from('pendaftaran_pending').update({ status: 'Selesai' }).eq('id', idPending);

    if (typeof window.generateInvoice === 'function') {
        await window.generateInvoice(muridBaru.id_murid, nama, 'Kelas Beginner (Baru)', wa);
    } else {
        const modalInv = document.getElementById('modal-invoice');
        if (modalInv) {
            modalInv.classList.remove('hidden'); 
            document.getElementById('hidden-inv-murid-id').value = muridBaru.id_murid;
            document.getElementById('inv-input-nama').value = nama;
            document.getElementById('inv-input-paket').value = 'Kelas Beginner (Baru)';
        } else {
            console.error("Modal Invoice tidak ditemukan!");
        }
    }

    const btnSubmit = document.querySelector('button[onclick="submitInvoiceDatabase()"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = "🚀 Cetak Tagihan & Kirim Akses Akun";
        btnSubmit.onclick = function() {
            // 🔥 OPER salesAsli KE DALAM FUNGSI INVOICE 🔥
            window.submitInvoiceBaruSpesial(muridBaru.id_murid, nama, wa, user, pass, salesAsli, btnSubmit); 
        };
    }

    alert(`Berhasil meng-ACC Ananda ${nama}! Nomor Invoice otomatis ter-generate. Silakan isi Sesi 1 dan Nominal Biaya.`);
    window.loadPendingPendaftaran(); 
};

// 4. Fungsi Kirim WA Spesial Member Baru & INJECT KOMISI SALES 
window.submitInvoiceBaruSpesial = async function(idMurid, nama, wa, user, pass, salesAsli, btnTarget) {
    const btn = btnTarget || event.target;
    btn.innerText = "⏳ Menyimpan...";
    btn.disabled = true;

    const noInv = document.getElementById('inv-nomor').innerText;
    const tglTerbitRaw = new Date().toISOString().split('T')[0];
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
        alert("Tanggal Sesi 1 wajib diisi untuk menentukan masa aktif rapor!");
        btn.innerText = "🚀 Cetak Tagihan & Kirim Akses Akun";
        btn.disabled = false;
        return;
    }

    // ==============================================================
    // 🔥🔥 KUNCI PENENTU KEADILAN KOMISI 🔥🔥
    // ==============================================================
    const currentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
    let adminPemilikKomisi = currentUser; // Defaultnya orang yang lagi login
    
    // TAPI, kalau ternyata salesAsli ada isinya (dibawa oleh marketing),
    // Timpa hak kepemilikan tagihan ini ke nama salesAsli tersebut!
    if (salesAsli && salesAsli !== 'Pusat / Organik' && salesAsli !== 'undefined' && salesAsli !== 'null') {
        adminPemilikKomisi = salesAsli;
    }
    // ==============================================================

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
            status: 'Unpaid',
            admin_id: adminPemilikKomisi // <--- KOMISI AMAN TERKENDALI
        }]);

        if (error) {
            if(error.code === '23505') throw new Error("Nomor invoice tabrakan, silakan generate ulang.");
            throw error;
        }

        let noWaFormated = wa.toString();
        if (noWaFormated.startsWith('0')) {
            noWaFormated = '62' + noWaFormated.substring(1);
        }

        const dateOpt = { day: '2-digit', month: 'short', year: 'numeric' };
        const tglCantikTerbit = new Date().toLocaleDateString('id-ID', dateOpt);
        const tglCantikExp = expDate ? new Date(expDate).toLocaleDateString('id-ID', dateOpt) : "-";

        const teksWA = `Halo Ayah/Bunda dari *${nama}*! 👋%0A%0ASelamat, pendaftaran ananda di *Jago Renang Academy* telah disetujui.%0A%0A🧾 *DETAIL TAGIHAN*:%0ANo Invoice: ${noInv}%0ATgl Terbit: ${tglCantikTerbit}%0APaket: ${paket}%0ATotal Tagihan: *Rp ${total.toLocaleString('id-ID')}*%0A%0ASilakan lakukan pembayaran melalui *QRIS Jago Renang Academy* (Barcode gambar QRIS akan dikirimkan Admin setelah pesan ini) atau via transfer bank.%0A⏳ Batas Expired Sesi: ${tglCantikExp}%0A%0A🔑 *AKSES APLIKASI LOGIN WALI MURID*:%0AUsername: ${user}%0APassword: ${pass}%0ALink Login: https://www.jagorenang.my.id%0A%0ATerima kasih!`;

        window.open(`https://wa.me/${noWaFormated}?text=${teksWA}`, '_blank');

        if (typeof window.tutupModalInvoice === 'function') {
            window.tutupModalInvoice();
        } else {
             document.getElementById('modal-invoice').classList.add('hidden');
        }
        
        alert(`Invoice Berhasil Disimpan & Didaftarkan ke: ${adminPemilikKomisi}`);

        if (typeof window.loadPendingInvoiceAdmin2 === 'function') {
            window.loadPendingInvoiceAdmin2();
        }

        if(btn) {
            btn.innerHTML = "💾 Submit & Kirim WA";
            btn.setAttribute('onclick', 'submitInvoiceDatabase()');
            btn.onclick = null;
        }

    } catch (err) {
        console.error("Error pendaftaran invoice simpan:", err);
        alert(`Gagal menyimpan Invoice: ${err.message}`);
    } finally {
        btn.innerText = "🚀 Cetak Tagihan & Kirim Akses Akun";
        btn.disabled = false;
    }
};

// ==========================================
// DAFTARKAN SEMUA HELPER KE GLOBAL WINDOW
// ==========================================
window.formatRupiah = formatRupiah;
window.formatTanggal = formatTanggal;
window.chatAdmin = chatAdmin;
window.hitungKelompokUmur = hitungKelompokUmur;
window.loadDaftarKolam = loadDaftarKolam;
window.hapusData = hapusData;
