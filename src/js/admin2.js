import { sb } from './config.js';

window.bukaModulAdmin2 = function(idTarget) {
    const moduls = ['dashboard-admin2', 'admin2-modul-renewal', 'admin2-modul-content', 'admin2-modul-leads'];
    moduls.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    document.getElementById(idTarget).classList.remove('hidden');
};

window.initDashboardAdmin2 = async function() {
    bukaModulAdmin2('dashboard-admin2');
    
    // Panggil Jam duluan agar UI langsung ter-update tanpa delay
    jalankanJamWIB(); 
    
    // Proses data secara asinkron tanpa memblokir UI satu sama lain
    muatChecklistHarian();
    loadProfilAdmin(); 
    hitungMyBonus();
    loadPendingInvoiceAdmin2();
};

// ==========================================
// 1. RENEWAL QUEUE (Tabel: murid)
// ==========================================
window.loadRenewalQueue = async function() {
    const container = document.getElementById('list-renewal-container');
    container.innerHTML = '<p class="text-center text-slate-400 py-4 italic text-sm">🔄 Menarik data antrean dari server...</p>';
    
    try {
        const { data, error } = await sb
            .from('murid') 
            .select('id_murid, nama_murid, jenis_paket, sisa_sesi, no_wa, expired_sesi')
            .lte('sisa_sesi', 2)
            .order('sisa_sesi', { ascending: true });

        if (error) throw error;

        if (data.length === 0) {
            container.innerHTML = `<div class="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-center text-sm font-bold border border-emerald-200">🎉 Mantap! Tidak ada antrean Renewal hari ini.</div>`;
            return;
        }

        document.getElementById('badge-renewal-count').innerText = data.length;
        document.getElementById('score-fu').innerText = data.length;

        let html = '';
        data.forEach(m => {
            let isOverdue = (m.sisa_sesi <= 0);
            let badgeOverdue = isOverdue ? `<span class="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 rounded border border-red-300 animate-pulse">⚠️ SESI HABIS</span>` : '';

            const pesanWA = `Halo Ayah/Bunda ${m.nama_murid}, ini Admin JR Academy 👋.%0A%0AInfo nih Bun, sesi renang Jagoan kita sisa ${m.sisa_sesi} pertemuan lagi lho. Biar jadwal latihannya nggak keputus, yuk amankan kuota untuk paket selanjutnya!%0A%0ABisa balas pesan ini untuk diterbitkan invoice tagihannya ya Bun. Terima kasih! 😊🏊‍♂️`;
            
            let noWa = m.no_wa ? m.no_wa.toString() : "";
            if (noWa.startsWith("0")) noWa = "62" + noWa.substring(1);

            html += `
            <div class="bg-white border ${isOverdue ? 'border-red-400 shadow-sm shadow-red-100' : 'border-slate-200'} rounded-xl p-4 transition hover:shadow-md">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm m-0 flex items-center gap-2">
                            👤 ${m.nama_murid} ${badgeOverdue}
                        </h3>
                        <p class="text-[11px] text-slate-500 font-bold mt-0.5">${m.jenis_paket || 'Belum ada paket'}</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-4 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-3">
                    <div class="${isOverdue ? 'text-red-600' : 'text-sky-600'}">
                        📅 Sisa Sesi: <span class="text-sm">${m.sisa_sesi}</span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <a href="https://wa.me/${noWa}?text=${pesanWA}" target="_blank" onclick="updateScoreKontak()" class="flex-[2] bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs text-center flex items-center justify-center gap-1.5 transition">
                        💬 WA Reminder
                    </a>
                    <button onclick="triggerInvoiceDariAdmin2('${m.id_murid}', '${m.nama_murid}', '${m.jenis_paket || ''}')" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-xs text-center transition">
                        🧾 Buat Invoice
                    </button>
                </div>
            </div>`;
        });

        container.innerHTML = html;
    } catch (e) {
        console.error("Error Renewal:", e);
        container.innerHTML = '<p class="text-center text-red-500 py-4 text-sm">Gagal memuat data. Cek koneksi.</p>';
    }
};

