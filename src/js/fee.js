import { sb } from './config.js';

/* =========================================================
   MANAJEMEN REKAP FEE COACH (ADMIN)[span_9](start_span)[span_9](end_span)
========================================================= */

export async function initDropdownCoach() {
    const selectCoach = document.getElementById('coach-nama');
    const selectFee = document.getElementById('fee-nama');
    
    try {
        // FIX: Tarik data langsung dari tabel master 'coach', bukan 'users'
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
    
    const { data, error } = await sb.from('fee_coach').select('*').order('tanggal', { ascending: false }).limit(30);
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
            <button class="btn-danger" onclick="hapusData('fee_coach', ${f.id}, loadFeeAdmin)" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:5px;">❌</button>
        </div>`;
    });
    list.innerHTML = html || 'Belum ada record fee terkini.';
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

    const bulanEl = document.getElementById('filter-bulan');
    const tahunEl = document.getElementById('filter-tahun');

    const bulan = bulanEl ? parseInt(bulanEl.value) : (new Date().getMonth() + 1);
    const tahun = tahunEl ? parseInt(tahunEl.value) : new Date().getFullYear();

    const rekap = {};

    data.forEach(item => {
        if (!item.tanggal) return;

        const tgl = new Date(item.tanggal);
        if ((tgl.getMonth() + 1) === bulan && tgl.getFullYear() === tahun) {
            const nama = item.nama_coach;
            const fee = parseInt(item.total_fee) || 0;
            rekap[nama] = (rekap[nama] || 0) + fee;
        }
    });

    let opsiTahun = "";
    const tahunSekarang = new Date().getFullYear();
    for (let t = 2023; t <= tahunSekarang; t++) {
        opsiTahun += `<option value="${t}" ${t === tahun ? "selected" : ""}>${t}</option>`;
    }

    let html = `
    <div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-bottom:15px;">
        <div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #cbd5e1;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <strong style="color:#334155;">📅 Rekap Total Fee</strong>
                <select id="filter-bulan" style="padding:6px; border-radius:4px; border:1px solid #cbd5e1; font-size:12px;" onchange="loadRekapFee()">
                    <option value="1" ${bulan==1?"selected":""}>Januari</option>
                    <option value="2" ${bulan==2?"selected":""}>Februari</option>
                    <option value="3" ${bulan==3?"selected":""}>Maret</option>
                    <option value="4" ${bulan==4?"selected":""}>April</option>
                    <option value="5" ${bulan==5?"selected":""}>Mei</option>
                    <option value="6" ${bulan==6?"selected":""}>Juni</option>
                    <option value="7" ${bulan==7?"selected":""}>Juli</option>
                    <option value="8" ${bulan==8?"selected":""}>Agustus</option>
                    <option value="9" ${bulan==9?"selected":""}>September</option>
                    <option value="10" ${bulan==10?"selected":""}>Oktober</option>
                    <option value="11" ${bulan==11?"selected":""}>November</option>
                    <option value="12" ${bulan==12?"selected":""}>Desember</option>
                </select>
                <select id="filter-tahun" style="padding:6px; border-radius:4px; border:1px solid #cbd5e1; font-size:12px;" onchange="loadRekapFee()">
                    ${opsiTahun}
                </select>
            </div>
        </div>
        <div style="margin-top:10px;">
    `;

    if (Object.keys(rekap).length === 0) {
        html += `<p style="color:#64748b; font-size:12px;">Belum ada data pada periode ini.</p>`;
    } else {
        for (const nama in rekap) {
            html += `
            <div onclick="bukaDetailFee('${nama}', ${bulan}, ${tahun})" style="display:flex; justify-content:space-between; margin-bottom:6px; cursor:pointer; padding:6px; border-bottom:1px solid #e2e8f0; border-radius:4px;">
                <span style="color:#0369a1; font-weight:bold; font-size:13px;">👨‍🏫 ${nama}</span>
                <strong style="color:#10b981; font-size:13px;">Rp ${rekap[nama].toLocaleString('id-ID')}</strong>
            </div>`;
        }
    }
    html += `</div></div>`;

    container.innerHTML = html;
}

export async function bukaDetailFee(namaCoach, bulan, tahun) {
    const modal = document.getElementById('modal-detail-fee');
    if (!modal) return alert("Peringatan: Elemen Modal Detail HTML belum dipasang!");

    const namaBulanMap = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const textBulan = namaBulanMap[bulan - 1];

    modal.style.display = 'flex';
    document.getElementById('detail-fee-nama').innerText = namaCoach;
    document.getElementById('detail-fee-periode').innerText = `Periode: ${textBulan} ${tahun}`;
    document.getElementById('detail-fee-list').innerHTML = 'Memuat rincian data...';
    document.getElementById('detail-fee-total').innerText = 'Rp 0';

    const { data, error } = await sb.from('fee_coach')
                                    .select('*')
                                    .eq('nama_coach', namaCoach)
                                    .order('tanggal', { ascending: false });

    if (error) return document.getElementById('detail-fee-list').innerHTML = '<p style="color:red;">Gagal memuat data.</p>';

    const targetBulanString = String(bulan).padStart(2, '0');
    const prefixTanggal = `${tahun}-${targetBulanString}`;
    const filteredData = data.filter(d => d.tanggal && d.tanggal.startsWith(prefixTanggal));

    let html = '';
    let total = 0;
    
    filteredData.forEach(d => {
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

    document.getElementById('detail-fee-list').innerHTML = html || '<p style="text-align:center; color:#94a3b8; margin-top:20px;">Tidak ada histori mengajar di bulan ini.</p>';
    document.getElementById('detail-fee-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

window.initDropdownCoach = initDropdownCoach;
window.loadFeeAdmin = loadFeeAdmin;
window.tambahFee = tambahFee;
window.loadRekapFee = loadRekapFee;
window.bukaDetailFee = bukaDetailFee;
