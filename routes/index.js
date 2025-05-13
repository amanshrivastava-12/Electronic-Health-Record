const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Appointment = require('../models/appointment');
// Import the auth middleware
const auth = require('../middleware/auth');


// Home route - landing page
router.get('/', (req, res) => {
  res.render('index', {
    title: 'EHR System - Electronic Health Records',
    isAuthenticated: req.session.isLoggedIn || false,
    userRole: req.session.userRole || null
  });
});

// Render patient signup page
router.get('/patient/signup', (req, res) => {
  res.render('patient_signup', {
    title: 'Patient Registration',
    isAuthenticated: false
  });
});

// Render patient login page
router.get('/patient/login', (req, res) => {
  res.render('patient_login', {
    title: 'Patient Login',
    isAuthenticated: false
  });
});

// Render doctor signup page
router.get('/doctor/signup', (req, res) => {
  res.render('doctor_signup', {
    title: 'Doctor Registration',
    isAuthenticated: false
  });
});

// Render doctor login page
router.get('/doctor/login', (req, res) => {
  res.render('doctor_login', {
    title: 'Doctor Login',
    isAuthenticated: false
  });
});

// Render patient details form page
router.get('/patient/details', auth, (req, res) => {
  // Check if user is a patient
  if (req.user.role !== 'patient') {
    return res.redirect('/');
  }
  
  res.render('patient_details', {
    title: 'Patient Details',
    isAuthenticated: true,
    userRole: 'patient'
  });
});

// Render information page after successful login/signup
router.get('/info', auth, (req, res) => {
  res.render('info', {
    title: 'Account Information',
    isAuthenticated: true,
    userRole: req.user.role
  });
});

// Render appointment page
router.get('/appointment', auth, async (req, res) => {
  try {
    // Get list of doctors for patient to select
    const doctors = await User.find({ role: 'doctor' })
      .select('name specialization')
      .sort({ name: 1 });
    
    res.render('appointment', {
      title: 'Book Appointment',
      isAuthenticated: true,
      userRole: req.user.role,
      doctors: doctors
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Render receipt page after successful appointment booking
router.get('/receipt/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name specialization')
      .populate('patient', 'name');
    
    if (!appointment) {
      return res.redirect('/');
    }
    
    // Check if current user is associated with this appointment
    if (req.user.role === 'patient' && appointment.patient._id.toString() !== req.user.id) {
      return res.status(403).redirect('/');
    }
    
    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user.id) {
      return res.status(403).redirect('/');
    }
    
    res.render('receipt', {
      title: 'Appointment Confirmation',
      isAuthenticated: true,
      userRole: req.user.role,
      appointment: appointment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
    }
    res.redirect('/');
  });
});

// Dashboard based on user role
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role === 'patient') {
      // Get patient's appointments
      const appointments = await Appointment.find({ patient: req.user.id })
        .populate('doctor', 'name specialization')
        .sort({ date: 1 });
      
      const user = await User.findById(req.user.id).select('-password');
      
      res.render('patient_dashboard', {
        title: 'Patient Dashboard',
        isAuthenticated: true,
        userRole: 'patient',
        user: user,
        appointments: appointments
      });
    } else if (req.user.role === 'doctor') {
      // Get doctor's appointments
      const appointments = await Appointment.find({ doctor: req.user.id })
        .populate('patient', 'name age gender')
        .sort({ date: 1 });
      
      const user = await User.findById(req.user.id).select('-password');
      
      res.render('doctor_dashboard', {
        title: 'Doctor Dashboard',
        isAuthenticated: true,
        userRole: 'doctor',
        user: user,
        appointments: appointments
      });
    } else {
      return res.redirect('/');
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;