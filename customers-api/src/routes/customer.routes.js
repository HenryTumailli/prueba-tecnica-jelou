const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas públicas
router.get('/customers', customerController.getCustomers);
router.post('/customers', customerController.createCustomer);
router.get('/customers/:id', customerController.getCustomerById);
router.put('/customers/:id', customerController.updateCustomer);
router.delete('/customers/:id', customerController.deleteCustomer);

// Ruta interna protegida por token
router.get(
  '/internal/customers/:id',
  authMiddleware.verifyServiceToken,
  customerController.getCustomerById
);

module.exports = router;