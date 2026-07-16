import { sb } from './config.js';

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
            html += `
            <div class="bg-white border border-slate-200 rounded-xl p-3 mb-3 shadow-sm relative">
                <div class="absolute top-3 right-3 flex gap-1">
                    <button onclick="editKatalog('${k.id}', '${namaAman}', '${descAman}', '${k.harga}')" class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold cursor-pointer">✏️ Edit</button>
                    <button onclick="hapusData('katalog', '${k.id}', loadKatalogAdmin)" class="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold cursor-pointer">❌</button>
                </div>
                <h4 class="font-bold text-sky-800 m-0 pr-16">${k.nama_program}</h4>
                <p class="text-[11px] text-slate-500 line-clamp-2 mt-1">${k.deskripsi}</p>
                <p class="text-sm font-bold text-emerald-600 mt-1">${k.harga}</p>
            </div>`;
        });
        list.innerHTML = html || '<p class="text-sm text-slate-400">Belum ada program.</p>';
    } catch(e) { list.innerHTML = `<p class="text-red-500 text-sm">Gagal: ${e.message}</p>`; }
}

export function editKatalog(id, nama, desc, harga) {
    document.getElementById('kat-edit-id').value = id;
    document.getElementById('kat-nama').value = nama;
    document.getElementById('kat-deskripsi').value = desc;
    document.getElementById('kat-harga').value = harga;
    document.getElementById('btn-katalog').innerText = "💾 Update Program";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

export async function simpanKatalog() {
    const id = document.getElementById('kat-edit-id').value;
    const nama = document.getElementById('kat-nama').value;
    const desc = document.getElementById('kat-deskripsi').value;
    const harga = document.getElementById('kat-harga').value;
    const btn = document.getElementById('btn-katalog');

    if(!nama || !harga) return alert("Nama program dan harga wajib diisi bos!");
    btn.innerText = "⏳ Menyimpan..."; btn.disabled = true;

    try {
        if (id) {
            await sb.from('katalog').update({ nama_program: nama, deskripsi: desc, harga: harga }).eq('id', id);
        } else {
            await sb.from('katalog').insert([{ nama_program: nama, deskripsi: desc, harga: harga }]);
        }
        alert("Program sukses disimpan!");
        document.getElementById('kat-edit-id').value = '';
        document.getElementById('kat-nama').value = '';
        document.getElementById('kat-deskripsi').value = '';
        document.getElementById('kat-harga').value = '';
        loadKatalogAdmin();
    } catch(e) { alert("Gagal simpan: " + e.message); }
    finally { btn.innerText = "⚡ Upload Program"; btn.disabled = false; }
}

export async function loadKatalogUser() {
    const kat = document.getElementById('katalog-container');
    if(!kat) return;
    kat.innerHTML = '<p class="text-sky-600 text-sm font-bold animate-pulse">⏳ Memuat Katalog...</p>';
    try {
        const { data, error } = await sb.from('katalog').select('*').order('id', { ascending: false });
        if(error) throw error;
        let html = '';
        data?.forEach(k => {
            html += `
            <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-4">
                <h3 class="text-lg font-bold text-sky-700 m-0">${k.nama_program}</h3>
                <p class="text-sm text-slate-600 my-2 leading-relaxed">${k.deskripsi}</p>
                <div class="text-lg font-bold text-emerald-600 mb-3">${k.harga}</div>
                <button onclick="window.location.href='https://wa.me/6289678159835?text=Halo%20Admin%2C%20saya%20mau%20tanya%20program%20${encodeURIComponent(k.nama_program)}'" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg text-sm font-bold shadow-md">💬 Tanya Program Ini</button>
            </div>`;
        });
        kat.innerHTML = html || '<p class="text-sm text-slate-500">Belum ada program.</p>';
    } catch(e) { kat.innerHTML = `<p class="text-red-500 font-bold">Gagal memuat katalog.</p>`; }
}

window.loadKatalogAdmin = loadKatalogAdmin;
window.loadKatalogUser = loadKatalogUser;
window.simpanKatalog = simpanKatalog;
window.editKatalog = editKatalog;
