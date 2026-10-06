const { Router } = require('express');
const productos = require('../controllers/productos.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth');

const router = Router();
function idDesdeBody(controlador) {
  return (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ mensaje: 'Debe enviar el id del producto en el body' });
    }
    req.params.id = String(id);
    return controlador(req, res);
  };
}

// ===== Servicios POST (evidencia GA7-220501096-AA5-EV04) =====
router.post('/buscar', idDesdeBody(productos.obtener));
router.post('/registrar', verificarToken, permitirRoles('admin'), productos.crear);
router.post('/actualizar', verificarToken, permitirRoles('admin'), idDesdeBody(productos.actualizar));
router.post('/eliminar', verificarToken, permitirRoles('admin'), idDesdeBody(productos.eliminar));

// ===== Servicios REST (evidencia GA7-220501096-AA5-EV03) =====
// Públicas: cualquiera puede ver el menú
router.get('/', productos.listar);
router.get('/:id', productos.obtener);

// Solo el administrador puede modificar el menú
router.post('/', verificarToken, permitirRoles('admin'), productos.crear);
router.put('/:id', verificarToken, permitirRoles('admin'), productos.actualizar);
router.delete('/:id', verificarToken, permitirRoles('admin'), productos.eliminar);

module.exports = router;
