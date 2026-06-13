const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const PatientHistory = require('../models/PatientHistory');

// Get Doctor Dashboard Data for current logged-in doctor
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.userId;
    const doctor = await Doctor.findOne({ userId }).populate(
      'userId',
      'name email phone profileImage'
    );
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({
      doctor: {
        id: doctor._id,
        userId: doctor.userId._id,
        name: doctor.userId.name,
        email: doctor.userId.email,
        phone: doctor.userId.phone,
        specialization: doctor.specialization,
        yearsOfExperience: doctor.yearsOfExperience,
        licenseNumber: doctor.licenseNumber,
        bio: doctor.bio,
        rating: doctor.rating,
        profileImage: doctor.profileImage || doctor.userId?.profileImage || null,
        consultationFee: doctor.consultationFee,
        qualifications: doctor.qualifications,
        createdAt: doctor.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Dashboard Stats and today's appointments for a specific doctor
exports.getDashboardById = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: { $gte: today, $lt: tomorrow },
    })
      .populate('patientId', 'name email phone')
      .sort({ time: 1 });

    const uniquePatients = new Set(todayAppointments.map(apt => apt.patientId?._id.toString())).size;
    const completedCount = todayAppointments.filter(apt => apt.status === 'completed').length;
    const pendingCount = todayAppointments.filter(apt => apt.status === 'pending').length;

    const appointments = todayAppointments.map(apt => ({
      id: apt._id,
      patientId: apt.patientId?._id,
      patientName: apt.patientName || apt.patientId?.name,
      patientEmail: apt.patientId?.email,
      patientPhone: apt.patientId?.phone,
      date: apt.date,
      time: apt.time,
      treatment: apt.treatment || apt.reason,
      status: apt.status,
    }));

    res.json({
      totalPatients: uniquePatients,
      completed: completedCount,
      pending: pendingCount,
      appointments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Today's Stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.userId;
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: { $gte: today, $lt: tomorrow },
    });

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const completedAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      status: 'completed',
      date: { $gte: monthStart, $lte: monthEnd },
    });

    const pendingReports = await Appointment.countDocuments({
      doctorId: doctor._id,
      status: 'completed',
      notes: { $exists: false },
    });

    const revenue = (completedAppointments * (doctor.consultationFee || 100)) / 1000;

    res.json({
      todayPatients: todayAppointments.length,
      surgeries: 3,
      pendingReports: Math.max(pendingReports, 0),
      revenue: revenue.toFixed(1),
      patientsChange: '+12%',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Doctor's Appointments
exports.getAppointments = async (req, res) => {
  try {
    const userId = req.userId;
    const { filter, status } = req.query;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const query = { doctorId: doctor._id };
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: today, $lt: tomorrow };
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone profileImage')
      .sort({ date: 1, time: 1 });

    const formattedAppointments = appointments.map(apt => ({
      id: apt._id,
      patientId: apt.patientId._id,
      patientName: apt.patientId.name,
      patientEmail: apt.patientId.email,
      patientPhone: apt.patientId.phone,
      patientProfileImage: apt.patientId.profileImage,
      patientInitial: apt.patientId.name.charAt(0).toUpperCase(),
      date: apt.date,
      time: apt.time,
      treatment: apt.treatment || apt.reason,
      description: apt.description,
      status: apt.status,
      notes: apt.notes,
    }));

    res.json({ appointments: formattedAppointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Doctor's Patients
exports.getPatients = async (req, res) => {
  try {
    const userId = req.userId;
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const patientIds = await Appointment.find({ doctorId: doctor._id }).distinct('patientId');
    const patients = await User.find({ _id: { $in: patientIds } });

    const formattedPatients = patients.map(patient => ({
      id: patient._id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      profileImage: patient.profileImage,
      initial: patient.name.charAt(0).toUpperCase(),
    }));

    res.json({ patients: formattedPatients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Doctor Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, phone, specialization, yearsOfExperience, licenseNumber, bio } = req.body;

    if (name || email || phone) {
      const userUpdate = {};
      if (name) userUpdate.name = name;
      if (email) userUpdate.email = email;
      if (phone) userUpdate.phone = phone;
      await User.findByIdAndUpdate(userId, userUpdate, { new: true });
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const doctorUpdate = {};
    if (specialization) doctorUpdate.specialization = specialization;
    if (yearsOfExperience) doctorUpdate.yearsOfExperience = yearsOfExperience;
    if (licenseNumber) doctorUpdate.licenseNumber = licenseNumber;
    if (bio) doctorUpdate.bio = bio;

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctor._id,
      doctorUpdate,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone profileImage');

    res.json({
      doctor: {
        id: updatedDoctor._id,
        userId: updatedDoctor.userId._id,
        name: updatedDoctor.userId.name,
        email: updatedDoctor.userId.email,
        phone: updatedDoctor.userId.phone,
        specialization: updatedDoctor.specialization,
        yearsOfExperience: updatedDoctor.yearsOfExperience,
        licenseNumber: updatedDoctor.licenseNumber,
        bio: updatedDoctor.bio,
        profileImage: updatedDoctor.profileImage || updatedDoctor.userId?.profileImage || null,
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Upload Doctor Profile Image
exports.uploadImage = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.userId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    doctor.profileImage = `/uploads/${req.file.filename}`;
    await doctor.save();

    res.json({ doctor: {
      id: doctor._id,
      profileImage: doctor.profileImage,
    }});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Doctor Profile (called during registration)
exports.createProfile = async (req, res) => {
  try {
    const { userId, specialization, licenseNumber, yearsOfExperience, consultationFee } = req.body;

    const existingDoctor = await Doctor.findOne({ userId });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor profile already exists' });
    }

    const doctor = new Doctor({
      userId,
      specialization: specialization || 'General Medicine',
      licenseNumber,
      yearsOfExperience: yearsOfExperience || 0,
      consultationFee: consultationFee || 100,
    });

    await doctor.save();

    const populatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'name email phone');

    res.status(201).json({
      doctor: {
        id: populatedDoctor._id,
        userId: populatedDoctor.userId._id,
        name: populatedDoctor.userId.name,
        email: populatedDoctor.userId.email,
        phone: populatedDoctor.userId.phone,
        specialization: populatedDoctor.specialization,
        yearsOfExperience: populatedDoctor.yearsOfExperience,
        licenseNumber: populatedDoctor.licenseNumber,
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get Patient History - Doctor can view patient's medical history
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patientHistory = await PatientHistory.find({ patientId })
      .sort({ createdAt: -1 });

    if (!patientHistory) {
      return res.json([]);
    }

    const formattedHistory = patientHistory.map((item) => {
      const obj = typeof item.toObject === 'function' ? item.toObject() : item;
      let prescriptionImage = obj.prescriptionImage;
      if (prescriptionImage && typeof prescriptionImage === 'string') {
        const trimmed = prescriptionImage.trim();
        if (/^https?:\/\//i.test(trimmed)) {
          prescriptionImage = trimmed;
        } else {
          let rel = trimmed.replace(/^\/+/, '');
          if (/^uploads\//i.test(rel)) {
            prescriptionImage = `/${rel}`;
          } else {
            prescriptionImage = `/uploads/${rel}`;
          }
        }
      } else {
        prescriptionImage = null;
      }

      return {
        _id: obj._id,
        patientId: obj.patientId,
        disease: obj.disease,
        notes: obj.notes,
        prescriptionImage,
        createdAt: obj.createdAt,
      };
    });

    res.json(formattedHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
