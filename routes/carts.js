// routes/carts.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const cartsFilePath = path.join(__dirname, '../data/carrito.json');

// Función para leer carritos desde el archivo
const readCarts = () => {
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

// Función para escribir carritos al archivo
const writeCarts = (data) => {
    try {
        fs.writeFileSync(cartsFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error escribiendo carritos:", error);
    }
};

// Ruta POST /api/carts/ - Crear un nuevo carrito
router.post('/', (req, res) => {
    const carts = readCarts();
    const newId = carts.length ? Math.max(...carts.map(c => c.id)) + 1 : 1;

    const newCart = {
        id: newId,
        products: []
    };

    carts.push(newCart);
    writeCarts(carts);
    res.status(201).json(newCart);
});

// Ruta GET /api/carts/:cid - Listar productos de un carrito por ID
router.get('/:cid', (req, res) => {
    const { cid } = req.params;
    const carts = readCarts();
    const cart = carts.find(c => c.id == cid);

    if (cart) {
        res.json(cart.products);
    } else {
        res.status(404).json({ error: 'Carrito no encontrado' });
    }
});

// Ruta POST /api/carts/:cid/product/:pid - Agregar un producto al carrito
router.post('/:cid/product/:pid', (req, res) => {
    const { cid, pid } = req.params;
    const { quantity = 1 } = req.body;

    const carts = readCarts();
    const cartIndex = carts.findIndex(c => c.id == cid);

    if (cartIndex === -1) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    const productInCartIndex = carts[cartIndex].products.findIndex(p => p.product == pid);

    if (productInCartIndex !== -1) {
        // Si el producto ya existe en el carrito, incrementa la cantidad
        carts[cartIndex].products[productInCartIndex].quantity += quantity;
    } else {
        // Si el producto no existe, agrégalo al carrito
        carts[cartIndex].products.push({ product: parseInt(pid), quantity });
    }

    writeCarts(carts);
    res.json(carts[cartIndex].products);
});

module.exports = router;
