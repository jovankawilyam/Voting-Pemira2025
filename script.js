// Deteksi himpunanId otomatis dari nama file HTML (universal untuk semua jurusan)
// Contoh: SistemInformasi.html → 'sistem-informasi', Vokasi.html → 'vokasi'
let himpunanId = window.location.pathname.split('/').pop().replace('.html', '').toLowerCase().replace(/\s+/g, '-'); // Hilangkan spasi, lowercase
if (!himpunanId || himpunanId === 'index') himpunanId = 'default'; // Fallback jika kosong

// Mapping nama jurusan readable untuk alert (sesuaikan jika nama file beda)
const jurusanNames = {
    'sistem-informasi': 'Sistem Informasi',
    'teknologi-informasi': 'Teknologi Informasi',
    'pariwisata': 'Pariwisata',
    'manajemen': 'Manajemen',
    'akuntansi': 'Akuntansi',
    'bio-kewirausahaan': 'BioKewirausahaan',
    'vokasi': 'Vokasi'
};
const jurusanName = jurusanNames[himpunanId] || himpunanId.charAt(0).toUpperCase() + himpunanId.slice(1).replace('-', ' ');

console.log("🔄 Himpunan saat ini (dari file):", himpunanId, "-", jurusanName);

// --- Google Sheets Apps Script endpoint (auto-send when Save Suara clicked)
// Ganti jika perlu; ini URL yang kamu berikan
const SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwRucvOfk7hGlbxQGH8ZuWmJBwaaGXTl6g1mpbQdEzO8E5G-HyaIu_XSFqD2aDv-ilh/exec';
const SHEET_TOKEN = ''; // optional: isi jika Apps Script expects a token

// Fungsi untuk update suara (cocok dengan onclick di HTML)
// ...existing code...
// Dapatkan daftar paslon yang ada di DOM secara dinamis (mis. ["paslon1","paslon2"])
function getPaslonIds() {
    const all = Array.from(document.querySelectorAll('[id]'));
    const paslonIds = all.map(el => el.id).filter(id => /^p\d+$/.test(id));
    return paslonIds.sort((a,b) => (parseInt(a.replace('p',''))||0) - (parseInt(b.replace('p',''))||0));
}

// Fungsi untuk update suara (cocok dengan onclick di HTML)
function updateCount(id, change) {
    const counter = document.getElementById(id);
    if (!counter) return;

    let current = parseInt(counter.textContent) || 0;
    current = Math.max(0, current + change);
    counter.textContent = current;

    if (/^p\d+$/.test(id)) {
        const totalElem = document.getElementById(`${id}-total`);
        if (totalElem) totalElem.textContent = current;
    }

    updateRekap();
}

// Hitung total untuk setiap paslon (sah + tidak sah)
function updateTotal(paslon) {
    const sahElem = document.getElementById(paslon);
    const totalElem = document.getElementById(`${paslon}-total`);
    const sah = sahElem ? (parseInt(sahElem.textContent) || 0) : 0;
    if (totalElem) totalElem.textContent = sah;
}

// Hitung total keseluruhan (sum semua paslon)
function updateRekap() {
    const paslonIds = getPaslonIds();
    let totalSah = 0;
    paslonIds.forEach(id => {
        const el = document.getElementById(id);
        totalSah += el ? (parseInt(el.textContent) || 0) : 0;
    });

    const tidakSahElem = document.getElementById('tidakSah');
    const totalTidakSah = tidakSahElem ? (parseInt(tidakSahElem.textContent) || 0) : 0;

    const totalSahElem = document.getElementById('totalSah');
    const totalTidakSahElem = document.getElementById('totalTidakSah');
    const keseluruhanElem = document.getElementById('totalKeseluruhan');

    if (totalSahElem) totalSahElem.textContent = totalSah;
    if (totalTidakSahElem) totalTidakSahElem.textContent = totalTidakSah;
    if (keseluruhanElem) keseluruhanElem.textContent = totalSah + totalTidakSah;

    paslonIds.forEach(id => updateTotal(id));
}

