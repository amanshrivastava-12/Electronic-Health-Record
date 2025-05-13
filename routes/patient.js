const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Appointment = require('../models/appointment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Patient signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, age, gender, phone } = req.body;

    // Check if patient already exists
    let patient = await User.findOne({ email });
    if (patient) {
      return res.status(400).json({ message: 'Patient already exists with this email' });
    }

    // Create new patient
    patient = new User({
      name,
      email,
      password,
      role: 'patient',
      age,
      gender,
      phone
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    patient.password = await bcrypt.hash(password, salt);

    // Save patient to database
    await patient.save();

    // Create JWT token
    const payload = {
      user: {
        id: patient.id,
        role: patient.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Patient login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if patient exists
    const patient = await User.findOne({ email, role: 'patient' });
    if (!patient) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: patient.id,
        role: patient.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get patient profile
router.get('/profile', auth, async (req, res) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Not authorized as a patient' });
    }

    const patient = await User.findById(req.user.id).select('-password');
    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update patient profile
router.put('/profile', auth, async (req, res) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Not authorized as a patient' });
    }

    const { name, age, gender, bloodGroup, allergies, medicalHistory, phone } = req.body;
    
    // Build patient profile object
    const profileFields = {};
    if (name) profileFields.name = name;
    if (age) profileFields.age = age;
    if (gender) profileFields.gender = gender;
    if (bloodGroup) profileFields.bloodGroup = bloodGroup;
    if (allergies) profileFields.allergies = allergies;
    if (medicalHistory) profileFields.medicalHistory = medicalHistory;
    if (phone) profileFields.phone = phone;

    // Update patient profile
    const patient = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');

    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update patient medical details
router.put('/medical-details', auth, async (req, res) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Not authorized as a patient' });
    }

    const { bloodGroup, allergies, medicalHistory } = req.body;
    
    // Build medical details object
    const medicalDetails = {};
    if (bloodGroup) medicalDetails.bloodGroup = bloodGroup;
    if (allergies) medicalDetails.allergies = allergies;
    if (medicalHistory) medicalDetails.medicalHistory = medicalHistory;

    // Update patient medical details
    const patient = await User.findByIdAndUpdate(
      req.user.id,
      { $set: medicalDetails },
      { new: true }
    ).select('-password');

    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get patient's appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Not authorized as a patient' });
    }

    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialization')
      .sort({ date: 1 });
    
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Cancel patient appointment
router.delete('/appointments/:id', auth, async (req, res) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Not authorized as a patient' });
    }

    // Find appointment
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if patient owns this appointment
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to cancel this appointment' });
    }
    
    // Check if appointment is in the past
    if (new Date(appointment.date) < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel past appointments' });
    }
    
    // Delete appointment
    await appointment.remove();
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add patient feedback for a completed appointment
router.put('/appointments/:id/feedback', auth, async (req, res) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Not authorized as a patient' });
    }

    const { rating, feedback } = req.body;
    
    // Find appointment
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if patient owns this appointment
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to add feedback to this appointment' });
    }
    
    // Check if appointment is completed
    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only add feedback to completed appointments' });
    }
    
    // Update appointment with feedback
    appointment.patientFeedback = {
      rating,
      feedback,
      date: Date.now()
    };
    
    await appointment.save();
    
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;