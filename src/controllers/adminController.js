const Service = require('../models/Service');
const moment = require('moment');

const adminController = {
  // Render dashboard
  dashboard: async (req, res) => {
    try {
      // Get all services for today (not just completed ones)
      const today = moment().startOf('day');
      const tomorrow = moment().add(1, 'day').startOf('day');
      
      const services = await Service.find({
        gateInDateTime: {
          $gte: today.toDate(),
          $lt: tomorrow.toDate()
        }
      }).sort({ gateInDateTime: -1 });

      // Calculate status counts based on the new logic
      let pendingServices = 0;
      let inProgressServices = 0;
      let completedServices = 0;

      services.forEach(service => {
        if (service.status === 'completed') {
          completedServices++;
        } else {
          // Check if T1 and T2 are completed
          const t1Completed = service.vehicleAttendedBy && service.vehicleAttended;
          const t2Completed = service.clientApprovalMethod;
          
          if (t1Completed && t2Completed) {
            inProgressServices++;
          } else {
            pendingServices++;
          }
        }
      });

      console.log('Dashboard services:', services.length);
      console.log('Status counts - Pending:', pendingServices, 'In Progress:', inProgressServices, 'Completed:', completedServices);
      
      res.render('admin/dashboard', {
        services,
        pendingServices,
        inProgressServices,
        completedServices,
        moment,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      res.status(500).render('error', { error: 'Error loading dashboard' });
    }
  },

  // Analytics page
  analytics: async (req, res) => {
    try {
      // Get analytics data for the past week
      const weekAgo = moment().subtract(7, 'days').startOf('day');
      
      const services = await Service.find({
        gateInDateTime: {
          $gte: weekAgo.toDate()
        }
      }).sort({ gateInDateTime: -1 });

      // Calculate various metrics
      const totalServices = services.length;
      const completedServices = services.filter(s => s.status === 'completed').length;
      const averageCompletionTime = services
        .filter(s => s.workStartedAt && s.workDoneTime)
        .reduce((acc, s) => {
          const duration = moment(s.workDoneTime).diff(moment(s.workStartedAt), 'minutes');
          return acc + duration;
        }, 0) / services.filter(s => s.workStartedAt && s.workDoneTime).length || 0;

      res.render('admin/analytics', {
        services,
        totalServices,
        completedServices,
        averageCompletionTime: Math.round(averageCompletionTime),
        moment,
        user: req.session.user
      });
      getNotifications; async (req, res) => {
  res.json({ message: 'Notifications data not implemented yet.' });
},

getAnalyticsData; async (req, res) => {
  res.json({ message: 'Analytics data not implemented yet.' });
},

getDelayedServices; async (req, res) => {
  res.json({ message: 'Delayed services not implemented yet.' });
},

checkNewNotifications; async (req, res) => {
  res.json({ message: 'Check notifications endpoint not implemented yet.' });
},

listServices; async (req, res) => {
  res.json({ message: 'List of services not implemented yet.' });
},

exportServicesCSV; async (req, res) => {
  res.json({ message: 'Export services CSV not implemented yet.' });
},

getServiceById; async (req, res) => {
  const { id } = req.params;
  res.json({ message: `Service with ID ${id} not implemented.` });
},

createService; async (req, res) => {
  res.json({ message: 'Create service not implemented yet.' });
},

updateService; async (req, res) => {
  const { id } = req.params;
  res.json({ message: `Update service ${id} not implemented yet.` });
},

deleteService; async (req, res) => {
  const { id } = req.params;
  res.json({ message: `Delete service ${id} not implemented yet.` });
},

unlockService, async (req, res) => {
  const { id } = req.params;
  res.json({ message: `Unlock service ${id} not implemented yet.` });
}
    } catch (error) {
      console.error('Error loading analytics:', error);
      res.status(500).render('error', { error: 'Error loading analytics' });
    }
  }
};

module.exports = adminController;