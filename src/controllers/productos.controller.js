const pool = require('../config/db');

const CATEGORIAS = ['pancerotti', 'gelatina', 'arepa', 'jugo'];

// GET /api/productos
// Lista los productos disponibles. Se puede filtrar: /api/productos?categoria=arepa
async function listar(req, res) {
  try {
    const { categoria } = req.query;
    let sql = 'SELECT * FROM productos WHERE disponible = TRUE';
    const params = [];

    if (categoria) {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }
    sql += ' ORDER BY categoria, nombre';

    const [productos] = await pool.query(sql, params);
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar los productos' });
  }
}

// GET /api/productos/:id
async function obtener(req, res) {
  try {
    const [filas] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json(filas[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar el producto' });
  }
}

// POST /api/productos (solo admin)
async function crear(req, res) {
  try {
    const { nombre, descripcion, categoria, precio } = req.body;

    if (!nombre || !categoria || precio === undefined) {
      return res.status(400).json({ mensaje: 'Nombre, categoría y precio son obligatorios' });
    }
    if (!CATEGORIAS.includes(categoria)) {
      return res.status(400).json({ mensaje: `Categoría no válida. Use: ${CATEGORIAS.join(', ')}` });
    }
    if (isNaN(precio) || Number(precio) <= 0) {
      return res.status(400).json({ mensaje: 'El precio debe ser un número mayor a 0' });
    }

    const [resultado] = await pool.query(
      'INSERT INTO productos (nombre, descripcion, categoria, precio) VALUES (?, ?, ?, ?)',
      [nombre, descripcion || null, categoria, precio]
    );

    res.status(201).json({ mensaje: 'Producto creado', id: resultado.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear el producto' });
  }
}

// PUT /api/productos/:id (solo admin)
async function actualizar(req, res) {
  try {
    const { nombre, descripcion, categoria, precio, disponible } = req.body;

    const [filas] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    if (categoria && !CATEGORIAS.includes(categoria)) {
      return res.status(400).json({ mensaje: `Categoría no válida. Use: ${CATEGORIAS.join(', ')}` });
    }
    if (precio !== undefined && (isNaN(precio) || Number(precio) <= 0)) {
      return res.status(400).json({ mensaje: 'El precio debe ser un número mayor a 0' });
    }

    // Si un campo no llega en el body, se conserva el valor actual
    const actual = filas[0];
    await pool.query(
      'UPDATE productos SET nombre = ?, descripcion = ?, categoria = ?, precio = ?, disponible = ? WHERE id = ?',
      [
        nombre ?? actual.nombre,
        descripcion ?? actual.descripcion,
        categoria ?? actual.categoria,
        precio ?? actual.precio,
        disponible ?? actual.disponible,
        req.params.id,
      ]
    );

    res.json({ mensaje: 'Producto actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el producto' });
  }
}

// DELETE /api/productos/:id (solo admin)
// No se borra el registro porque puede estar en pedidos anteriores, solo se oculta del menú
async function eliminar(req, res) {
  try {
    const [resultado] = await pool.query(
      'UPDATE productos SET disponible = FALSE WHERE id = ?',
      [req.params.id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto eliminado del menú' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar el producto' });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
