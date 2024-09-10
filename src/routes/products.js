const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const productFilePath = path.join(__dirname, '../productos.json');


const readProducts = () => {
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


const writeProducts = (data) => {
    try {
        fs.writeFileSync(productFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error escribiendo productos:", error);
    }
};


router.get('/', (req, res) => {
    const products = readProducts();
    res.json(products);
});


router.get('/:pid', (req, res) => {
    const { pid } = req.params;
    const products = readProducts();
    const product = products.find(p => p.id == pid);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});


router.post('/', (req, res) => {
    const { title, description, code, price, status = true, stock, category, thumbnails } = req.body;
    if (!title || !description || !code || !price || stock === undefined || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const products = readProducts();
    const newProduct = {
        id: products.length ? Math.max(products.map(p => p.id)) + 1 : 1,
        title,
        description,
        code,
        price,
        status,
        stock,
        category,
        thumbnails: thumbnails || []
    };

    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
});


router.put('/:pid', (req, res) => {
    const { pid } = req.params;
    const { title, description, code, price, status, stock, category, thumbnails } = req.body;
    const products = readProducts();
    const index = products.findIndex(p => p.id == pid);

    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = { ...products[index], title, description, code, price, status, stock, category, thumbnails };
    products[index] = updatedProduct;
    writeProducts(products);
    res.json(updatedProduct);
});


router.delete('/:pid', (req, res) => {
    const { pid } = req.params;
    let products = readProducts();
    products = products.filter(p => p.id != pid);
    writeProducts(products);
    res.status(204).end();
});

module.exports = router;
