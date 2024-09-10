const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const cartFilePath = path.join(__dirname, '../carrito.json');


const readCarts = () => {
    try {
        if (fs.existsSync(cartFilePath)) {
            const data = fs.readFileSync(cartFilePath, 'utf-8');
            return data ? JSON.parse(data) : [];
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error leyendo carritos:", error);
        return [];
    }
};


const writeCarts = (data) => {
    try {
        fs.writeFileSync(cartFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error escribiendo carritos:", error);
    }
};


router.post('/', (req, res) => {
    const carts = readCarts();
    const newCart = {
        id: carts.length ? Math.max(carts.map(c => c.id)) + 1 : 1,
        products: []
    };

    carts.push(newCart);
    writeCarts(carts);
    res.status(201).json(newCart);
});


router.get('/:cid', (req, res) => {
    const { cid } = req.params;
    const carts = readCarts();
    const cart = carts.find(c => c.id == cid);

    if (cart) {
        res.json(cart.products);
    } else {
        res.status(404).json({ error: 'Cart not found' });
    }
});


router.post('/:cid/product/:pid', (req, res) => {
    const { cid, pid } = req.params;
    const { quantity = 1 } = req.body;
    const carts = readCarts();
    const cart = carts.find(c => c.id == cid);

    if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
    }

    let productInCart = cart.products.find(p => p.product == pid);

    if (productInCart) {
        productInCart.quantity += quantity;
    } else {
        cart.products.push({ product: parseInt(pid), quantity });
    }

    writeCarts(carts);
    res.json(cart);
});

module.exports = router;
