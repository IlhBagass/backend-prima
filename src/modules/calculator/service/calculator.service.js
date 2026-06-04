const round1 = (n) => Math.round(n * 10) / 10;
const round0 = (n) => Math.round(n);

export function calculateBmi({ tinggi_cm, berat_kg }) {
  const tinggi_m = tinggi_cm / 100;
  const bmi = berat_kg / (tinggi_m * tinggi_m);
  const bmiRounded = round1(bmi);

  const kategori = {
    Kurus: "< 18.5",
    Normal: "18.5 - 24.9",
    Overweight: "25 - 29.9",
    Obesitas: "> 30",
  };

  let status = "Normal";
  if (bmi < 18.5) status = "Kurus";
  else if (bmi < 25) status = "Normal";
  else if (bmi < 30) status = "Overweight";
  else status = "Obesitas";

  const saran = (() => {
    if (status === "Kurus") {
      return [
        "Tambah asupan kalori dari makanan bergizi",
        "Perbanyak protein (telur, ikan, kacang-kacangan)",
        "Latihan kekuatan 3x/minggu untuk menambah massa otot",
      ];
    }
    if (status === "Normal") {
      return [
        "Pertahankan pola makan seimbang",
        "Olahraga rutin minimal 150 menit/minggu",
        "Tidur cukup dan jaga hidrasi",
      ];
    }
    if (status === "Overweight") {
      return [
        "Kurangi konsumsi makanan berlemak",
        "Olahraga rutin minimal 30 menit/hari",
        "Target turun 5-7 kg dalam 3 bulan",
      ];
    }
    return [
      "Kurangi gula, gorengan, dan porsi makan berlebih",
      "Tingkatkan aktivitas fisik bertahap (jalan cepat, bersepeda)",
      "Pertimbangkan konsultasi dengan dokter atau ahli gizi",
    ];
  })();

  return {
    bmi: bmiRounded,
    status,
    keterangan: `BMI kamu ${bmiRounded}, masuk kategori ${status.toLowerCase()}.`,
    kategori,
    saran,
  };
}

export function calculateDiabetesRisk({
  umur,
  berat_kg,
  tinggi_cm,
  gula_darah,
  riwayat_keluarga,
  aktifitas_fisik,
}) {
  const { bmi } = calculateBmi({ tinggi_cm, berat_kg });

  const ageScore =
    umur < 35 ? 5 : umur < 45 ? 10 : umur < 55 ? 15 : umur < 65 ? 20 : 25;

  const bmiScore = bmi < 25 ? 0 : bmi < 30 ? 15 : 25;

  const glucoseScore = gula_darah < 100 ? 0 : gula_darah < 126 ? 15 : 25;

  const familyScore = riwayat_keluarga ? 15 : 0;

  const activityScore = aktifitas_fisik === "tinggi" ? 0 : aktifitas_fisik === "sedang" ? 5 : 12;

  const rawScore = ageScore + bmiScore + glucoseScore + familyScore + activityScore;
  const skor = Math.max(0, Math.min(100, round0(rawScore)));

  const level_risiko = skor >= 70 ? "Tinggi" : skor >= 35 ? "Sedang" : "Rendah";

  const faktor_risiko = [];
  if (bmi >= 25 && bmi < 30) faktor_risiko.push(`BMI overweight (${bmi})`);
  if (bmi >= 30) faktor_risiko.push(`BMI obesitas (${bmi})`);
  if (gula_darah >= 100 && gula_darah < 126) faktor_risiko.push("Gula darah mendekati batas");
  if (gula_darah >= 126) faktor_risiko.push("Gula darah tinggi");
  if (riwayat_keluarga) faktor_risiko.push("Riwayat keluarga diabetes");
  if (aktifitas_fisik === "rendah") faktor_risiko.push("Aktivitas fisik rendah");
  if (umur >= 45) faktor_risiko.push("Usia 45 tahun ke atas");

  const saran = (() => {
    if (level_risiko === "Tinggi") {
      return [
        "Segera konsultasi ke dokter",
        "Kurangi konsumsi gula & karbohidrat sederhana",
        "Olahraga rutin minimal 30 menit/hari",
      ];
    }
    if (level_risiko === "Sedang") {
      return [
        "Perbaiki pola makan (kurangi minuman manis, perbanyak serat)",
        "Tingkatkan aktivitas fisik secara bertahap",
        "Cek gula darah berkala sesuai kebutuhan",
      ];
    }
    return [
      "Pertahankan gaya hidup sehat",
      "Aktif bergerak dan jaga berat badan ideal",
      "Lakukan pemeriksaan rutin sesuai usia",
    ];
  })();

  const recommended_specialist = level_risiko === "Tinggi" ? "Dokter Penyakit Dalam" : "Dokter Umum";

  return {
    skor,
    level_risiko,
    keterangan:
      level_risiko === "Tinggi"
        ? "Kamu memiliki risiko tinggi diabetes tipe 2."
        : level_risiko === "Sedang"
          ? "Kamu memiliki risiko sedang diabetes tipe 2."
          : "Risiko diabetes tipe 2 kamu tergolong rendah.",
    faktor_risiko,
    saran,
    recommended_specialist,
  };
}