// Fungsi helper: Reset semua counter ke 0 (untuk bersihkan tampilan saat load)
function resetCountersToZero() {
    console.log("🧹 Reset counter ke 0 untuk", jurusanName);
    const paslonIds = getPaslonIds();
    if (paslonIds.length === 0) {
        ['p1','p2','p3'].forEach(id => {
            const el = document.getElementById(id);
            const total = document.getElementById(`${id}-total`);
            if (el) el.textContent = '0';
            if (total) total.textContent = '0';
        });
    } else {
        paslonIds.forEach(id => {
            const el = document.getElementById(id);
            const total = document.getElementById(`${id}-total`);
            if (el) el.textContent = '0';
            if (total) total.textContent = '0';
        });
    }

    const tidak = document.getElementById('tidakSah');
    if (tidak) tidak.textContent = '0';

    const totalSahElem = document.getElementById('totalSah');
    const totalTidakSahElem = document.getElementById('totalTidakSah');
    const keseluruhanElem = document.getElementById('totalKeseluruhan');
    if (totalSahElem) totalSahElem.textContent = '0';
    if (totalTidakSahElem) totalTidakSahElem.textContent = '0';
    if (keseluruhanElem) keseluruhanElem.textContent = '0';
}

// Load data dari localStorage (dipanggil saat DOM ready)
function loadData() {
    console.log("📂 Memuat data untuk", jurusanName, "(ID:", himpunanId, ")");
    resetCountersToZero();

    const savedData = localStorage.getItem(`suara-data-${himpunanId}`);
    if (!savedData) return console.log(`📊 Tidak ada data untuk ${jurusanName}. Tetap di 0.`);

    try {
        const data = JSON.parse(savedData);
        console.log(`📊 Data DIMUAT untuk ${jurusanName}:`, data);

        const paslonIds = getPaslonIds();
        paslonIds.forEach(id => {
            if (data[id] != null) {
                const el = document.getElementById(id);
                const total = document.getElementById(`${id}-total`);
                if (el) el.textContent = data[id] || '0';
                if (total) total.textContent = data[`${id}-total`] || data[id] || '0';
            }
        });

        if (data.tidakSah != null) {
            const ts = document.getElementById('tidakSah');
            if (ts) ts.textContent = data.tidakSah;
        }

        if (data.rekap) {
            const totalSahElem = document.getElementById('totalSah');
            const totalTidakSahElem = document.getElementById('totalTidakSah');
            const keseluruhanElem = document.getElementById('totalKeseluruhan');
            if (totalSahElem) totalSahElem.textContent = data.rekap.sah || '0';
            if (totalTidakSahElem) totalTidakSahElem.textContent = data.rekap.tidakSah || '0';
            if (keseluruhanElem) keseluruhanElem.textContent = data.rekap.keseluruhan || '0';
        }

        updateRekap();
        console.log(`✅ Load selesai. Total: ${document.getElementById('totalKeseluruhan')?.textContent || 0}`);
    } catch (error) {
        console.error("❌ Error parsing data:", error);
    }
}

// Save data ke localStorage
function saveData() {
    console.log("💾 Menyimpan data untuk", jurusanName);
    const data = {};
    const paslonIds = getPaslonIds();
    paslonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = el.textContent || '0';
        const tot = document.getElementById(`${id}-total`);
        if (tot) data[`${id}-total`] = tot.textContent || (el ? el.textContent : '0');
    });

    const tidak = document.getElementById('tidakSah');
    data.tidakSah = tidak ? (tidak.textContent || '0') : '0';

    const totalSah = document.getElementById('totalSah') ? document.getElementById('totalSah').textContent : '0';
    const totalTidakSah = document.getElementById('totalTidakSah') ? document.getElementById('totalTidakSah').textContent : '0';
    const keseluruhan = document.getElementById('totalKeseluruhan') ? document.getElementById('totalKeseluruhan').textContent : '0';
    data.rekap = { sah: totalSah, tidakSah: totalTidakSah, keseluruhan };

    localStorage.setItem(`suara-data-${himpunanId}`, JSON.stringify(data));
    console.log(`📊 Data DISIMPAN untuk ${jurusanName}: Total ${keseluruhan}`);
    alert(`Data suara untuk ${jurusanName} berhasil disimpan! (Total: ${keseluruhan})`);
}

