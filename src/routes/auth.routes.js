const { Router } = require('express');
const auth = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth');

const router = Router();

router.post('/registro', auth.registro);
router.post('/login', auth.login);
router.get('/perfil', verificarToken, auth.perfil);

module.exports = router;
