import { sb } from './config.js';

// =======================================================
// MODUL ADMIN: LOAD KATALOG
// =======================================================
export async function loadKatalogAdmin() {
    const list = document.getElementById('admin-katalog-list');
    if(!list) return;
    list.innerHTML = '<p class="text-sky-600 text-sm font-bold animate-pulse">⏳ Memuat katalog...</p>';
    
    try {
        const { data, error } = await sb.from('katalog').select('*').order('id', { ascending: false });
        if(error) throw error;
        
        let html = '';
        data?.forEach(k => {
            const namaAman = (k.nama_program || '').replace(/'/g, "\\'");
            const descAman = (k.deskripsi || '').replace(/'/g, "\\'");
            const urlGambar = k.url_gambar || '/images/logo.png'; // Fallback kalau gak ada foto
            
            // Rapihin angka jadi Rupiah
            const hargaBersih = String(k.harga).replace(/[^0-9]/g, ''); 
            const hargaRp = hargaBersih ? 'Rp ' + parseInt(hargaBersih).toLocaleString('id-ID') : 'Rp 0';

            html += `
            <div class="bg-white border border-slate-200 rounded-xl p-3 mb-3 shadow-sm relative flex gap-3 items-center">
                <img src="${urlGambar}" alt="Cover" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg bg-slate-100 shrink-0">
                
                <div class="flex-1">
                    <div class="absolute top-3 right-3 flex gap-1">
                        <button onclick="editKatalog('${k.id}', '${namaAman}', '${descAman}', '${k.harga}', '${k.url_gambar || ''}')" class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold cursor-pointer">✏️ Edit</button>
                        <button onclick="hapusData('katalog', '${k.id}', loadKatalogAdmin)" class="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold cursor-pointer">❌</button>
                    </div>
                    <h4 class="font-bold text-sky-800 m-0 pr-16 text-sm md:text-base">${k.nama_program}</h4>
                    <p class="text-[10px] md:text-[11px] text-slate-500 line-clamp-2 mt-1">${k.deskripsi}</p>
                    <p class="text-xs md:text-sm font-bold text-emerald-600 mt-1">${hargaRp}</p>
                </div>
            </div>`;
        });
        list.innerHTML = html || '<p class="text-sm text-slate-400">Belum ada program.</p>';
    } catch(e) { 
        list.innerHTML = `<p class="text-red-500 text-sm">Gagal: ${e.message}</p>`; 
    }
}

// =======================================================
// MODUL ADMIN: EDIT KATALOG
// =======================================================
export function editKatalog(id, nama, desc, harga, urlGambar) {
    document.getElementById('kat-edit-id').value = id;
    document.getElementById('kat-nama').value = nama;
    document.getElementById('kat-deskripsi').value = desc;
    document.getElementById('kat-harga').value = harga;
    
    // Simpan URL gambar lama di input hidden
    let hiddenImg = document.getElementById('kat-gambar-lama');
    if (!hiddenImg) {
        hiddenImg = document.createElement('input');
        hiddenImg.type = 'hidden';
        hiddenImg.id = 'kat-gambar-lama';
        document.getElementById('admin-modul-katalog').appendChild(hiddenImg);
    }
    hiddenImg.value = urlGambar;

    document.getElementById('btn-katalog').innerText = "💾 Update Program";
    window.scrollTo({ top: 0, behavior: "smooth" });
    alert("Form siap diedit! (Biarkan form foto KOSONG jika tidak ingin mengganti gambar)");
}

// =======================================================
// MODUL ADMIN: SIMPAN & UPLOAD GAMBAR KATALOG
// =======================================================
export async function simpanKatalog() {
    const id = document.getElementById('kat-edit-id').value;
    const nama = document.getElementById('kat-nama').value;
    const desc = document.getElementById('kat-deskripsi').value;
    const harga = document.getElementById('kat-harga').value;
    const fileInput = document.getElementById('kat-file');
    
    // Cek input hidden gambar lama (kalau ada)
    let hiddenImg = document.getElementById('kat-gambar-lama');
    let imageUrl = hiddenImg ? hiddenImg.value : "";
    
    const btn = document.getElementById('btn-katalog');

    if(!nama || !harga) return alert("Nama program dan harga wajib diisi bos!");
    btn.innerText = "⏳ Menyimpan..."; btn.disabled = true;

    try {
        // PROSES UPLOAD GAMBAR KE SUPABASE STORAGE
        if (fileInput && fileInput.files.length > 0) {
            btn.innerText = "⏳ Mengupload Foto...";
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `kat_${Date.now()}.${fileExt}`; 

            const { error: uploadError } = await sb.storage.from('katalog-images').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data } = sb.storage.from('katalog-images').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

        const dataObj = { 
            nama_program: nama, 
            deskripsi: desc, 
            harga: harga, 
            url_gambar: imageUrl 
        };

        btn.innerText = "⏳ Menyimpan Data...";

        if (id) {
            await sb.from('katalog').update(dataObj).eq('id', id);
        } else {
            await sb.from('katalog').insert([dataObj]);
        }
        
        alert("Program sukses disimpan!");
        
        // Bersihkan Form
        document.getElementById('kat-edit-id').value = '';
        document.getElementById('kat-nama').value = '';
        document.getElementById('kat-deskripsi').value = '';
        document.getElementById('kat-harga').value = '';
        if(hiddenImg) hiddenImg.value = '';
        if(fileInput) fileInput.value = '';
        
        loadKatalogAdmin();
    } catch(e) { 
        console.error(e);
        alert("Gagal simpan: " + e.message); 
    } finally { 
        btn.innerText = "⚡ Upload Program"; btn.disabled = false; 
    }
}

// =======================================================
// MODUL USER: BUKA KATALOG (GUEST / NON-MEMBER)
// =======================================================
export async function bukaKatalog() {
    // Pindah layar kalau fungsi ada
    if (typeof pindahHalaman === 'function') pindahHalaman('page-katalog');

    const container = document.getElementById('katalog-container');
    if(!container) return;
    
    container.innerHTML = '<p class="text-sky-600 text-center text-sm font-bold animate-pulse mt-4">⏳ Memuat Katalog...</p>';

    try {
        const { data, error } = await sb.from('katalog').select('*').order('id', { ascending: true });
        if(error) throw error;

        let html = '';
        data?.forEach(k => {
            const urlGambar = k.url_gambar || '/images/logo.png'; // Gambar default
            
            const hargaBersih = String(k.harga).replace(/[^0-9]/g, ''); 
            const hargaRp = hargaBersih ? 'Rp ' + parseInt(hargaBersih).toLocaleString('id-ID') : 'Rp 0';

            const noWA = "6289678159835";
            const pesanWa = `Halo Admin JR Academy 👋%0A%0ASaya tertarik dengan program:%0A*${encodeURIComponent(k.nama_program)}*%0A*Biaya:* ${encodeURIComponent(hargaRp)}%0A%0AMohon infonya ya!`;

            html += `
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-5 transition-transform hover:scale-[1.01]">
                <div class="w-full h-48 bg-slate-100 relative">
                    <img src="${urlGambar}" alt="${k.nama_program}" class="w-full h-full object-cover">
                </div>
                <div class="p-5">
                    <h3 class="text-lg font-bold text-sky-700 mb-1">${k.nama_program}</h3>
                    <p class="text-sm text-slate-600 mb-4">${k.deskripsi}</p>
                    <div class="text-xl font-bold text-emerald-600 mb-4">${hargaRp}</div>
                    <button onclick="window.open('https://wa.me/${noWA}?text=${pesanWa}', '_blank')" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2">
                        💬 Tanya Program Ini
                    </button>
                </div>
            </div>`;
        });
        container.innerHTML = html || '<p class="text-sm text-slate-500 text-center mt-4">Belum ada program.</p>';
    } catch(e) { 
        container.innerHTML = `<p class="text-red-500 font-bold text-center mt-4">Gagal memuat katalog.</p>`; 
    }
}

// =======================================================
// REGISTER TO WINDOW
// =======================================================
window.loadKatalogAdmin = loadKatalogAdmin;
window.simpanKatalog = simpanKatalog;
window.editKatalog = editKatalog;
window.bukaKatalog = bukaKatalog;
