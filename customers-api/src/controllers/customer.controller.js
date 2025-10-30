const db = require('../db/mysql');

exports.createCustomer = async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );
    res.status(201).json({ id: result.insertId, name, email, phone });
  } catch (error) {
    // Maneja el error de email duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    //Verificar si existe el usuario
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getCustomers = async (req, res) => {
  // Extraer parámetros de la query con valores por defecto
  const { search, cursor, limit = 10 } = req.query;

  try {
    let query = 'SELECT id, name, email, phone FROM customers WHERE deleted_at IS NULL';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (cursor) {
      query += ' AND id > ?';
      params.push(cursor);
    }

    query += ' ORDER BY id ASC LIMIT ?';
    params.push(parseInt(limit, 10) + 1); // Pedimos uno más para saber si hay página siguiente

    const [rows] = await db.query(query, params);

    let nextCursor = null;
    // Si obtenemos más resultados de los pedidos, hay una página siguiente
    if (rows.length > limit) {
      nextCursor = rows.pop().id; // El último elemento es el cursor de la siguiente página
    }
    
    res.status(200).json({
      data: rows,
      next_cursor: nextCursor
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  // Construir la consulta dinámicamente
  const updateFields = [];
  const params = [];

  if (name !== undefined) {
    updateFields.push('name = ?');
    params.push(name);
  }
  if (email !== undefined) {
    updateFields.push('email = ?');
    params.push(email);
  }
  if (phone !== undefined) {
    updateFields.push('phone = ?');
    params.push(phone);
  }

  // Si no se proporcionaron campos para actualizar
  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update provided' });
  }

  // Añadir el ID del cliente a los parámetros para el WHERE
  params.push(id);

  const query = `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;

  try {
    const [result] = await db.query(query, params);

    // Verificar si el cliente existía
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found or no changes made' });
    }

    // Devolver el cliente actualizado
    const [updatedRows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    res.status(200).json(updatedRows[0]);

  } catch (error) {
    // Manejar el error de email duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE customers SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};