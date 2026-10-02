const { Router } = require('express');
const productos = require('../controllers/productos.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth');

const router = Router();

// Públicas: cualquiera puede ver el menú
router.get('/', productos.listar);
router.get('/:id', productos.obtener);

// Solo el administrador puede modificar el menú
router.post('/', verificarToken, permitirRoles('admin'), productos.crear);
router.put('/:id', verificarToken, permitirRoles('admin'), productos.actualizar);
router.delete('/:id', verificarToken, permitirRoles('admin'), productos.eliminar);

module.exports = router;
