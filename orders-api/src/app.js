const express = require('express');
const config = require('./config');
const productRoutes = require('./routes/products.routes');
const orderRoutes = require('./routes/orders.routes');

const app = express();

//configuracion
app.set('port',config.app.port);

// Middlewares
app.use(express.json()); // Para parsear body JSON

// Ruta de Health Check (requerida en la prueba )
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ... (middlewares)
app.use(productRoutes);
app.use(orderRoutes);

module.exports = app;