export function calculateHipertensiRisk({
  umur,
  tekanan_sistolik,
  tekanan_diastolik,
  merokok,
  riwayat_keluarga,
}) {
  const statusTekananDarah = (() => {
    if (tekanan_sistolik >= 180 || tekanan_diastolik >= 120) return "Krisis hipertensi";
    if (tekanan_sistolik >= 140 || tekanan_diastolik >= 90) return "Hipertensi tahap 2";
    if (tekanan_sistolik >= 130 || tekanan_diastolik >= 80) return "Hipertensi tahap 1";
    if (tekanan_sistolik >= 120 && tekanan_diastolik < 80) return "Elevated";
    return "Normal";
  })();

  const base =
    statusTekananDarah === "Normal"
      ? 10
      : statusTekananDarah === "Elevated"
        ? 25
        : statusTekananDarah === "Hipertensi tahap 1"
          ? 45
          : statusTekananDarah === "Hipertensi tahap 2"
            ? 70
            : 90;

  const age = umur < 35 ? 0 : umur < 45 ? 5 : umur < 55 ? 10 : umur < 65 ? 15 : 20;
  const smoking = merokok ? 10 : 0;
  const family = riwayat_keluarga ? 8 : 0;

  const skor = Math.max(0, Math.min(100, round0(base + age + smoking + family)));
  const level_risiko = skor >= 70 ? "Tinggi" : skor >= 35 ? "Sedang" : "Rendah";

  const saran = (() => {
    if (statusTekananDarah === "Krisis hipertensi") {
      return [
        "Segera ke IGD atau layanan kesehatan terdekat",
        "Jangan menunda pemeriksaan karena berisiko komplikasi",
      ];
    }
    if (level_risiko === "Tinggi") {
      return [
        "Konsultasi dengan dokter untuk evaluasi tekanan darah",
        "Kurangi garam, makanan olahan, dan kafein berlebih",
        "Olahraga rutin (jalan cepat 30 menit/hari) bila memungkinkan",
      ];
    }
    if (level_risiko === "Sedang") {
      return [
        "Pantau tekanan darah secara berkala",
        "Perbaiki pola makan (DASH diet) dan kelola stres",
        "Batasi rokok dan alkohol",
      ];
    }
    return [
      "Pertahankan pola hidup sehat",
      "Jaga berat badan, tidur cukup, dan olahraga teratur",
      "Cek tekanan darah rutin",
    ];
  })();

  return {
    skor,
    level_risiko,
    status_tekanan_darah: statusTekananDarah,
    keterangan:
      level_risiko === "Tinggi"
        ? "Risiko hipertensi kamu tinggi. Perlu evaluasi lebih lanjut."
        : level_risiko === "Sedang"
          ? "Risiko hipertensi kamu sedang. Perlu perbaikan gaya hidup."
          : "Risiko hipertensi kamu rendah.",
    saran,
  };
}

export function calculateBmr({ umur, berat_kg, tinggi_cm, jenis_kelamin, aktifitas_fisik }) {
  // Mifflin-St Jeor
  const bmrRaw =
    jenis_kelamin === "pria"
      ? 10 * berat_kg + 6.25 * tinggi_cm - 5 * umur + 5
      : 10 * berat_kg + 6.25 * tinggi_cm - 5 * umur - 161;

  const activityFactor = aktifitas_fisik === "tinggi" ? 1.725 : aktifitas_fisik === "sedang" ? 1.55 : 1.2;
  const bmr = round0(bmrRaw);
  const kalori_harian = round0(bmrRaw * activityFactor);

  const anjuran_per_meal = {
    sarapan: round0(kalori_harian * 0.3),
    makan_siang: round0(kalori_harian * 0.4),
    makan_malam: round0(kalori_harian * 0.3),
  };

  return {
    bmr,
    kalori_harian,
    anjuran_kalori_per_meal: anjuran_per_meal,
  };
}

