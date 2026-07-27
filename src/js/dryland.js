import { sb } from './config.js';

// ==========================================
// 1. FUNGSI MEMUNCULKAN WA (PELURU KENDALI)
// ==========================================
window.toggleWA = function() {
    const memberSelect = document.querySelector('#page-dryland #dry-member');
    const waContainer = document.querySelector('#page-dryland #dryland-wa-container');
    
    if (!memberSelect || !waContainer) return;
    
    if (memberSelect.value === 'Non-Member') {
        waContainer.classList.remove('hidden');
    } else {
        waContainer.classList.add('hidden');
    }
};

// ==========================================
// 2. FUNGSI PREVIEW FILE
// ==========================================
window.previewFile = function(num) {
    const input = document.querySelector(`#page-dryland #file-cicil-${num}`);
    const label = document.querySelector(`#page-dryland #label-file-${num}`);
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
// 3. FUNGSI UTAMA SUBMIT DATA
// ==========================================
window.submitDryland = async function() {
    const btn = document.querySelector('#page-dryland #btn-submit-dryland');
    
    const namaInput = document.querySelector('#page-dryland #dry-nama');
    const ukuranInput = document.querySelector('#page-dryland #dry-ukuran');
    const memberInput = document.querySelector('#page-dryland #dry-member');
    
    if (!namaInput || !ukuranInput || !memberInput) {
        return alert("🚨 Form tidak terbaca sistem. Coba refresh halaman!");
    }

    const nama = namaInput.value.trim();
    const ukuran = ukuranInput.value;
    const status_member = memberInput.value;
    
    const file1 = document.querySelector('#page-dryland #file-cicil-1').files[0];
    const file2 = document.querySelector('#page-dryland #file-cicil-2').files[0];
    const file3 = document.querySelector('#page-dryland #file-cicil-3').files[0];
    const file4 = document.querySelector('#page-dryland #file-cicil-4').files[0];

    // Validasi Wajib Isi
    if (!nama || !ukuran || !status_member) {
        return alert("🚨 Mohon lengkapi Nama, Status Member, dan Ukuran Jersey!");
    }
    
    if (!file1 && !file2 && !file3 && !file4) {
        return alert("🚨 Silakan upload minimal Bukti Cicilan 1 (DP)!");
    }

    const originalText = btn ? btn.innerHTML : "🚀 KIRIM PENDAFTARAN";
    if (btn) {
        btn.innerText = "⏳ Sedang Mengirim Data...";
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
    }

    try {
        let urls = { cicilan_1: null, cicilan_2: null, cicilan_3: null, cicilan_4: null };
        const cleanName = nama.replace(/\s+/g, '_').toLowerCase();
        const timestamp = Date.now();

        const uploadFile = async (file, cicilanNum) => {
            if (!file) return null;
            const ext = file.name.split('.').pop();
            const fileName = `${cleanName}_cicilan${cicilanNum}_${timestamp}.${ext}`;
            const path = `public/${fileName}`;

            const { error: upErr } = await sb.storage.from('bukti_pembayaran_event').upload(path, file);
            if (upErr) throw upErr;

            const { data } = sb.storage.from('bukti_pembayaran_event').getPublicUrl(path);
            return data.publicUrl;
        };

        if(file1) urls.cicilan_1 = await uploadFile(file1, 1);
        if(file2) urls.cicilan_2 = await uploadFile(file2, 2);
        if(file3) urls.cicilan_3 = await uploadFile(file3, 3);
        if(file4) urls.cicilan_4 = await uploadFile(file4, 4);

        const { error: dbErr } = await sb.from('pendaftaran_dryland').insert([{
            nama_peserta: nama,
            status_member: status_member,
            ukuran_jersey: ukuran,
            bukti_cicilan_1: urls.cicilan_1,
            bukti_cicilan_2: urls.cicilan_2,
            bukti_cicilan_3: urls.cicilan_3,
            bukti_cicilan_4: urls.cicilan_4,
            status_pembayaran: 'Menunggu Konfirmasi'
        }]);

        if (dbErr) throw dbErr;

        alert(`🎉 PENDAFTARAN BERHASIL!\nTerima kasih ${nama}. Silakan tunggu konfirmasi Admin.`);
        
        // Reset Kolom
        namaInput.value = '';
        ukuranInput.value = '';
        memberInput.value = '';
        window.toggleWA(); // Tutup kembali WA Container
        
        // Reset Kotak Upload
        for (let i = 1; i <= 4; i++) {
            const resetFileInput = document.querySelector(`#page-dryland #file-cicil-${i}`);
            if(resetFileInput) resetFileInput.value = '';
            window.previewFile(i);
        }
        
        // Opsional: Langsung balik ke dashboard
        if (typeof window.pindahHalaman === 'function') {
            window.pindahHalaman('dashboard-parent');
        }

    } catch (e) {
        console.error(e);
        alert("❌ Gagal mengirim data: " + (e.message || e));
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    }
};
