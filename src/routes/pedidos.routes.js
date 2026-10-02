const { Router } = require('express');
const pedidos = require('../controllers/pedidos.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth');

const router = Router();

// Todas las rutas de pedidos requieren sesión iniciada
router.use(verificarToken);

// Estudiante
router.post('/', permitirRoles('estudiante'), pedidos.crear);
router.get('/mis-pedidos', permitirRoles('estudiante'), pedidos.misPedidos);
router.patch('/:id/cancelar', permitirRoles('estudiante'), pedidos.cancelar);

// Administrador
router.get('/', permitirRoles('admin'), pedidos.listarTodos);
router.patch('/:id/estado', permitirRoles('admin'), pedidos.cambiarEstado);

// Ambos (el controlador valida que el estudiante sea el dueño del pedido)
router.get('/:id', pedidos.obtener);

module.exports = router;
