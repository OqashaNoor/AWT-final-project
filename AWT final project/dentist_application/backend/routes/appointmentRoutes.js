const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Get all appointments (with filters)
router.get('/', async (req, res) => {
  try {
    const { patientId, doctorId, status } = req.query;
    const filter = {};

    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'userId specialization')
      .sort({ date: -1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'userId specialization');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available slots for a doctor on a specific date
router.get('/available-slots/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'doctorId and date are required' });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Parse date to YYYY-MM-DD format for consistent comparison
    const selectedDate = new Date(date);
    const dateStartOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const dateEndOfDay = new Date(dateStartOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Fetch all booked appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: dateStartOfDay, $lt: dateEndOfDay },
      status: { $in: ['pending', 'confirmed', 'scheduled', 'rescheduled'] },
    }).select('time');

    // Extract booked times
    const bookedTimes = bookedAppointments.map(apt => apt.time);

    // Generate all available slots (9 AM to 5 PM in 30-minute intervals)
    const availableSlots = [];
    const startHour = 9;
    const endHour = 17; // 5 PM

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const isBooked = bookedTimes.includes(timeString);
        
        availableSlots.push({
          time: timeString,
          isBooked,
        });
      }
    }

    res.json({
      date: date,
      doctorId,
      totalSlots: availableSlots.length,
      bookedCount: bookedTimes.length,
      availableCount: availableSlots.length - bookedTimes.length,
      slots: availableSlots,
      bookedTimes, // For frontend reference
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Book appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      reason,
      description,
      date,
      time,
      treatment,
    } = req.body;

    const actualPatientId = patientId || req.userId;
    if (actualPatientId.toString() !== req.userId.toString() && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointmentDateValue = date ? new Date(date) : new Date(appointmentDate);
    const appointmentTimeValue = time || appointmentTime;
    const treatmentValue = treatment || reason;

    // Normalize date to start of day for comparison
    const dateStartOfDay = new Date(appointmentDateValue.getFullYear(), appointmentDateValue.getMonth(), appointmentDateValue.getDate());
    const dateEndOfDay = new Date(dateStartOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Convert time string (HH:MM) to minutes for easier comparison
    const [requestedHour, requestedMinute] = appointmentTimeValue.split(':').map(Number);
    const requestedTotalMinutes = requestedHour * 60 + requestedMinute;

    // Check for existing appointments on the same day
    const existingAppointments = await Appointment.find({
      doctorId,
      date: { $gte: dateStartOfDay, $lt: dateEndOfDay },
      status: { $in: ['pending', 'confirmed', 'scheduled', 'rescheduled'] },
    });

    // Check if any existing appointment conflicts (within 15 minutes before/after)
    for (const existingApt of existingAppointments) {
      const [existingHour, existingMinute] = existingApt.time.split(':').map(Number);
      const existingTotalMinutes = existingHour * 60 + existingMinute;

      const timeDifference = Math.abs(requestedTotalMinutes - existingTotalMinutes);

      // If difference is less than 15 minutes, slot is not available
      if (timeDifference < 15) {
        return res.status(400).json({ 
          message: 'Slot already booked. Please select another time after 15 minutes.' 
        });
      }
    }

    const patient = await User.findById(actualPatientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const appointment = new Appointment({
      patientName: patient.name,
      patientId: actualPatientId,
      doctorId,
      date: dateStartOfDay,
      time: appointmentTimeValue,
      treatment: treatmentValue,
      appointmentDate: dateStartOfDay,
      appointmentTime: appointmentTimeValue,
      reason: treatmentValue,
      description,
      status: 'pending',
    });

    await appointment.save();

    const io = req.app.get('io');
    io?.emit('appointmentUpdated', { appointmentId: appointment._id, action: 'created' });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update appointment by patient
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only the patient can edit this appointment' });
    }

    const { date, time, treatment, appointmentDate, appointmentTime, reason } = req.body;
    const updatedFields = { updatedAt: Date.now() };

    if (date || appointmentDate) {
      updatedFields.date = date ? new Date(date) : new Date(appointmentDate);
      updatedFields.appointmentDate = updatedFields.date;
    }
    if (time || appointmentTime) {
      updatedFields.time = time || appointmentTime;
      updatedFields.appointmentTime = updatedFields.time;
    }
    if (treatment || reason) {
      updatedFields.treatment = treatment || reason;
      updatedFields.reason = updatedFields.treatment;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true, runValidators: true }
    );

    const io = req.app.get('io');
    io?.emit('appointmentUpdated', { appointmentId: updatedAppointment._id, action: 'updated' });

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel appointment by patient
router.patch('/cancel/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only the patient can cancel this appointment' });
    }

    const cancelledAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', updatedAt: Date.now() },
      { new: true }
    );

    const io = req.app.get('io');
    io?.emit('appointmentUpdated', { appointmentId: cancelledAppointment._id, action: 'cancelled' });

    res.json({ message: 'Appointment cancelled', appointment: cancelledAppointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Confirm appointment by doctor
router.patch('/confirm/:id', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'doctor' && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const doctorProfile = await Doctor.findOne({ userId: req.userId });
    if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({ message: 'Doctor can only update their own appointments' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed', updatedAt: Date.now() },
      { new: true }
    );

    const io = req.app.get('io');
    io?.emit('appointmentUpdated', { appointmentId: updatedAppointment._id, action: 'confirmed' });

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete appointment by doctor
router.patch('/complete/:id', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'doctor' && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const doctorProfile = await Doctor.findOne({ userId: req.userId });
    if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({ message: 'Doctor can only update their own appointments' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', updatedAt: Date.now() },
      { new: true }
    );

    const io = req.app.get('io');
    io?.emit('appointmentUpdated', { appointmentId: updatedAppointment._id, action: 'completed' });

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject appointment by doctor
router.patch('/reject/:id', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'doctor' && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const doctorProfile = await Doctor.findOne({ userId: req.userId });
    if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({ message: 'Doctor can only update their own appointments' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', updatedAt: Date.now() },
      { new: true }
    );

    const io = req.app.get('io');
    io?.emit('appointmentUpdated', { appointmentId: updatedAppointment._id, action: 'rejected' });

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Keep cancel route backward compatible
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.userId && appointment.doctorId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const cancelledAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', updatedAt: Date.now() },
      { new: true }
    );

    const io = req.app.get('io');
    io?.emit('appointmentUpdated', { appointmentId: cancelledAppointment._id, action: 'cancelled' });

    res.json({ message: 'Appointment cancelled', appointment: cancelledAppointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's appointments (patient or doctor)
router.get('/user/appointments', authMiddleware, async (req, res) => {
  try {
    let appointments;

    if (req.userRole === 'patient') {
      appointments = await Appointment.find({ patientId: req.userId })
        .populate('doctorId', 'userId specialization')
        .sort({ date: 1, time: 1 });
    } else if (req.userRole === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: req.userId });
      if (!doctorProfile) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      appointments = await Appointment.find({ doctorId: doctorProfile._id })
        .populate('patientId', 'name email phone')
        .sort({ date: 1, time: 1 });
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor's appointments
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name email phone')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
