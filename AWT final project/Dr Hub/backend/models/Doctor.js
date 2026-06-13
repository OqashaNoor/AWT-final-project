const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  specialization: {
    type: String,
    enum: [
      'General Medicine',
      'Cardiology',
      'Pediatrics',
      'Orthopedics',
      'Dermatology',
      'Neurology',
      'ENT',
      'General Surgery',
      'Psychiatry',
      'Family Medicine',
      'Emergency Medicine',
      'Radiology',
      'General Dentistry',
      'Orthodontics',
      'Periodontics',
      'Endodontics',
      'Oral Surgery'
    ],
    required: true,
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
  },
  yearsOfExperience: {
    type: Number,
    required: true,
  },
  qualifications: {
    type: [String],
  },
  bio: {
    type: String,
  },
  availableHours: {
    monday: { from: String, to: String },
    tuesday: { from: String, to: String },
    wednesday: { from: String, to: String },
    thursday: { from: String, to: String },
    friday: { from: String, to: String },
    saturday: { from: String, to: String },
    sunday: { from: String, to: String },
  },
  consultationFee: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Doctor', doctorSchema);
