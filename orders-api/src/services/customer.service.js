const axios = require('axios');
require('dotenv').config();

const customersApi = axios.create({
  baseURL: process.env.CUSTOMERS_API_BASE,
  headers: {
    'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`
  }
});

/**
 * Valida si un cliente existe llamando a la Customers API.
 * @param {number} customerId - El ID del cliente a validar.
 * @returns {Promise<object|null>} - El objeto del cliente si existe, o null si no.
 */
exports.validateCustomer = async (customerId) => {
  try {
    const response = await customersApi.get(`/internal/customers/${customerId}`);
    return response.data; // Devuelve los datos del cliente
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // El cliente no existe
    }
    // Lanza otros errores (ej. 500, 403)
    throw new Error('Error validating customer with Customers API');
  }
};