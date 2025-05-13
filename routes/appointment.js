const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Appointment = require('../models/appointment');
const User = require('../models/user');

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// @route   POST /appointment
// @desc    Create a new appointment
// @access  Private (patients only)
router.post('/', [
  authMiddleware,
  [
    check('doctor', 'Doctor ID is required').not().isEmpty(),
    check('date', 'Date is required').not().isEmpty(),
    check('time', 'Time is required').not().isEmpty(),
    check('reason', 'Reason for appointment is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Check if user is a patient
    const user = await User.findById(req.user.id);
    if (user.role !== 'patient') {
      return res.status(403).json({ msg: 'Only patients can book appointments' });
    }
    
    // Check if doctor exists
    const doctor = await User.findOne({ _id: req.body.doctor, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ msg: 'Doctor not found' });
    }
    
    // Create new appointment
    const { doctor: doctorId, date, time, reason, notes } = req.body;
    const newAppointment = new Appointment({
      patient: req.user.id,
      doctor: doctorId,
      date,
      time,
      reason,
      notes,
      paymentAmount: doctor.doctorDetails.consultationFee
    });
    
    const appointment = await newAppointment.save();
    
    // Populate doctor and patient info
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', ['name', 'email', 'doctorDetails'])
      .populate('patient', ['name', 'email', 'patientDetails']);
      
    res.json(populatedAppointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /appointment
// @desc    Get all appointments for logged-in user (doctor or patient)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let appointments;
    
    // Find appointments based on user role
    if (user.role === 'patient') {
      appointments = await Appointment.find({ patient: req.user.id })
        .populate('doctor', ['name', 'doctorDetails.specialization'])
        .sort({ date: 1, time: 1 });
    } else if (user.role === 'doctor') {
      appointments = await Appointment.find({ doctor: req.user.id })
        .populate('patient', ['name', 'patientDetails'])
        .sort({ date: 1, time: 1 });
    } else {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /appointment/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', ['name', 'email', 'doctorDetails'])
      .populate('patient', ['name', 'email', 'patientDetails']);
    
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    
    // Check if the user is the patient or doctor for this appointment
    if (
      appointment.patient._id.toString() !== req.user.id &&
      appointment.doctor._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this appointment' });
    }
    
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /appointment/:id
// @desc    Update appointment status
// @access  Private (doctor only)
router.put('/:id', [
  authMiddleware,
  [
    check('status', 'Status is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    
    // Check if the user is the doctor for this appointment
    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this appointment' });
    }
    
    // Update appointment fields
    const { status, notes, followUpRequired, prescriptions } = req.body;
    
    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;
    if (followUpRequired !== undefined) appointment.followUpRequired = followUpRequired;
    if (prescriptions) appointment.prescriptions = prescriptions;
    
    await appointment.save();
    
    const updatedAppointment = await Appointment.findById(req.params.id)
      .populate('doctor', ['name', 'email', 'doctorDetails'])
      .populate('patient', ['name', 'email', 'patientDetails']);
    
    res.json(updatedAppointment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /appointment/:id/payment
// @desc    Update appointment payment status
// @access  Private (patient only)
router.put('/:id/payment', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    
    // Check if the user is the patient for this appointment
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this appointment' });
    }
    
    // Update payment status
    appointment.paymentStatus = 'completed';
    
    await appointment.save();
    
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /appointment/:id
// @desc    Cancel appointment
// @access  Private (patient or doctor)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    
    // Check if the user is the patient or doctor for this appointment
    if (
      appointment.patient.toString() !== req.user.id &&
      appointment.doctor.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to cancel this appointment' });
    }
    
    // Update status to cancelled instead of deleting
    appointment.status = 'cancelled';
    await appointment.save();
    
    res.json({ msg: 'Appointment cancelled' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;