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
  const rows = await sql.query(
    `
      SELECT
        a.id,
        a.doctor_id,
        a.pasien_id,
        a.appointment_date,
        a.start_time,
        a.status,
        u_pasien.name AS pasien_name,
        u_pasien.no_telepon AS pasien_phone,
        u_doctor.name AS doctor_name,
        u_doctor.spesialisasi AS doctor_spesialisasi
      FROM public.appointments a
      LEFT JOIN users u_pasien ON u_pasien.id = a.pasien_id
      LEFT JOIN users u_doctor ON u_doctor.id = a.doctor_id
      WHERE a.id = $1
      LIMIT 1
    `,
    [bookingId]
  );

  const booking = rows[0];
  if (!booking) return null;

  const doctorId = booking.doctor_id;
  const date = booking.appointment_date;

  const queueRows = await getQueueRowsByDoctorDate({ doctorId, date });
  const withNumber = queueRows.map((r, idx) => ({
    ...r,
    nomor_antrian: idx + 1,
    queue_status: mapQueueStatus(r.status),
  }));

  const self = withNumber.find((r) => String(r.id) === String(bookingId));
  if (!self) {
    // booking ada tapi mungkin cancelled dan tidak masuk queue list
    return {
      booking_id: bookingId,
      pasien: { nama: booking.pasien_name ?? null, no_telepon: booking.pasien_phone ?? null },
      dokter: { nama: booking.doctor_name ?? null, spesialisasi: booking.doctor_spesialisasi ?? null },
      antrian: {
        nomor_antrian: null,
        posisi_sekarang: null,
        sisa_antrian: null,
        estimasi_waktu: null,
        status: mapQueueStatus(booking.status),
      },
      jadwal: { tanggal: String(date), jam: formatJamWib(booking.start_time) },
    };
  }

  const currentCalled = withNumber
    .filter((r) => r.queue_status === "dipanggil")
    .sort((a, b) => a.nomor_antrian - b.nomor_antrian)[0];

  const lastDoneNumber =
    withNumber
      .filter((r) => ["selesai", "tidak_hadir"].includes(r.queue_status))
      .map((r) => r.nomor_antrian)
      .reduce((acc, v) => Math.max(acc, v), 0) || 0;

  const posisi_sekarang = currentCalled ? currentCalled.nomor_antrian : lastDoneNumber;
  const sisa_antrian = Math.max(0, self.nomor_antrian - posisi_sekarang);
  const estimasi_waktu = estimateWait(Math.max(0, sisa_antrian - 1));

  return {
    booking_id: bookingId,
    pasien: {
      nama: self.pasien_name ?? null,
      no_telepon: self.pasien_phone ?? null,
    },
    dokter: {
      nama: self.doctor_name ?? null,
      spesialisasi: self.doctor_spesialisasi ?? null,
    },
    antrian: {
      nomor_antrian: self.nomor_antrian,
      posisi_sekarang,
      sisa_antrian,
      estimasi_waktu,
      status: self.queue_status,
    },
    jadwal: {
      tanggal: String(date),
      jam: formatJamWib(self.start_time),
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

