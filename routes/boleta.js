const express = require('express');
const router = express.Router();
const { db, connectToDatabase } = require('../config/dbConfig');

router.get('/ticketData/:id_boleta', async (req, res) => {
    try {
        const { id_boleta } = req.params;
        console.log("ID: ", id_boleta)
        if (!id_boleta) {
            return res.status(400).json({ success: false, message: 'El ID de la boleta es necesario' });
        }
        const [results] = await db.query('SELECT * FROM boleta WHERE id = ?', [id_boleta]);
        console.log("RESULTADO: ", results)
        if (results.length > 0) {
            const ticketData = results[0];
            return res.json({ success: true, ticketData });
        } else {
            return res.json({ success: false, message: 'Boleta no encontrada' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al conectar a la base de datos' });
    }
});

router.post('/generarCalculation', async (req, res) => {
    try {
        const productos = req.body;

        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({ success: false, message: 'No se proporcionaron productos para generar el cálculo de venta' });
        }

        let totalGeneral = 0;
        const detalles = productos.map(producto => {
            const { id_producto, monto_unitario_cobrado, cantidad } = producto;
            const totalProducto = monto_unitario_cobrado * cantidad;
            totalGeneral += totalProducto;

            return {
                id_producto,
                monto_unitario_cobrado,
                cantidad,
                totalProducto
            };
        });

        const ticket = {
            detalles,
            totalGeneral
        };
        return res.status(201).json({ success: true, ticket });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});
router.post('/generateTicket', async (req, res) => {
    const venta = req.body;

    try {
        // 1. Consultar la ID del cliente utilizando el RUT
        const [cliente] = await db.query('SELECT id FROM cliente WHERE rut = ?', [venta.rut]);

        if (!cliente || cliente.length === 0) { // Verifica que el cliente sea encontrado
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }

        const idCliente = cliente[0].id; // Obtener el id del cliente

        // 2. Verificar si el usuario existe
        const [usuario] = await db.query('SELECT * FROM usuario WHERE id = ?', [venta.idUsuario]);
        if (!usuario || usuario.length === 0) { // Verifica que el usuario sea encontrado
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        // 3. Registrar en la tabla boleta
        const [resultBoleta] = await db.query(
            'INSERT INTO boleta (id_cliente, valor_total, valor_pagado, cantidad_total_productos, id_usuario, metodo_pago, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [idCliente, venta.totalCompra, venta.totalCancelado, venta.cantidadTotalProductos, venta.idUsuario, venta.metodoPago, 1]
        );

        const idBoleta = resultBoleta.insertId; // Capturar la ID de la boleta registrada

        // 4. Registrar en la tabla productoboleta para cada producto
        for (const producto of venta.productos) {
            await db.query(
                'INSERT INTO productoboleta (id_producto, id_boleta, cantidad, monto_unitario_cobrado) VALUES (?, ?, ?, ?)',
                [producto.id, idBoleta, producto.cantidad, producto.montoUnitario]
            );
        }

        // 5. Si el total cancelado es menor al total compra, registrar en la tabla deuda_cliente
        if (venta.totalCancelado < venta.totalCompra) {
            const montoDeuda = venta.totalCompra - venta.totalCancelado;

            await db.query(
                'INSERT INTO deudacliente (id_boleta, monto_deuda) VALUES (?, ?)',
                [idBoleta, montoDeuda]
            );
        }

        return res.status(201).json({ success: true, message: 'Venta registrada correctamente.' });
    } catch (err) {
        console.error('Error al registrar la venta:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});


router.post('/generateTicketa', async (req, res) => {
    try {
        const { productos, id_cliente, valor_pagado, id_usuario, metodo_pago } = req.body;

        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({ success: false, message: 'No se proporcionaron productos para generar la boleta' });
        }

        let valor_total = 0;
        let cantidad_total_productos = 0;

        productos.forEach(producto => {
            const { monto_unitario_cobrado, cantidad } = producto;
            const totalProducto = monto_unitario_cobrado * cantidad;
            valor_total += totalProducto;
            cantidad_total_productos += cantidad;
        });
        const estado = 1; 
        const boletaQuery = `
            INSERT INTO boleta (id_cliente, valor_total, valor_pagado, cantidad_total_productos, id_usuario, metodo_pago, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [boletaResult] = await db.query(boletaQuery, [id_cliente, valor_total, valor_pagado, cantidad_total_productos, id_usuario, metodo_pago, estado]);
        const id_boleta = boletaResult.insertId;
        const productoBoletaQuery = `
            INSERT INTO productoboleta (id_producto, id_boleta, cantidad, monto_unitario_cobrado)
            VALUES (?, ?, ?, ?)
        `;
        for (const producto of productos) {
            const { id_producto, monto_unitario_cobrado, cantidad } = producto;
            const totalProducto = monto_unitario_cobrado * cantidad;

            await db.query(productoBoletaQuery, [id_producto, id_boleta, cantidad, monto_unitario_cobrado]);
        }
        return res.status(201).json({ success: true, message: 'Boleta generada exitosamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});



router.get('/listAll', async (req, res) => {
    try {
        const query = `
            SELECT pb.*, p.nombre AS nombre_producto 
            FROM productoboleta pb
            JOIN producto p ON pb.id_producto = p.id
        `;

        const [results] = await db.query(query);

        if (results.length > 0) {
            return res.json({ success: true, productData: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron productos' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/listAllTicket', async (req, res) => {
    try {
        const query = `
            SELECT b.*, c.nombre, c.apellido, u.nombre_usuario 
            FROM boleta b
            JOIN cliente c ON b.id_cliente = c.id 
            JOIN usuario u ON b.id_usuario = u.id 
        `;

        const [results] = await db.query(query);

        if (results.length > 0) {
            return res.json({ success: true, ventasData: results });
        } else {
            return res.json({ success: false, message: 'No se encontraron ventas' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});


router.get('/getFindOne/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const boletaQuery = `
            SELECT * FROM boleta WHERE id = ?
        `;
        const [boletaResult] = await db.query(boletaQuery, [id]);

        if (boletaResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Boleta no encontrada' });
        }
        const productosQuery = `
            SELECT * FROM productoboleta WHERE id_boleta = ?
        `;
        const [productosResult] = await db.query(productosQuery, [id]);
        const response = {
            boleta: boletaResult[0],
            productos: productosResult
        };

        return res.status(200).json({ success: true, data: response });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});


router.put('/delete', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: 'El id de la boleta es requerido' });
        }
        const estado = 0;
        const query = 'UPDATE productoboleta SET estado = ? WHERE id = ?';
        await db.query(query, [estado, id]);

        return res.json({ success: true, message: 'Boleta anulada exitosamente' });
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

router.get('/productTicketRange', async (req, res) => {
    try {
        const { desde, hasta } = req.body;
        if (!desde || !hasta) {
            return res.status(400).json({ success: false, message: 'Faltan las fechas desde y hasta' });
        }
        const desdeFecha = `${desde} 00:00:00`;
        const hastaFecha = `${hasta} 23:59:59`;
        const query = `
            SELECT 
                pb.id_producto, 
                pb.cantidad, 
                pb.monto_unitario_cobrado, 
                p.nombre AS nombre_producto
            FROM productoboleta pb
            JOIN producto p ON pb.id_producto = p.id
            WHERE pb.createdAt >= ? AND pb.createdAt <= ?
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

router.get('/productTicketIdRange', async (req, res) => {
    try {
        const { id_producto, desde, hasta } = req.body;
        if (!desde || !hasta || !id_producto) {
            return res.status(400).json({ success: false, message: 'Faltan datos para la consulta' });
        }
        const desdeFecha = `${desde} 00:00:00`;
        const hastaFecha = `${hasta} 23:59:59`;
        const query = `
            SELECT 
                pb.id_producto, 
                pb.cantidad, 
                pb.monto_unitario_cobrado, 
                p.nombre AS nombre_producto
            FROM productoboleta pb
            JOIN producto p ON pb.id_producto = p.id
            WHERE pb.createdAt >= ? AND pb.createdAt <= ?
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
