// Smooth scroll to sections
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,  // Adjusting for fixed header
                behavior: 'smooth'
            });
        }
    });
});

// Add hover effect on buttons (Doctor and Patient login buttons)
const doctorBtn = document.querySelector('.btn.doctor');
const patientBtn = document.querySelector('.btn.patient');

doctorBtn.addEventListener('mouseover', function () {
    this.style.backgroundColor = '#1E88E5';
});
doctorBtn.addEventListener('mouseout', function () {
    this.style.backgroundColor = '#2196F3';
});

patientBtn.addEventListener('mouseover', function () {
    this.style.backgroundColor = '#FB8C00';
});
patientBtn.addEventListener('mouseout', function () {
    this.style.backgroundColor = '#FF9800';
});

// Scroll to top when clicking the logo
const logo = document.querySelector('.logo');
logo.addEventListener('click', function () {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Simple form validation (if needed for future forms)
function validateForm(event) {
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');

    if (!emailInput.value || !passwordInput.value) {
        alert("Please fill in all required fields.");
        event.preventDefault(); // Prevent form submission if fields are empty
    }
}

// Attach form validation if there are forms on the page
const loginForm = document.querySelector('#loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', validateForm);
}

// Sticky header effect (optional)
window.onscroll = function() {stickyHeader()};
const header = document.querySelector("header");
const sticky = header.offsetTop;

function stickyHeader() {
    if (window.pageYOffset > sticky) {
        header.classList.add("sticky");
    } else {
        header.classList.remove("sticky");
    }
}
