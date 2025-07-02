const mongoose = require('mongoose');
const Service = require('./src/models/Service');

async function updateDefaults() {
  try {
    await mongoose.connect('mongodb://localhost:27017/garage-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await Service.updateMany(
      { $or: [{ clientApprovalMethod: { $exists: false } }, { clientApprovalMethod: null }] },
      { $set: { clientApprovalMethod: '' } }
    );

    await Service.updateMany(
      { $or: [{ billing: { $exists: false } }, { billing: null }] },
      { $set: { billing: null } }
    );

    console.log('Database update complete');
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    await mongoose.disconnect();
  }
}

updateDefaults();
