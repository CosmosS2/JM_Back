const mysql = require('mysql2');
const clc = require('cli-color');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'jm',
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
