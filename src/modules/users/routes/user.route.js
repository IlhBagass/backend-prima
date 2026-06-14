import { registerAdmin } from "../controller/admin.controller.js";
import { registerDoctor, updateDoctorProfileById } from "../controller/doctor.controller.js";
import { registerPasien, updatePasienProfileById } from "../controller/pasien.controller.js";
import { login, logout } from "../controller/auth.controller.js";
import {
  deleteUserById,
  hardDeleteUserById,
  getUserById,
  listUsers,
  updateUserById,
  uploadUserProfilePhoto,
} from "../controller/user.controller.js";

export default async function userRoutes(app) {
  app.post("/login", login);
  app.post("/logout", logout);
  app.post("/register/admin", registerAdmin);
  app.post("/register/doctor", registerDoctor);
  app.post("/register/pasien", registerPasien);

  // CRUD Users (tanpa auth middleware dulu)
  app.get("/users", listUsers);
  app.get("/users/:id", getUserById);
  app.patch("/users/:id", updateUserById);
  app.patch("/users/:id/pasien", updatePasienProfileById);
  app.patch("/users/:id/doctor", updateDoctorProfileById);
  app.post("/users/:id/photo", uploadUserProfilePhoto);
  app.delete("/users/:id", deleteUserById);
  app.delete("/users/:id/permanent", hardDeleteUserById);
}
