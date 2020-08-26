const express = require('express');
const router = express.Router();
const controller = require('../controllers/index'); 

/* GET home page. */
router.get('/', controller.view );
router.post('/registro_plantacion', controller.registrarPlantacion );
router.post('/registro_sgmoperativo', controller.registrarSgmOperativo );
router.post('/registro_sgmoperacional', controller.registrarSgmOperacional );
router.post('/actualizar_ip', controller.actualizarIp );
router.post('/actualizar_loc', controller.actualizarLoc );
router.get('/obtener_plantaciones', controller.obtenerPlantaciones );
router.get('/obtener_plantacion', controller.obtenerPlantacion );

module.exports = router;
