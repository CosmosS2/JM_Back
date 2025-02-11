const mysql = require("mysql2/promise"); // ✅ Cambia a mysql2/promise
const clc = require("cli-color");

// ✅ Crear un pool de conexiones para manejar múltiples solicitudes
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "jm",
  waitForConnections: true,
  connectionLimit: 10, // ✅ Define el número máximo de conexiones simultáneas
  queueLimit: 0,
});

// ✅ Función para obtener una conexión de la pool
async function connectToDatabase() {
  try {
    const connection = await pool.getConnection(); // 🔄 Obtiene una conexión del pool
    console.log(clc.magentaBright("🔗 Conectado a la base de datos MySQL"));
    return connection; // ✅ Retorna la conexión activa
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error);
    throw error;
  }
}

module.exports = {
  db: pool, // ✅ Exporta el pool para consultas simples
  connectToDatabase, // ✅ Exporta la función para obtener conexiones individuales
};
