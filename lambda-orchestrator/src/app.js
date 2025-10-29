const express = require('express');
const config = require('./config');

const app = express();


//configuracion
app.set('port',config.app.port);


module.exports = app;