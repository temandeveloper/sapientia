/**
 * Fungsi untuk mengubah teks menjadi suara menggunakan Web Speech API.
 * Fungsi ini bersifat mandiri dan tidak bergantung pada elemen DOM global.
 *
 * PERLU DIPERHATIKAN : bahwa list pembicara mengacu pada list pembicara dari sistem operasi
 * 
 * @param {object} options - Opsi untuk sintesis suara.
 * @param {string} options.text - Teks yang akan diucapkan.
 * @param {string} [options.lang='id-ID'] - Kode bahasa (default: Indonesia).
 * @param {number} [options.rate=1.0] - Kecepatan bicara (0.1 - 10).
 * @param {number} [options.pitch=1.0] - Nada suara (0 - 2).
 * @param {function} [options.onStart] - Callback yang dijalankan saat ucapan dimulai.
 * @param {function} [options.onEnd] - Callback yang dijalankan saat ucapan selesai.
 * @param {function} [options.onError] - Callback yang dijalankan jika terjadi error.
 */
export function textToSpeech({
  text,
  lang = 'id-ID',
  rate = 1.0,
  pitch = 1.0,
  onStart,
  onEnd,
  onError,
}) {
  // 1. Cek dukungan browser
  if (!('speechSynthesis' in window)) {
    // Panggil callback error jika tidak didukung
    if (onError) onError({ error: 'Browser tidak mendukung Web Speech API.' });
    return;
  }

  // 2. Validasi input teks
  if (!text || text.trim() === '') {
    if (onError) onError({ error: 'Tidak ada teks yang diberikan untuk diucapkan.' });
    return;
  }

  // 3. Hentikan ucapan sebelumnya untuk menghindari tumpang tindih
  window.speechSynthesis.cancel();

  // 4. Buat objek permintaan ucapan (utterance)
  const utterance = new SpeechSynthesisUtterance(text);

  // 5. Atur properti dari parameter fungsi
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = pitch;

  // 6. Hubungkan event handler ke callbacks yang diberikan
  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  // 7. Mulai proses bicara (asinkron)
  window.speechSynthesis.speak(utterance);
}
