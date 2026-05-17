// app.js
document.addEventListener('DOMContentLoaded', () => {
    // Handle Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role = document.getElementById('role').value;
            
            if (role === 'admin') {
                window.location.href = 'admin_dashboard.html';
            } else if (role === 'teacher') {
                window.location.href = 'teacher_dashboard.html';
            } else if (role === 'student') {
                window.location.href = 'student_dashboard.html';
            }
        });
    }

    // Handle Signup Form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Registration successful! Please login.');
            window.location.href = 'index.html';
        });
    }

    // Handle Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }
});