// ==========================================
// 2. LEADS INBOX (PENDAFTARAN BARU)
// ==========================================
window.loadLeadsInbox = async function() {
    bukaModulAdmin2('admin2-modul-leads');
    const container = document.getElementById('list-leads-container');
    container.innerHTML = '<p class="text-center text-slate-400 py-4 italic text-sm">🔄 Mencari leads baru...</p>';
    
    try {
        const { data, error } = await sb
            .from('pendaftaran_pending')
            .select('*')
            .eq('status', 'Menunggu Invoice')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data.length === 0) {
            container.innerHTML = `<div class="bg-slate-50 text-slate-500 p-4 rounded-xl text-center text-sm font-bold border border-slate-200">Belum ada pendaftar baru hari ini.</div>`;
            return;
        }

        let html = '';
        data.forEach(lead => {
            const tglDaftar = new Date(lead.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute:'2-digit' });
            
            const pesanWA = `Halo Bunda ${lead.nama}, terima kasih sudah mendaftar di Jago Renang Academy! 🎉%0A%0AData pendaftaran jagoan kita sudah kami terima. Berikutnya kami akan mengirimkan link Invoice untuk aktivasi akun dan jadwal perdananya ya Bun.%0A%0AApakah ada pertanyaan soal program kelasnya?`;
            
            let noWa = lead.no_wa ? lead.no_wa.toString() : "";
            if (noWa.startsWith("0")) noWa = "62" + noWa.substring(1);

            html += `
            <div class="bg-white border border-amber-300 shadow-sm shadow-amber-50 rounded-xl p-4 mb-3">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm m-0">🆕 ${lead.nama}</h3>
                        <p class="text-[11px] text-slate-500 font-bold mt-0.5">Daftar: ${tglDaftar}</p>
                        <p class="text-[11px] text-slate-600 mt-1">WA: ${lead.no_wa} | User: ${lead.username}</p>
                    </div>
                    <span class="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded">PENDING</span>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-2 mt-3">
                    <a href="https://wa.me/${noWa}?text=${pesanWA}" target="_blank" class="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg text-xs text-center transition">
                        💬 Sapa via WA
                    </a>
                    <button onclick="approvePendaftar(${lead.id}, '${lead.nama}', '${lead.tanggal_lahir}', '${lead.no_wa}', '${lead.username}', '${lead.password}')" class="flex-[1.5] bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-xs text-center transition shadow-sm">
                        ✅ ACC & Tagih
                    </button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    } catch (e) {
        console.error("Error Leads:", e);
        container.innerHTML = '<p class="text-center text-red-500 py-4 text-sm">Gagal memuat leads.</p>';
    }
};

// ==========================================
// 3. FUNGSI PEMBANTU & GAMIFICATION BONUS
// ==========================================
window.triggerInvoiceDariAdmin2 = function(id_murid, nama_murid, paket) {
    const modal = document.getElementById('modal-invoice');
    if(modal) {
        modal.classList.remove('hidden'); 
        document.getElementById('hidden-inv-murid-id').value = id_murid;
        document.getElementById('inv-input-nama').value = nama_murid;
        document.getElementById('inv-input-paket').value = paket;
        
        document.getElementById('inv-nomor').innerText = "INV/JR/" + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('inv-tanggal').innerText = new Date().toLocaleDateString('id-ID');
        
    } else {
        alert("Modal Invoice tidak ditemukan!");
    }
};

// 🔥 FUNGSI HITUNG BONUS (MURNI NARIK DARI fee_marketing) 🔥
window.hitungMyBonus = async function() {
    try {
        const currentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
        if (!currentUser) return;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const startDate = `${currentYear}-${currentMonth}-01`;
        const endDate = `${currentYear}-${currentMonth}-31`;

        const { data, error } = await sb.from('fee_marketing')
            .select('fee')
            .eq('admin_id', currentUser)
            .gte('tanggal_cair', startDate)
            .lte('tanggal_cair', endDate);

        if (error) throw error;

        let totalBonus = 0;
        
        if (data && data.length > 0) {
            totalBonus = data.reduce((sum, item) => sum + (parseInt(item.fee) || 0), 0);
        }

        const elBonus = document.getElementById('admin2-bonus-display');
        if (elBonus) {
            elBonus.innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalBonus);
        }
        
    } catch(e) {
        console.error("Gagal menghitung bonus:", e);
    }
};

window.updateScoreKontak = function() {
    let k = parseInt(document.getElementById('score-kontak').innerText);
    document.getElementById('score-kontak').innerText = k + 1;
};

window.muatChecklistHarian = function() {
    const today = new Date().toLocaleDateString('id-ID');
    document.getElementById('tgl-checklist').innerText = today;
    const savedDate = localStorage.getItem('checklist_date');
    if(savedDate !== today) {
        localStorage.setItem('chk-ig-story', 'false');
        localStorage.setItem('chk-ig-reels', 'false');
        localStorage.setItem('chk-balas-komen', 'false');
        localStorage.setItem('checklist_date', today);
    }
    document.getElementById('chk-ig-story').checked = (localStorage.getItem('chk-ig-story') === 'true');
    document.getElementById('chk-ig-reels').checked = (localStorage.getItem('chk-ig-reels') === 'true');
    document.getElementById('chk-balas-komen').checked = (localStorage.getItem('chk-balas-komen') === 'true');
};

window.simpanChecklist = function() {
    localStorage.setItem('chk-ig-story', document.getElementById('chk-ig-story').checked);
    localStorage.setItem('chk-ig-reels', document.getElementById('chk-ig-reels').checked);
    localStorage.setItem('chk-balas-komen', document.getElementById('chk-balas-komen').checked);
    muatChecklistHarian();
};

// ==========================================
// 4. MANAJEMEN INVOICE PENDING KHUSUS ADMIN 2
// ==========================================
window.loadPendingInvoiceAdmin2 = async function() {
    const container = document.getElementById('admin2-pending-invoice-list');
    if(!container) return;
    
    container.innerHTML = '<p class="text-center text-xs text-slate-400 italic py-2">🔄 Menarik data...</p>';
    const currentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('username');

    try {
        const { data, error } = await sb.from('invoices')
            .select('*')
            .eq('admin_id', currentUser)
            .eq('status', 'Unpaid')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center text-xs text-teal-600 font-bold py-2">✨ Bersih! Tidak ada tagihan yang gantung.</p>';
            return;
        }

        let html = '';
        data.forEach(inv => {
            let totalVal = inv.total || inv.biaya || 0;
            
            html += `
            <div class="bg-white border border-amber-300 rounded-lg p-3 shadow-sm flex flex-col gap-2">
                <div class="flex justify-between items-start">
                    <div>
                        <strong class="text-sky-700 text-xs">${inv.nomor_invoice || inv.no_invoice}</strong>
                        <p class="text-[11px] font-bold text-slate-700 mt-0.5">👤 ${inv.nama_murid || 'Tanpa Nama'}</p>
                    </div>
                    <span class="text-amber-600 font-black text-sm">Rp ${totalVal.toLocaleString('id-ID')}</span>
                </div>
                
                <div class="flex gap-2 mt-1">
                    <button onclick="lunasiInvoiceAdmin2(${inv.id}, '${inv.nomor_invoice || inv.no_invoice}', '${inv.nama_murid}', ${totalVal})" class="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded text-[10px] transition shadow-sm">
                        ✅ Tandai Lunas
                    </button>
                    <button onclick="window.open('https://wa.me/?text=Halo%20Ayah/Bunda%20${inv.nama_murid},%20mengingatkan%20tagihan%20${inv.nomor_invoice || inv.no_invoice}%20belum%20diselesaikan.%20Terima%20kasih!', '_blank')" class="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 font-bold px-3 py-2 rounded text-[10px] transition">
                        🔔 Follow Up
                    </button>
                </div>
            </div>`;
        });
        
        container.innerHTML = html;
    } catch(e) {
        console.error("Gagal memuat pending invoice:", e);
        container.innerHTML = '<p class="text-center text-xs text-red-500 py-2">Gagal memuat data.</p>';
    }
};

// 🔥 FUNGSI LUNASI INVOICE (Dilengkapi Insert ke fee_marketing) 🔥
window.lunasiInvoiceAdmin2 = async function(idInvoice, noInvoice, namaSiswa, total) {
    if (!confirm(`✅ Tandai Invoice ${noInvoice} (${namaSiswa}) LUNAS?\nBonus Rp 10.000 akan masuk ke dompetmu!`)) return;

    try {
        const currentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('username');

        // 1. Update status jadi Paid
        const { error: errInv } = await sb.from('invoices').update({ status: 'Paid' }).eq('id', idInvoice);
        if (errInv) throw errInv;

        const now = new Date();
        const tglHariIni = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        
        // 2. Catat ke Arus Kas Pusat
        const { error: errKas } = await sb.from('akunting').insert([{
            tanggal: tglHariIni,
            keterangan: `Pembayaran ${noInvoice} - ${namaSiswa} (Via ${currentUser})`,
            jenis: 'Pemasukan',
            jumlah: parseInt(total)
        }]);
        if (errKas) throw errKas;

        // 3. Catat Bonus ke tabel fee_marketing
        const feeBounty = 10000;
        const { error: errFee } = await sb.from('fee_marketing').insert([{
            admin_id: currentUser,
            invoice_id: idInvoice,
            no_invoice: noInvoice,
            tanggal_cair: tglHariIni,
            fee: feeBounty
        }]);
        if (errFee) throw errFee;

        let paidScoreEl = document.getElementById('score-paid');
        if (paidScoreEl) {
            paidScoreEl.innerText = parseInt(paidScoreEl.innerText) + 1;
        }
        
        alert("🎉 BOOM! Invoice Lunas. Bonus Rp 10.000 berhasil dicatat!");
        
        loadPendingInvoiceAdmin2();
        hitungMyBonus(); 

    } catch(e) {
        alert("Gagal memproses pembayaran: " + e.message);
        console.error(e);
    }
};

// ==========================================
// 5. PROFIL ADMIN, UPLOAD AVATAR & JAM WIB
// ==========================================

window.jalankanJamWIB = function() {
    const elJam = document.getElementById('admin-jam-realtime');
    const elTgl = document.getElementById('admin-tgl-realtime'); 

    const updateWaktu = () => {
        try {
            const now = new Date();
            // Format Jam (Manual murni biar HP/Browser apapun gak error)
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            if(elJam) elJam.innerText = `${hh}:${mm}`;

            // Format Tanggal (Manual: Sel, 21 Jul)
            const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const blnList = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
            const namaHari = hariList[now.getDay()];
            const tgl = now.getDate();
            const namaBln = blnList[now.getMonth()];
            
            if(elTgl) elTgl.innerText = `${namaHari}, ${tgl} ${namaBln}`;
        } catch(e) {
            console.error("Jam Error:", e);
        }
    };

    updateWaktu(); // Eksekusi instan
    if(window.jamInterval) clearInterval(window.jamInterval);
    window.jamInterval = setInterval(updateWaktu, 1000);
};

window.loadProfilAdmin = async function() {
    const currentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
    if(!currentUser) return;

    const elNama = document.getElementById('admin-nama-panggilan');
    const elRole = document.getElementById('admin-role-label');
    const elFoto = document.getElementById('admin-avatar-img');

    // 1. Tembak UI Instan (Fallback) sebelum nunggu Database loading
    let callName = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);
    if(currentUser.toLowerCase() === 'trialfebi') callName = 'Febi';
    
    if (elNama) elNama.innerText = callName;
    if (elFoto) elFoto.src = `https://ui-avatars.com/api/?name=${callName}&background=0D8ABC&color=fff`;

    try {
        // 2. Tarik Data! Pakai "select('*')" biar GAK CRASH kalau kolom call_name belum ada
        const { data, error } = await sb.from('users').select('*').eq('username', currentUser).maybeSingle();
        
        if (data) {
            if (elNama && data.call_name) {
                elNama.innerText = data.call_name;
                // Update avatar inisial dengan nama aslinya
                if(elFoto && !data.avatar_url) elFoto.src = `https://ui-avatars.com/api/?name=${data.call_name}&background=0D8ABC&color=fff`;
            }
            if (elRole && data.role_label) elRole.innerText = data.role_label;
            
            if (elFoto && data.avatar_url) {
                elFoto.src = data.avatar_url;
                // Cegah gambar rusak/blank kalau link mati
                elFoto.onerror = () => { elFoto.src = `https://ui-avatars.com/api/?name=${data.call_name || callName}&background=0D8ABC&color=fff`; };
            }
        }
    } catch(e) {
        console.error("Database profil aman di-bypass:", e);
    }
};

window.uploadAvatarAdmin = async function(event) {
    const file = event.target.files[0];
    if(!file) return;

    if(file.size > 2 * 1024 * 1024) {
        return alert("🚨 Ukuran file terlalu besar! Maksimal 2MB ya Bos.");
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if(!validTypes.includes(file.type)) {
        return alert("🚨 Format file harus JPG, PNG, atau WEBP.");
    }

    const currentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('username');
    const elFoto = document.getElementById('admin-avatar-img');
    const oldSrc = elFoto.src; 
    
    elFoto.style.opacity = '0.5';

    try {
        const ext = file.name.split('.').pop();
        const fileName = `avatar_${Date.now()}.${ext}`;
        // Path murni pakai username agar tidak tertukar
        const filePath = `${currentUser}/${fileName}`; 

        const { error: uploadError } = await sb.storage
            .from('admin-avatars')
            .upload(filePath, file, { upsert: true, cacheControl: '3600' });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = sb.storage
            .from('admin-avatars')
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // Update ke database users lokal
        const { error: updateError } = await sb.from('users')
            .update({ avatar_url: publicUrl })
            .eq('username', currentUser);

        if (updateError) throw updateError;

        elFoto.src = publicUrl;
        alert("✅ Foto profil berhasil diperbarui!");

    } catch(e) {
        console.error("Gagal upload avatar:", e);
        alert("Gagal mengunggah foto: " + e.message);
        elFoto.src = oldSrc; 
    } finally {
        elFoto.style.opacity = '1';
    }
};

// AUTO PANGGIL paksa biar jam & nama nggak bengong saat halaman dibuka
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if(document.getElementById('admin-jam-realtime')) jalankanJamWIB();
        if(document.getElementById('admin-nama-panggilan')) loadProfilAdmin();
    }, 500);
});
