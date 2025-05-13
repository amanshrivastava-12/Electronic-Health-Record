const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash'); // Add flash for validation error messages
require('dotenv').config();

// Initialize app
const app = express();

// Connect to Database
connectDB();

// Initialize middleware
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key_for_session',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Flash middleware (needs to be after session)
app.use(flash());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import route files
const indexRoutes = require('./routes/index');
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const appointmentRoutes = require('./routes/appointment');
const authRoutes = require('./routes/auth');

// Define routes
app.use('/', indexRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);

// 404 Error handling - must be before the main error handler
app.use((req, res, next) => {
  res.status(404);
  
  // Handle API requests
  if (req.xhr || req.path.startsWith('/api/') || req.get('Content-Type') === 'application/json') {
    return res.json({ error: { message: 'Resource not found', status: 404 } });
  }
  
  // Handle page requests
  res.render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    status: 404,
    isAuthenticated: req.session.isLoggedIn || false,
    userRole: req.session.userRole || null
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  
  // Determine if this is an API request or a page request
  const isApiRequest = req.xhr || req.path.startsWith('/api/') || req.get('Content-Type') === 'application/json';
  
  // Set status code
  const statusCode = err.status || 500;
  res.status(statusCode);
  
  // For API requests, return JSON
  if (isApiRequest) {
    return res.json({
      error: {
        message: err.message || 'An unexpected error occurred',
        status: statusCode
      }
    });
  }
  
  // For validation errors, redirect back to the form
  if (err.array && typeof err.array === 'function') {
    // This is an express-validator error
    req.flash('errors', err.array());
    return res.redirect('back');
  }
  
  // For page requests, try to render an error view
  try {
    res.render('error', {
      title: 'Server Error',
      message: err.message || 'Something went wrong on our end. Please try again later.',
      status: statusCode,
      isAuthenticated: req.session.isLoggedIn || false,
      userRole: req.session.userRole || null
    });
  } catch (e) {
    // If error view doesn't exist, show a simple error message
    res.send(`
      <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error-container { max-width: 600px; margin: 0 auto; }
            h1 { color: #e74c3c; }
            .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; 
                  background: #3498db; color: #fff; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>Error</h1>
            <p>${err.message || 'An error occurred'}</p>
            <a href="javascript:history.back()" class="btn">Go Back</a>
          </div>
        </body>
      </html>
    `);
  }
});

// Set port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;