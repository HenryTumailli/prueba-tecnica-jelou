const app = require('./app');

app.listen(app.get('port'), () => {
    console.log("Servidor escuchando el en puerto", app.get('port'));
})