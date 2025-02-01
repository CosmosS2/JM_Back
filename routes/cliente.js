const express = require("express");
const router = express.Router();
const { validarRut, formatearRut } = require("../helpers/validador");
const { db, connectToDatabase } = require("../config/dbConfig");

router.get("/clientData/:rut", async (req, res) => {
  try {
    await connectToDatabase();
    const { rut } = req.params;
    if (!validarRut(rut)) {
      return res.status(400).json({ success: false, message: "RUT inválido" });
    }
    const rutFormateado = formatearRut(rut);
    const [results] = await db.query(
      "SELECT rut, nombre, apellido, telefono, correo FROM cliente WHERE rut = ?",
      [rutFormateado]
    );

    if (results.length > 0) {
      const userData = results[0];
      return res.json({ success: true, userData });
    } else {
      return res.json({ success: false, message: "Cliente no encontrado" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { rut, nombre, apellido, telefono, correo } = req.body;

    if (!nombre || !apellido || !telefono || !correo) {
      return res.status(400).json({ success: false, message: "Faltan datos" });
    }

    const rutFormateado =
      rut && rut.trim() !== "" ? formatearRut(rut) : "Sin rut";

    if (rutFormateado !== "Sin rut" && !validarRut(rutFormateado)) {
      return res.status(400).json({ success: false, message: "RUT inválido" });
    }
    const estado = 1;
    const query =
      "INSERT INTO cliente (rut, nombre, apellido, telefono, correo, estado) VALUES (?, ?, ?, ?, ?, ?)";
    await db.query(query, [
      rutFormateado,
      nombre,
      apellido,
      telefono,
      correo,
      estado,
    ]);

    return res
      .status(201)
      .json({ success: true, message: "Cliente registrado exitosamente" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/listAll", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM cliente");
    if (results.length > 0) {
      return res.json({ success: true, userData: results });
    } else {
      return res.json({
        success: false,
        message: "No se encontraron clientes",
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/listActive", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM cliente WHERE estado = 1");
    if (results.length > 0) {
      return res.json({ success: true, userData: results });
    } else {
      return res.json({
        success: false,
        message: "No se encontraron clientes activos",
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/update", async (req, res) => {
  try {
    const { id, rut, nombre, apellido, telefono, correo } = req.body;
    console.log("DATOS EN CLIENTE: ", rut, nombre, apellido, telefono, correo);
    if (!rut || !nombre || !apellido || !telefono || !correo) {
      return res.status(400).json({ success: false, message: "Faltan datos" });
    }
    const query =
      "UPDATE cliente SET rut = ?, nombre = ?, apellido = ?, telefono = ?, correo = ? WHERE id = ?";
    await db.query(query, [rut, nombre, apellido, telefono, correo, id]);

    return res.json({
      success: true,
      message: "Cliente actualizado exitosamente",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "El id del cliente es requerido" });
    }
    const query = "UPDATE cliente SET estado = 0 WHERE id = ?";
    await db.query(query, [id]);

    return res.json({
      success: true,
      message: "Cliente deshabilitado exitosamente",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/Active/:rut", async (req, res) => {
  try {
    const { rut } = req.params;
    console.log("RUT DE CLIENTE A habilitar: ", rut);
    if (!rut) {
      return res
        .status(400)
        .json({ success: false, message: "El RUT del cliente es requerido" });
    }
    const estado = 1;
    const rutFormateado = formatearRut(rut);
    const query = "UPDATE cliente SET estado = ? WHERE rut = ?";
    await db.query(query, [estado, rutFormateado]);

    return res.json({
      success: true,
      message: "Cliente habilitado exitosamente",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
