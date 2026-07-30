import { sb } from './config.js';

window.existingDrylandId = null;
window.isMemberLoaded = false; 

// Panggil Counter Total Peserta saat file ini dieksekusi pertama kali
setTimeout(() => {
    if(typeof window.loadTotalPeserta === 'function') window.loadTotalPeserta();
}, 500);

// ==========================================
// 1. FUNGSI HITUNG TOTAL PESERTA (FLOATING INFO)
// ==========================================
window.loadTotalPeserta = async function() {
    try {
        const { count, error } = await sb.from('pendaftaran_dryland')
            .select('*', { count: 'exact', head: true });
            
        const counterEl = document.getElementById('floating-counter');
        if (!error && count !== null && counterEl) {
            counterEl.innerHTML = `${count} <span class="font-medium text-slate-300">Jagoan Terdaftar</span>`;
        } else if (counterEl) {
            counterEl.innerHTML = `Yuk Daftar!`;
        }
    } catch (e) {
        console.error("Gagal load total peserta:", e);
    }
};

// ==========================================
// 2. FUNGSI GANTI KATEGORI (MEMBER VS UMUM)
// ==========================================
window.gantiKategori = async function() {
    const kategori = document.getElementById('kategori-pendaftar').value;
    const wadahUmum = document.getElementById('wadah-umum');
    const wadahMember = document.getElementById('wadah-member');
    const commonFields = document.getElementById('common-fields');

    window.resetFormDrylandUI(); 

    if (kategori === 'umum') {
        wadahUmum.classList.remove('hidden');
        wadahMember.classList.add('hidden');
        commonFields.classList.remove('hidden');
    } 
    else if (kategori === 'member') {
        wadahUmum.classList.add('hidden');
        wadahMember.classList.remove('hidden');
        commonFields.classList.remove('hidden');

        if (!window.isMemberLoaded) {
            const select = document.getElementById('select-nama-member');
            select.innerHTML = '<option value="">⏳ Memuat data...</option>';
            try {
                const { data, error } = await sb.from('murid').select('id_murid, nama_murid').order('nama_murid', { ascending: true });
                if (error) throw error;
                select.innerHTML = '<option value="">-- Silakan Pilih Nama Anak --</option>';
                data.forEach(m => {
                    select.innerHTML += `<option value="${m.nama_murid}">${m.nama_murid}</option>`;
                });
                window.isMemberLoaded = true;
            } catch (e) {
                select.innerHTML = '<option value="">❌ Gagal memuat data</option>';
            }
        }
    } 
    else {
        wadahUmum.classList.add('hidden');
        wadahMember.classList.add('hidden');
        commonFields.classList.add('hidden');
    }
};

// ==========================================
// 3. FUNGSI CEK DATA PESERTA (SCANNER ANTI-DUPLIKAT)
// ==========================================
window.cekStatusDryland = async function() {
    const kategori = document.getElementById('kategori-pendaftar').value;
    let nama = "";

    if (kategori === 'member') {
        nama = document.getElementById('select-nama-member').value.trim();
    } else if (kategori === 'umum') {
        nama = document.getElementById('input-nama-umum').value.trim();
    }
    
    if (!nama) {
        window.resetFormDrylandUI();
        return;
    }

    try {
        // PERBAIKAN KRUSIAL: Ambil cuma 1 (yang terbaru) biar ngga error kalau ada nama dobel
        const { data, error } = await sb.from('pendaftaran_dryland')
            .select('*')
            .eq('nama_peserta', nama)
            .order('id', { ascending: false }) 
            .limit(1);

        if (data && data.length > 0) {
            const p = data[0]; // Ambil array index 0 sebagai data peserta
            window.existingDrylandId = p.id;
            const btn = document.getElementById('btn-submit-dryland');

            // JIKA SUDAH LUNAS
            if (p.status_pembayaran === 'Lunas') {
                alert(`Hai ${nama}, pendaftaran dan pembayaran kamu sudah LUNAS! 🎉\nTidak perlu upload bukti lagi.`);
                btn.disabled = true;
                btn.innerText = "✅ SUDAH LUNAS";
                btn.classList.add('bg-emerald-500', 'cursor-not-allowed');
                btn.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'from-sky-500', 'to-indigo-500');
            } else {
                btn.disabled = false;
                btn.innerText = "🚀 KIRIM CICILAN SELANJUTNYA";
                btn.classList.remove('bg-emerald-500', 'cursor-not-allowed');
                btn.classList.add('from-sky-500', 'to-indigo-500');
            }

            // Kunci ukuran jersey
            const ukuranInput = document.getElementById('dry-ukuran');
            if (ukuranInput && p.ukuran_jersey) {
                ukuranInput.value = p.ukuran_jersey;
            }

            // Kunci upload box
            if (p.bukti_cicilan_1) lockUploadBox(1);
            if (p.bukti_cicilan_2) lockUploadBox(2);
            if (p.bukti_cicilan_3) lockUploadBox(3);
            if (p.bukti_cicilan_4) lockUploadBox(4);

        } else {
            window.resetFormDrylandUI();
        }
    } catch (e) {
        console.error("Gagal cek status peserta:", e);
    }
};

