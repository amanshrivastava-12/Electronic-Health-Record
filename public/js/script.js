// Token handling functions
const getToken = () => {
  return localStorage.getItem('token');
};

// Logout function
const logoutUser = () => {
  removeToken();
  removeUser();
  window.location.href = '/';
};

// User profile functions
const updatePatientDetails = async (patientDetails) => {
  try {
    const response = await fetch('/api/auth/patient/details', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': getToken()
      },
      body: JSON.stringify(patientDetails)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to update patient details');
    }
    
    // Update user in localStorage
    setUser({ ...getUser(), patientDetails: data.patientDetails });
    
    return data;
  } catch (error) {
    console.error('Update patient details error:', error);
    throw error;
  }
};

const updateDoctorDetails = async (doctorDetails) => {
  try {
    const response = await fetch('/api/auth/doctor/details', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': getToken()
      },
      body: JSON.stringify(doctorDetails)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to update doctor details');
    }
    
    // Update user in localStorage
    setUser({ ...getUser(), doctorDetails: data.doctorDetails });
    
    return data;
  } catch (error) {
    console.error('Update doctor details error:', error);
    throw error;
  }
};

const getUserProfile = async () => {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'GET',
      headers: {
        'x-auth-token': getToken()
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to get user profile');
    }
    
    // Update user in localStorage
    setUser(data);
    
    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// Doctor functions
const getAllDoctors = async () => {
  try {
    const response = await fetch('/api/auth/doctors');
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to get doctors');
    }
    
    return data;
  } catch (error) {
    console.error('Get doctors error:', error);
    throw error;
  }
};

const getDoctorById = async (doctorId) => {
  try {
    const response = await fetch(`/api/auth/doctor/${doctorId}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to get doctor');
    }
    
    return data;
  } catch (error) {
    console.error('Get doctor error:', error);
    throw error;
  }
};

// Appointment functions
const createAppointment = async (appointmentData) => {
  try {
    const response = await fetch('/api/appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': getToken()
      },
      body: JSON.stringify(appointmentData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to create appointment');
    }
    
    return data;
  } catch (error) {
    console.error('Create appointment error:', error);
    throw error;
  }
};

const getAppointments = async () => {
  try {
    const response = await fetch('/api/appointment', {
      method: 'GET',
      headers: {
        'x-auth-token': getToken()
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to get appointments');
    }
    
    return data;
  } catch (error) {
    console.error('Get appointments error:', error);
    throw error;
  }
};

const getAppointmentById = async (appointmentId) => {
  try {
    const response = await fetch(`/api/appointment/${appointmentId}`, {
      method: 'GET',
      headers: {
        'x-auth-token': getToken()
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to get appointment');
    }
    
    return data;
  } catch (error) {
    console.error('Get appointment error:', error);
    throw error;
  }
};

const updateAppointmentStatus = async (appointmentId, updateData) => {
  try {
    const response = await fetch(`/api/appointment/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': getToken()
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to update appointment');
    }
    
    return data;
  } catch (error) {
    console.error('Update appointment error:', error);
    throw error;
  }
};

const updatePaymentStatus = async (appointmentId) => {
  try {
    const response = await fetch(`/api/appointment/${appointmentId}/payment`, {
      method: 'PUT',
      headers: {
        'x-auth-token': getToken()
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to update payment status');
    }
    
    return data;
  } catch (error) {
    console.error('Update payment status error:', error);
    throw error;
  }
};

const cancelAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`/api/appointment/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': getToken()
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to cancel appointment');
    }
    
    return data;
  } catch (error) {
    console.error('Cancel appointment error:', error);
    throw error;
  }
};

// Utility to format date
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Check auth status on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  if (isLoggedIn()) {
    const user = getUser();
    
    // Show/hide elements based on login status
    const loggedInElements = document.querySelectorAll('.logged-in');
    const loggedOutElements = document.querySelectorAll('.logged-out');
    
    loggedInElements.forEach(el => el.style.display = 'block');
    loggedOutElements.forEach(el => el.style.display = 'none');
    
    // Show/hide elements based on user role
    if (user && user.role) {
      const patientElements = document.querySelectorAll('.patient-only');
      const doctorElements = document.querySelectorAll('.doctor-only');
      
      if (user.role === 'patient') {
        patientElements.forEach(el => el.style.display = 'block');
        doctorElements.forEach(el => el.style.display = 'none');
      } else if (user.role === 'doctor') {
        doctorElements.forEach(el => el.style.display = 'block');
        patientElements.forEach(el => el.style.display = 'none');
      }
    }
  } else {
    // User is not logged in
    const loggedInElements = document.querySelectorAll('.logged-in');
    const loggedOutElements = document.querySelectorAll('.logged-out');
    
    loggedInElements.forEach(el => el.style.display = 'none');
    loggedOutElements.forEach(el => el.style.display = 'block');
  }
});

const setToken = (token) => {
  localStorage.setItem('token', token);
};

const removeToken = () => {
  localStorage.removeItem('token');
};

const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

const removeUser = () => {
  localStorage.removeItem('user');
};

// Check if user is logged in
const isLoggedIn = () => {
  return !!getToken();
};

// Authentication functions
const registerUser = async (userData) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Registration failed');
    }
    
    // Store token and user data
    setToken(data.token);
    setUser(data.user);
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

const loginUser = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Login failed');
    }
    
    // Store token and user data
    setToken(data.token);
    setUser(data.user);
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};