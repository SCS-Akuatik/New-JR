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
    muatChecklistHarian();
    await hitungMyBonus();
    // Bisa tambah badge notif Leads & Renewal di sini nantinya
};

// ==========================================
// 1. RENEWAL QUEUE (Tabel: murid)
// ==========================================
window.loadRenewalQueue = async function() {
    const container = document.getElementById('list-renewal-container');
    container.innerHTML = '<p class="text-center text-slate-400 py-4 italic text-sm">🔄 Menarik data antrean dari server...</p>';
    
    try {
        // PAKE NAMA KOLOM ASLI DATABASE-MU
        const { data, error } = await sb
            .from('murid') 
            .select('id_murid, nama_murid, jenis_paket, sisa_sesi, no_wa, expired_sesi')
            .lte('sisa_sesi', 2)
            .order('sisa_sesi', { ascending: true }); // Urutkan dari sesi 0 dulu

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
            let badgeOverdue = isOverdue ? `<span class="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 rounded border border-red-300 animate-pulse">⚠️ SESA HABIS</span>` : '';

            // Template WA Alarm Renewal
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
// 2. LEADS INBOX (Tabel: pendaftaran_pending)
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
            
            // Template WA Sambutan
            const pesanWA = `Halo Bunda ${lead.nama}, terima kasih sudah mendaftar di Jago Renang Academy! 🎉%0A%0AData pendaftaran jagoan kita sudah kami terima. Berikutnya kami akan mengirimkan link Invoice untuk aktivasi akun dan jadwal perdananya ya Bun.%0A%0AApakah ada pertanyaan soal program kelasnya?`;
            
            let noWa = lead.no_wa ? lead.no_wa.toString() : "";
            if (noWa.startsWith("0")) noWa = "62" + noWa.substring(1);

            html += `
            <div class="bg-white border border-amber-300 shadow-sm shadow-amber-50 rounded-xl p-4 mb-3">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm m-0">🆕 ${lead.nama}</h3>
                        <p class="text-[11px] text-slate-500 font-bold mt-0.5">Daftar: ${tglDaftar}</p>
                    </div>
                    <span class="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded">PENDING INVOICE</span>
                </div>
                
                <div class="flex gap-2 mt-3">
                    <a href="https://wa.me/${noWa}?text=${pesanWA}" target="_blank" class="flex-[2] bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg text-xs text-center transition">
                        💬 Sapa via WA
                    </a>
                    <!-- NOTE: Karena murid belum masuk tabel 'murid', tombol invoice ini mungkin perlu logic khusus insert ke tabel murid dulu atau proses approval -->
                    <button onclick="alert('Fitur Approval & Generate Invoice Leads sedang disiapkan!')" class="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs text-center transition">
                        ✅ Approve
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
// 3. FUNGSI PEMBANTU (INVOICE, BONUS, CEKLIS)
// ==========================================
window.triggerInvoiceDariAdmin2 = function(id_murid, nama_murid, paket) {
    const modal = document.getElementById('modal-invoice');
    if(modal) {
        modal.classList.remove('hidden'); 
        // Menggunakan id HTML yang ada di kodemu sebelumnya
        document.getElementById('hidden-inv-murid-id').value = id_murid;
        document.getElementById('inv-input-nama').value = nama_murid;
        document.getElementById('inv-input-paket').value = paket;
        
        document.getElementById('inv-nomor').innerText = "INV/JR/" + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('inv-tanggal').innerText = new Date().toLocaleDateString('id-ID');
        
        // Animasi UI Score (Gamification)
        let paidScore = parseInt(document.getElementById('score-paid').innerText);
        document.getElementById('score-paid').innerText = paidScore + 1;
    } else {
        alert("Modal Invoice tidak ditemukan!");
    }
};

window.hitungMyBonus = async function() {
    try {
        // Query tabel invoices yang statusnya Paid 
        // Admin ID belum ada di tabel invoice, jadi pakai dummy dulu biar angkanya gede wkwk
        let totalBonus = 2150000; 
        document.getElementById('admin2-bonus-display').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalBonus);
    } catch(e) {
        console.error(e);
    }
};

window.updateScoreKontak = function() {
    let k = parseInt(document.getElementById('score-kontak').innerText);
    document.getElementById('score-kontak').innerText = k + 1;
};

// Logika Content Tracker tetap sama persis seperti sebelumnya (pakai LocalStorage)
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
