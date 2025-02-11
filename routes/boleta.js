const express = require("express");
const router = express.Router();
const { db, connectToDatabase } = require("../config/dbConfig");

// 📌 Registrar una Nueva Boleta
router.post("/createBoleta", async (req, res) => {
  const connection = await connectToDatabase(); // 🔄 Obtener conexión
  try {
    console.log("🚀 Creando Boleta:", req.body);
    const {
      idCliente,
      totalCompra,
      totalCancelado,
      cantidadTotalProductos,
      id_usuario,
      metodoPago,
      productos,
    } = req.body;

    if (!productos || productos.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos de la boleta" });
    }

    // 🔄 Iniciar transacción
    await connection.beginTransaction();

    // ✅ Insertar Boleta en la Base de Datos
    const [result] = await connection.query(
      "INSERT INTO boleta (id_cliente, valor_total, valor_pagado, cantidad_total_productos, id_usuario, metodo_pago, estado) VALUES (?, ?, ?, ?, ?, ?, 1)",
      [
        idCliente,
        totalCompra,
        totalCancelado,
        cantidadTotalProductos,
        id_usuario,
        metodoPago,
      ]
    );
    const id_boleta = result.insertId;
    console.log("✅ Boleta creada con ID:", id_boleta);

    // ✅ Procesar Productos en la Boleta
    for (const producto of productos) {
      console.log("📦 Procesando Producto:", producto);
      const { id, cantidad, montoUnitario, origen } = producto;
      const tablaOrigen = origen === "2" ? "productoparque" : "productobodega";
      console.log("📦 Producto en:", tablaOrigen);
      // ✅ Verificar el Stock Actual
      const [stockActual] = await connection.query(
        `SELECT stock FROM ${tablaOrigen} WHERE id = ?`,
        [id]
      );

      if (stockActual.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Producto con ID ${id} no encontrado en ${origen}`,
        });
      }

      const stockDisponible = stockActual[0].stock;

      if (cantidad > stockDisponible) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para el producto ID ${id} en ${origen}. Disponible: ${stockDisponible}, solicitado: ${cantidad}`,
        });
      }

      // ✅ Insertar en `productoboleta`
      await connection.query(
        "INSERT INTO productoboleta (id_producto, id_boleta, cantidad, monto_unitario_cobrado, origen) VALUES (?, ?, ?, ?, ?)",
        [id, id_boleta, cantidad, montoUnitario, origen]
      );

      // ✅ Actualizar el Stock
      const nuevoStock = stockDisponible - cantidad;
      await connection.query(
        `UPDATE ${tablaOrigen} SET stock = ? WHERE id = ?`,
        [nuevoStock, id]
      );

      console.log("🔻 Nuevo stock en", origen, ":", nuevoStock);

      // ✅ Registrar Egreso en `movimientosproductos`
      await connection.query(
        "INSERT INTO movimientosproductos (id_producto, tipo_movimiento, cantidad, origen) VALUES (?, 'venta', ?, ?)",
        [id, cantidad, origen]
      );
    }

    // ✅ Verificar si se debe Registrar una Deuda
    if (totalCancelado < totalCompra) {
      const montoDeuda = totalCompra - totalCancelado;
      console.log("⚠️ Registrando deuda de:", montoDeuda);

      await connection.query(
        "INSERT INTO deudacliente (id_boleta, monto_deuda, estado, monto_deuda_inicial) VALUES (?, ?, 'pendiente', ?)",
        [id_boleta, montoDeuda, montoDeuda]
      );

      console.log("✅ Deuda registrada correctamente en `deudacliente`");
    }

    // 🔄 Confirmar Transacción
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Boleta creada correctamente",
      idBoleta: id_boleta,
    });
  } catch (err) {
    console.error("❌ Error en /createBoleta:", err);

    await connection.rollback(); // ❌ Revertir cambios en caso de error
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release(); // ✅ Liberar conexión
  }
});

