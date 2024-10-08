const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectToDatabase } = require('./config/dbConfig');

const userRoutes = require('./routes/user');
const clientRoutes = require('./routes/cliente');
const authRoutes = require('./routes/auth'); 
const productRoutes = require('./routes/product'); 
const ticketRoutes = require('./routes/boleta'); 

const PORT = 5000;

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

app.use(morgan('combined'));

app.use('/user', userRoutes);
app.use('/client', clientRoutes);
app.use('/auth', authRoutes); 
app.use('/product', productRoutes); 
app.use('/ticket', ticketRoutes); 

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
}).catch(err => {
    console.error('No se pudo conectar a la base de datos. No se inicia el servidor.');
});