// ==========================================
// 4. FUNGSI PEMBANTU UI
// ==========================================
function lockUploadBox(num) {
    const input = document.getElementById(`file-cicil-${num}`);
    const label = document.getElementById(`label-file-${num}`);
    if (!input || !label) return;
    
    const box = input.parentElement;
    input.disabled = true;
    
    label.innerText = "✅ Tersimpan";
    label.className = "text-[10px] font-bold text-emerald-700 text-center truncate w-full px-1 mt-1";
    box.className = "upload-box relative flex flex-col items-center justify-center bg-emerald-100 border-2 border-solid border-emerald-500 rounded-2xl p-4 overflow-hidden opacity-80 cursor-not-allowed";
}

window.resetFormDrylandUI = function() {
    window.existingDrylandId = null; 
    const btn = document.getElementById('btn-submit-dryland');
    
    if(btn) {
        btn.disabled = false;
        btn.innerText = "🚀 KIRIM PENDAFTARAN";
        btn.classList.remove('bg-emerald-500', 'cursor-not-allowed');
        btn.classList.add('from-sky-500', 'to-indigo-500');
    }
    
    for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`file-cicil-${i}`);
        const label = document.getElementById(`label-file-${i}`);
        const box = input ? input.parentElement : null;
        
        if(input && label && box) {
            input.disabled = false;
            input.value = ''; 
            label.innerText = "Belum ada file";
            label.className = "text-[9px] text-slate-400 mt-1 text-center truncate w-full px-1";
            box.className = "upload-box relative flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 cursor-pointer overflow-hidden transition hover:bg-sky-50";
        }
    }
};

window.previewFile = function(num) {
    const input = document.getElementById(`file-cicil-${num}`);
    const label = document.getElementById(`label-file-${num}`);
    if (!input || !label) return;
    
    const box = input.parentElement;
    if (input.files && input.files[0]) {
        label.innerText = "✅ " + input.files[0].name;
        label.className = "text-[10px] font-bold text-emerald-600 text-center truncate w-full px-1 mt-1";
        box.className = "upload-box relative flex flex-col items-center justify-center bg-emerald-50 border-2 border-dashed border-emerald-400 rounded-2xl p-4 cursor-pointer overflow-hidden transition";
    } else {
        label.innerText = "Belum ada file";
        label.className = "text-[9px] text-slate-400 mt-1 text-center truncate w-full px-1";
        box.className = "upload-box relative flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 cursor-pointer overflow-hidden transition hover:bg-sky-50";
    }
};

