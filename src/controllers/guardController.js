const Service = require('../models/Service');
const moment = require('moment');

exports.dashboard = async (req, res) => {
  try {
    const oneDayAgo = moment().subtract(1, 'days').toDate();

    const services = await Service.find({
      $or: [
        { status: { $in: ['pending', 'in-progress'] } },
        { status: 'completed', updatedAt: { $gte: oneDayAgo } }
      ]
    }).sort({ createdAt: -1 });

    res.render('guard/dashboard', { services: services || [] });
  } catch (error) {
    console.error('Error fetching services for dashboard:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.newServiceForm = async (req, res) => {
  res.render('guard/new-service', { error: null, values: {} });
};

exports.createNewService = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { vehicleNumber, gateInDateTime, gatePassType } = req.body;
    
    if (!vehicleNumber || !gateInDateTime) {
      return res.render('guard/new-service', { 
        error: 'Vehicle number and gate-in date/time are required',
        values: req.body 
      });
    }

    // Convert gateInDateTime string to Date object
    const gateInDate = new Date(gateInDateTime);
    if (isNaN(gateInDate.getTime())) {
      return res.render('guard/new-service', {
        error: 'Invalid Gate-In Date & Time format',
        values: req.body
      });
    }

    // Check for duplicate vehicleNumber within last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingService = await Service.findOne({
      vehicleNumber: vehicleNumber,
      gateInDateTime: { $gte: twentyFourHoursAgo }
    });

    if (existingService) {
      return res.render('guard/new-service', {
        error: 'Vehicle plate number already entered within the last 24 hours',
        values: req.body
      });
    }

    const service = new Service({
      vehicleNumber,
      gateInDateTime: gateInDate,
      status: 'pending',
      clientApprovalMethod: 'SMS',  // Setting a default value since it's required
      gatePassType: gatePassType || 'Manual'  // Use value from req.body or default to 'Manual'
    });

    console.log('Service to save:', service);
    await service.save();
    console.log('Service saved successfully');
    res.redirect('/guard/dashboard');
  } catch (error) {
    console.error('Error creating service:', error.message);
    console.error('Error stack:', error.stack);
    res.render('guard/new-service', { 
      error: 'An error occurred while creating the service. Please try again.',
      values: req.body 
    });
  }
};

exports.listUncompletedServices = async (req, res) => {
  try {
    const services = await Service.find({ 
      status: { $ne: 'completed' },
      isLocked: false 
    }).sort({ createdAt: -1 });
    
    res.render('guard/update-service', { services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.editServiceForm = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    console.log('Guard editServiceForm service:', service);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.render('guard/edit-service', { service });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.submitServiceUpdate = async (req, res) => {
  try {
    const { gatePassDateTime, signedBy, gatePassType, gatePasserName, gatePasserNameOther } = req.body;
    console.log('submitServiceUpdate - req.body:', req.body);

    const service = await Service.findById(req.params.id);
    console.log('Guard submitServiceUpdate service:', service);
    if (!service) {
      console.log('submitServiceUpdate - Service not found');
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if floor manager has completed their part
    if (!service.clientApprovalMethod || !service.assignedTechnician || !service.estimatedCompletionTime) {
      console.log('submitServiceUpdate - Floor Manager details incomplete');
      return res.status(400).json({ 
        error: 'Service cannot be completed until Floor Manager has filled all required details' 
      });
    }

    if (gatePassDateTime !== undefined) {
      service.gatePassDay = gatePassDateTime ? moment(gatePassDateTime).toDate() : null;
      service.gatePassTime = gatePassDateTime ? moment(gatePassDateTime).format('HH:mm') : null;
    }
    if (signedBy !== undefined) {
      service.signedBy = signedBy || null;
    }
    if (gatePassType !== undefined) {
      service.gatePassType = gatePassType || null;
      if (gatePassType === 'Manual') {
        service.gatePasserName = gatePasserName === 'Other' ? (gatePasserNameOther || null) : (gatePasserName || null);
      } else {
        service.gatePasserName = null;
      }
    }

    service.status = 'completed';
    service.isLocked = true;

    console.log('submitServiceUpdate - Saving service:', service);
    await service.save();
    console.log('submitServiceUpdate - Service saved successfully');
    res.redirect('/guard/update-service');
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
