const Service = require('../models/Service');
const moment = require('moment');

const adminController = {
  dashboard: async (req, res) => {
    try {
      const totalServices = await Service.countDocuments();
      const completedServices = await Service.countDocuments({ status: 'completed' });
      const inProgressServices = await Service.countDocuments({ status: 'in-progress' });
      const pendingServices = await Service.countDocuments({ status: 'pending' });
      const services = await Service.find({}).sort({ createdAt: -1 }).limit(5);

      res.render('admin/dashboard', {
        user: req.session.user,
        totalServices,
        completedServices,
        inProgressServices,
        pendingServices,
        services,
        moment
      });
    } catch (error) {
      res.status(500).render('error', { error: 'Error loading admin dashboard' });
    }
  },

  exportServicesCSV: async (req, res) => {
    try {
      const services = await Service.find();

      // Convert services to CSV format
      const header = ['Vehicle Number', 'Status', 'Is Locked', 'Created At', 'Updated At'];
      const rows = services.map(service => [
        service.vehicleNumber,
        service.status,
        service.isLocked ? 'Yes' : 'No',
        service.createdAt ? service.createdAt.toISOString() : '',
        service.updatedAt ? service.updatedAt.toISOString() : ''
      ]);

      const csvContent = [
        header.join(','),
        ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="services.csv"');
      res.status(200).send(csvContent);
    } catch (error) {
      res.status(500).json({ error: 'Error exporting services as CSV' });
    }
  },

  getNotifications: async (req, res) => {
    try {
      const now = moment();
      const delayedServices = await Service.find({
        status: { $ne: 'completed' },
        estimatedCompletionTime: { $lte: now.toDate() }
      });

      res.json(delayedServices);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching notifications' });
    }
  },

  getDelayedServices: async (req, res) => {
    try {
      const now = moment();
      const delayedServices = await Service.find({
        status: { $ne: 'completed' },
        estimatedCompletionTime: { $lte: now.toDate() }
      });

      res.render('admin/delayed-services', {
        delayedServices,
        moment,
        user: req.session.user
      });
    } catch (error) {
      res.status(500).render('error', { error: 'Error loading delayed services' });
    }
  },

  getAnalytics: async (req, res) => {
    try {
      // Placeholder for analytics page
      res.render('admin/analytics', {
        user: req.session.user
      });
    } catch (error) {
      res.status(500).render('error', { error: 'Error loading analytics' });
    }
  },

  getAnalyticsData: async (req, res) => {
    try {
      // Example analytics data: count of services by status
      const totalServices = await Service.countDocuments();
      const completedServices = await Service.countDocuments({ status: 'completed' });
      const inProgressServices = await Service.countDocuments({ status: 'in-progress' });
      const pendingServices = await Service.countDocuments({ status: 'pending' });

      res.json({
        totalServices,
        completedServices,
        inProgressServices,
        pendingServices
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching analytics data' });
    }
  },

  checkNewNotifications: async (req, res) => {
    try {
      const now = moment();
      const delayedServices = await Service.find({
        status: { $ne: 'completed' },
        estimatedCompletionTime: { $lte: now.toDate() }
      });

      // Filter services that need notification every 5 mins
      const servicesToNotify = delayedServices.filter(service => {
        if (!service.notificationsStarted) return false;
        if (!service.lastNotificationTime) return true;
        const lastNotified = moment(service.lastNotificationTime);
        return now.diff(lastNotified, 'minutes') >= 5;
      });

      // Update lastNotificationTime for notified services
      for (const service of servicesToNotify) {
        service.lastNotificationTime = now.toDate();
        await service.save();
      }

      res.json(servicesToNotify);
    } catch (error) {
      res.status(500).json({ error: 'Error checking notifications' });
    }
  },

  // New controller methods for admin CRUD and unlock

  listServices: async (req, res) => {
    try {
      const services = await Service.find();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching services' });
    }
  },

  getServiceById: async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching service' });
    }
  },

  createService: async (req, res) => {
    try {
      const newService = new Service(req.body);
      await newService.save();
      res.status(201).json(newService);
    } catch (error) {
      res.status(500).json({ error: 'Error creating service' });
    }
  },

  updateService: async (req, res) => {
    try {
      const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedService) {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json(updatedService);
    } catch (error) {
      res.status(500).json({ error: 'Error updating service' });
    }
  },

  deleteService: async (req, res) => {
    try {
      const deletedService = await Service.findByIdAndDelete(req.params.id);
      if (!deletedService) {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting service' });
    }
  },

  unlockService: async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      service.isLocked = false;
      await service.save();
      res.json({ message: 'Service unlocked successfully', service });
    } catch (error) {
      res.status(500).json({ error: 'Error unlocking service' });
    }
  }
};

module.exports = adminController;
