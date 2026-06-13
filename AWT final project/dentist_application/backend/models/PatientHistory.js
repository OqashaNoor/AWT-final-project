const mongoose = require('mongoose');

const patientHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  disease: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    required: true,
  },
  prescriptionImage: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PatientHistory', patientHistorySchema);