// --- Send snapshot to Google Sheets (Apps Script web app)
async function sendToSheet(endpointUrl, token) {
    try {
        const paslonIds = getPaslonIds();
        const paslons = {};
        paslonIds.forEach(id => {
            const el = document.getElementById(id);
            paslons[id] = Math.max(0, Number(el ? el.textContent.trim() : 0) || 0);
        });

        const payload = {
            timestamp: new Date().toISOString(),
            page: document.title || himpunanId,
            paslons,
            tidakSah: Number(document.getElementById('tidakSah')?.textContent || 0),
            totalSah: Number(document.getElementById('totalSah')?.textContent || 0),
            totalTidakSah: Number(document.getElementById('totalTidakSah')?.textContent || 0),
            totalKeseluruhan: Number(document.getElementById('totalKeseluruhan')?.textContent || 0),
            token: token || ''
        };

        const resp = await fetch(endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`HTTP ${resp.status}: ${text}`);
        }

        const json = await resp.json().catch(() => null);
        return { ok: true, body: json };
    } catch (err) {
        return { ok: false, error: err.message || String(err) };
    }
}
// ...existing code...

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOM loaded. Memulai loadData untuk", jurusanName);
    loadData();

    // Event untuk tombol save
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", async function (ev) {
            // First, save locally as before
            try {
                saveData();
            } catch (err) {
                console.error('Error saat menyimpan lokal:', err);
                alert('Gagal menyimpan lokal: ' + err.message);
                return;
            }

            // Then send to Google Sheets endpoint
            if (!SHEET_ENDPOINT) {
                console.warn('SHEET_ENDPOINT kosong, tidak mengirim ke Sheets.');
                return;
            }

            const btn = this;
            btn.disabled = true;
            btn.textContent = 'Mengirim...';
            try {
                const result = await sendToSheet(SHEET_ENDPOINT, SHEET_TOKEN);
                if (result.ok) {
                    console.log('✅ Dikirim ke Sheet:', result.body);
                    alert('Berhasil mengirim data ke spreadsheet.');
                } else {
                    console.error('❌ Gagal mengirim ke Sheet:', result.error);
                    alert('Gagal mengirim ke spreadsheet: ' + result.error);
                }
            } catch (err) {
                console.error('❌ Error saat mengirim ke Sheet:', err);
                alert('Network error saat mengirim ke spreadsheet: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Save Suara';
            }
        });
    } else {
        console.warn("⚠️ Tombol #saveBtn tidak ditemukan.");
    }
});

document.querySelectorAll(".jurusan-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault(); // cegah langsung redirect
    const targetUrl = btn.getAttribute("href");

    animateLogoFullscreen(() => {
      window.location.href = targetUrl; // pindah setelah animasi selesai
    });
  });
});

function animateLogoFullscreen(callback) {
  const logoSrc = document.getElementById("logo-img").src;

  const overlay = document.createElement("img");
  overlay.src = logoSrc;
  overlay.classList.add("logo-overlay");
  document.body.appendChild(overlay);

  // Step 1: Grow + rotate
  setTimeout(() => {
    overlay.classList.add("grow");
  }, 50);

  // Step 2: Shrink kembali
  setTimeout(() => {
    overlay.classList.remove("grow");
    overlay.classList.add("shrink");
  }, 1200);

  // Step 3: Hapus overlay & redirect
  setTimeout(() => {
    overlay.remove();
    if (callback) callback();
  }, 2200);
}

