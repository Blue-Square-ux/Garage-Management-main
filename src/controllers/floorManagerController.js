const Service = require('../models/Service');
const moment = require('moment');

// Simulate SMS/WhatsApp/Call approval system
const simulateClientApproval = async (service) => {
  // In real implementation, this would integrate with actual SMS/WhatsApp/Call APIs
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
};

const floorManagerController = {
  // Render dashboard
  dashboard: async (req, res) => {
    try {
      const services = await Service.find({})
        .sort({ createdAt: -1 })
        .limit(5);

      console.log('Dashboard services:', services);
      
      res.render('floor-manager/dashboard', {
        services,
        moment,
        user: req.session.user
      });
    } catch (error) {
      res.status(500).render('error', { error: 'Error loading dashboard' });
    }
  },

  // List all services
  listServices: async (req, res) => {
    try {
      const services = await Service.find({})
        .sort({ createdAt: -1 });
      
      res.render('floor-manager/services', {
        services,
        moment,
        user: req.session.user
      });
    } catch (error) {
      res.status(500).render('error', { error: 'Error loading services' });
    }
  },

  // Show edit service form
  editServiceForm: async (req, res) => {
    console.log('editServiceForm method called with id:', req.params.id);
    try {
      const service = await Service.findById(req.params.id);
      
      if (!service) {
        return res.status(404).render('error', { error: 'Service not found' });
      }

      if (service.isLocked) {
        return res.status(403).render('error', { error: 'Service is locked and cannot be edited' });
      }

      // Ensure vehicleAttendedBy, vehicleAttended, and workStartedAt have default values to avoid rendering errors
      if (!service.vehicleAttendedBy) {
        service.vehicleAttendedBy = '';
      }
      if (!service.vehicleAttended) {
        service.vehicleAttended = '';
      }
      if (!service.workStartedAt) {
        service.workStartedAt = null; // keep null for date formatting in form
      }

      console.log('Edit Service Form - clientApprovalMethod:', service.clientApprovalMethod);
      console.log('Edit Service Form - billing:', service.billing);

      // Ensure clientApprovalMethod remains unset if not previously set
      service.clientApprovalMethod = service.clientApprovalMethod || undefined;

      // Set default null for billing if not set
      if (service.billing === undefined || service.billing === null) {
        service.billing = null;
      }

      res.render('floor-manager/edit-service', {
        service,
        moment,
        user: req.session.user,
        error: null
      });
    } catch (error) {
      res.status(500).render('error', { error: 'Error loading service' });
    }
  },

  // Update service
  updateService: async (req, res) => {
    try {
      console.log('Update Service Request Body:', req.body);
      const service = await Service.findById(req.params.id);
      console.log('Service found:', service);
      
      if (!service) {
        console.error('Service not found');
        return res.status(404).render('error', { error: 'Service not found' });
      }

      if (service.isLocked) {
        console.error('Service is locked and cannot be edited');
        return res.status(403).render('error', { error: 'Service is locked and cannot be edited' });
      }

      const {
        clientApprovalMethod,
        assignedHelper,
        assignedTechnician,
        typeOfWork,
        estimatedTime,
        status,
        billing,
        vehicleAttendedBy,
        vehicleAttended,
        workStartedAt,
        workDone,
        workDoneTime
      } = req.body;

      // Validate required fields (allow empty vehicleAttendedBy, vehicleAttended, workStartedAt)
      if (!assignedHelper || !assignedTechnician || !typeOfWork) {
        console.error('Validation error: Missing required fields');
        return res.status(400).render('floor-manager/edit-service', {
          service,
          moment,
          user: req.session.user,
          error: 'Assigned Helper, Assigned Technician, and Type of Work are required.'
        });
      }

      // Validate clientApprovalMethod enum
      const validClientApprovalMethods = ['SMS', 'WhatsApp', 'Call', ''];
      if (clientApprovalMethod && !validClientApprovalMethods.includes(clientApprovalMethod)) {
        console.error('Validation error: Invalid clientApprovalMethod');
        return res.status(400).render('floor-manager/edit-service', {
          service,
          moment,
          user: req.session.user,
          error: 'Invalid client approval method.'
        });
      }

      // Validate status enum
      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (status && !validStatuses.includes(status)) {
        console.error('Validation error: Invalid status');
        return res.status(400).render('floor-manager/edit-service', {
          service,
          moment,
          user: req.session.user,
          error: 'Invalid status value.'
        });
      }

      // Validate estimatedTime format HH:mm:ss
      if (estimatedTime) {
        const timeParts = estimatedTime.split(':');
        if (timeParts.length !== 3 || timeParts.some(part => isNaN(Number(part)))) {
          console.error('Validation error: Invalid estimatedTime format');
          return res.status(400).render('floor-manager/edit-service', {
            service,
            moment,
            user: req.session.user,
            error: 'Estimated time must be in HH:mm:ss format.'
          });
        }
      }

      // Update service details
      if (clientApprovalMethod !== undefined) {
        console.log('Updating clientApprovalMethod:', clientApprovalMethod);
        service.clientApprovalMethod = clientApprovalMethod || null;
      }
      if (assignedHelper !== undefined) {
        console.log('Updating assignedHelper:', assignedHelper);
        service.assignedHelper = assignedHelper;
      }
      if (assignedTechnician !== undefined) {
        console.log('Updating assignedTechnician:', assignedTechnician);
        service.assignedTechnician = assignedTechnician;
      }
      if (typeOfWork !== undefined) {
        console.log('Updating typeOfWork:', typeOfWork);
        service.typeOfWork = typeOfWork;
      }
      if (estimatedTime) {
        console.log('Updating estimatedCompletionTime with estimatedTime:', estimatedTime);
        const [hours, minutes, seconds] = estimatedTime.split(':').map(Number);
        service.estimatedCompletionTime = moment(service.gateInDateTime)
          .add(hours, 'hours')
          .add(minutes, 'minutes')
          .add(seconds, 'seconds')
          .toDate();
      }
      if (status !== undefined) {
        console.log('Updating status:', status);
        service.status = status;
      }
      if (billing !== undefined) {
        console.log('Updating billing:', billing);
        service.billing = billing === 'true';
      }
      if (vehicleAttendedBy !== undefined) {
        console.log('Updating vehicleAttendedBy:', vehicleAttendedBy);
        service.vehicleAttendedBy = vehicleAttendedBy || null;
      }
      if (vehicleAttended !== undefined) {
        console.log('Updating vehicleAttended:', vehicleAttended);
        service.vehicleAttended = vehicleAttended || null;
      }
      if (workStartedAt) {
        console.log('Updating workStartedAt:', workStartedAt);
        service.workStartedAt = new Date(workStartedAt);
      }
      if (workDone !== undefined) {
        console.log('Updating workDone:', workDone);
        service.workDone = workDone === 'on' || workDone === true || workDone === 'true';
      }
      if (workDoneTime) {
        console.log('Updating workDoneTime:', workDoneTime);
        service.workDoneTime = new Date(workDoneTime);
      }

      // Mark service as ready for guard completion
      console.log('Setting clientApproved to true');
      service.clientApproved = true;

      // Start notifications if service is in progress and estimated time is set
      if (service.status === 'in-progress' && service.estimatedCompletionTime) {
        console.log('Starting notifications');
        service.notificationsStarted = true;
      }

      console.log('Service before save:', service);
      await service.save();
      console.log('Service after save:', service);
      console.log('Service updated successfully');
      res.redirect('/floor-manager/services');
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).render('floor-manager/edit-service', {
        service: await Service.findById(req.params.id),
        moment,
        user: req.session.user,
        error: 'Error updating service'
      });
    }
  },

};

module.exports = floorManagerController;
