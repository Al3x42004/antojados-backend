const pool = require('../config/db');

const ESTADOS = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'];

// Consulta un pedido con el detalle de sus productos
async function buscarPedidoCompleto(id) {
  const [pedidos] = await pool.query(
    `SELECT p.*, u.nombre AS estudiante
     FROM pedidos p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.id = ?`,
    [id]
  );
  if (pedidos.length === 0) return null;

  const [detalle] = await pool.query(
    `SELECT d.producto_id, pr.nombre, d.cantidad, d.precio_unitario, d.subtotal
     FROM detalle_pedido d
     JOIN productos pr ON pr.id = d.producto_id
     WHERE d.pedido_id = ?`,
    [id]
  );

  return { ...pedidos[0], productos: detalle };
}

// POST /api/pedidos (estudiante)
// Body: { "productos": [{ "producto_id": 1, "cantidad": 2 }], "observaciones": "..." }
async function crear(req, res) {
  const { productos, observaciones } = req.body;

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ mensaje: 'El pedido debe tener al menos un producto' });
  }
  for (const item of productos) {
    if (!item.producto_id || !Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      return res.status(400).json({ mensaje: 'Cada producto necesita producto_id y una cantidad mayor a 0' });
    }
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // Los precios se toman de la base de datos, no de lo que envíe el cliente
    let total = 0;
    const lineas = [];
    for (const item of productos) {
      const [filas] = await conexion.query(
        'SELECT id, precio, disponible FROM productos WHERE id = ?',
        [item.producto_id]
      );
      if (filas.length === 0 || !filas[0].disponible) {
        await conexion.rollback();
        return res.status(400).json({ mensaje: `El producto ${item.producto_id} no está disponible` });
      }
      const precio = Number(filas[0].precio);
      const subtotal = precio * item.cantidad;
      total += subtotal;
      lineas.push([item.producto_id, item.cantidad, precio, subtotal]);
    }

    const [resultado] = await conexion.query(
      'INSERT INTO pedidos (usuario_id, total, observaciones) VALUES (?, ?, ?)',
      [req.usuario.id, total, observaciones || null]
    );
    const pedidoId = resultado.insertId;

    for (const linea of lineas) {
      await conexion.query(
        'INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [pedidoId, ...linea]
      );
    }

    await conexion.commit();

    const pedido = await buscarPedidoCompleto(pedidoId);
    res.status(201).json({ mensaje: 'Pedido realizado correctamente', pedido });
  } catch (error) {
    await conexion.rollback();
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar el pedido' });
  } finally {
    conexion.release();
  }
}

// GET /api/pedidos/mis-pedidos (estudiante)
async function misPedidos(req, res) {
  try {
    const [pedidos] = await pool.query(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY creado_en DESC',
      [req.usuario.id]
    );
    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar los pedidos' });
  }
}

// GET /api/pedidos (admin)
// Se puede filtrar por estado: /api/pedidos?estado=pendiente
async function listarTodos(req, res) {
  try {
    const { estado } = req.query;
    let sql = `SELECT p.*, u.nombre AS estudiante
               FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id`;
    const params = [];

    if (estado) {
      sql += ' WHERE p.estado = ?';
      params.push(estado);
    }
    sql += ' ORDER BY p.creado_en ASC';

    const [pedidos] = await pool.query(sql, params);
    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar los pedidos' });
  }
}

// GET /api/pedidos/:id
// El estudiante solo puede ver sus propios pedidos; el admin puede ver todos
async function obtener(req, res) {
  try {
    const pedido = await buscarPedidoCompleto(req.params.id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    if (req.usuario.rol !== 'admin' && pedido.usuario_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puede ver pedidos de otros usuarios' });
    }
    res.json(pedido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar el pedido' });
  }
}

// PATCH /api/pedidos/:id/estado (admin)
// El administrador cambia el estado mientras prepara el pedido
async function cambiarEstado(req, res) {
  try {
    const { estado } = req.body;
    if (!ESTADOS.includes(estado)) {
      return res.status(400).json({ mensaje: `Estado no válido. Use: ${ESTADOS.join(', ')}` });
    }

    const [resultado] = await pool.query(
      'UPDATE pedidos SET estado = ? WHERE id = ?',
      [estado, req.params.id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    res.json({ mensaje: `Pedido actualizado a "${estado}"` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el pedido' });
  }
}

// PATCH /api/pedidos/:id/cancelar (estudiante)
// Solo se puede cancelar si el admin todavía no lo ha empezado a preparar
async function cancelar(req, res) {
  try {
    const [filas] = await pool.query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    const pedido = filas[0];

    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    if (pedido.usuario_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puede cancelar pedidos de otros usuarios' });
    }
    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'Solo se pueden cancelar pedidos en estado pendiente' });
    }

    await pool.query("UPDATE pedidos SET estado = 'cancelado' WHERE id = ?", [req.params.id]);
    res.json({ mensaje: 'Pedido cancelado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al cancelar el pedido' });
  }
}

module.exports = { crear, misPedidos, listarTodos, obtener, cambiarEstado, cancelar };
