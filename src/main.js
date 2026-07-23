import './style.css'; 
import './js/config.js';
import './js/helper.js'; 
import './js/app.js';
import './js/beginner.js'; 
import './js/admin.js'
import './js/login.js';
import './js/coach.js'; 
import './js/katalog.js';
import './js/siswa.js';
import './js/parents.js'; 
import './js/fee.js';
import './js/akunting.js'
// Import logika untuk Admin Freelance
import './js/admin2.js';
// Import logika JS-nya
import './js/dryland.js';

// Import komponen HTML-nya dan suntikkan ke index.html
import drylandHtml from './components/dryland.html?raw';
const containerDryland = document.getElementById('dryland-container');
if(containerDryland) {
    containerDryland.innerHTML = drylandHtml;
}


// KULI KASTA TERTINGGI (BOS BESAR) MASUK SINI 👇
import './js/owner.js';
// Import kode HTML dari file admin
import adminHtml from './components/admin.html?raw';

// Suntikkan kode tersebut ke dalam wadah di index.html
document.getElementById('admin-container').innerHTML = adminHtml;
// Import kode HTML Coach
import coachHtml from './components/coach.html?raw';

// Suntikkan ke container di index.html
document.getElementById('coach-container').innerHTML = coachHtml;
// Import kode HTML Parent
import parentHtml from './components/parent.html?raw';

// Suntikkan ke container di index.html
document.getElementById('parent-container').innerHTML = parentHtml;
// Import kode HTML Owner
import ownerHtml from './components/owner.html?raw';

// Suntikkan ke container di index.html
document.getElementById('owner-container').innerHTML = ownerHtml;
// Import kode HTML Non-Member
import nonmemberHtml from './components/nonmember.html?raw';

// Suntikkan ke container di index.html
document.getElementById('nonmember-container').innerHTML = nonmemberHtml;
// Import kode HTML Modal
import modalHtml from './components/modal.html?raw';

// Suntikkan ke container di index.html
document.getElementById('modal-container').innerHTML = modalHtml;
import admin2Html from './components/admin2.html?raw';
document.getElementById('admin2-container').innerHTML = admin2Html;
// Auto-Routing: Buka halaman Dryland kalau link-nya di-share pakai #dryland
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#dryland') {
        if(typeof pindahHalaman === 'function') {
            pindahHalaman('page-dryland');
        }
    }
});
