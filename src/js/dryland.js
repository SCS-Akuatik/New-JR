import { sb } from './config.js';

// Variabel Global untuk mengingat ID peserta jika sudah pernah daftar
window.existingDrylandId = null;

// ==========================================
// 1. FUNGSI CEK DATA PESERTA OTOMATIS
// ==========================================
window.cekStatusDryland = async function() {
    // PERBAIKAN: Sekarang JS ngebaca ID select-nama-member dari HTML kamu
    const namaInput = document.querySelector('#page-dryland #select-nama-member') || document.querySelector('#page-dryland #dry-nama');
    
    if (!namaInput) return;
    
    const nama = namaInput.value.trim();
    // Kalau belum milih nama, reset UI
    if (!nama || nama === '' || nama === 'Non-Member') {
        window.resetFormDrylandUI();
        return;
    }

    try {
        // Cek ke Supabase apakah nama ini sudah ada
        const { data, error } = await sb.from('pendaftaran_dryland')
            .select('*')
            .eq('nama_peserta', nama)
            .maybeSingle();

        if (data) {
            // SIMPAN ID-NYA! Biar nanti pas disubmit jadinya UPDATE, bukan INSERT
            window.existingDrylandId = data.id;

            const btn = document.querySelector('#page-dryland #btn-submit-dryland');

            // JIKA SUDAH LUNAS
            if (data.status_pembayaran === 'Lunas') {
                alert(`Hai ${nama}, pendaftaran dan pembayaran kamu sudah LUNAS! 🎉\nTidak perlu upload bukti lagi.`);
                if(btn) {
                    btn.disabled = true;
                    btn.innerText = "✅ SUDAH LUNAS";
                    btn.classList.add('bg-emerald-500', 'cursor-not-allowed');
                    btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                }
            } else {
                // JIKA BELUM LUNAS (MASIH CICIL)
                if(btn) {
                    btn.disabled = false;
                    btn.innerText = "🚀 KIRIM CICILAN SELANJUTNYA";
                    btn.classList.remove('bg-emerald-500', 'cursor-not-allowed');
                    btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                }
            }

            // Kunci otomatis form ukuran baju biar gak ke-reset
            const ukuranInput = document.querySelector('#page-dryland #dry-ukuran');
            if (ukuranInput && data.ukuran_jersey) {
                ukuranInput.value = data.ukuran_jersey;
            }

            // Update UI Kotak Upload (Kunci yang sudah terisi di database)
            if (data.bukti_cicilan_1) lockUploadBox(1);
            if (data.bukti_cicilan_2) lockUploadBox(2);
            if (data.bukti_cicilan_3) lockUploadBox(3);
            if (data.bukti_cicilan_4) lockUploadBox(4);

        } else {
            // Kalau nama belum ada di database, kembalikan UI seperti form baru
            window.resetFormDrylandUI();
        }
    } catch (e) {
        console.error("Gagal cek status peserta:", e);
    }
};

// ==========================================
// 2. FUNGSI PEMBANTU UI (KUNCI BOX & RESET)
// ==========================================
function lockUploadBox(num) {
    const input = document.querySelector(`#page-dryland #file-cicil-${num}`);
    const label = document.querySelector(`#page-dryland #label-file-${num}`);
    if (!input || !label) return;
    
    const box = input.parentElement;
    
    // Matikan input biar gak ditimpa
    input.disabled = true;
    
    // Ubah tampilan jadi hijau tanda sukses
    label.innerText = "✅ Tersimpan di Sistem";
    label.className = "text-[10px] font-bold text-emerald-700 text-center truncate w-full px-1 mt-1";
    box.className = "upload-box relative flex flex-col items-center justify-center bg-emerald-100 border-2 border-solid border-emerald-500 rounded-2xl p-4 overflow-hidden opacity-80 cursor-not-allowed";
}

