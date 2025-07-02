const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
console.log("Handlers:", Object.keys(adminController));

// Admin dashboard and analytics routes
router.get('/dashboard', adminController.dashboard);
// router.get('/notifications', adminController.getNotifications);
router.get('/analytics', adminController.getAnalytics);
router.get('/services/delayed', adminController.getDelayedServices);

// API endpoints for real-time updates
router.get('/api/notifications/check', adminController.checkNewNotifications);
router.get('/api/analytics/data', adminController.getAnalyticsData);

// CRUD routes for vehicle/service records
router.get('/services', adminController.listServices); // List all services
router.get('/services/export-csv', adminController.exportServicesCSV); // Export services as CSV
router.get('/services/:id', adminController.getServiceById); // Get service by ID
router.post('/services', adminController.createService); // Create new service
router.put('/services/:id', adminController.updateService); // Update service by ID
router.delete('/services/:id', adminController.deleteService); // Delete service by ID

// Unlock service record for editing
router.post('/services/:id/unlock', adminController.unlockService);

module.exports = router;
