-- Insertar Clientes
INSERT INTO `customers` (`name`, `email`, `phone`) VALUES
('ACME Corporation', 'contact@acme.com', '555-0101'),
('Stark Industries', 'tony@starkindustries.com', '555-0102'),
('Wayne Enterprises', 'bruce@wayne-enterprises.com', '555-0103');

-- Insertar Productos
INSERT INTO `products` (`sku`, `name`, `price_cents`, `stock`) VALUES
('PROD-001', 'Quantum Computer', 999900, 10),
('PROD-002', 'Flux Capacitor', 129900, 5),
('PROD-003', 'Adamantium Shield', 450000, 3),
('PROD-004', 'Lightsaber', 750000, 15);

-- Insertar una Orden de ejemplo (CREATED)
-- Se crea una orden para el cliente 1 (ACME) con dos productos.
INSERT INTO `orders` (`customer_id`, `status`, `total_cents`) VALUES
(1, 'CREATED', 809700);

-- Capturar el ID de la última orden insertada.
SET @last_order_id = LAST_INSERT_ID();

-- Insertar los items de esa orden
INSERT INTO `order_items` (`order_id`, `product_id`, `qty`, `unit_price_cents`, `subtotal_cents`) VALUES
(@last_order_id, 2, 2, 129900, 259800), -- 2 Flux Capacitors
(@last_order_id, 3, 1, 450000, 450000); -- 1 Adamantium Shield