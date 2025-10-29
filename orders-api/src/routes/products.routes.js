const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');


router.post('/products', productController.createProduct);
router.get('/products/:id', productController.getProductById);
router.patch('/products/:id', productController.updateProduct);
// Falta GET /products con búsqueda, pero con esto ya puedes empezar.

module.exports = router;