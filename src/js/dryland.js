import { sb } from './config.js';

// Fungsi untuk mengganti teks saat gambar di-select
window.previewFileName = function(num) {
    const input = document.getElementById(`file-cicil-${num}`);
    const label = document.getElementById(`label-file-${num}`);
    const box = input.parentElement;
    
    if (input.files && input.files[0]) {
        label.innerText = "✅ " + input.files[0].name;
        label.classList.replace('text-slate-400', 'text-emerald-600');
        box.classList.replace('border-slate-300', 'border-emerald-400');
        box.classList.replace('bg-slate-50', 'bg-emerald-50');
    } else {
        label.innerText = "Belum ada file";
        label.classList.replace('text-emerald-600', 'text-slate-400');
        box.classList.replace('border-emerald-400', 'border-slate-300');
        box.classList.replace('bg-emerald-50', 'bg-slate-50');
    }
};

window.submitDryland = async function() {
    const btn = document.getElementById('btn-submit-dryland');
    const nama = document.getElementById('dry-nama').value.trim();
    const ukuran = document.getElementById('dry-ukuran').value;
    
    // Ambil input file
    const file1 = document.getElementById('file-cicil-1').files[0];
    const file2 = document.getElementById('file-cicil-2').files[0];
    const file3 = document.getElementById('file-cicil-3').files[0];
    const file4 = document.getElementById('file-cicil-4').files[0];

    // Validasi Minimal
    if (!nama || !ukuran) {
        return alert("🚨 Nama dan Ukuran Jersey wajib diisi ya!");
    }
    
    // Minimal harus ada bukti pembayaran Cicilan 1 (DP) untuk mendaftar pertama kali
    // (Atau hilangkan blok IF ini kalau boleh daftar tanpa bayar dulu)
    if (!file1 && !file2 && !file3 && !file4) {
        return alert("🚨 Silakan upload minimal Bukti Cicilan 1 (DP) untuk mendaftar.");
    }

    btn.innerText = "⏳ Sedang Mengirim Data...";
    btn.disabled = true;

    try {
        let urls = { cicilan_1: null, cicilan_2: null, cicilan_3: null, cicilan_4: null };
        const cleanName = nama.replace(/\s+/g, '_').toLowerCase();
        const timestamp = Date.now();

        // Helper function untuk Upload Storage
        const uploadFile = async (file, cicilanNum) => {
            if (!file) return null;
            const ext = file.name.split('.').pop();
            const fileName = `${cleanName}_cicilan${cicilanNum}_${timestamp}.${ext}`;
            const path = `dryland_payments/${fileName}`;

            // Asumsi kamu punya bucket bernama 'pembayaran' di Supabase
            // Jika beda, ganti 'pembayaran' dengan nama bucket milikmu
            const { error: upErr } = await sb.storage.from('pembayaran').upload(path, file);
            if (upErr) throw upErr;

            return sb.storage.from('pembayaran').getPublicUrl(path).data.publicUrl;
        };

        // Upload semua file yang ada
        urls.cicilan_1 = await uploadFile(file1, 1);
        urls.cicilan_2 = await uploadFile(file2, 2);
        urls.cicilan_3 = await uploadFile(file3, 3);
        urls.cicilan_4 = await uploadFile(file4, 4);

        // Insert ke Database tabel 'pendaftaran_dryland'
        const { error: dbErr } = await sb.from('pendaftaran_dryland').insert([{
            nama_peserta: nama,
            ukuran_jersey: ukuran,
            bukti_cicilan_1: urls.cicilan_1,
            bukti_cicilan_2: urls.cicilan_2,
            bukti_cicilan_3: urls.cicilan_3,
            bukti_cicilan_4: urls.cicilan_4,
            waktu_daftar: new Date().toISOString()
        }]);

        if (dbErr) throw dbErr;

        // Tampilan Sukses ala Jago Renang
        document.body.innerHTML = `
            <div style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f0f9ff; font-family: sans-serif; padding: 20px; text-align: center;">
                <h1 style="font-size: 50px; margin: 0; margin-bottom: 10px;">🎉</h1>
                <h2 style="color: #0369a1; margin: 0; font-size: 24px; font-weight: 900;">PENDAFTARAN BERHASIL!</h2>
                <p style="color: #475569; margin-top: 10px; max-w: 300px; font-size: 14px;">Terima kasih telah mendaftar Dryland & Chills. Sampai jumpa di Narita Hotel, <b>${nama}</b>!</p>
                <button onclick="window.location.reload()" style="margin-top: 20px; background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Daftarkan Peserta Lain</button>
            </div>
        `;

    } catch (e) {
        console.error(e);
        alert("Gagal mengirim data pendaftaran: " + e.message);
        btn.innerText = "🚀 KIRIM PENDAFTARAN";
        btn.disabled = false;
    }
};
