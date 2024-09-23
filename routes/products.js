const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const productFilePath = path.join(__dirname, '../data/productos.json');

// Función para leer productos
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

// Función para escribir productos
const writeProducts = (data) => {
    try {
        fs.writeFileSync(productFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error escribiendo productos:", error);
    }
};

// Ruta GET - Listar todos los productos
router.get('/', (req, res) => {
    const products = readProducts();
    res.json(products);
});

// Ruta GET - Obtener un producto por ID
router.get('/:pid', (req, res) => {
    const { pid } = req.params;
    const products = readProducts();
    const product = products.find(p => p.id == pid);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Producto no encontrado' });
    }
});

// Ruta POST - Agregar un nuevo producto
router.post('/', (req, res) => {
    const { title, description, code, price, status = true, stock, category, thumbnails } = req.body;

    if (!title || !description || !code || price === undefined || stock === undefined || !category) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const products = readProducts();
    const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;

    const newProduct = {
        id: newId,
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

    if (req.io) {
        req.io.emit('productAdded', newProduct);
    }

    res.status(201).json(newProduct);
});

// Ruta PUT - Actualizar un producto por ID
router.put('/:pid', (req, res) => {
    const { pid } = req.params;
    const { title, description, code, price, status, stock, category, thumbnails } = req.body;

    const products = readProducts();
    const productIndex = products.findIndex(p => p.id == pid);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // No se permite actualizar el ID
    const updatedProduct = {
        ...products[productIndex],
        title: title !== undefined ? title : products[productIndex].title,
        description: description !== undefined ? description : products[productIndex].description,
        code: code !== undefined ? code : products[productIndex].code,
        price: price !== undefined ? price : products[productIndex].price,
        status: status !== undefined ? status : products[productIndex].status,
        stock: stock !== undefined ? stock : products[productIndex].stock,
        category: category !== undefined ? category : products[productIndex].category,
        thumbnails: thumbnails !== undefined ? thumbnails : products[productIndex].thumbnails
    };

    products[productIndex] = updatedProduct;
    writeProducts(products);
    res.json(updatedProduct);
});

// Ruta DELETE - Eliminar un producto por ID
router.delete('/:pid', (req, res) => {
    const { pid } = req.params;
    let products = readProducts();
    const product = products.find(p => p.id == pid);
    if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }
    products = products.filter(p => p.id != pid);
    writeProducts(products);

    if (req.io) {
        req.io.emit('productDeleted', pid);
    }

    res.status(204).end();
});

module.exports = router;
