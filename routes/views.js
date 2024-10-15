const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// GET /products
router.get('/products', async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;

        const filter = {};
        if (query) {
            filter.title = { $regex: query, $options: 'i' };
        }

        let sortOption = {};
        if (sort === 'asc') {
            sortOption.price = 1;
        } else if (sort === 'desc') {
            sortOption.price = -1;
        }

        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);
        const hasPrevPage = page > 1;
        const hasNextPage = page < totalPages;
        const prevPage = hasPrevPage ? parseInt(page) - 1 : null;
        const nextPage = hasNextPage ? parseInt(page) + 1 : null;

        const products = await Product.find(filter)
            .sort(sortOption)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();

        res.render('index', {
            products,
            pagination: {
                totalPages,
                currentPage: parseInt(page),
                hasPrevPage,
                hasNextPage,
                prevPage,
                nextPage,
                prevLink: hasPrevPage ? `/products?limit=${limit}&page=${prevPage}${sort ? `&sort=${sort}` : ''}${query ? `&query=${query}` : ''}` : null,
                nextLink: hasNextPage ? `/products?limit=${limit}&page=${nextPage}${sort ? `&sort=${sort}` : ''}${query ? `&query=${query}` : ''}` : null
            }
        });
    } catch (error) {
        console.error('Error en GET /products:', error);
        res.status(500).render('error', { message: 'Error interno del servidor' });
    }
});

// GET /products/:pid
router.get('/products/:pid', async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid).lean();

        if (!product) {
            return res.status(404).render('error', { message: 'Producto no encontrado' });
        }

        res.render('product', { product });
    } catch (error) {
        console.error('Error en GET /products/:pid:', error);
        res.status(500).render('error', { message: 'Error interno del servidor' });
    }
});

// GET /carts/:cid
router.get('/carts/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid).populate('products.product').lean();

        if (!cart) {
            return res.status(404).render('error', { message: 'Carrito no encontrado' });
        }

        res.render('cart', {
            cartId: cart._id,
            products: cart.products.map(item => ({
                id: item.product._id,
                title: item.product.title,
                description: item.product.description,
                price: item.product.price,
                category: item.product.category,
                thumbnails: item.product.thumbnails,
                quantity: item.quantity,
                total: (item.product.price * item.quantity).toFixed(2)
            }))
        });
    } catch (error) {
        console.error('Error en GET /carts/:cid:', error);
        res.status(500).render('error', { message: 'Error interno del servidor' });
    }
});

// Ruta raíz redirige a /products
router.get('/', (req, res) => {
    res.redirect('/products');
});

module.exports = router;
