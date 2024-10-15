const express = require('express');
const exphbs = require('express-handlebars');
const socketIo = require('socket.io');
const http = require('http');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require('path');

// Rutas
const cartsRouter = require('./routes/carts');
const productsRouter = require('./routes/products');
const viewsRouter = require('./routes/views');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(methodOverride('_method'));


app.use(express.static(path.join(__dirname, 'public')));

// Configurar Handlebars
app.engine('handlebars', exphbs.engine({
    helpers: {
        calcTotal: (price, quantity) => {
            return (price * quantity).toFixed(2);
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Conectar a MongoDB
const mongoURI = 'mongodb://localhost:27017/mi_tienda';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error al conectar a MongoDB:', err));


app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routers
app.use('/', viewsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/products', productsRouter);

// Socket.io
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');


    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
