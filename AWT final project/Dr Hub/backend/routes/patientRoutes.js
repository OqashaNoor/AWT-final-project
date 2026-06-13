const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Dashboard routes
router.get('/dashboard/:id', authMiddleware, patientController.getDashboard);
router.get('/profile/:id', authMiddleware, patientController.getProfile);
router.put('/profile/:id', authMiddleware, upload.single('profileImage'), patientController.updateProfile);

// History routes
router.get('/history/:id', authMiddleware, patientController.getPatientHistory);
router.post('/history', authMiddleware, upload.single('prescriptionImage'), patientController.addPatientHistory);

// Appointment routes
router.post('/appointments', authMiddleware, patientController.bookAppointment);
router.get('/appointments/:id', authMiddleware, patientController.getUpcomingAppointments);

// Doctor routes
router.get('/doctors', authMiddleware, patientController.getDoctors);

module.exports = router;