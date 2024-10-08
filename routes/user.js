const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { db, connectToDatabase } = require('../config/dbConfig');

router.get('/userdata', async (req, res) => {
    try {
        await connectToDatabase();
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario es necesario' });
        }

        const [results] = await db.query('SELECT * FROM usuario WHERE nombre_usuario = ?', [username]);

        if (results.length > 0) {
            const userData = results[0];
            return res.json({ success: true, userData });
        } else {
            return res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al conectar a la base de datos' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { nombre, contrasena, rol } = req.body;
        console.log("USUARIO EN BACK: ", nombre, contrasena, rol)
        if (!nombre || !contrasena || !rol) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }

        const usernameValidador = /^[a-zA-Z0-9_-]+$/;
        if (!usernameValidador.test(nombre)) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario solo debe contener letras, números y/o guion medio, sin espacios.' });
        }

        const [results] = await db.query('SELECT * FROM usuario WHERE nombre_usuario = ?', [nombre]);
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const estado = 1;
        const query = 'INSERT INTO usuario (nombre_usuario, contraseña, estado, id_rol) VALUES (?, ?, ?, ?)';
        await db.query(query, [nombre, hashedPassword, estado, rol]);

        return res.status(201).json({ success: true, message: 'Usuario registrado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/listAll', async (req, res) => {
    try {
        const [results] = await db.query('SELECT id, nombre_usuario, estado, id_rol FROM usuario');
        if (results.length > 0) {
            return res.json({ success: true, userData: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron usuarios' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/listActive', async (req, res) => {
    try {
        const [results] = await db.query('SELECT nombre_usuario, estado, id_rol FROM usuario where estado = 1');
        if (results.length > 0) {
            return res.json({ success: true, userData: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron usuarios' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.put('/update', async (req, res) => {
    try {
        const { id, nombre_usuario, password, id_rol, estado } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID del usuario es requerido' });
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const query = 'UPDATE usuario SET nombre_usuario = ?, contraseña = ?, id_rol = ?, estado = ? WHERE id = ?';
            await db.query(query, [nombre_usuario, hashedPassword, id_rol, estado, id]);
        } else {
            const query = 'UPDATE usuario SET nombre_usuario = ?, id_rol = ?, estado = ? WHERE id = ?';
            await db.query(query, [nombre_usuario, id_rol, estado, id]);
        }

        return res.json({ success: true, message: 'Usuario actualizado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID del usuario es requerido' });
        }

        const estado = 0;
        const query = 'UPDATE usuario SET estado = ? WHERE id = ?';
        await db.query(query, [estado, id]);

        return res.json({ success: true, message: 'Usuario deshabilitado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/active/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID del usuario es requerido' });
        }

        const estado = 1;
        const query = 'UPDATE usuario SET estado = ? WHERE id = ?';
        await db.query(query, [estado, id]);

        return res.json({ success: true, message: 'Usuario habilitado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
