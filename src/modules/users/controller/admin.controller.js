import { registerAdminService } from "../service/admin.service.js";

export const registerAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      jenis_kelamin,
      no_telepon,
      kota,
      provinsi,
    } = req.body;

    if (!name || !email || !password) {
      return res.code(400).send({
        success: false,
        message: "name, email, dan password wajib diisi",
      });
    }

    const data = await registerAdminService({
      name,
      email,
      password,
      jenis_kelamin,
      no_telepon,
      kota,
      provinsi,
    });

    return res.code(201).send({
      success: true,
      message: "Registrasi admin berhasil",
      data,
    });

  } catch (error) {
    return res.code(400).send({
      success: false,
      message: error.message,
    });
  }
};