window.resetFormDrylandUI = function() {
    window.existingDrylandId = null; // Hapus ingatan ID
    const btn = document.querySelector('#page-dryland #btn-submit-dryland');
    
    if(btn) {
        btn.disabled = false;
        btn.innerText = "🚀 KIRIM PENDAFTARAN";
        btn.classList.remove('bg-emerald-500', 'cursor-not-allowed');
        btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }
    
    for (let i = 1; i <= 4; i++) {
        const input = document.querySelector(`#page-dryland #file-cicil-${i}`);
        const label = document.querySelector(`#page-dryland #label-file-${i}`);
        const box = input ? input.parentElement : null;
        
        if(input && label && box) {
            input.disabled = false;
            input.value = ''; // Kosongkan file
            
            // Balikin UI ke warna abu-abu default
            label.innerText = "Belum ada file";
            label.className = "text-[9px] text-slate-400 mt-1 text-center truncate w-full px-1";
            box.className = "upload-box relative flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 cursor-pointer overflow-hidden transition hover:bg-sky-50";
        }
    }
};

// ==========================================
// 3. FUNGSI LAINNYA
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
// 4. FUNGSI UTAMA SUBMIT DATA
// ==========================================
window.submitDryland = async function() {
    const btn = document.querySelector('#page-dryland #btn-submit-dryland');
    
    // PERBAIKAN: Baca nama pakai ID yang bener
    const namaInput = document.querySelector('#page-dryland #select-nama-member') || document.querySelector('#page-dryland #dry-nama');
    const ukuranInput = document.querySelector('#page-dryland #dry-ukuran');
    const memberInput = document.querySelector('#page-dryland #dry-member');
    
    if (!namaInput || !ukuranInput) {
        return alert("🚨 Form tidak terbaca sistem. Pastikan ID elemen HTML sudah benar!");
    }

    const nama = namaInput.value.trim();
    const ukuran = ukuranInput.value;
    const status_member = memberInput ? memberInput.value : 'Member JR Academy';
    
    const file1 = document.querySelector('#page-dryland #file-cicil-1').files[0];
    const file2 = document.querySelector('#page-dryland #file-cicil-2').files[0];
    const file3 = document.querySelector('#page-dryland #file-cicil-3').files[0];
    const file4 = document.querySelector('#page-dryland #file-cicil-4').files[0];

    if (!nama || !ukuran) {
        return alert("🚨 Mohon lengkapi Nama dan Ukuran Jersey!");
    }
    
    // Validasi Pendaftaran Baru
    if (!window.existingDrylandId && !file1 && !file2 && !file3 && !file4) {
        return alert("🚨 Silakan upload minimal Bukti Cicilan 1 (DP)!");
    }

    // Validasi Update Cicilan
    if (window.existingDrylandId && !file1 && !file2 && !file3 && !file4) {
        return alert("🚨 Kamu belum memilih file bukti transfer yang baru!");
    }

    const originalText = btn ? btn.innerHTML : "🚀 KIRIM PENDAFTARAN";
    if (btn) {
        btn.innerText = "⏳ Sedang Mengirim Data...";
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
    }

    try {
        let payload = {};
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

        if(file1) payload.bukti_cicilan_1 = await uploadFile(file1, 1);
        if(file2) payload.bukti_cicilan_2 = await uploadFile(file2, 2);
        if(file3) payload.bukti_cicilan_3 = await uploadFile(file3, 3);
        if(file4) payload.bukti_cicilan_4 = await uploadFile(file4, 4);

        if (window.existingDrylandId) {
            // UPDATE: Jika sudah pernah terdaftar, update cicilan & reset status pembayaran
            payload.status_pembayaran = 'Menunggu Konfirmasi';
            
            const { error: dbErr } = await sb.from('pendaftaran_dryland')
                .update(payload)
                .eq('id', window.existingDrylandId);

            if (dbErr) throw dbErr;
            alert(`🎉 UPDATE BERHASIL!\nTerima kasih ${nama}, bukti cicilan baru telah masuk. Tunggu konfirmasi Admin ya.`);
            
        } else {
            // INSERT: Jika pendaftaran baru
            payload.nama_peserta = nama;
            payload.status_member = status_member;
            payload.ukuran_jersey = ukuran;
            payload.status_pembayaran = 'Menunggu Konfirmasi';

            const { error: dbErr } = await sb.from('pendaftaran_dryland').insert([payload]);
            if (dbErr) throw dbErr;
            alert(`🎉 PENDAFTARAN BERHASIL!\nTerima kasih ${nama}. Silakan tunggu konfirmasi Admin.`);
        }
        
        // Reset Form Setelah Sukses
        namaInput.value = '';
        ukuranInput.value = '';
        if(memberInput) memberInput.value = 'Member JR Academy';
        window.toggleWA(); 
        window.resetFormDrylandUI();
        
        // Balik ke dashboard
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
