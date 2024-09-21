// server.js

const express = require('express');
const path = require('path');
const http = require('http'); // Necesario para Socket.io
const { Server } = require('socket.io'); // Importa Socket.io
const exphbs = require('express-handlebars'); // Importa express-handlebars
const fs = require('fs'); // Importa fs para leer archivos
const productsRouter = require('./routes/products');
const cartsRouter = require('./routes/carts');

const app = express();
const server = http.createServer(app); // Crea el servidor HTTP
const io = new Server(server); // Inicializa Socket.io

const PORT = 8080;

// Middleware para parsear JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de Handlebars
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Directorio para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para pasar la instancia de Socket.io a las rutas
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Rutas de API
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Función para leer productos desde el archivo
const readProducts = () => {
    const productFilePath = path.join(__dirname, 'data', 'productos.json');
    try {
        if (fs.existsSync(productFilePath)) {
            const data = fs.readFileSync(productFilePath, 'utf-8');
            return data ? JSON.parse(data) : [];
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error leyendo productos:", error);
        return [];
    }
};

// Función para leer carritos desde el archivo
const readCarts = () => {
    const cartsFilePath = path.join(__dirname, 'data', 'carrito.json');
    try {
        if (fs.existsSync(cartsFilePath)) {
            const data = fs.readFileSync(cartsFilePath, 'utf-8');
            return data ? JSON.parse(data) : [];
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error leyendo carritos:", error);
        return [];
    }
};

// Ruta raíz para Handlebars que pasa los productos a la vista
app.get('/', (req, res) => {
    const products = readProducts();
    res.render('home', { products });
});

// Ruta para realTimeProducts
app.get('/realtimeproducts', (req, res) => {
    const products = readProducts();
    res.render('realTimeProducts', { products });
});

// Configuración de Socket.io
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Puedes definir eventos aquí
    socket.on('mensaje', (data) => {
        console.log('Mensaje recibido:', data);
        // Emite el mensaje a todos los clientes
        io.emit('mensaje', data);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Middleware para manejar errores (opcional)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
