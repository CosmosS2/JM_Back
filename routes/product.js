const express = require("express");
const router = express.Router();
const { db, connectToDatabase } = require("../config/dbConfig");

router.get("/productData/:id", async (req, res) => {
  try {
    await connectToDatabase();
    const { id } = req.params;

    const [results] = await db.query(
      "SELECT nombre FROM productobodega WHERE id = ?",
      [id]
    );

    if (results.length > 0) {
      const productData = results[0];
      return res.json({ success: true, productData });
    } else {
      return res.json({ success: false, message: "Producto no encontrado" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { nombre, stock, ubicacion } = req.body;

    if (!nombre || stock === undefined || ubicacion === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos o valores inválidos" });
    }

    const estado = 1;
    const ubicacionNum = Number(ubicacion);
    let id_producto;

    console.log(
      "📌 Registrando producto:",
      nombre,
      "Stock:",
      stock,
      "Ubicación:",
      ubicacionNum
    );

    // 🔹 Si se agrega en bodega, se registra también en parque con stock 0
    if (ubicacionNum === 1) {
      const [result] = await db.query(
        "INSERT INTO productobodega (nombre, stock, estado) VALUES (?, ?, ?)",
        [nombre, stock, estado]
      );
      id_producto = result.insertId;

      await db.query(
        "INSERT INTO productoparque (id, nombre, stock, estado) VALUES (?, ?, ?, ?)",
        [id_producto, nombre, 0, estado]
      );
    }
    // 🔹 Si se agrega en parque, se registra también en bodega con stock 0
    else if (ubicacionNum === 2) {
      const [result] = await db.query(
        "INSERT INTO productoparque (nombre, stock, estado) VALUES (?, ?, ?)",
        [nombre, stock, estado]
      );
      id_producto = result.insertId;

      await db.query(
        "INSERT INTO productobodega (id, nombre, stock, estado) VALUES (?, ?, ?, ?)",
        [id_producto, nombre, 0, estado]
      );
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Ubicación no válida" });
    }

    // ✅ Registrar el ingreso en movimientosproductos
    await db.query(
      "INSERT INTO movimientosproductos (id_producto, tipo_movimiento, cantidad, origen) VALUES (?, 'ingreso', ?, ?)",
      [id_producto, stock, ubicacionNum === 1 ? "bodega" : "parque"]
    );

    return res
      .status(200)
      .json({ success: true, message: "Producto registrado exitosamente" });
  } catch (err) {
    console.error("❌ Error en /register:", err);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: err.message,
    });
  }
});

router.get("/listAllBodega", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM productoBodega");
    if (results.length > 0) {
      return res.json({ success: true, productData: results });
    } else {
      return res.json({
        success: false,
        message: "No se encontraron productos",
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/listAllParque", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM productoParque");
    if (results.length > 0) {
      return res.json({ success: true, productData: results });
    } else {
      return res.json({
        success: false,
        message: "No se encontraron productos",
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/transferABodega", async (req, res) => {
  try {
    console.log("Transferencia a bodega iniciada:");
    const { id, cantidad, stock } = req.body;
    console.log("Datos recibidos:", id, cantidad, stock);

    if (!cantidad || cantidad > stock) {
      return res
        .status(400)
        .json({ success: false, message: "Cantidad inválida para transferir" });
    }

    const [productosBodega] = await db.query(
      "SELECT stock FROM productobodega WHERE id = ?",
      [id]
    );
    if (productosBodega.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No se encontró un producto en la bodega con el ID ${id}`,
      });
    }

    const nuevoStockBodega = productosBodega[0].stock + cantidad;
    await db.query(
      "UPDATE productobodega SET stock = ?, estado = 1 WHERE id = ?",
      [nuevoStockBodega, id]
    );

    const nuevoStockParque = stock - cantidad;
    await db.query(
      "UPDATE productoparque SET stock = ?, estado = 1 WHERE id = ?",
      [nuevoStockParque, id]
    );

    // Registrar transferencia en movimientosproductos
    await db.query(
      "INSERT INTO movimientosproductos (id_producto, tipo_movimiento, cantidad, origen, destino) VALUES (?, 'transferencia', ?, 'parque', 'bodega')",
      [id, cantidad]
    );

    return res.json({
      success: true,
      message: "Producto transferido exitosamente a la bodega",
    });
  } catch (err) {
    console.error("Error en transferencia a bodega:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/listActiveBodega", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM productoBodega WHERE estado = 1"
    );
    if (results.length > 0) {
      return res.json({ success: true, productData: results });
    } else {
      return res.json({
        success: false,
        message: "No se encontraron productos activos",
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/listActiveParque", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM productoParque WHERE estado = 1"
    );
    if (results.length > 0) {
      return res.json({ success: true, productData: results });
    } else {
      return res.json({
        success: false,
        message: "No se encontraron productos activos",
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/transferAParque", async (req, res) => {
  try {
    console.log("Transferencia a parque iniciada:");
    const { id, cantidad, stock } = req.body;
    console.log("Datos recibidos:", id, cantidad, stock);

    if (!cantidad || cantidad > stock) {
      return res
        .status(400)
        .json({ success: false, message: "Cantidad inválida para transferir" });
    }

    const [productosParque] = await db.query(
      "SELECT stock FROM productoparque WHERE id = ?",
      [id]
    );
    if (productosParque.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No se encontró un producto en el parque con el ID ${id}`,
      });
    }

    const nuevoStockParque = productosParque[0].stock + cantidad;
    await db.query(
      "UPDATE productoparque SET stock = ?, estado = 1 WHERE id = ?",
      [nuevoStockParque, id]
    );

    const nuevoStockBodega = stock - cantidad;
    await db.query(
      "UPDATE productobodega SET stock = ?, estado = 1 WHERE id = ?",
      [nuevoStockBodega, id]
    );

    // Registrar transferencia en movimientosproductos
    await db.query(
      "INSERT INTO movimientosproductos (id_producto, tipo_movimiento, cantidad, origen, destino) VALUES (?, 'transferencia', ?, 'bodega', 'parque')",
      [id, cantidad]
    );

    return res.json({
      success: true,
      message: "Producto transferido exitosamente al parque",
    });
  } catch (err) {
    console.error("Error en transferencia a parque:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/updateStockBodega", async (req, res) => {
  try {
    console.log("🚀 Actualizando stock en bodega:");
    const { id, nombre, stock } = req.body;

    if (!id || stock === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos obligatorios" });
    }

    // Obtener stock actual antes de actualizarlo
    const [producto] = await db.query(
      "SELECT stock FROM productobodega WHERE id = ?",
      [id]
    );

    if (producto.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    }

    const stockAnterior = producto[0].stock;
    const diferenciaStock = stock - stockAnterior;
    const tipoMovimiento = diferenciaStock > 0 ? "ingreso" : "egreso";

    // ✅ Actualizar stock en la base de datos
    let query = "UPDATE productobodega SET stock = ?";
    const values = [stock];

    if (nombre) {
      query += ", nombre = ?";
      values.push(nombre);
    }

    query += " WHERE id = ?";
    values.push(id);

    await db.query(query, values);

    // ✅ Registrar en movimientosproductos
    await db.query(
      "INSERT INTO movimientosproductos (id_producto, tipo_movimiento, cantidad, origen) VALUES (?, ?, ?, 'bodega')",
      [id, tipoMovimiento, Math.abs(diferenciaStock)]
    );

    return res.json({
      success: true,
      message: "Stock actualizado correctamente en bodega",
    });
  } catch (err) {
    console.error("❌ Error en /updateStockBodega:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/deleteProductBodega/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "El id del producto es requerido" });
    }
    const query =
      "UPDATE productobodega SET estado = 0, stock = 0 WHERE id = ?";
    await db.query(query, [id]);

    return res.json({
      success: true,
      message: "Producto deshabilitado exitosamente",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/deleteProductParque/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "El id del producto es requerido" });
    }
    const query =
      "UPDATE productoparque SET estado = 0, stock = 0 WHERE id = ?";
    await db.query(query, [id]);

    return res.json({
      success: true,
      message: "Producto deshabilitado exitosamente",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/updateStockParque", async (req, res) => {
  try {
    console.log("🚀 Actualizando stock en parque:");
    const { id, nombre, stock } = req.body;

    if (!id || stock === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos obligatorios" });
    }

    // Obtener stock actual antes de actualizarlo
    const [producto] = await db.query(
      "SELECT stock FROM productoparque WHERE id = ?",
      [id]
    );

    if (producto.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    }

    const stockAnterior = producto[0].stock;
    const diferenciaStock = stock - stockAnterior;
    const tipoMovimiento = diferenciaStock > 0 ? "ingreso" : "egreso";

    // ✅ Actualizar stock en la base de datos
    let query = "UPDATE productoparque SET stock = ?";
    const values = [stock];

    if (nombre) {
      query += ", nombre = ?";
      values.push(nombre);
    }

    query += " WHERE id = ?";
    values.push(id);

    await db.query(query, values);

    // ✅ Registrar en movimientosproductos
    await db.query(
      "INSERT INTO movimientosproductos (id_producto, tipo_movimiento, cantidad, origen) VALUES (?, ?, ?, 'parque')",
      [id, tipoMovimiento, Math.abs(diferenciaStock)]
    );

    return res.json({
      success: true,
      message: "Stock actualizado correctamente en parque",
    });
  } catch (err) {
    console.error("❌ Error en /updateStockParque:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/listMovimientos", async (req, res) => {
  try {
    console.log("📌 Obteniendo lista de movimientos de productos...");
    const [results] = await db.query(
      `SELECT m.id, m.id_producto, p.nombre AS nombre_producto, 
              m.tipo_movimiento, m.cantidad, m.origen, m.destino, m.createdAt
       FROM movimientosproductos m
       JOIN (SELECT id, nombre FROM productobodega UNION SELECT id, nombre FROM productoparque) p
       ON m.id_producto = p.id
       ORDER BY m.createdAt DESC`
    );
    console.log("resultado movimientos: ", results);

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error("❌ Error al obtener movimientos de productos:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/listMovimientosPorProducto", async (req, res) => {
  try {
    const { id_producto, desde, hasta } = req.query;

    if (!id_producto || !desde || !hasta) {
      return res.status(400).json({
        success: false,
        message: "Faltan parámetros (id_producto, desde, hasta)",
      });
    }

    console.log(
      `📌 Filtrando movimientos del producto ${id_producto} entre ${desde} y ${hasta}...`
    );

    const [results] = await db.query(
      `SELECT m.id, m.id_producto, p.nombre AS nombre_producto, 
              m.tipo_movimiento, m.cantidad, m.origen, m.createdAt
       FROM movimientosproductos m
       JOIN (SELECT id, nombre FROM productobodega UNION SELECT id, nombre FROM productoparque) p
       ON m.id_producto = p.id
       WHERE m.id_producto = ? 
       AND m.createdAt BETWEEN ? AND ?
       ORDER BY m.createdAt DESC`,
      [id_producto, `${desde} 00:00:00`, `${hasta} 23:59:59`]
    );
    return res.json({ success: true, data: results });
  } catch (err) {
    console.error("❌ Error al obtener movimientos por producto:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
