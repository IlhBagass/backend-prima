import {
  createSchedule,
  deleteScheduleById,
  getAvailableSchedulesByDoctor,
  getSchedulesByDoctor,
  updateScheduleById,
} from "../controller/schedule.controller.js";
import {
  createBooking,
  deleteBookingById,
  getBookingById,
  listBookingsByDoctor,
  listBookingsByUser,
  updateBookingById,
} from "../controller/booking.controller.js";

export default async function scheduleRoutes(app) {
  app.post("/", createSchedule);
  app.get("/doctor/:doctor_id", getSchedulesByDoctor);
  app.get("/doctor/:doctor_id/available", getAvailableSchedulesByDoctor);
  app.patch("/:id", updateScheduleById);
  app.delete("/:id", deleteScheduleById);

  // Booking / appointment (user <-> doctor) - tetap dalam schedules module
  app.post("/bookings", createBooking);
  app.get("/bookings/:id", getBookingById);
  app.patch("/bookings/:id", updateBookingById);
  app.delete("/bookings/:id", deleteBookingById);

  // List booking dari sisi doctor & user
  app.get("/doctor/:doctor_id/bookings", listBookingsByDoctor);
  app.get("/user/:user_id/bookings", listBookingsByUser);
}
