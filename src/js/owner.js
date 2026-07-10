// src/js/owner.js
import { sb } from './config.js';
import { pindahHalaman } from './app.js';

export async function loadSiswaOwner() {
    // ... (Isi fungsi tetap persis seperti Source 6)
}

export async function loadCoachKPI() {
    // ... (Isi fungsi tetap persis seperti Source 6)
}

export async function tanyaGeminiLangsung() {
    const pertanyaan = document.getElementById('robot-free-prompt').value;
    const kotakJawaban = document.getElementById('robot-jawaban');
    if (!pertanyaan) return alert("Ketik dulu pertanyaannya, Bos!");

    kotakJawaban.innerHTML = "<em style='color:#fbbf24;'>✨ Gemini Flash sedang berpikir...</em>";

    // ✅ PANGGIL API KEY DARI .ENV
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const d = window.dataRobot || { totalMurid: 0, omset: 0 };
    const konteksSistem = `Kamu adalah Asisten AI untuk Jago Renang Academy. Data saat ini: ${d.totalMurid} murid aktif, estimasi omset Rp ${d.omset}. Tolong jawab pertanyaan owner ini: ${pertanyaan}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: konteksSistem }] }] })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const textBalasan = data.candidates[0].content.parts[0].text;
        const htmlBalasan = textBalasan.replace(/\*\*(.*?)\*\*/g, '<b style="color:#fbbf24;">$1</b>').replace(/\*/g, '•').replace(/\n/g, '<br>');

        kotakJawaban.innerHTML = `
            <div style="border-bottom:1px solid #475569; padding-bottom:8px; margin-bottom:8px;">
                <b style="color:#38bdf8;">Tanya:</b> <i>"${pertanyaan}"</i>
            </div>
            <b style="color:#fbbf24;">✨ Gemini:</b><br>
            <span style="color:#f8fafc; font-size: 13px;">${htmlBalasan}</span>
        `;
    } catch (error) {
        kotakJawaban.innerHTML = `<b style="color:#ef4444;">Gagal konek ke Gemini:</b> ${error.message}.`;
    }
}

// ... (Masukkan fungsi-fungsi Owner lainnya dari source 6 seperti masukRuangDewa, loadLoginLogs, dll)

// ===================================================
// DAFTARKAN SEMUA FUNGSI OWNER KE GLOBAL WINDOW
// ===================================================
window.loadSiswaOwner = loadSiswaOwner;
window.loadCoachKPI = loadCoachKPI;
window.loadRobotData = loadRobotData;
window.tanyaRobotTemplate = tanyaRobotTemplate;
window.tanyaGeminiLangsung = tanyaGeminiLangsung;
window.masukRuangDewa = masukRuangDewa;
window.loadMataDewaDropdown = loadMataDewaDropdown;
window.simulasiLoginOrtu = simulasiLoginOrtu;
window.loadLoginLogs = loadLoginLogs;
window.loadRahasiaMurid = loadRahasiaMurid;
window.simpanRahasiaMurid = simpanRahasiaMurid;
window.loadRahasiaUsers = loadRahasiaUsers;
window.simpanRahasiaUsers = simpanRahasiaUsers;
