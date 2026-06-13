const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  treatment: {
    type: String,
    required: true,
  },
  appointmentDate: {
    type: Date,
  },
  appointmentTime: {
    type: String,
  },
  reason: {
    type: String,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'rejected', 'cancelled', 'scheduled', 'rescheduled'],
    default: 'pending',
  },
  notes: {
    type: String,
  },
  prescriptions: {
    type: [String],
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Appointment', appointmentSchema);
