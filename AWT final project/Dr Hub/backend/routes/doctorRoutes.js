const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const Doctor = require('../models/Doctor');
const PatientHistory = require('../models/PatientHistory');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const doctorController = require('../controllers/doctorController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({ storage });

// Protected routes - Doctor Dashboard & Profile
router.get('/dashboard/data', authMiddleware, doctorController.getDashboard);
router.get('/dashboard/stats', authMiddleware, doctorController.getStats);
router.get('/dashboard/:doctorId', authMiddleware, doctorController.getDashboardById);
router.get('/appointments/list', authMiddleware, doctorController.getAppointments);
router.get('/patients/list', authMiddleware, doctorController.getPatients);
router.get('/patient-history/:patientId', authMiddleware, doctorController.getPatientHistory);
router.put('/profile/update', authMiddleware, doctorController.updateProfile);
router.put('/upload-image/:doctorId', authMiddleware, upload.single('image'), doctorController.uploadImage);
router.post('/profile/create', authMiddleware, doctorController.createProfile);

// Emergency Doctor endpoint - returns 3-4 random active doctors
router.get('/emergency', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true })
      .populate('userId', 'name email phone')
      .select('-createdAt');

    if (doctors.length === 0) {
      return res.json([]);
    }

    // Shuffle array and select 3-4 doctors
    const shuffled = doctors.sort(() => Math.random() - 0.5);
    const numDoctors = Math.min(Math.random() < 0.5 ? 3 : 4, shuffled.length);
    const emergencyDoctors = shuffled.slice(0, numDoctors);

    res.json(emergencyDoctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public routes - List all doctors for patients to view
router.get('/', async (req, res) => {
  try {
    const { specialization } = req.query;
    const query = { isActive: true };
    if (specialization) {
      query.specialization = specialization;
    }

    const doctors = await Doctor.find(query)
      .populate('userId', 'name email phone')
      .select('-createdAt');

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email phone address');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
