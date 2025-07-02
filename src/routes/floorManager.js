const express = require('express');
const router = express.Router();
const floorManagerController = require('../controllers/floorManagerController');

router.get('/dashboard', floorManagerController.dashboard);
router.get('/services', floorManagerController.listServices);
router.get('/services/edit/:id', floorManagerController.editServiceForm);
router.post('/services/edit/:id', floorManagerController.updateService);

module.exports = router;
