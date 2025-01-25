const express = require('express');
const router = express.Router();
const { db, connectToDatabase } = require('../config/dbConfig');

router.get('/productData', async (req, res) => {
    try {
        await connectToDatabase();
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ success: false, message: 'El ID del producto es necesario' });
        }

        const [results] = await db.query('SELECT nombre, stock FROM producto WHERE id = ?', [id]);

        if (results.length > 0) {
            const productData = results[0];
            return res.json({ success: true, productData });
        } else {
            return res.json({ success: false, message: 'Producto no encontrado' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al conectar a la base de datos' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { nombre, stock, ubicacion } = req.body;
        if (!nombre || !stock || !ubicacion) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }
        const estado = 1;
        const query = 'INSERT INTO producto (nombre, stock, estado, ubicacion) VALUES (?, ?, ?, ?)';
        await db.query(query, [nombre, stock, estado, ubicacion]);

        return res.status(201).json({ success: true, message: 'Producto registrado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/listAll', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM producto');
        if (results.length > 0) {
            return res.json({ success: true, productData: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron productos' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/listActive', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM producto WHERE estado = 1');
        if (results.length > 0) {
            return res.json({ success: true, productData: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron productos activos' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.put('/update', async (req, res) => {
    try {
        console.log("EN PRODUCTO: ")
        const { id, nombre, stock } = req.body;
        console.log("DATOS EN PRODUCTO: ", id, nombre, stock)
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID del producto es requerido' });
        }
        let query = 'UPDATE producto SET';
        const values = [];
        if (nombre) {
            query += ' nombre = ?';
            values.push(nombre);
        }
        if (stock !== undefined && stock !== null) {
            if (values.length > 0) {
                query += ',';
            }
            query += ' stock = ?';
            values.push(stock);
        }
        if (values.length === 0) {
            return res.status(400).json({ success: false, message: 'Nada para actualizar' });
        }
        query += ' WHERE id = ?';
        values.push(id);
        await db.query(query, values);
        return res.json({ success: true, message: 'Producto actualizado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/delete/:id', async (req, res) => {
    try {
        const { id }= req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'El id del producto es requerido' });
        }
        const query = 'UPDATE producto SET estado = 0 WHERE id = ?';
        await db.query(query, [id]);

        return res.json({ success: true, message: 'Producto deshabilitado exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/productEntry', async (req, res) => {
    try {
        const { id_producto, cantidad, id_usuario } = req.body;
        if (!id_producto || !cantidad || !id_usuario) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }
        const [results] = await db.query('SELECT stock, estado FROM producto WHERE id = ?', [id_producto]);
        if (results.length > 0) {
            const { stock: stockActual, estado } = results[0];
            if (estado === 1) {
                const nuevoStock = stockActual + cantidad;
                await db.query('UPDATE producto SET stock = ? WHERE id = ?', [nuevoStock, id_producto]);
                await db.query('INSERT INTO ingresoproductos (id_producto, cantidad, id_usuario) VALUES (?, ?, ?)', [id_producto, cantidad, id_usuario]);

                return res.status(201).json({ success: true, message: 'Ingreso registrado exitosamente' });
            } else {
                return res.status(403).json({ success: false, message: 'El producto no está disponible para ingreso' });
            }
        } else {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/listProductEntry', async (req, res) => {
    try {
        const query = `
            SELECT 
                ip.id, 
                ip.cantidad, 
                p.nombre AS nombre_producto, 
                u.nombre_usuario 
            FROM ingresoproductos ip
            JOIN producto p ON ip.id_producto = p.id
            JOIN usuario u ON ip.id_usuario = u.id
        `;
        
        const [results] = await db.query(query);

        if (results.length > 0) {
            return res.json({ success: true, data: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron registros' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/productEntryRange', async (req, res) => {
    try {
        const { desde, hasta } = req.body;
        if (!desde || !hasta) {
            return res.status(400).json({ success: false, message: 'Faltan las fechas desde y hasta' });
        }
        const desdeFecha = `${desde} 00:00:00`;
        const hastaFecha = `${hasta} 23:59:59`;
        const query = `
            SELECT 
                ip.id_producto, 
                ip.cantidad, 
                ip.id_usuario, 
                p.nombre AS nombre_producto, 
                u.nombre_usuario 
            FROM ingresoproductos ip
            JOIN producto p ON ip.id_producto = p.id
            JOIN usuario u ON ip.id_usuario = u.id
            WHERE ip.createdAt >= ? AND ip.createdAt <= ?
        `;
        
        const [results] = await db.query(query, [desdeFecha, hastaFecha]);

        if (results.length > 0) {
            return res.json({ success: true, data: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron registros en el rango de fechas dado' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/productEntryIdRange', async (req, res) => {
    try {
        const { id_producto, desde, hasta } = req.body;
        if (!desde || !hasta || !id_producto) {
            return res.status(400).json({ success: false, message: 'Faltan datos para la consulta' });
        }
        const desdeFecha = `${desde} 00:00:00`;
        const hastaFecha = `${hasta} 23:59:59`;
        const query = `
            SELECT 
                ip.id_producto, 
                ip.cantidad, 
                ip.id_usuario, 
                p.nombre AS nombre_producto, 
                u.nombre_usuario 
            FROM ingresoproductos ip
            JOIN producto p ON ip.id_producto = p.id
            JOIN usuario u ON ip.id_usuario = u.id
            WHERE ip.createdAt >= ? AND ip.createdAt <= ?
            AND p.id = ?
        `;
        
        const [results] = await db.query(query, [desdeFecha, hastaFecha, id_producto]);

        if (results.length > 0) {
            return res.json({ success: true, data: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron registros en el rango de fechas dado' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});


module.exports = router;
