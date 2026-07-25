// ==========================================
// EVENT.JS - Logic untuk Event Jago Renang
// ==========================================
import { sb } from './config.js';

// Fungsi bantuan untuk memastikan kita hanya mengambil elemen dari form yang aktif
function getActiveContainer() {
    return document.getElementById('dryland-container') || document;
}

/**
 * Menampilkan atau menyembunyikan kontainer WhatsApp 
 */
export function toggleDrylandMember() {
    const container = getActiveContainer();
    const memberSelect = container.querySelector('#dry-member');
    const waContainer = container.querySelector('#dryland-wa-container');
    
    if (memberSelect && waContainer) {
        if (memberSelect.value === 'Non-Member') {
            waContainer.classList.remove('hidden');
        } else {
            waContainer.classList.add('hidden');
        }
    }
}

/**
 * Menampilkan nama file gambar yang dipilih
 */
export function previewFileName(index) {
    const container = getActiveContainer();
    const fileInput = container.querySelector(`#file-cicil-${index}`);
    const label = container.querySelector(`#label-file-${index}`);

    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        label.textContent = fileInput.files[0].name;
        label.classList.remove('text-slate-400', 'text-emerald-500/70');
        
        if (index === 4) {
            label.classList.add('text-emerald-600', 'font-bold');
        } else {
            label.classList.add('text-sky-600', 'font-bold');
        }
    } else if (label) {
        label.textContent = 'Belum ada file';
        label.classList.remove('text-sky-600', 'text-emerald-600', 'font-bold');
        
        if (index === 4) {
            label.classList.add('text-emerald-500/70');
        } else {
            label.classList.add('text-slate-400');
        }
    }
}

/**
 * Mengirim data pendaftaran
 */
export async function submitDryland() {
    const container = getActiveContainer();
    
    // Tarik data dengan spesifik dari container yang aktif
    const namaInput = container.querySelector('#dry-nama');
    const memberSelect = container.querySelector('#dry-member');
    const ukuranSelect = container.querySelector('#dry-ukuran');
    const file1Input = container.querySelector('#file-cicil-1');
    const btn = container.querySelector('#btn-submit-dryland');

    // Pastikan elemen ditemukan sebelum mengambil value
    if (!namaInput || !memberSelect || !ukuranSelect) {
        console.error("Elemen form tidak ditemukan di DOM!");
        alert("❌ Terjadi kesalahan sistem. Coba refresh halaman.");
        return;
    }

    const nama = namaInput.value.trim();
    const memberStatus = memberSelect.value;
    const ukuran = ukuranSelect.value;

    // 1. Validasi Form Dasar
    if (!nama || !memberStatus || !ukuran) {
        alert("⚠️ Harap lengkapi Nama, Status Member, dan Ukuran Jersey!");
        return;
    }

    // 2. Validasi Minimal DP (Cicilan 1)
    const file1 = file1Input.files[0];
    if (!file1) {
        alert("⚠️ Harap upload minimal bukti pembayaran Cicilan 1 (DP)!");
        return;
    }

    let originalText = "";
    if (btn) {
        originalText = btn.innerHTML;
        btn.innerHTML = '⏳ MENGIRIM DATA & UPLOAD...';
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
    }

    try {
        const buktiUrls = {
            bukti_cicilan_1: null,
            bukti_cicilan_2: null,
            bukti_cicilan_3: null,
            bukti_cicilan_4: null
        };

        // 3. Looping untuk upload file cicilan
        for (let i = 1; i <= 4; i++) {
            const fileInputLoop = container.querySelector(`#file-cicil-${i}`);
            if (fileInputLoop && fileInputLoop.files[0]) {
                const file = fileInputLoop.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${nama.replace(/\s+/g, '_')}_c${i}.${fileExt}`;
                const filePath = `public/${fileName}`;

                const { error: uploadError } = await sb.storage
                    .from('bukti_pembayaran_event')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: publicURLData } = sb.storage
                    .from('bukti_pembayaran_event')
                    .getPublicUrl(filePath);

                buktiUrls[`bukti_cicilan_${i}`] = publicURLData.publicUrl;
            }
        }

        // 4. Insert data
        const { error: insertError } = await sb
            .from('pendaftaran_dryland')
            .insert([
                {
                    nama_peserta: nama,
                    status_member: memberStatus,
                    ukuran_jersey: ukuran,
                    bukti_cicilan_1: buktiUrls.bukti_cicilan_1,
                    bukti_cicilan_2: buktiUrls.bukti_cicilan_2,
                    bukti_cicilan_3: buktiUrls.bukti_cicilan_3,
                    bukti_cicilan_4: buktiUrls.bukti_cicilan_4,
                    status_pembayaran: 'Menunggu Konfirmasi'
                }
            ]);

        if (insertError) throw insertError;

        alert("✅ Pendaftaran berhasil dikirim! Silakan tunggu konfirmasi Admin.");
        
        // 5. Reset Form
        namaInput.value = '';
        memberSelect.value = '';
        ukuranSelect.value = '';
        toggleDrylandMember();
        
        for (let i = 1; i <= 4; i++) {
            const resetFileInput = container.querySelector(`#file-cicil-${i}`);
            if(resetFileInput) resetFileInput.value = '';
            previewFileName(i);
        }

        if (typeof window.pindahHalaman === 'function') {
            window.pindahHalaman('dashboard-parent');
        }

    } catch (error) {
        console.error("Error Pendaftaran Dryland:", error);
        alert("❌ Terjadi kesalahan saat mengirim data: " + (error.message || error));
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    }
}

// Daftarkan ke window agar bisa diakses HTML
window.toggleDrylandMember = toggleDrylandMember;
window.previewFileName = previewFileName;
window.submitDryland = submitDryland;
