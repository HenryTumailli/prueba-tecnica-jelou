const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.get('/products', productController.getProducts);
router.post('/products', productController.createProduct);
router.get('/products/:id', productController.getProductById);
router.patch('/products/:id', productController.updateProduct);

module.exports = router;