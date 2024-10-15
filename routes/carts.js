const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// POST
router.post('/', async (req, res) => {
    try {
        const newCart = new Cart({ products: [] });
        await newCart.save();
        res.status(201).json({ status: 'success', payload: newCart });
    } catch (error) {
        console.error('Error en POST /api/carts:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

// GET
router.get('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid).populate('products.product').lean();

        if (!cart) {
            return res.status(404).json({ status: 'error', payload: null, message: 'Carrito no encontrado' });
        }

        res.json({ status: 'success', payload: cart });
    } catch (error) {
        console.error('Error en GET /api/carts/:cid:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

// DELETE
router.delete('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid);

        if (!cart) {
            return res.status(404).json({ status: 'error', payload: null, message: 'Carrito no encontrado' });
        }

        cart.products = [];
        await cart.save();

        
        if (req.io) {
            req.io.emit('cartEmptied', { cartId: cid });
        }

        res.json({ status: 'success', payload: `Carrito ${cid} vaciado exitosamente` });
    } catch (error) {
        console.error('Error en DELETE /api/carts/:cid:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

// DELETE
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const cart = await Cart.findById(cid);

        if (!cart) {
            return res.status(404).json({ status: 'error', payload: null, message: 'Carrito no encontrado' });
        }

        const productIndex = cart.products.findIndex(p => p.product.toString() === pid);

        if (productIndex === -1) {
            return res.status(404).json({ status: 'error', payload: null, message: 'Producto no encontrado en el carrito' });
        }

        cart.products.splice(productIndex, 1);
        await cart.save();

        
        if (req.io) {
            req.io.emit('productRemovedFromCart', { cartId: cid, productId: pid });
        }

        res.json({ status: 'success', payload: `Producto ${pid} eliminado del carrito ${cid}` });
    } catch (error) {
        console.error('Error en DELETE /api/carts/:cid/products/:pid:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

// PUT /api/carts/:cid
router.put('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const { products } = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({ status: 'error', payload: null, message: 'Se espera un array de productos' });
        }

        
        for (let item of products) {
            const productExists = await Product.findById(item.product);
            if (!productExists) {
                return res.status(400).json({ status: 'error', payload: null, message: `Producto con ID ${item.product} no existe` });
            }
            if (item.quantity < 1) {
                return res.status(400).json({ status: 'error', payload: null, message: 'La cantidad debe ser al menos 1' });
            }
        }

        const cart = await Cart.findById(cid);

        if (!cart) {
            return res.status(404).json({ status: 'error', payload: null, message: 'Carrito no encontrado' });
        }

        cart.products = products;
        await cart.save();

        
        if (req.io) {
            req.io.emit('cartUpdated', { cartId: cid, products });
        }

        res.json({ status: 'success', payload: cart });
    } catch (error) {
        console.error('Error en PUT /api/carts/:cid:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

// PUT /api/carts/:cid/products/:pid
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ status: 'error', payload: null, message: 'La cantidad debe ser al menos 1' });
        }

        const cart = await Cart.findById(cid);

        if (!cart) {
            return res.status(404).json({ status: 'error', payload: null, message: 'Carrito no encontrado' });
        }

        const productItem = cart.products.find(p => p.product.toString() === pid);

        if (!productItem) {
            return res.status(404).json({ status: 'error', payload: null, message: 'Producto no encontrado en el carrito' });
        }

        productItem.quantity = quantity;
        await cart.save();

        
        if (req.io) {
            req.io.emit('productQuantityUpdated', { cartId: cid, productId: pid, quantity });
        }

        res.json({ status: 'success', payload: productItem });
    } catch (error) {
        console.error('Error en PUT /api/carts/:cid/products/:pid:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

// Ruta para agregar un producto al carrito
router.post('/add-to-cart/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const { quantity = 1 } = req.body;

        const product = await Product.findById(pid);
        if (!product) {
            return res.status(404).render('error', { message: 'Producto no encontrado' });
        }
        
        const cartId = '603d2f8f9b1e8e3a8c4f1234';

        const cart = await Cart.findById(cartId);

        if (!cart) {
            return res.status(404).render('error', { message: 'Carrito no encontrado' });
        }

        const existingProductIndex = cart.products.findIndex(p => p.product.toString() === pid);

        if (existingProductIndex !== -1) {
            cart.products[existingProductIndex].quantity += parseInt(quantity);
        } else {
            cart.products.push({ product: pid, quantity: parseInt(quantity) });
        }

        await cart.save();

        
        if (req.io) {
            req.io.emit('cartUpdated', { cartId: cartId, products: cart.products });
        }

        res.redirect(`/carts/${cartId}`);
    } catch (error) {
        console.error('Error en POST /api/carts/add-to-cart/:pid:', error);
        res.status(500).render('error', { message: 'Error interno del servidor' });
    }
});

module.exports = router;
