const User = require('../models/User');
const Appointment = require('../models/Appointment');
const PatientHistory = require('../models/PatientHistory');
const Doctor = require('../models/Doctor');

// Get patient dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Get patient data
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get upcoming appointments (next 3)
    const upcomingAppointments = await Appointment.find({
      patientId: patientId,
      date: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed', 'scheduled'] }
    })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ date: 1, time: 1 })
      .limit(3);

    // Get patient history for medical summary
    const medicalHistory = await PatientHistory.find({ patientId: patientId })
      .sort({ createdAt: -1 })
      .limit(1);

    const dashboardData = {
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
        profileImage: patient.profileImage,
        age: patient.age,
        gender: patient.gender,
      },
      upcomingAppointments: upcomingAppointments.map(apt => ({
        id: apt._id,
        doctorName: apt.doctorId?.userId?.name || 'Unknown',
        date: apt.date,
        time: apt.time,
        specialty: apt.doctorId?.specialization || 'General Medicine',
        status: apt.status,
        treatment: apt.treatment
      })),
      medicalSummary: {
        allergies: patient.allergies,
        treatment: patient.currentTreatment || 'None',
        bloodType: patient.bloodType,
        lastVisitDate: medicalHistory?.[0]?.createdAt || null
      },
      appointmentCount: await Appointment.countDocuments({ patientId: patientId })
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all doctors with their details
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true })
      .populate('userId', 'name profileImage')
      .select('-licenseNumber -qualifications -availableHours');

    const formattedDoctors = doctors.map(doctor => ({
      id: doctor._id,
      name: doctor.userId?.name || 'Unknown',
      image: doctor.profileImage || doctor.userId?.profileImage,
      specialty: doctor.specialization,
      experience: doctor.yearsOfExperience,
      rating: doctor.rating || 4.5,
      available: 'Today',
      consultationFee: doctor.consultationFee
    }));

    res.json(formattedDoctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient profile
exports.getProfile = async (req, res) => {
  try {
    const patient = await User.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
      id: patient._id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      address: patient.address,
      profileImage: patient.profileImage,
      age: patient.age,
      gender: patient.gender,
      allergies: patient.allergies,
      bloodType: patient.bloodType,
      patientId: `#PDC-${patient._id.toString().slice(-6).toUpperCase()}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update patient profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address, age, gender, allergies, bloodType } = req.body;
    const updateData = { name, email, phone, address, age, gender, bloodType };

    if (allergies) {
      updateData.allergies = typeof allergies === 'string' ? [allergies] : allergies;
    }

    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const patient = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      patient
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient history
exports.getPatientHistory = async (req, res) => {
  try {
    const history = await PatientHistory.find({ patientId: req.params.id })
      .sort({ createdAt: -1 });

    const formattedHistory = history.map(item => ({
      id: item._id,
      disease: item.disease,
      notes: item.notes,
      prescriptionImage: item.prescriptionImage ? `/uploads/${item.prescriptionImage}` : null,
      date: item.createdAt
    }));

    res.json(formattedHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add patient history
exports.addPatientHistory = async (req, res) => {
  try {
    const { patientId, disease, notes } = req.body;
    const historyData = { patientId, disease, notes };

    if (req.file) {
      historyData.prescriptionImage = req.file.filename;
    }

    const newHistory = new PatientHistory(historyData);
    await newHistory.save();

    res.status(201).json({
      message: 'History added successfully',
      history: newHistory
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Book appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date, time, treatment } = req.body;

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if slot is available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $in: ['confirmed', 'scheduled'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot not available' });
    }

    // Get patient name
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const appointment = new Appointment({
      patientName: patient.name,
      patientId,
      doctorId,
      date: new Date(date),
      time,
      treatment: treatment || 'Consultation',
      status: 'pending'
    });

    await appointment.save();

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get upcoming appointments for patient
exports.getUpcomingAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientId: req.params.id,
      date: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed', 'scheduled'] }
    })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ date: 1, time: 1 });

    const formatted = appointments.map(apt => ({
      id: apt._id,
      doctorName: apt.doctorId?.userId?.name || 'Unknown',
      date: apt.date,
      time: apt.time,
      specialty: apt.doctorId?.specialization || 'General Medicine',
      status: apt.status,
      treatment: apt.treatment
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
