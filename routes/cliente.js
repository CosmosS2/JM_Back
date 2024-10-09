const express = require('express');
const router = express.Router();
const { validarRut, formatearRut } = require('../helpers/validador');
const { db } = require('../config/dbConfig');

router.get('/clientData/:rut', async (req, res) => {
    try {
        const { rut } = req.params;
        if (!validarRut(rut)) {
            return res.status(400).json({ success: false, message: 'RUT inválido' });
        }
        const rutFormateado = formatearRut(rut);
        const [results] = await db.query('SELECT rut, nombre, apellido, telefono, correo FROM cliente WHERE rut = ?', [rutFormateado]);

        if (results.length > 0) {
            const userData = results[0]; // Cambié 'data' por 'userData'
            return res.json({ success: true, userData });
        } else {
            return res.json({ success: false, message: 'Cliente no encontrado' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { rut, nombre, apellido, telefono, correo } = req.body;
        if (!rut || !nombre || !apellido || !telefono || !correo) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }
        if (!validarRut(rut)) {
            return res.status(400).json({ success: false, message: 'RUT inválido' });
        }
        const rutFormateado = formatearRut(rut);
        const [results] = await db.query('SELECT * FROM cliente WHERE rut = ?', [rutFormateado]);

        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'El cliente ya está registrado' });
        }

        const estado = 1;
        const query = 'INSERT INTO cliente (rut, nombre, apellido, telefono, correo, estado) VALUES (?, ?, ?, ?, ?, ?)';
        await db.query(query, [rutFormateado, nombre, apellido, telefono, correo, estado]);

        return res.status(201).json({ success: true, message: 'Cliente registrado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/listAll', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM cliente');
        if (results.length > 0) {
            return res.json({ success: true, userData: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron clientes' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/listActive', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM cliente WHERE estado = 1');
        if (results.length > 0) {
            return res.json({ success: true, userData: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron clientes activos' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.put('/update', async (req, res) => {
    try {
        const { rut, nombre, apellido, telefono, correo } = req.body;
        console.log("DATOS EN CLIENTE: ", rut, nombre, apellido, telefono, correo)
        if (!rut || !nombre || !apellido || !telefono || !correo) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }
        const rutFormateado = formatearRut(rut);
        const query = 'UPDATE cliente SET nombre = ?, apellido = ?, telefono = ?, correo = ? WHERE rut = ?';
        await db.query(query, [nombre, apellido, telefono, correo, rutFormateado]);

        return res.json({ success: true, message: 'Cliente actualizado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/delete/:rut', async (req, res) => {
    try {
        const { rut } = req.params;
        console.log("RUT DE CLIENTE A ELIMINAR: ", rut)
        if (!rut) {
            return res.status(400).json({ success: false, message: 'El RUT del cliente es requerido' });
        }
        const estado = 0;
        const rutFormateado = formatearRut(rut);
        const query = 'UPDATE cliente SET estado = ? WHERE rut = ?';
        await db.query(query, [estado, rutFormateado]);

        return res.json({ success: true, message: 'Cliente deshabilitado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/Active/:rut', async (req, res) => {
    try {
        const { rut } = req.params;
        console.log("RUT DE CLIENTE A habilitar: ", rut)
        if (!rut) {
            return res.status(400).json({ success: false, message: 'El RUT del cliente es requerido' });
        }
        const estado = 1;
        const rutFormateado = formatearRut(rut);
        const query = 'UPDATE cliente SET estado = ? WHERE rut = ?';
        await db.query(query, [estado, rutFormateado]);

        return res.json({ success: true, message: 'Cliente habilitado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
