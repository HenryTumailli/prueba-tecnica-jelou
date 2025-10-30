const db = require('../db/mysql');
const { validateCustomer } = require('../services/customer.service');

exports.createOrder = async (req, res) => {
  const { customer_id, items } = req.body;

  // Verifica si se envio el customer_id y si existen items
  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customer_id and a non-empty items array are required.' });
  }

  //Validar que el cliente exista
  const customer = await validateCustomer(customer_id);
  if (!customer) {
    return res.status(404).json({ error: `Customer with id ${customer_id} not found.` });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let total_cents = 0;
    const orderItemsData = [];

    //Procesar cada item: verificar stock y calcular totales
    for (const item of items) {
      // Bloquea la fila del producto para evitar race conditions
      const [products] = await connection.query(
        'SELECT * FROM products WHERE id = ? FOR UPDATE', 
        [item.product_id]
      );
      
      const product = products[0];
      if (!product) {
        throw new Error(`Product with id ${item.product_id} not found.`);
      }
      if (product.stock < item.qty) {
        throw new Error(`Not enough stock for product ${product.name}. Available: ${product.stock}, requested: ${item.qty}.`);
      }

      const subtotal_cents = product.price_cents * item.qty;
      total_cents += subtotal_cents;
      
      orderItemsData.push({
        ...item,
        unit_price_cents: product.price_cents,
        subtotal_cents
      });
    }

    // Crear la orden en la tabla `orders`
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, total_cents, status) VALUES (?, ?, ?)',
      [customer_id, total_cents, 'CREATED']
    );
    const orderId = orderResult.insertId;

    // Insertar los items y descontar el stock
    for (const itemData of orderItemsData) {
      // Insertar item en `order_items`
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, qty, unit_price_cents, subtotal_cents) VALUES (?, ?, ?, ?, ?)',
        [orderId, itemData.product_id, itemData.qty, itemData.unit_price_cents, itemData.subtotal_cents]
      );
      // Descontar stock del producto
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [itemData.qty, itemData.product_id]
      );
    }

    // Si todo fue bien, confirmar la transacción
    await connection.commit();

    res.status(201).json({
      message: 'Order created successfully!',
      orderId: orderId,
      total_cents: total_cents
    });

  } catch (error) {
    // Si algo falló, revertir todos los cambios
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    // Liberar la conexión a la base de datos
    connection.release();
  }
};

exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    
    const orderDetails = {
      ...orders[0],
      items: items
    };

    res.status(200).json(orderDetails);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

exports.confirmOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const idempotencyKey = req.headers['x-idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'X-Idempotency-Key header is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar si la clave de idempotencia ya fue procesada
    const [existingKey] = await connection.query(
      'SELECT * FROM idempotency_keys WHERE key_value = ?',
      [idempotencyKey]
    );

    if (existingKey.length > 0) {
      return res.status(existingKey[0].status_code).json(existingKey[0].response_body);
    }

    // Obtener la orden
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? FOR UPDATE',
      [orderId]
    );
    if (orders.length === 0) {
      throw new Error('Order not found');
    }
    const order = orders[0];

    // Solo se pueden confirmar órdenes en estado CREATED
    if (order.status !== 'CREATED') {
      throw new Error(`Order is already in ${order.status} state.`);
    }

    // Actualizar el estado de la orden
    await connection.query(
      "UPDATE orders SET status = 'CONFIRMED', confirmed_at = NOW() WHERE id = ?",
      [orderId]
    );

    const responseBody = { message: 'Order confirmed successfully', orderId, status: 'CONFIRMED' };
    const statusCode = 200;

    // Guardar la clave de idempotencia y la respuesta
    await connection.query(
      'INSERT INTO idempotency_keys (key_value, target_type, target_id, status_code, response_body, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [idempotencyKey, 'order_confirmation', orderId, statusCode, JSON.stringify(responseBody), new Date(Date.now() + 24 * 60 * 60 * 1000)] // Expira en 24h
    );

    await connection.commit();
    res.status(statusCode).json(responseBody);

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.cancelOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
        'SELECT * FROM orders WHERE id = ? FOR UPDATE', 
        [orderId]
    );
    if (orders.length === 0) {
      throw new Error('Order not found');
    }
    const order = orders[0];

    // Lógica de cancelación
    if (order.status === 'CREATED') {
        // Restaurar stock
        const [items] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of items) {
            await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.product_id]);
        }
    } else if (order.status === 'CONFIRMED') {
        // Solo se puede cancelar dentro de los 10 minutos de confirmada
        const confirmedAt = new Date(order.confirmed_at);
        const now = new Date();
        if ((now - confirmedAt) > 10 * 60 * 1000) { 
            throw new Error('Cannot cancel a confirmed order after 10 minutes.');
        }
    } else {
        throw new Error(`Order is already in ${order.status} state.`);
    }

    // Actualizar estado de la orden
    await connection.query(
      "UPDATE orders SET status = 'CANCELED', canceled_at = NOW() WHERE id = ?",
      [orderId]
    );

    await connection.commit();
    res.status(200).json({ message: 'Order canceled successfully', orderId });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.getOrders = async (req, res) => {
  // Extraer parámetros de la query con valores por defecto
  const { status, from, to, cursor, limit = 10 } = req.query;

  try {
    let query = 'SELECT * FROM orders';
    const conditions = [];
    const params = [];

    // Añadir filtros a la consulta
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (from) {
      conditions.push('created_at >= ?');
      params.push(from); // Formato esperado: 'YYYY-MM-DD'
    }
    if (to) {
      conditions.push('created_at <= ?');
      params.push(`${to} 23:59:59`); // Incluir todo el día 'to'
    }

    // Paginación por cursor
    if (cursor) {
      conditions.push('id > ?');
      params.push(cursor);
    }
    
    // Unir todas las condiciones
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Ordenar y limitar
    query += ' ORDER BY id ASC LIMIT ?';
    params.push(parseInt(limit, 10) + 1); // Pedir uno extra para saber si hay página siguiente

    const [rows] = await db.query(query, params);

    let nextCursor = null;
    // Si obtenemos más resultados de los pedidos, hay una página siguiente
    if (rows.length > limit) {
      nextCursor = rows.pop().id; // El último elemento se convierte en el cursor
    }

    res.status(200).json({
      data: rows,
      next_cursor: nextCursor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
};