const mongoose = require('mongoose');
const fs = require('fs').promises;
const Product = require('../models/Product');

const mongoURI = 'mongodb://localhost:27017/mi_tienda';

const migrateProducts = async () => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conectado a MongoDB');

        const data = await fs.readFile('./data/productos.json', 'utf-8');
        const products = JSON.parse(data);

        await Product.deleteMany({});
        console.log('Colección de productos vaciada');

        const insertedProducts = await Product.insertMany(products);
        console.log(`${insertedProducts.length} productos migrados exitosamente`);

        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración de productos:', error);
        process.exit(1);
    }
};

migrateProducts();
