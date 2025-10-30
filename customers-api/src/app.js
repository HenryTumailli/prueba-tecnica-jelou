const express = require('express');
const config = require('./config');
const customerRoutes = require('./routes/customer.routes');

const app = express();

//configuracion
app.set('port',config.app.port);

// Middlewares
app.use(express.json());

// Ruta de Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(customerRoutes);

module.exports = app;