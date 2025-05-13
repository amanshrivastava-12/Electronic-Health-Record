const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Appointment = require('../models/appointment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Doctor signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, specialization, experience, phone } = req.body;

    // Check if doctor already exists
    let doctor = await User.findOne({ email });
    if (doctor) {
      return res.status(400).json({ message: 'Doctor already exists with this email' });
    }

    // Create new doctor
    doctor = new User({
      name,
      email,
      password,
      role: 'doctor',
      specialization,
      experience,
      phone
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    doctor.password = await bcrypt.hash(password, salt);

    // Save doctor to database
    await doctor.save();

    // Create JWT token
    const payload = {
      user: {
        id: doctor.id,
        role: doctor.role
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

// Doctor login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if doctor exists
    const doctor = await User.findOne({ email, role: 'doctor' });
    if (!doctor) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: doctor.id,
        role: doctor.role
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

// Get doctor profile
router.get('/profile', auth, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Not authorized as a doctor' });
    }

    const doctor = await User.findById(req.user.id).select('-password');
    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update doctor profile
router.put('/profile', auth, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Not authorized as a doctor' });
    }

    const { name, specialization, experience, phone } = req.body;
    
    // Build doctor profile object
    const profileFields = {};
    if (name) profileFields.name = name;
    if (specialization) profileFields.specialization = specialization;
    if (experience) profileFields.experience = experience;
    if (phone) profileFields.phone = phone;

    // Update doctor profile
    const doctor = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');

    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get doctor's appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Not authorized as a doctor' });
    }

    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'name email phone')
      .sort({ date: 1 });
    
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update appointment status
router.put('/appointments/:id', auth, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Not authorized as a doctor' });
    }

    const { status, notes } = req.body;
    
    // Find appointment
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if doctor owns this appointment
    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this appointment' });
    }
    
    // Update appointment
    if (status) appointment.status = status;
    if (notes) appointment.doctorNotes = notes;
    
    await appointment.save();
    
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all doctors for public listing
router.get('/', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name specialization experience')
      .sort({ name: 1 });
    
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get specific doctor by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const doctor = await User.findOne({ 
      _id: req.params.id,
      role: 'doctor'
    }).select('name specialization experience');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    
    // Check if error is due to invalid ID format
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.status(500).send('Server error');
  }
});

module.exports = router;