import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByEmailService } from "../service/user.service.js";

export const login = async (req, reply) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return reply.code(400).send({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    const user = await findUserByEmailService(email);

    if (!user) {
      return reply.code(401).send({
        success: false,
        message: "Email atau password salah",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return reply.code(401).send({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" }
    );

    return reply.send({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return reply.code(500).send({
      success: false,
      message: "Terjadi kesalahan internal pada server",
      error_message: error.message,
      error_stack: error.stack
    });
  }
};

export const logout = async (req, reply) => {
  try {
    return reply.send({
      success: true,
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return reply.code(500).send({
      success: false,
      message: "Terjadi kesalahan internal pada server",
    });
  }
};
