require('dotenv').config();

const SERVICE_TOKEN = process.env.SERVICE_TOKEN;

exports.verifyServiceToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  const token = authHeader.split(' ')[1]; // Formato: Bearer <token>
  if (!token || token !== SERVICE_TOKEN) {
    return res.status(403).json({ error: 'Forbidden: Invalid service token' });
  }

  next(); // Token válido, continuar con la solicitud
};