const express = require('express');
const router = express.Router();
const guardController = require('../controllers/guardController');

// Middleware to check if user is guard
function isGuard(req, res, next) {
  if (req.session.user && req.session.user.role === 'guard') {
    next();
  } else {
    res.redirect('/login');
  }
}

router.get('/dashboard', isGuard, guardController.dashboard);

router.get('/new-service', isGuard, guardController.newServiceForm);
router.post('/new-service', isGuard, guardController.createNewService);

router.get('/update-service', isGuard, guardController.listUncompletedServices);
router.get('/update-service/:id', isGuard, guardController.editServiceForm);
router.post('/update-service/:id', isGuard, guardController.submitServiceUpdate);

module.exports = router;
