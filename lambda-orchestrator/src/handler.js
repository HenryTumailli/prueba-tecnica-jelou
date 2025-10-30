// Cargar variables de entorno desde .env
require('dotenv').config();

const axios = require('axios');

// Configuración de APIs con variables del .env
const customersApi = axios.create({
  baseURL: process.env.CUSTOMERS_API_BASE,
  headers: { 'Authorization': `Bearer ${process.env.SERVICE_TOKEN}` }
});

const ordersApi = axios.create({
  baseURL: process.env.ORDERS_API_BASE
});

module.exports.createAndConfirmOrder = async (event) => {
  try {
    console.log('CUSTOMERS_API_BASE:', process.env.CUSTOMERS_API_BASE);
    console.log('CUSTOMERS_API_BASE:', process.env.CUSTOMERS_API_BASE);
    console.log('ORDERS_API_BASE:', process.env.ORDERS_API_BASE);
    console.log('SERVICE_TOKEN:', process.env.SERVICE_TOKEN ? 'loaded' : 'missing');
    console.log('Event body:', event.body);

    const { customer_id, items, idempotency_key, correlation_id } = JSON.parse(event.body);

    if (!customer_id || !items || !idempotency_key) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'customer_id, items, and idempotency_key are required.' }) 
      };
    }

    // --- Orquestación ---
    const customer = (await customersApi.get(`/internal/customers/${customer_id}`)).data;

    const createOrderResponse = await ordersApi.post('/orders', {
      customer_id,
      items
    });
    const { orderId } = createOrderResponse.data;

    await ordersApi.post(`/orders/${orderId}/confirm`, {}, {
      headers: { 'X-Idempotency-Key': idempotency_key }
    });

    const confirmedOrder = (await ordersApi.get(`/orders/${orderId}`)).data;

    const responsePayload = {
      success: true,
      correlationId: correlation_id || null,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        order: {
          id: confirmedOrder.id,
          status: confirmedOrder.status,
          total_cents: confirmedOrder.total_cents,
          items: confirmedOrder.items.map(item => ({
            product_id: item.product_id,
            qty: item.qty,
            unit_price_cents: item.unit_price_cents,
            subtotal_cents: item.subtotal_cents,
          })),
        }
      }
    };

    return {
      statusCode: 201,
      body: JSON.stringify(responsePayload)
    };

  } catch (error) {
    const statusCode = error.response ? error.response.status : 500;
    const message = error.response ? error.response.data.error : 'Internal Server Error';
    return {
      statusCode,
      body: JSON.stringify({ success: false, error: message })
    };
  }
};
