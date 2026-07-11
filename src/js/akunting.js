import { sb } from './config.js';

export async function loadAkuntingAdmin() {
    loadRekapAkunting();
}

export async function loadRekapAkunting() {
    const list = document.getElementById('admin-akunting-list');
    if(!list) return;

    try {
        const { data } = await sb.from('akunting').select('*').order('id', { ascending: false });
        let html = '';
        data?.forEach(a => {
            const color = a.tipe === 'Masuk' ? 'text-emerald-500' : 'text-red-500';
            html += `
            <div class="bg-white p-3 mb-2 rounded border border-slate-200 flex justify-between items-center text-xs">
                <div>
                    <strong class="block text-slate-800">${a.keterangan}</strong>
                    <span class="text-[10px] text-slate-400">${a.tanggal}</span>
                </div>
                <div class="${color} font-bold">${a.tipe === 'Masuk' ? '+' : '-'} ${a.nominal}</div>
            </div>`;
        });
        list.innerHTML = html || '<p class="text-xs text-slate-400">Belum ada catatan.</p>';
    } catch(e) { console.error(e); }
}

export async function simpanAkunting() {
    const keterangan = document.getElementById('ak-ket').value;
    const nominal = document.getElementById('ak-nominal').value;
    const tipe = document.getElementById('ak-tipe').value;
    
    if(!keterangan || !nominal) return alert("Isi keterangan & nominal!");

    const { error } = await sb.from('akunting').insert([{ keterangan, nominal, tipe, tanggal: new Date().toISOString() }]);
    if(error) alert("Gagal: " + error.message);
    else {
        alert("Catatan tersimpan!");
        loadRekapAkunting();
    }
}

window.loadAkuntingAdmin = loadAkuntingAdmin;
window.loadRekapAkunting = loadRekapAkunting;
window.simpanAkunting = simpanAkunting;
