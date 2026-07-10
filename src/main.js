// Import CSS Tailwind
import './style.css'; 

// ==========================================
// CCTV ERROR (Biar ketahuan kalau ada yg crash)
// ==========================================
window.onerror = function(message, source, lineno, colno, error) {
    alert("🚨 ADA ERROR BRAY!\n\nPesan: " + message + "\nBaris: " + lineno);
    return true; 
};

// ==========================================
// IMPORT EKOSISTEM JS JAGO RENANG ACADEMY
// ==========================================
import './js/config.js';
import './js/helper.js'; // 🔴 INI YANG KELUPAAN BRAY!
import './js/app.js';
import './js/login.js';
import './js/owner.js';
import './js/akunting.js';
import './js/beginner.js';
import './js/coach.js';
import './js/fee.js';
import './js/katalog.js';
import './js/parents.js';
import './js/siswa.js';
