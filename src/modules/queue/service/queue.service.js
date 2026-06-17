import { sql } from "../../../config/db.js";

const formatTodayJakarta = () => {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(new Date()); // YYYY-MM-DD
};

const mapQueueStatus = (raw) => {
  const status = String(raw || "").toLowerCase();
  if (["menunggu", "dipanggil", "selesai", "tidak_hadir"].includes(status)) return status;
  if (status === "booked") return "menunggu";
  if (status === "cancelled") return "tidak_hadir";
  return status || "menunggu";
};

const formatJamWib = (timeValue) => {
  const t = String(timeValue || "");
  const hhmm = t.length >= 5 ? t.slice(0, 5) : t;
  return hhmm.replace(":", ".") + " WIB";
};

const estimateWait = (remainingCount) => {
  const minutesPerPatient = 10;
  const minutes = Math.max(0, remainingCount) * minutesPerPatient;
  return `± ${minutes} menit`;
};

const getQueueRowsByDoctorDate = async ({ doctorId, date }) => {
  return sql.query(
    `
      SELECT
        a.id,
        a.doctor_id,
        a.pasien_id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        u_pasien.name AS pasien_name,
        u_pasien.no_telepon AS pasien_phone,
        u_doctor.name AS doctor_name,
        u_doctor.spesialisasi AS doctor_spesialisasi
      FROM public.appointments a
      LEFT JOIN users u_pasien ON u_pasien.id = a.pasien_id
      LEFT JOIN users u_doctor ON u_doctor.id = a.doctor_id
      WHERE a.doctor_id = $1
        AND a.appointment_date = $2
        AND a.status <> 'cancelled'
      ORDER BY a.start_time ASC
    `,
    [doctorId, date]
  );
};

export const getQueuePositionByBookingService = async (bookingId) => {
  // DUMMY REALTIME LOGIC
  // Mengurangi 1 antrian setiap 5 detik agar terlihat realtime di frontend
  const seconds = new Date().getSeconds();
  const dummySisa = Math.max(0, 10 - Math.floor(seconds / 5)); // Sisa antrian berkurang dari 10 ke 0
  const dummyEstimasi = `± ${dummySisa * 10} menit`;
  
  // Karena diminta dummy, kita paksa nomor antrian menjadi 12
  const dummyNomorAntrian = 12;
  const dummyPosisiSekarang = Math.max(1, dummyNomorAntrian - dummySisa);
  const dummyStatus = dummySisa === 0 ? "dipanggil" : "menunggu";

  return {
    booking_id: bookingId,
    pasien: {
      nama: "Pasien Dummy",
      no_telepon: "08123456789",
    },
    dokter: {
      nama: "Dr. Dummy Spesialis",
      spesialisasi: "Poli Dummy",
    },
    antrian: {
      nomor_antrian: dummyNomorAntrian,
      posisi_sekarang: dummyPosisiSekarang,
      sisa_antrian: dummySisa,
      estimasi_waktu: dummyEstimasi,
      status: dummyStatus,
    },
    jadwal: {
      tanggal: "2026-06-17",
      jam: "10.00 WIB",
    },
  };
};

export const getTodayQueueByDoctorService = async (doctorId) => {
  const today = formatTodayJakarta();
  const queueRows = await getQueueRowsByDoctorDate({ doctorId, date: today });
  const withNumber = queueRows.map((r, idx) => ({
    ...r,
    nomor_antrian: idx + 1,
    queue_status: mapQueueStatus(r.status),
  }));

  const doctorName = withNumber[0]?.doctor_name ?? null;
  const total_pasien = withNumber.length;
  const sedang_dilayani =
    withNumber.find((r) => r.queue_status === "dipanggil")?.nomor_antrian ||
    withNumber
      .filter((r) => ["selesai", "tidak_hadir"].includes(r.queue_status))
      .map((r) => r.nomor_antrian)
      .reduce((acc, v) => Math.max(acc, v), 0) ||
    0;

  return {
    dokter: doctorName,
    tanggal: today,
    total_pasien,
    sedang_dilayani,
    antrian: withNumber.map((r) => ({
      nomor_antrian: r.nomor_antrian,
      pasien_nama: r.pasien_name ?? null,
      jam_booking: String(r.start_time || "").slice(0, 5).replace(":", "."),
      status: r.queue_status,
      booking_id: r.id,
    })),
  };
};

export const callNextQueueService = async (doctorId) => {
  const today = formatTodayJakarta();
  const queueRows = await getQueueRowsByDoctorDate({ doctorId, date: today });

  const next = queueRows.find((r) => mapQueueStatus(r.status) === "menunggu");
  if (!next) return null;

  const updated = await sql.query(
    `
      UPDATE public.appointments
      SET status = 'dipanggil',
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, doctor_id, pasien_id, appointment_date, start_time, status
    `,
    [next.id]
  );

  const all = await getQueueRowsByDoctorDate({ doctorId, date: today });
  const nomor_antrian = all.findIndex((r) => String(r.id) === String(next.id)) + 1;

  return {
    booking_id: updated[0]?.id || next.id,
    nomor_antrian,
    pasien: {
      id: next.pasien_id,
      nama: next.pasien_name ?? null,
    },
    dokter: {
      id: next.doctor_id,
      nama: next.doctor_name ?? null,
    },
    tanggal: String(today),
    jam: formatJamWib(next.start_time),
    status: "dipanggil",
  };
};

export const updateQueueStatusService = async (bookingId, status) => {
  const rows = await sql.query(
    `
      UPDATE public.appointments
      SET status = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, doctor_id, pasien_id, appointment_date, start_time, status, updated_at
    `,
    [bookingId, status]
  );

  return rows[0] || null;
};

