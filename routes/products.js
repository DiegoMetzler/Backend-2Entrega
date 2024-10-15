const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products
router.get('/', async (req, res) => {
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

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: sortOption,
            lean: true
        };


        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / options.limit);
        const hasPrevPage = options.page > 1;
        const hasNextPage = options.page < totalPages;
        const prevPage = hasPrevPage ? options.page - 1 : null;
        const nextPage = hasNextPage ? options.page + 1 : null;
        const products = await Product.find(filter)
            .sort(sortOption)
            .skip((options.page - 1) * options.limit)
            .limit(options.limit)
            .lean();

        const response = {
            status: 'success',
            payload: products,
            totalPages,
            prevPage,
            nextPage,
            page: options.page,
            hasPrevPage,
            hasNextPage,
            prevLink: hasPrevPage ? `/api/products?limit=${options.limit}&page=${prevPage}${sort ? `&sort=${sort}` : ''}${query ? `&query=${query}` : ''}` : null,
            nextLink: hasNextPage ? `/api/products?limit=${options.limit}&page=${nextPage}${sort ? `&sort=${sort}` : ''}${query ? `&query=${query}` : ''}` : null
        };

        res.json(response);
    } catch (error) {
        console.error('Error en GET /api/products:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

// GET /api/products/:pid
router.get('/:pid', async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid).lean();
        if (!product) {
            return res.status(404).json({ status: 'error', payload: null, message: 'Producto no encontrado' });
        }
        res.json({ status: 'success', payload: product });
    } catch (error) {
        console.error('Error en GET /api/products/:pid:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

// POST /api/products
router.post('/', async (req, res) => {
    try {
        const { title, description, code, price, stock, category, thumbnails } = req.body;
      
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: 'error', payload: null, message: 'Faltan campos requeridos' });
        }

        const existingProduct = await Product.findOne({ code });
        if (existingProduct) {
            return res.status(400).json({ status: 'error', payload: null, message: 'El código del producto ya existe' });
        }

        const newProduct = new Product({
            title,
            description,
            code,
            price,
            stock,
            category,
            thumbnails: thumbnails || []
        });

        await newProduct.save();

        
        if (req.io) {
            req.io.emit('productAdded', newProduct);
        }

        res.status(201).json({ status: 'success', payload: newProduct });
    } catch (error) {
        console.error('Error en POST /api/products:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

// PUT /api/products/:pid
router.put('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const updateData = req.body;

        delete updateData.id;

        const updatedProduct = await Product.findByIdAndUpdate(pid, updateData, { new: true, runValidators: true }).lean();

        if (!updatedProduct) {
            return res.status(404).json({ status: 'error', payload: null, message: 'Producto no encontrado' });
        }

        if (req.io) {
            req.io.emit('productUpdated', updatedProduct);
        }

        res.json({ status: 'success', payload: updatedProduct });
    } catch (error) {
        console.error('Error en PUT /api/products/:pid:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

// DELETE /api/products/:pid
router.delete('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(pid).lean();

        if (!deletedProduct) {
            return res.status(404).json({ status: 'error', payload: null, message: 'Producto no encontrado' });
        }

        if (req.io) {
            req.io.emit('productDeleted', { id: pid });
        }

        res.json({ status: 'success', payload: deletedProduct });
    } catch (error) {
        console.error('Error en DELETE /api/products/:pid:', error);
        res.status(500).json({ status: 'error', payload: null, message: 'Error interno del servidor' });
    }
});

module.exports = router;
