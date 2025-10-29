const db = require('../db/mysql');

// POST /products -> Crea un nuevo producto
exports.createProduct = async (req, res) => {
  const { sku, name, price_cents, stock } = req.body;
  if (!sku || !name || price_cents === undefined || stock === undefined) {
    return res.status(400).json({ error: 'SKU, name, price_cents, and stock are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO products (sku, name, price_cents, stock) VALUES (?, ?, ?, ?)',
      [sku, name, price_cents, stock]
    );
    res.status(201).json({ id: result.insertId, sku, name, price_cents, stock });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
};

// GET /products/:id -> Obtiene un producto por ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

// PATCH /products/:id -> Actualiza precio o stock
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { price_cents, stock } = req.body;

  const fields = [];
  const params = [];

  if (price_cents !== undefined) {
    fields.push('price_cents = ?');
    params.push(price_cents);
  }
  if (stock !== undefined) {
    fields.push('stock = ?');
    params.push(stock);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update provided' });
  }

  params.push(id);
  const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;

  try {
    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};