// 📌 Registrar un Pago Completo de una Deuda
router.post("/registrarPagoTotal", async (req, res) => {
  try {
    console.log("📌 Registrando pago total:", req.body);

    const { idDeuda, metodoPago, idUsuario } = req.body;

    if (!idDeuda || !metodoPago || !idUsuario) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos obligatorios" });
    }

    // ✅ Obtener la deuda
    const [deuda] = await db.query(
      "SELECT monto_deuda FROM deudacliente WHERE id = ?",
      [idDeuda]
    );

    if (deuda.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontró una deuda pendiente con el ID proporcionado",
      });
    }

    const montoDeuda = deuda[0].monto_deuda;

    // ✅ Registrar el pago en pagodeuda
    await db.query(
      "INSERT INTO pagodeuda (id_deudaCliente, metodo_pago, monto_abonado, id_usuario) VALUES (?, ?, ?, ?)",
      [idDeuda, metodoPago, montoDeuda, idUsuario]
    );

    // ✅ Marcar la deuda como pagada
    await db.query(
      "UPDATE deudacliente SET monto_deuda = 0, estado = 'pagada' WHERE id = ?",
      [idDeuda]
    );

    console.log("✅ Pago total registrado correctamente");

    return res.status(201).json({
      success: true,
      message: "Pago total registrado correctamente",
    });
  } catch (err) {
    console.error("❌ Error en /registrarPagoTotal:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 📌 Registrar un Pago Parcial de una Deuda
router.post("/registrarPagoParcial", async (req, res) => {
  try {
    console.log("📌 Registrando pago parcial:", req.body);

    const { idDeuda, metodoPago, monto, idUsuario } = req.body;

    if (!idDeuda || !metodoPago || !monto || !idUsuario) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos obligatorios" });
    }

    // ✅ Obtener la deuda
    const [deuda] = await db.query(
      "SELECT monto_deuda FROM deudacliente WHERE id = ? AND estado = 'pendiente'",
      [idDeuda]
    );

    if (deuda.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontró una deuda pendiente con el ID proporcionado",
      });
    }

    const montoDeuda = deuda[0].monto_deuda;
    const nuevoMontoDeuda = montoDeuda - monto;

    // ✅ Registrar el pago en pagodeuda
    await db.query(
      "INSERT INTO pagodeuda (id_deudaCliente, metodo_pago, monto_abonado, id_usuario) VALUES (?, ?, ?, ?)",
      [idDeuda, metodoPago, monto, idUsuario]
    );

    // ✅ Si el pago cubre toda la deuda, actualizar el estado a "pagada"
    if (nuevoMontoDeuda <= 0) {
      await db.query("UPDATE deudacliente SET estado = 'pagada' WHERE id = ?", [
        idDeuda,
      ]);
    } else {
      await db.query("UPDATE deudacliente SET monto_deuda = ? WHERE id = ?", [
        nuevoMontoDeuda,
        idDeuda,
      ]);
    }

    console.log("✅ Pago parcial registrado correctamente");

    return res.status(201).json({
      success: true,
      message: "Pago parcial registrado correctamente",
    });
  } catch (err) {
    console.error("❌ Error en /registrarPagoParcial:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 📌 Eliminar una Boleta (Devolver Productos y Restaurar Stock)
router.delete("/deleteBoleta/:id", async (req, res) => {
  try {
    console.log("🚀 Eliminando Boleta:");
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID de boleta requerido" });
    }

    // ✅ Obtener productos asociados a la boleta
    const [productos] = await db.query(
      "SELECT id_producto, cantidad, origen FROM productoboleta WHERE id_boleta = ?",
      [id]
    );

    // ✅ Devolver stock a su origen
    for (const producto of productos) {
      const { id_producto, cantidad, origen } = producto;
      const tablaOrigen =
        origen === "parque" ? "productoparque" : "productobodega";

      const [stockActual] = await db.query(
        `SELECT stock FROM ${tablaOrigen} WHERE id = ?`,
        [id_producto]
      );

      if (stockActual.length > 0) {
        const nuevoStock = stockActual[0].stock + cantidad;
        await db.query(`UPDATE ${tablaOrigen} SET stock = ? WHERE id = ?`, [
          nuevoStock,
          id_producto,
        ]);

        // ✅ Registrar Ingreso en movimientosproductos
        await db.query(
          "INSERT INTO movimientosproductos (id_producto, tipo_movimiento, cantidad, origen) VALUES (?, 'ingreso', ?, ?)",
          [id_producto, cantidad, origen]
        );
      }
    }

    // ✅ Eliminar productos de productoboleta y la boleta en sí
    await db.query("DELETE FROM productoboleta WHERE id_boleta = ?", [id]);
    await db.query("DELETE FROM boleta WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: "Boleta eliminada correctamente y stock restaurado",
    });
  } catch (err) {
    console.error("❌ Error en /deleteBoleta:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 📌 Obtener Todas las Deudas
router.get("/listDeudas", async (req, res) => {
  try {
    console.log("📌 Listando todas las deudas:");

    const query = `
      SELECT 
        dc.id,
        dc.id_boleta,
        dc.monto_deuda,
        dc.createdAt,
        dc.updatedAt,
        dc.estado,
        dc.monto_deuda_inicial,
        c.nombre AS nombre_cliente,
        c.apellido AS apellido_cliente,
        u.nombre_usuario,
        (SELECT COUNT(*) FROM pagodeuda pd WHERE pd.id_deudaCliente = dc.id) > 0 AS tienePagos
      FROM deudacliente dc
      JOIN boleta b ON dc.id_boleta = b.id
      JOIN cliente c ON b.id_cliente = c.id
      JOIN usuario u ON b.id_usuario = u.id
      ORDER BY dc.createdAt DESC
    `;

    const [results] = await db.query(query);

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error("❌ Error en /listDeudas:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 📌 Obtener Pagos de una Deuda Específica
router.get("/obtenerPagosDeuda/:idDeuda", async (req, res) => {
  try {
    const { idDeuda } = req.params;
    console.log(`📌 Obteniendo pagos de la deuda ID: ${idDeuda}`);

    if (!idDeuda) {
      return res.status(400).json({
        success: false,
        message: "ID de deuda requerido",
      });
    }

    const query = `
      SELECT 
        pd.id AS id_pago, 
        pd.id_deudaCliente AS id_deuda, 
        pd.metodo_pago, 
        pd.monto_abonado, 
        pd.createdAt AS fecha_pago, 
        u.nombre_usuario 
      FROM pagodeuda pd
      JOIN usuario u ON pd.id_usuario = u.id
      WHERE pd.id_deudaCliente = ?
      ORDER BY pd.createdAt DESC
    `;

    const [results] = await db.query(query, [idDeuda]);

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error("❌ Error en /obtenerPagosDeuda:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 📌 Obtener todas las Boletas con información del Cliente y Usuario
router.get("/listBoletas", async (req, res) => {
  try {
    console.log("📌 Listando todas las boletas:");

    const query = `
      SELECT 
        b.id AS id_boleta, 
        COALESCE(c.nombre, 'Venta Al Detalle') AS nombre_cliente, 
        COALESCE(c.apellido, '') AS apellido_cliente, 
        u.nombre_usuario, 
        b.metodo_pago, 
        b.valor_pagado, 
        b.valor_total,
        b.createdAt AS fecha
      FROM boleta b
      LEFT JOIN cliente c ON b.id_cliente = c.id  -- 🔹 Permite que el cliente sea NULL
      JOIN usuario u ON b.id_usuario = u.id
      ORDER BY b.createdAt DESC
    `;

    const [results] = await db.query(query);

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error("❌ Error en /listBoletas:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 📌 Obtener Detalle de una Boleta
router.get("/boleta/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Buscando boleta con ID:", id); // 📌 Debug

    // ✅ Obtener información completa de la boleta, incluyendo cliente (opcional) y usuario
    const boletaQuery = `
      SELECT 
        b.id AS id_boleta,
        b.valor_total, 
        b.valor_pagado, 
        b.metodo_pago, 
        b.cantidad_total_productos, 
        b.estado,
        b.createdAt AS fecha_boleta,
        c.id AS id_cliente, 
        COALESCE(c.nombre, 'Sin Cliente') AS nombre_cliente, 
        COALESCE(c.apellido, '') AS apellido_cliente, 
        COALESCE(c.rut, 'No registrado') AS rut_cliente, 
        COALESCE(c.telefono, 'No disponible') AS telefono_cliente, 
        COALESCE(c.correo, 'No disponible') AS correo_cliente,
        u.id AS id_usuario, 
        u.nombre_usuario
      FROM boleta b
      LEFT JOIN cliente c ON b.id_cliente = c.id
      JOIN usuario u ON b.id_usuario = u.id
      WHERE b.id = ?
    `;

    const [boletaResult] = await db.query(boletaQuery, [id]);

    if (boletaResult.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Boleta no encontrada" });
    }

    // ✅ Obtener información detallada de los productos en la boleta
    const productosQuery = `
      SELECT 
        pb.id_producto, 
        COALESCE(p.nombre, 'Producto desconocido') AS nombre_producto, 
        pb.cantidad, 
        pb.monto_unitario_cobrado, 
        pb.origen, 
        CASE 
          WHEN pb.origen = 1 THEN 'Bodega'
          WHEN pb.origen = 2 THEN 'Parque'
          ELSE 'Desconocido' 
        END AS origen_nombre
      FROM productoboleta pb
      LEFT JOIN productobodega p ON pb.id_producto = p.id
      WHERE pb.id_boleta = ?
    `;

    const [productosResult] = await db.query(productosQuery, [id]);

    const response = {
      boleta: boletaResult[0], // ✅ Información de la boleta, cliente y usuario
      productos: productosResult, // ✅ Información detallada de los productos
    };

    console.log("✅ Respuesta de la API:", response); // 📌 Debug
    return res.status(200).json({ success: true, data: response });
  } catch (err) {
    console.error("❌ Error en /boleta/:id:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 📌 Obtener deuda por ID de Boleta
router.get("/deudaPorBoleta/:idBoleta", async (req, res) => {
  try {
    const { idBoleta } = req.params;
    console.log(`📌 Buscando deuda para la boleta ID: ${idBoleta}`);

    if (!idBoleta) {
      return res.status(400).json({
        success: false,
        message: "ID de boleta requerido",
      });
    }

    const query = `
      SELECT 
        dc.id AS id_deuda, 
        dc.id_boleta, 
        dc.monto_deuda, 
        dc.monto_deuda_inicial, 
        dc.estado, 
        dc.createdAt AS fecha_deuda,
        c.nombre AS nombre_cliente,
        c.apellido AS apellido_cliente,
        u.nombre_usuario
      FROM deudacliente dc
      JOIN boleta b ON dc.id_boleta = b.id
      JOIN cliente c ON b.id_cliente = c.id
      JOIN usuario u ON b.id_usuario = u.id
      WHERE dc.id_boleta = ?
    `;

    const [results] = await db.query(query, [idBoleta]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontró deuda asociada a esta boleta",
      });
    }

    return res.json({ success: true, data: results[0] });
  } catch (err) {
    console.error("❌ Error en /deudaPorBoleta:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
