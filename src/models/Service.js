const mongoose = require('mongoose');
const moment = require('moment');

const serviceSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  gateInDateTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  clientApprovalMethod: {
    type: String,
    enum: [ 'SMS', 'WhatsApp', 'Call'],
    required: true,
    validate: {
      validator: function(v) {
        return ['SMS', 'WhatsApp', 'Call'].includes(v);
      },
      message: props => `${props.value} is not a valid approval method`
    }
  },
  clientApprovalTime: {
    type: Date,
    default: null
  },
  clientApproved: {
    type: Boolean,
    default: false
  },
  assignedHelper: {
    type: String,
    default: null
  },
  assignedTechnician: {
    type: String,
    default: null
  },
  typeOfWork: {
    type: String,
    default: null
  },
  estimatedCompletionTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  billing: {
    type: Boolean,
    default: null,
    required: false
  },
  gatePassDay: {
    type: Date,
    default: null
  },
  gatePassTime: {
    type: String,
    default: null
  },
  gatePassType: {
    type: String,
    enum: ['Manual', 'System'],
    default: null
  },
  gatePasserName: {
    type: String,
    default: null
  },
  signedBy: {
    type: String,
    default: null
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  notificationsStarted: {
    type: Boolean,
    default: false
  },
  lastNotificationTime: {
    type: Date,
    default: null
  },
  vehicleAttendedBy: {
    type: String,
    default: null
  },
  vehicleAttended: {
    type: String,
    default: null
  },
  workStartedAt: {
    type: Date,
    default: null
  },
  workDone: {
    type: Boolean,
    default: false
  },
  workDoneTime: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
serviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Ensure clientApprovalMethod is never defaulted
  if (this.isNew && !this.clientApprovalMethod) {
    this.clientApprovalMethod = undefined;
  }
  
  next();
});

// Virtual for checking if service is delayed
serviceSchema.virtual('isDelayed').get(function() {
  if (!this.estimatedCompletionTime || this.status === 'completed') {
    return false;
  }
  const now = moment();
  const estimatedTime = moment(this.estimatedCompletionTime);
  const minutesRemaining = estimatedTime.diff(now, 'minutes');
  return minutesRemaining <= 30 && minutesRemaining > 0;
});

// Method to check if notification should be sent
serviceSchema.methods.shouldSendNotification = function() {
  if (!this.notificationsStarted || this.status === 'completed') {
    return false;
  }
  
  const now = moment();
  const lastNotification = this.lastNotificationTime ? moment(this.lastNotificationTime) : null;
  
  return !lastNotification || now.diff(lastNotification, 'minutes') >= 5;
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