// ==========================================
// 5. FUNGSI SUBMIT (INSERT / UPDATE)
// ==========================================
window.submitDryland = async function() {
    const btn = document.getElementById('btn-submit-dryland');
    const kategori = document.getElementById('kategori-pendaftar').value;
    
    let finalNama = "";
    let finalWA = "";
    let finalStatus = "";

    if (kategori === 'umum') {
        finalNama = document.getElementById('input-nama-umum').value.trim();
        finalWA = document.getElementById('input-wa-umum').value.trim();
        finalStatus = "Non-Member / Umum";
        if (!finalNama || !finalWA) return alert("🚨 Mohon lengkapi Nama dan Nomor WA!");
    } 
    else if (kategori === 'member') {
        finalNama = document.getElementById('select-nama-member').value;
        finalWA = "Tarik dr DB";
        finalStatus = "Member JR Academy";
        if (!finalNama) return alert("🚨 Mohon pilih nama murid!");
    } 
    else {
        return alert("🚨 Silakan pilih Kategori Pendaftar terlebih dahulu!");
    }

    const ukuran = document.getElementById('dry-ukuran').value;
    if (!ukuran) return alert("🚨 Mohon pilih ukuran jersey!");

    const file1 = document.getElementById('file-cicil-1').files[0];
    const file2 = document.getElementById('file-cicil-2').files[0];
    const file3 = document.getElementById('file-cicil-3').files[0];
    const file4 = document.getElementById('file-cicil-4').files[0];

    if (!window.existingDrylandId && !file1 && !file2 && !file3 && !file4) {
        return alert("🚨 Silakan upload minimal Bukti Cicilan 1 (DP)!");
    }
    if (window.existingDrylandId && !file1 && !file2 && !file3 && !file4) {
        return alert("🚨 Kamu belum memilih file bukti transfer yang baru!");
    }

    const originalText = btn.innerHTML;
    btn.innerText = "⏳ Sedang Mengirim Data...";
    btn.disabled = true;
    btn.classList.add('opacity-70', 'cursor-not-allowed');

    try {
        let payload = {};
        const cleanName = finalNama.replace(/\s+/g, '_').toLowerCase();
        const timestamp = Date.now();

        const uploadFile = async (file, cicilanNum) => {
            if (!file) return null;
            const ext = file.name.split('.').pop();
            const fileName = `${cleanName}_cicilan${cicilanNum}_${timestamp}.${ext}`;
            const path = `public/${fileName}`;
            const { error: upErr } = await sb.storage.from('bukti_pembayaran_event').upload(path, file);
            if (upErr) throw upErr;
            return sb.storage.from('bukti_pembayaran_event').getPublicUrl(path).data.publicUrl;
        };

        if(file1) payload.bukti_cicilan_1 = await uploadFile(file1, 1);
        if(file2) payload.bukti_cicilan_2 = await uploadFile(file2, 2);
        if(file3) payload.bukti_cicilan_3 = await uploadFile(file3, 3);
        if(file4) payload.bukti_cicilan_4 = await uploadFile(file4, 4);

        if (window.existingDrylandId) {
            payload.status_pembayaran = 'Menunggu Konfirmasi';
            const { error: dbErr } = await sb.from('pendaftaran_dryland')
                .update(payload)
                .eq('id', window.existingDrylandId);
            if (dbErr) throw dbErr;
            alert(`🎉 UPDATE BERHASIL!\nTerima kasih ${finalNama}, bukti cicilan baru telah masuk.`);
        } else {
            payload.nama_peserta = finalNama;
            payload.status_member = finalStatus;
            payload.ukuran_jersey = ukuran;
            payload.no_wa = finalWA;
            payload.status_pembayaran = 'Menunggu Konfirmasi';

            const { error: dbErr } = await sb.from('pendaftaran_dryland').insert([payload]);
            if (dbErr) throw dbErr;
            alert(`🎉 PENDAFTARAN BERHASIL!\nTerima kasih ${finalNama}. Silakan tunggu konfirmasi Admin.`);
        }

        document.getElementById('input-nama-umum').value = '';
        document.getElementById('input-wa-umum').value = '';
        document.getElementById('select-nama-member').value = '';
        document.getElementById('dry-ukuran').value = '';
        document.getElementById('kategori-pendaftar').value = '';
        window.gantiKategori(); 

        if (typeof window.pindahHalaman === 'function') {
            window.pindahHalaman('dashboard-parent');
        } else {
            window.location.reload();
        }

    } catch (e) {
        console.error(e);
        alert("❌ Gagal mengirim data: " + (e.message || e));
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
};
