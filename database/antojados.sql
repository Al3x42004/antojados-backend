-- =====================================================
-- Base de datos del proyecto Antojados
-- Evidencia GA7-220501096-AA5-EV03
-- =====================================================

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS antojados_db;
CREATE DATABASE antojados_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE antojados_db;

-- Usuarios del sistema: estudiantes que hacen pedidos y el administrador que los prepara
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('estudiante', 'admin') NOT NULL DEFAULT 'estudiante',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Productos que se venden
CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  categoria ENUM('pancerotti', 'gelatina', 'arepa', 'jugo') NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Encabezado del pedido
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado ENUM('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  observaciones VARCHAR(255),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Productos incluidos en cada pedido
CREATE TABLE detalle_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Administrador inicial (contraseña: Admin123)
INSERT INTO usuarios (nombre, correo, password, rol) VALUES
('Administrador Antojados', 'admin@antojados.com', '$2a$10$S220jOtqlMux.w6D3U47WubYCliOwwHRcwlFipYSqHxNbB0sLRhrW', 'admin');

-- Productos iniciales
INSERT INTO productos (nombre, descripcion, categoria, precio) VALUES
('Pancerotti de queso y jamón', 'Relleno de queso y jamón artesanal', 'pancerotti', 3500),
('Pancerotti hawaiano', 'Queso, jamón y piña', 'pancerotti', 4000),
('Gelatina de fresa', 'Gelatina en vaso con crema', 'gelatina', 1500),
('Gelatina mosaico', 'Gelatina de varios sabores tropicales', 'gelatina', 2000),
('Arepa de queso', 'Arepa asada rellena de queso', 'arepa', 3000),
('Arepa con pollo', 'Arepa rellena de pollo desmechado y queso', 'arepa', 4500),
('Jugo de mora', 'Natural en agua o en leche', 'jugo', 2500),
('Jugo de lulo', 'Natural en agua o en leche', 'jugo', 2500);
