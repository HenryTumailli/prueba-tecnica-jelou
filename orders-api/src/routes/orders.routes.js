const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');

router.get('/orders', ordersController.getOrders);

router.post('/orders', ordersController.createOrder);

// Obtener detalle de orden
router.get('/orders/:id', ordersController.getOrderById);

// Confirmar orden (idempotente)
router.post('/orders/:id/confirm', ordersController.confirmOrder);

// Cancelar orden
router.post('/orders/:id/cancel', ordersController.cancelOrder);

module.exports = router;