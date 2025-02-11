const express = require("express");
const router = express.Router();
const { db } = require("../config/dbConfig");

router.get("/listarPagos", async (req, res) => {
  try {
    const query = `
      SELECT 
          pd.id AS id_pago, 
          pd.metodo_pago, 
          pd.monto_abonado AS monto,
          u.nombre_usuario AS usuario,
          'Pago Deuda' AS tipo_pago,
          pd.createdAt AS fecha
      FROM pagodeuda pd
      JOIN usuario u ON pd.id_usuario = u.id
      
      UNION ALL
      
      SELECT 
          b.id AS id_pago, 
          b.metodo_pago, 
          b.valor_pagado AS monto,
          u.nombre_usuario AS usuario,
          'Venta' AS tipo_pago,
          b.createdAt AS fecha
      FROM boleta b
      JOIN usuario u ON b.id_usuario = u.id
      
      ORDER BY fecha DESC;
    `;

    const [results] = await db.query(query);
    return res.json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
