const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connectToDatabase, db } = require("../config/dbConfig");
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    await connectToDatabase();
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Nombre de usuario y contraseña son necesarios",
        });
    }
    const [results] = await db.query(
      "SELECT * FROM usuario WHERE nombre_usuario = ?",
      [username]
    );
    if (results.length > 0) {
      const user = results[0];
      if (user.estado === 0) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Usuario inactivo. No puede iniciar sesión.",
          });
      }

      if (bcrypt.compareSync(password, user.contraseña)) {
        usuario = {
          nombre: user.nombre_usuario,
          id: user.id,
          estado: user.estado,
          id_rol: user.id_rol,
        };
        console.log(usuario);
        let token = jwt.sign({ user: usuario }, process.env.AUTH_SECRET, {
          expiresIn: process.env.AUTH_EXPIRES,
        });
        console.log("🔍 Token Generado:", token);

        return res.status(200).send({
          msg: "Usuario logueado exitosamente",
          token: token,
        });
      } else {
        return res.status(401).send({ msg: "Contraseña incorrecta" });
      }
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
