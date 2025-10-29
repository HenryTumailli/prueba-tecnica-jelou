-- Habilita el modo estricto de SQL para mayor integridad de datos.
SET @@SESSION.sql_mode = 'TRADITIONAL,NO_AUTO_VALUE_ON_ZERO,ONLY_FULL_GROUP_BY';

-- Tabla de Clientes (Customers)
-- Almacena la información de los clientes B2B.
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE, -- El email debe ser único para cada cliente.
  `phone` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL -- Para soft-delete opcional.
) ENGINE=InnoDB;

-- Tabla de Productos (Products)
-- Almacena el catálogo de productos con su stock.
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sku` VARCHAR(100) NOT NULL UNIQUE, -- SKU (Stock Keeping Unit) debe ser único.
  `name` VARCHAR(255) NOT NULL,
  `price_cents` INT NOT NULL, -- Precio en centavos para evitar problemas con decimales.
  `stock` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL
) ENGINE=InnoDB;

-- Tabla de Órdenes (Orders)
-- Contiene la información principal de cada pedido.
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `status` ENUM('CREATED', 'CONFIRMED', 'CANCELED') NOT NULL DEFAULT 'CREATED', -- Estados posibles de una orden.
  `total_cents` INT NOT NULL DEFAULT 0, -- Total del pedido en centavos.
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` TIMESTAMP NULL,
  `canceled_at` TIMESTAMP NULL,
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de Items de la Orden (Order Items)
-- Tabla pivote que detalla los productos y cantidades de cada orden.
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `qty` INT NOT NULL,
  `unit_price_cents` INT NOT NULL, -- Precio del producto al momento de la compra.
  `subtotal_cents` INT NOT NULL, -- Subtotal (qty * unit_price_cents).
  CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabla de Claves de Idempotencia (Idempotency Keys)
-- Almacena las claves para garantizar que operaciones críticas (como confirmar un pedido) no se ejecuten dos veces.
CREATE TABLE IF NOT EXISTS `idempotency_keys` (
  `key_value` VARCHAR(255) PRIMARY KEY, -- La clave de idempotencia, ej: 'abc-123'.
  `target_type` VARCHAR(50) NOT NULL, -- El tipo de recurso, ej: 'order_confirmation'.
  `target_id` VARCHAR(255) NOT NULL, -- El ID del recurso, ej: el ID de la orden.
  `status_code` INT, -- Código de estado HTTP de la respuesta original (200, 201, etc.).
  `response_body` JSON, -- El cuerpo de la respuesta original guardado como JSON.
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 1 DAY)
) ENGINE=InnoDB;