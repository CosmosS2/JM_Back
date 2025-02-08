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

    // Validaciones
    if (!nombre || stock === undefined || ubicacion === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos o valores inválidos" });
    }

    const estado = 1;
    const ubicacionNum = Number(ubicacion);

    console.log("UBICACION:", ubicacionNum);
    console.log("NOMBRE:", nombre);
    console.log("STOCK:", stock);

    const productoBodega =
      "INSERT INTO productobodega (nombre, stock, estado) VALUES (?, ?, ?)";
    const productoParque =
      "INSERT INTO productoparque (nombre, stock, estado) VALUES (?, ?, ?)";

    switch (ubicacionNum) {
      case 1:
        await db.query(productoBodega, [nombre, stock, estado]);
        await db.query(productoParque, [nombre, 0, estado]);
        break;
      case 2:
        await db.query(productoParque, [nombre, stock, estado]);
        await db.query(productoBodega, [nombre, 0, estado]);
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Ubicación no válida" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Producto registrado exitosamente" });
  } catch (err) {
    console.error("Error en /register:", err);
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

router.put("/updateStockBodega", async (req, res) => {
  try {
    console.log("EN PRODUCTO: ");
    const { id, nombre, stock } = req.body;
    console.log("DATOS EN PRODUCTO: ", id, nombre, stock);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID del producto es requerido" });
    }
    let query = "UPDATE productoBodega SET";
    const values = [];
    if (nombre) {
      query += " nombre = ?";
      values.push(nombre);
    }
    if (stock !== undefined && stock !== null) {
      if (values.length > 0) {
        query += ",";
      }
      query += " stock = ?";
      values.push(stock);
    }
    if (values.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nada para actualizar" });
    }
    query += " WHERE id = ?";
    values.push(id);
    await db.query(query, values);
    return res.json({
      success: true,
      message: "Producto actualizado exitosamente",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/updateStockParque", async (req, res) => {
  try {
    console.log("EN PRODUCTO: ");
    const { id, nombre, stock } = req.body;
    console.log("DATOS EN PRODUCTO: ", id, nombre, stock);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID del producto es requerido" });
    }
    let query = "UPDATE productoParque SET";
    const values = [];
    if (nombre) {
      query += " nombre = ?";
      values.push(nombre);
    }
    if (stock !== undefined && stock !== null) {
      if (values.length > 0) {
        query += ",";
      }
      query += " stock = ?";
      values.push(stock);
    }
    if (values.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nada para actualizar" });
    }
    query += " WHERE id = ?";
    values.push(id);
    await db.query(query, values);
    return res.json({
      success: true,
      message: "Producto actualizado exitosamente",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/transfer", async (req, res) => {
  try {
    console.log("EN PRODUCTO TRANSFER: ");
    const { id, cantidad, stock, ubicacion, nombre } = req.body;
    console.log("DATOS EN PRODUCTO: ", id, cantidad, stock, ubicacion);
    if (!cantidad) {
      return res.status(400).json({
        success: false,
        message: "La cantidad del producto a transferir es requerido",
      });
    }
    if (cantidad > stock) {
      return res.status(400).json({
        success: false,
        message: "La cantidad a transferir es mayor a la del stock actual",
      });
    }
    const [productosParque] = await db.query(
      "SELECT id, stock FROM producto WHERE ubicacion = ?",
      [2]
    );
    if (productosParque != 0) {
      console.log("NUEVO PRODUCTO EN PARQUE: CANTIDAD = ", cantidad);
      //await db.query(
      //'INSERT INTO producto (nombre, stock, estado, ubicacion) VALUES (?, ?, ?, ?)',
      //[nombre, cantidad, 1, 2]
      //);
    } else {
      const nuevoStockParque = productosParque.stock + cantidad;
      console.log(
        "PRODUCTO ENCONTRADO EN PARQUE CON ID: ",
        productosParque.id,
        " CANTIDAD QUE HABIA: ",
        productosParque.stock,
        " cantidad nueva: ",
        nuevoStockParque
      );
      //await db.query('UPDATE producto SET stock = ? WHERE id = ?', [nuevoStockParque, id]);
    }
    const nuevoStockBodega = stock - cantidad;
    console.log(
      "NUEVO STOCK EN PRODUCTOS BODEGA LUEGO DE TRANSFERIR: ",
      nuevoStockBodega
    );
    //await db.query('UPDATE producto SET stock = ? WHERE id = ?', [nuevoStockBodega, id]);
    //return res.json({ success: true, message: 'Producto transferido exitosamente' });
    //await db.query(query, values);
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
        .json({ success: false, message: "El id del producto es requerido" });
    }
    const query = "UPDATE producto SET estado = 0 WHERE id = ?";
    await db.query(query, [id]);

    return res.json({
      success: true,
      message: "Producto deshabilitado exitosamente",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/productEntry", async (req, res) => {
  try {
    const { id_producto, cantidad, id_usuario } = req.body;
    if (!id_producto || !cantidad || !id_usuario) {
      return res.status(400).json({ success: false, message: "Faltan datos" });
    }
    const [results] = await db.query(
      "SELECT stock, estado FROM producto WHERE id = ?",
      [id_producto]
    );
    if (results.length > 0) {
      const { stock: stockActual, estado } = results[0];
      if (estado === 1) {
        const nuevoStock = stockActual + cantidad;
        await db.query("UPDATE producto SET stock = ? WHERE id = ?", [
          nuevoStock,
          id_producto,
        ]);
        await db.query(
          "INSERT INTO ingresoproductos (id_producto, cantidad, id_usuario) VALUES (?, ?, ?)",
          [id_producto, cantidad, id_usuario]
        );

        return res
          .status(201)
          .json({ success: true, message: "Ingreso registrado exitosamente" });
      } else {
        return res.status(403).json({
          success: false,
          message: "El producto no está disponible para ingreso",
        });
      }
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/listProductEntry", async (req, res) => {
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
      return res.json({
        success: false,
        message: "No se encontraron registros",
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/productEntryRange", async (req, res) => {
  try {
    const { desde, hasta } = req.body;
    if (!desde || !hasta) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan las fechas desde y hasta" });
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
      return res.json({
        success: false,
        message: "No se encontraron registros en el rango de fechas dado",
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/productEntryIdRange", async (req, res) => {
  try {
    const { id_producto, desde, hasta } = req.body;
    if (!desde || !hasta || !id_producto) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos para la consulta" });
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

    const [results] = await db.query(query, [
      desdeFecha,
      hastaFecha,
      id_producto,
    ]);

    if (results.length > 0) {
      return res.json({ success: true, data: results });
    } else {
      return res.json({
        success: false,
        message: "No se encontraron registros en el rango de fechas dado",
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
