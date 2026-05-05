import { registerAdmin } from "../controller/admin.controller.js";
import { registerDoctor } from "../controller/doctor.controller.js";
import { registerPasien } from "../controller/pasien.controller.js";
import {
  deleteUserById,
  hardDeleteUserById,
  getUserById,
  listUsers,
  updateUserById,
  uploadUserProfilePhoto,
} from "../controller/user.controller.js";

export default async function userRoutes(app) {
  app.post("/register/admin", registerAdmin);
  app.post("/register/doctor", registerDoctor);
  app.post("/register/pasien", registerPasien);

  // CRUD Users (tanpa auth middleware dulu)
  app.get("/users", listUsers);
  app.get("/users/:id", getUserById);
  app.patch("/users/:id", updateUserById);
  app.post("/users/:id/photo", uploadUserProfilePhoto);
  app.delete("/users/:id", deleteUserById);
  app.delete("/users/:id/permanent", hardDeleteUserById);
}
