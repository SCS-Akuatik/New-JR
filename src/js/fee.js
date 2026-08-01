import { sb } from './config.js';

/* =========================================================
   MANAJEMEN REKAP FEE COACH (ADMIN)
========================================================= */

// Helper: Bikin default tanggal 26 bulan lalu
function getDefaultStartDate() {
    let d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-26`;
}

// Helper: Bikin default tanggal 25 bulan ini
function getDefaultEndDate() {
    let d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-25`;
}

// Helper: Format tanggal cantik buat cetak PDF (Ex: 25 Agustus 2026)
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
        const { data, error } = await sb.from('coach')
            .select('nama_coach')
            .order('nama_coach', { ascending: true });

        if (error) throw error;

        let options = '<option value="">Pilih Coach...</option>';
        data?.forEach(c => { 
            options += `<option value="${c.nama_coach}">${c.nama_coach}</option>`; 
        });

        if (selectCoach) selectCoach.innerHTML = options;
        if (selectFee) selectFee.innerHTML = options;
    } catch(e) { 
        console.error("Gagal muat dropdown coach:", e); 
    }
}

export async function loadFeeAdmin() {
    const list = document.getElementById('admin-fee-list');
    if(!list) return;
    list.innerHTML = 'Memuat data...';
    
    // 1. Tarik nilai dari input tanggal (Filter Start & End)
    const startEl = document.getElementById('filter-fee-start');
    const endEl = document.getElementById('filter-fee-end');
    
    let startDateStr = startEl ? startEl.value : getDefaultStartDate();
    let endDateStr = endEl ? endEl.value : getDefaultEndDate();

    // 2. Tarik data murni berdasarkan rentang tanggal yang di-set di kalender
    const { data, error } = await sb.from('fee_coach')
        .select('*')
        .gte('tanggal', startDateStr)
        .lte('tanggal', endDateStr)
        .order('tanggal', { ascending: false });

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
    list.innerHTML = html || '<p style="color:#64748b; font-size:12px;">Belum ada histori fee terbayar di periode ini.</p>';
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
    if (error) { console.error(error); return; }

    const container = document.getElementById('rekap-fee-container');
    if (!container) return;

    // Ambil value tanggal (jika ada), atau gunakan default (Tgl 26 bulan lalu s/d Tgl 25 bulan ini)
    const startEl = document.getElementById('filter-fee-start');
    const endEl = document.getElementById('filter-fee-end');
    
    let startDateStr = startEl ? startEl.value : getDefaultStartDate();
    let endDateStr = endEl ? endEl.value : getDefaultEndDate();

    const startDate = new Date(`${startDateStr}T00:00:00`);
    const endDate = new Date(`${endDateStr}T23:59:59`);

    const rekap = {};
    let totalSemuaFee = 0; // Buat nyimpan grand total operasional (Garis Merah)

    data.forEach(item => {
        if (!item.tanggal) return;

        const tglData = new Date(item.tanggal);
        // Cek apakah tanggal record fee masuk ke dalam filter Start - End Date
        if (tglData >= startDate && tglData <= endDate) {
            const nama = item.nama_coach;
            const fee = parseInt(item.total_fee) || 0;
            rekap[nama] = (rekap[nama] || 0) + fee;
            totalSemuaFee += fee; 
        }
    });

    // Bikin UI Filter Tanggal
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
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding:8px; border-bottom:1px solid #e2e8f0; border-radius:6px; background:#f8fafc;">
                <span style="color:#0369a1; font-weight:bold; font-size:13px; flex:1;">👨‍🏫 ${nama}</span>
                <strong style="color:#10b981; font-size:13px; flex:1; text-align:right;">Rp ${rekap[nama].toLocaleString('id-ID')}</strong>
                <!-- TOMBOL CETAK PDF (Garis Hijau) -->
                <button onclick="cetakSlipGajiPDF('${nama}', '${startDateStr}', '${endDateStr}', ${rekap[nama]})" style="margin-left:10px; background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer; font-weight:bold; box-shadow:0 1px 2px rgba(0,0,0,0.1);">📥 PDF</button>
            </div>`;
        }
        
        // TOTAL KESELURUHAN (Garis Merah Bawah)
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px; padding-top:10px; border-top:2px dashed #ef4444;">
            <span style="color:#b91c1c; font-weight:black; font-size:14px;">🚨 TOTAL BIAYA OPERASIONAL:</span>
            <strong style="color:#b91c1c; font-size:16px; font-weight:black;">Rp ${totalSemuaFee.toLocaleString('id-ID')}</strong>
        </div>`;
    }
    html += `</div></div>`;

    container.innerHTML = html;
}

// 4. FUNGSI CETAK SLIP GAJI PDF PER COACH
export async function cetakSlipGajiPDF(namaCoach, startDateStr, endDateStr, totalGaji) {
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
        
        // Tarik data detail dari database berdasar rentang tanggal PDF
        const { data, error } = await sb.from('fee_coach')
            .select('*')
            .eq('nama_coach', namaCoach)
            .gte('tanggal', startDateStr)
            .lte('tanggal', endDateStr)
            .order('tanggal', { ascending: true });

        if (error) throw error;

        // --- DESAIN PDF SLIP GAJI ---
        doc.setFillColor(2, 132, 199); // Sky Blue Header
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
        
        // Garis Pembatas
        doc.setLineWidth(0.5);
        doc.line(15, 68, 195, 68);
        
        // Header Tabel Rincian
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
            if (startY > 270) {
                doc.addPage();
                startY = 20;
            }
            const tglBagus = d.tanggal.split('-').reverse().join('/');
            doc.text(tglBagus, 15, startY);
            doc.text(d.jenis_sesi, 45, startY);
            
            // Potong teks murid kalau kepanjangan
            let nmMurid = d.nama_murid || '-';
            if(nmMurid.length > 25) nmMurid = nmMurid.substring(0, 25) + '...';
            doc.text(nmMurid, 80, startY);
            
            doc.text(d.total_sesi.toString(), 145, startY);
            doc.text(`Rp ${parseInt(d.total_fee).toLocaleString('id-ID')}`, 160, startY);
            
            grandTotalSesi += parseInt(d.total_sesi);
            startY += 8;
        });

        // Garis Penutup Tabel
        doc.line(15, startY + 2, 195, startY + 2);
        
        // SUMMARY TOTAL
        startY += 12;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`TOTAL SESI  : ${grandTotalSesi} Pertemuan`, 15, startY);
        
        doc.setTextColor(220, 38, 38); // Red
        doc.setFontSize(16);
        doc.text(`TOTAL GAJI BERSIH : Rp ${totalGaji.toLocaleString('id-ID')}`, 15, startY + 10);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("*Slip gaji ini di-generate otomatis oleh Sistem Jago Renang.", 15, startY + 25);
        doc.text("Jika ada ketidaksesuaian data, harap lapor ke Admin.", 15, startY + 30);

        // Cetak PDF (Nama file jadi rapi memuat nama coach dan rentang tanggal)
        doc.save(`Slip_Gaji_${namaCoach}_${startDateStr}_to_${endDateStr}.pdf`);

    } catch (err) {
        console.error("Gagal cetak PDF:", err);
        alert("Terjadi kesalahan saat mencetak PDF: " + err.message);
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

window.initDropdownCoach = initDropdownCoach;
window.loadFeeAdmin = loadFeeAdmin;
window.tambahFee = tambahFee;
window.loadRekapFee = loadRekapFee;
window.cetakSlipGajiPDF = cetakSlipGajiPDF;
