const mysql = require('mysql2');
const clc = require('cli-color');


require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

const connectToDatabase = () => {
    return new Promise((resolve, reject) => {
        db.connect((err) => {
            if (err) {
                console.error('Error al conectar a la base de datos:', err.stack);
                return reject(err);
            }
            console.log(clc.magentaBright('Conectado a la base de datos MySQL'));
            resolve();
        });
    });
};

module.exports = {
    db: db.promise(),
    connectToDatabase,
};