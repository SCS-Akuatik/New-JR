import { sb } from './config.js';

// Helper: Format tanggal cantik buat cetak PDF & Detail
function formatTglIndo(tglStr) {
    if(!tglStr) return '-';
    const [y, m, d] = tglStr.split('-');
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${d} ${bulan[parseInt(m)-1]} ${y}`;
}

export async function initDropdownCoach() {
    const selectCoach = document.getElementById('coach-nama');
    const selectFee = document.getElementById('fee-nama');
    try {
        const { data, error } = await sb.from('coach').select('nama_coach').order('nama_coach', { ascending: true });
        if (error) throw error;
        let options = '<option value="">Pilih Coach...</option>';
        data?.forEach(c => { options += `<option value="${c.nama_coach}">${c.nama_coach}</option>`; });
        if (selectCoach) selectCoach.innerHTML = options;
        if (selectFee) selectFee.innerHTML = options;
    } catch(e) { console.error("Gagal muat dropdown coach:", e); }
}

/* =========================================================
   🔥 FITUR ANTREAN FEE (BUG FIXED: FORMAT TANGGAL & GEMBOK) 🔥
========================================================= */
export async function loadAntreanFeeAdmin() {
    const list = document.getElementById('admin-antrean-fee-list');
    if(!list) return;
    list.innerHTML = '<p style="text-align:center; font-size:12px;">Memuat laporan masuk...</p>';

    const { data, error } = await sb.from('antrean_fee').select('*').order('id', { ascending: true });
    if (error) return list.innerHTML = '<p style="color:red; text-align:center;">Gagal memuat data.</p>';

    let html = '';
    data.forEach(item => {
        html += `
        <div style="background:#ffffff; border:1px solid #10b981; border-radius:8px; padding:12px; margin-bottom:12px; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            <div style="margin-bottom:12px; border-bottom:1px dashed #e2e8f0; padding-bottom:8px;">
                <strong style="color:#047857; font-size:14px;">Coach ${item.nama_coach}</strong><br>
                <small style="color:#475569; font-weight:bold;">${item.tipe_class} | Murid: ${item.nama_murid}</small><br>
                <small style="color:#64748b;">📅 Selesai: ${item.tanggal_selesai}</small>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; align-items:center; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:0 10px;">
                    <span style="font-weight:bold; color:#64748b; margin-right:8px;">Rp</span>
                    <input type="number" id="input-fee-${item.id}" placeholder="Ketik nominal fee..." style="flex:1; border:none; background:transparent; padding:10px 0; font-size:14px; outline:none;">
                </div>
                <button onclick="accFeeCoach(${item.id}, '${item.nama_coach}', '${item.nama_murid}', '${item.tipe_class}', '${item.tanggal_selesai}', event)" style="width:100%; background:#10b981; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:13px;">✅ Cairkan Fee</button>
            </div>
        </div>`;
    });
    list.innerHTML = html || '<p style="text-align:center; color:#64748b; font-size:13px; font-style:italic;">✨ Belum ada laporan kelas selesai. Inbox bersih!</p>';
}

export async function accFeeCoach(idAntrean, namaCoach, namaMurid, tipeClass, tglSelesai, event) {
    const nominal = document.getElementById(`input-fee-${idAntrean}`).value;
    if (!nominal || nominal <= 0) return alert("Masukkan nominal fee yang valid!");

    const btn = event ? event.target : null;
    if(btn) { btn.innerText = "⏳..."; btn.disabled = true; }

    try {
        if (parseInt(nominal) === 1) {
            await sb.from('antrean_fee').delete().eq('id', idAntrean);
            alert("🗑️ Laporan dihapus! (Sistem mendeteksi input 1 Rupiah)");
        } else {
            // 🔥 FIX: Paksa konversi jadi YYYY-MM-DD biar database nggak nolak
            const tglMasukDB = new Date().toISOString().split('T')[0];

            // 1. COBA INSERT KE DB FEE_COACH
            const { error: errInsert } = await sb.from('fee_coach').insert([{
                nama_coach: namaCoach,
                jenis_sesi: tipeClass,
                nama_murid: namaMurid,
                total_sesi: 1, 
                total_fee: parseInt(nominal),
                tanggal: tglMasukDB // Menggunakan format valid
            }]);
            
            // 🔥 GEMBOK KEAMANAN: Kalau ditolak/gagal, JANGAN hapus antrean!
            if (errInsert) throw errInsert;

            // 2. KALAU INSERT BERHASIL, BARU BOLEH HAPUS ANTREAN
            const { error: errDelete } = await sb.from('antrean_fee').delete().eq('id', idAntrean);
            if (errDelete) throw errDelete;

            alert("✅ Cair! Fee berhasil diinput ke data Coach.");
        }
        
        loadAntreanFeeAdmin(); 
        loadFeeAdmin();
        if (typeof window.loadRekapFee === 'function') window.loadRekapFee();

    } catch (err) {
        console.error("Gagal Proses Fee:", err);
        alert("Gagal memproses laporan: " + err.message);
        if(btn) { btn.innerText = "✅ Cairkan Fee"; btn.disabled = false; }
    }
}

/* =========================================================
   FITUR LOAD REKAP & CETAK PDF
========================================================= */
export async function loadFeeAdmin() {
    const list = document.getElementById('admin-fee-list');
    if(!list) return;
    list.innerHTML = 'Memuat data...';
    
    const startEl = document.getElementById('filter-fee-start');
    const endEl = document.getElementById('filter-fee-end');
    
    let startDateStr = startEl ? startEl.value : "";
    let endDateStr = endEl ? endEl.value : "";

    let query = sb.from('fee_coach').select('*').order('tanggal', { ascending: false });
    
    // Filter by Date (kosong = tampil semua)
    if (startDateStr && endDateStr) query = query.gte('tanggal', startDateStr).lte('tanggal', endDateStr);
    else if (startDateStr) query = query.gte('tanggal', startDateStr);
    else if (endDateStr) query = query.lte('tanggal', endDateStr);

    const { data, error } = await query;
    if(error) return list.innerHTML = 'Gagal load data: ' + error.message;

    let html = '';
    data?.forEach(f => {
        html += `
        <div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong style="color:#0369a1;">${f.nama_coach}</strong> 
                <span style="background:#bae6fd; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:5px; color:#0369a1;">${f.jenis_sesi}</span><br>
                <small style="color:#64748b;">📅 ${f.tanggal || '-'} | 👤 Murid: <b style="color:#334155;">${f.nama_murid || '-'}</b></small><br>
                <span style="font-size:12px; color:#334155;">Total: ${f.total_sesi} Sesi (Rp ${parseInt(f.total_fee).toLocaleString('id-ID')})</span>
            </div>
            <button class="btn-danger" onclick="hapusData('fee_coach', ${f.id}, function(){ loadFeeAdmin(); loadRekapFee(); })" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:5px;">❌</button>
        </div>`;
    });
    list.innerHTML = html || '<p style="color:#64748b; font-size:12px;">Belum ada histori fee terbayar.</p>';
}

export async function tambahFee() {
    const nama = document.getElementById('fee-nama').value;
    const jenis = document.getElementById('fee-jenis').value; 
    const murid = document.getElementById('fee-murid').value.trim(); 
    const sesi = document.getElementById('fee-sesi').value;
    const total = document.getElementById('fee-total').value;
    const tgl = document.getElementById('fee-tanggal').value; 

    if (!nama || !jenis || !murid || !sesi || !total || !tgl) return alert("Lengkapi semua data, termasuk Nama Murid!");

    const { error } = await sb.from('fee_coach').insert([{ 
        nama_coach: nama, 
        jenis_sesi: jenis, 
        nama_murid: murid, 
        total_sesi: parseInt(sesi), 
        total_fee: parseFloat(total),
        tanggal: tgl 
    }]);

    if (error) return alert("Gagal: " + error.message);
    alert("Fee tersimpan!");
    
    document.getElementById('fee-murid').value = '';
    document.getElementById('fee-sesi').value = '';
    document.getElementById('fee-total').value = '';
    
    loadFeeAdmin(); 
    loadRekapFee(); 
}

export async function loadRekapFee() {
    const { data, error } = await sb.from('fee_coach').select('*');
    if (error) return;

    const container = document.getElementById('rekap-fee-container');
    if (!container) return;

    const startEl = document.getElementById('filter-fee-start');
    const endEl = document.getElementById('filter-fee-end');
    
    let startDateStr = startEl ? startEl.value : "";
    let endDateStr = endEl ? endEl.value : "";

    const rekap = {};
    let totalSemuaFee = 0; 

    data.forEach(item => {
        if (!item.tanggal) return;

        const tglData = new Date(item.tanggal);
        let inRange = true;

        if (startDateStr && endDateStr) {
            const start = new Date(`${startDateStr}T00:00:00`);
            const end = new Date(`${endDateStr}T23:59:59`);
            if (tglData < start || tglData > end) inRange = false;
        }

        if (inRange) {
            const nama = item.nama_coach;
            const fee = parseInt(item.total_fee) || 0;
            rekap[nama] = (rekap[nama] || 0) + fee;
            totalSemuaFee += fee; 
        }
    });

    let html = `
    <div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-bottom:15px;">
        <div style="margin-bottom:10px;padding-bottom:12px;border-bottom:1px solid #cbd5e1;">
            <strong style="color:#334155; display:block; margin-bottom:10px; font-size:14px;">📅 Filter Periode Fee Coach</strong>
            <div style="display:flex; gap:10px; align-items:center;">
                <div style="flex:1;">
                    <label style="display:block; font-size:10px; color:#64748b; font-weight:bold; margin-bottom:4px;">Mulai Tanggal:</label>
                    <input type="date" id="filter-fee-start" value="${startDateStr}" onchange="loadRekapFee(); loadFeeAdmin();" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:12px; font-weight:bold; color:#0f172a; outline:none;">
                </div>
                <div style="flex:1;">
                    <label style="display:block; font-size:10px; color:#64748b; font-weight:bold; margin-bottom:4px;">Sampai Tanggal:</label>
                    <input type="date" id="filter-fee-end" value="${endDateStr}" onchange="loadRekapFee(); loadFeeAdmin();" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:12px; font-weight:bold; color:#0f172a; outline:none;">
                </div>
            </div>
        </div>
        <div style="margin-top:10px;">
    `;

    if (Object.keys(rekap).length === 0) {
        html += `<p style="color:#64748b; font-size:12px;">Belum ada data gaji pada periode ini.</p>`;
    } else {
        for (const nama in rekap) {
            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding:8px; border-bottom:1px solid #e2e8f0; border-radius:6px; background:#f8fafc; cursor:pointer; transition: 0.2s;" class="hover:bg-slate-100">
                <div onclick="bukaDetailFee('${nama}', '${startDateStr}', '${endDateStr}')" style="flex:1; display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#0369a1; font-weight:bold; font-size:13px;">👨‍🏫 ${nama}</span>
                    <strong style="color:#10b981; font-size:13px; margin-right:10px;">Rp ${rekap[nama].toLocaleString('id-ID')}</strong>
                </div>
                <button onclick="cetakSlipGajiPDF('${nama}', '${startDateStr}', '${endDateStr}', ${rekap[nama]}); event.stopPropagation();" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer; font-weight:bold; box-shadow:0 1px 2px rgba(0,0,0,0.1); z-index:10;">📥 PDF</button>
            </div>`;
        }
        
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px; padding-top:10px; border-top:2px dashed #ef4444;">
            <span style="color:#b91c1c; font-weight:black; font-size:14px;">🚨 TOTAL BIAYA OPERASIONAL:</span>
            <strong style="color:#b91c1c; font-size:16px; font-weight:black;">Rp ${totalSemuaFee.toLocaleString('id-ID')}</strong>
        </div>`;
    }
    html += `</div></div>`;

    container.innerHTML = html;
}

export async function bukaDetailFee(namaCoach, startDateStr, endDateStr) {
    const modal = document.getElementById('modal-detail-fee');
    if (!modal) return alert("Peringatan: Elemen Modal Detail HTML belum dipasang di admin.html!");

    modal.style.display = 'flex';
    document.getElementById('detail-fee-nama').innerText = namaCoach;

    let periodeText = "Semua Waktu";
    if(startDateStr && endDateStr) periodeText = `Periode: ${formatTglIndo(startDateStr)} - ${formatTglIndo(endDateStr)}`;
    
    document.getElementById('detail-fee-periode').innerText = periodeText;
    document.getElementById('detail-fee-list').innerHTML = 'Memuat rincian data...';
    document.getElementById('detail-fee-total').innerText = 'Rp 0';

    let query = sb.from('fee_coach').select('*').eq('nama_coach', namaCoach).order('tanggal', { ascending: false });
    if (startDateStr && endDateStr) {
        query = query.gte('tanggal', startDateStr).lte('tanggal', endDateStr);
    }

    const { data, error } = await query;
    if (error) return document.getElementById('detail-fee-list').innerHTML = '<p style="color:red;">Gagal memuat data.</p>';

    let html = '';
    let total = 0;
    
    data.forEach(d => {
        total += parseFloat(d.total_fee);
        html += `
        <div style="border-bottom:1px dashed #cbd5e1; padding-bottom:10px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:4px;">
                <span style="color:#0369a1;">${d.jenis_sesi}</span>
                <span style="color:#10b981;">Rp ${parseInt(d.total_fee).toLocaleString('id-ID')}</span>
            </div>
            <div style="font-size:12px; color:#64748b; line-height:1.4;">
                📅 ${d.tanggal} | 👤 Murid: <b style="color:#334155;">${d.nama_murid || '-'}</b><br>
                Jumlah: ${d.total_sesi} Sesi
            </div>
        </div>`;
    });

    document.getElementById('detail-fee-list').innerHTML = html || '<p style="text-align:center; color:#94a3b8; margin-top:20px;">Tidak ada histori mengajar di periode ini.</p>';
    document.getElementById('detail-fee-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

export function tutupDetailFee() {
    const modal = document.getElementById('modal-detail-fee');
    if (modal) modal.style.display = 'none';
}

export async function cetakSlipGajiPDF(namaCoach, startDateStr, endDateStr, totalGaji) {
    if (!startDateStr || !endDateStr) {
        return alert("🚨 Pilih 'Mulai Tanggal' dan 'Sampai Tanggal' terlebih dahulu sebelum mencetak Slip PDF!");
    }

    if (typeof window.jspdf === 'undefined') {
        alert("Library PDF belum dimuat. Sistem sedang mencoba mengunduh, silakan klik tombol cetak lagi setelah 3 detik.");
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        document.head.appendChild(script);
        return;
    }

    const btn = event.target;
    const oldText = btn.innerHTML;
    btn.innerHTML = "⏳ Proses...";
    btn.disabled = true;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const { data, error } = await sb.from('fee_coach')
            .select('*')
            .eq('nama_coach', namaCoach)
            .gte('tanggal', startDateStr)
            .lte('tanggal', endDateStr)
            .order('tanggal', { ascending: true });

        if (error) throw error;

        doc.setFillColor(2, 132, 199); 
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("SLIP GAJI COACH", 105, 20, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("JAGO RENANG ACADEMY", 105, 28, { align: "center" });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`NAMA COACH : ${namaCoach.toUpperCase()}`, 15, 55);
        doc.text(`PERIODE    : ${formatTglIndo(startDateStr)} s/d ${formatTglIndo(endDateStr)}`, 15, 62);
        
        doc.setLineWidth(0.5);
        doc.line(15, 68, 195, 68);
        doc.setFontSize(10);
        doc.text("TANGGAL", 15, 75);
        doc.text("TIPE KELAS", 45, 75);
        doc.text("NAMA MURID", 80, 75);
        doc.text("SESI", 140, 75);
        doc.text("NOMINAL", 160, 75);
        doc.line(15, 78, 195, 78);

        let startY = 85;
        let grandTotalSesi = 0;
        doc.setFont("helvetica", "normal");
        
        data.forEach((d) => {
            if (startY > 270) { doc.addPage(); startY = 20; }
            const tglBagus = d.tanggal.split('-').reverse().join('/');
            doc.text(tglBagus, 15, startY);
            doc.text(d.jenis_sesi, 45, startY);
            
            let nmMurid = d.nama_murid || '-';
            if(nmMurid.length > 25) nmMurid = nmMurid.substring(0, 25) + '...';
            doc.text(nmMurid, 80, startY);
            
            doc.text(d.total_sesi.toString(), 145, startY);
            doc.text(`Rp ${parseInt(d.total_fee).toLocaleString('id-ID')}`, 160, startY);
            
            grandTotalSesi += parseInt(d.total_sesi);
            startY += 8;
        });

        doc.line(15, startY + 2, 195, startY + 2);
        startY += 12;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`TOTAL SESI  : ${grandTotalSesi} Pertemuan`, 15, startY);
        
        doc.setTextColor(220, 38, 38); 
        doc.setFontSize(16);
        doc.text(`TOTAL GAJI BERSIH : Rp ${totalGaji.toLocaleString('id-ID')}`, 15, startY + 10);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("*Slip gaji ini di-generate otomatis oleh Sistem Jago Renang.", 15, startY + 25);

        doc.save(`Slip_Gaji_${namaCoach}_${startDateStr}_to_${endDateStr}.pdf`);

    } catch (err) {
        alert("Terjadi kesalahan saat mencetak PDF: " + err.message);
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

// REGISTER KE WINDOW
window.initDropdownCoach = initDropdownCoach;
window.loadFeeAdmin = loadFeeAdmin;
window.tambahFee = tambahFee;
window.loadRekapFee = loadRekapFee;
window.cetakSlipGajiPDF = cetakSlipGajiPDF;
window.bukaDetailFee = bukaDetailFee;
window.tutupDetailFee = tutupDetailFee;
window.loadAntreanFeeAdmin = loadAntreanFeeAdmin;
window.accFeeCoach = accFeeCoach;
