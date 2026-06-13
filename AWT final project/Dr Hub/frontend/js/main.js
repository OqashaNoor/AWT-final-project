// ========== API CONFIGURATION ==========
const API_URL = 'http://localhost:5000/api';

// ========== UTILITY FUNCTIONS ==========
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const token = localStorage.getItem('token');
        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'auth.html';
            }
            const error = await response.json();
            throw new Error(error.message || `API error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

function showMessage(elementId, message, type = 'error') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
        if (type === 'success') {
            element.classList.remove('error-message');
            element.classList.add('success-message');
        } else {
            element.classList.add('error-message');
        }
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// ========== DARK MODE ==========
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    function syncStars() {
        if (typeof window.syncCosmosNightHtmlClass === 'function') {
            window.syncCosmosNightHtmlClass();
        }
    }

    // Keep star overlay in sync before early return when no navbar toggle
    if (!darkModeToggle) {
        syncStars();
        return;
    }

    // Check if dark mode was previously enabled
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
        darkModeToggle.classList.add('active');
    }
    syncStars();

    // Toggle dark mode on button click
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isActive = document.body.classList.contains('dark-mode');
        
        // Update button appearance
        darkModeToggle.textContent = isActive ? '☀️' : '🌙';
        darkModeToggle.classList.toggle('active', isActive);
        
        // Save preference
        localStorage.setItem('darkMode', isActive);

        syncStars();
    });
}

// ========== IMAGE UPLOAD PREVIEW ==========
function initImagePreview() {
    const profileImageInput = document.getElementById('profileImage');
    if (!profileImageInput) return;

    profileImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${event.target.result}" alt="Profile Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

function initSocket() {
    if (!window.io) return;

    try {
        const socket = io('http://localhost:5000');
        socket.on('appointmentUpdated', () => {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            if (currentPage === 'patient-dashboard.html' && typeof loadAppointments === 'function') {
                loadAppointments();
            }
            if (currentPage === 'doctor-dashboard.html' && typeof refreshSmileDoctorDashboard === 'function') {
                refreshSmileDoctorDashboard(true);
            }
        });
    } catch (error) {
        console.warn('Socket connection failed:', error);
    }
}

// ========== AUTHENTICATION ==========
function initAuthPage() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Hide all forms
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            
            // Remove active class from all buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            
            // Show selected form and activate button
            document.getElementById(tabName).classList.add('active');
            btn.classList.add('active');
        });
    });

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const role = document.getElementById('loginRole').value;

            if (!role) {
                showMessage('loginError', 'Please select your role');
                return;
            }

            try {
                const result = await apiCall('/auth/login', 'POST', {
                    email,
                    password,
                    role,
                });

                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('userId', result.user.id);
                
                showMessage('loginSuccess', 'Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    if (role === 'patient') {
                        window.location.href = 'patient-dashboard-new.html';
                    } else if (role === 'doctor') {
                        window.location.href = 'doctor-dashboard.html';
                    }
                }, 1500);
            } catch (error) {
                showMessage('loginError', error.message);
            }
        });
    }

    // Register
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const phone = document.getElementById('registerPhone').value;
            const role = document.getElementById('registerRole').value;

            if (!role) {
                showMessage('registerError', 'Please select your role');
                return;
            }

            try {
                const result = await apiCall('/auth/register', 'POST', {
                    name,
                    email,
                    password,
                    phone,
                    role,
                });

                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('userId', result.user.id);
                
                showMessage('registerSuccess', 'Account created! Redirecting...', 'success');
                
                setTimeout(() => {
                    if (role === 'patient') {
                        window.location.href = 'patient-dashboard-new.html';
                    } else if (role === 'doctor') {
                        window.location.href = 'doctor-dashboard.html';
                    }
                }, 1500);
            } catch (error) {
                showMessage('registerError', error.message);
            }
        });
    }
}

// ========== PATIENT DASHBOARD ==========
function initPatientDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.role !== 'patient') {
        window.location.href = 'auth.html';
        return;
    }

    // Initialize dashboard components
    initDarkMode();
    loadPatientProfile(user);
    loadDashboardDate();

    // Sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.textContent.includes('Logout')) return;

            e.preventDefault();
            const section = item.dataset.section;

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.content-section').forEach(s => {
                s.classList.remove('active');
            });

            document.getElementById(`${section}-section`).classList.add('active');
            document.getElementById('pageTitle').textContent =
                section === 'appointments' ? 'My Appointments' :
                section === 'doctors' ? 'Find a Doctor' :
                'My Profile';

            if (section === 'appointments') loadAppointments();
            if (section === 'doctors') loadDoctors();
            if (section === 'profile') loadProfileForm();
        });
    });

    // Load initial sections
    loadAppointments();
    loadDoctors();

    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                await apiCall('/patients/profile', 'PUT', {
                    name: document.getElementById('profileName').value,
                    phone: document.getElementById('profilePhone').value,
                    dateOfBirth: document.getElementById('profileDOB').value,
                    address: document.getElementById('profileAddress').value,
                });

                showMessage('profileMessage', 'Profile updated successfully!', 'success');
            } catch (error) {
                showMessage('profileMessage', error.message);
            }
        });
    }

    // Modal handling
    const modal = document.getElementById('appointmentModal');
    const closeBtn = document.querySelector('.modal-close');
    
    closeBtn?.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    const editModal = document.getElementById('editAppointmentModal');
    const editCloseBtn = document.querySelector('#editAppointmentModal .modal-close');
    editCloseBtn?.addEventListener('click', () => {
        editModal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.remove('show');
        }
    });

    const editForm = document.getElementById('editAppointmentForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentEditAppointmentId) {
                return;
            }

            try {
                await apiCall(`/appointments/${currentEditAppointmentId}`, 'PUT', {
                    date: document.getElementById('editAppointmentDate').value,
                    time: document.getElementById('editAppointmentTime').value,
                    treatment: document.getElementById('editAppointmentTreatment').value,
                    description: document.getElementById('editAppointmentNotes').value,
                });

                showMessage('editAppointmentError', 'Appointment updated successfully!', 'success');
                editModal.classList.remove('show');
                loadAppointments();
            } catch (error) {
                showMessage('editAppointmentError', error.message);
            }
        });
    }

    // Book appointment form
    const bookForm = document.getElementById('bookAppointmentForm');
    if (bookForm) {
        bookForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                await apiCall('/appointments', 'POST', {
                    patientId: user.id,
                    doctorId: document.getElementById('appointmentDoctorId').value,
                    appointmentDate: document.getElementById('appointmentDate').value,
                    appointmentTime: document.getElementById('appointmentTime').value,
                    reason: document.getElementById('appointmentReason').value,
                    description: document.getElementById('appointmentDescription').value,
                });

                showMessage('appointmentError', 'Appointment booked successfully!', 'success');
                modal.classList.remove('show');
                bookForm.reset();
                loadAppointments();
                
                setTimeout(() => {
                    document.getElementById('appointmentError').classList.remove('show');
                }, 2000);
            } catch (error) {
                showMessage('appointmentError', error.message);
            }
        });
    }
}

async function loadAppointments() {
    const appointmentsList = document.getElementById('appointmentsList');
    if (!appointmentsList) return;

    try {
        appointmentsList.innerHTML = '<div class="loading">Loading appointments...</div>';
        
        const appointments = await apiCall('/appointments/user/appointments', 'GET');

        if (appointments.length === 0) {
            appointmentsList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <p>No appointments yet. <a href="#" onclick="document.querySelector('[data-section=\"doctors\"]').click()">Book one now!</a></p>
                </div>
            `;
            return;
        }

        appointmentsList.innerHTML = appointments.map(apt => {
            const appointmentDate = apt.date || apt.appointmentDate;
            const appointmentTime = apt.time || apt.appointmentTime;
            const treatment = apt.treatment || apt.reason;
            const formattedDate = appointmentDate ? new Date(appointmentDate).toLocaleDateString() : '';
            const canEdit = apt.status === 'pending' || apt.status === 'confirmed';

            return `
            <div class="appointment-item">
                <div class="appointment-header">
                    <div>
                        <div class="appointment-title">${apt.doctorId?.userId?.name || 'Doctor'}</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">${apt.doctorId?.specialization || ''}</div>
                    </div>
                    <span class="appointment-status status-${apt.status}">${apt.status}</span>
                </div>
                <div class="appointment-details">
                    <div class="appointment-detail">
                        <div class="appointment-detail-label">📅 Date</div>
                        <div class="appointment-detail-value">${formattedDate}</div>
                    </div>
                    <div class="appointment-detail">
                        <div class="appointment-detail-label">⏰ Time</div>
                        <div class="appointment-detail-value">${appointmentTime}</div>
                    </div>
                    <div class="appointment-detail">
                        <div class="appointment-detail-label">🏥 Treatment</div>
                        <div class="appointment-detail-value">${treatment}</div>
                    </div>
                </div>
                ${canEdit ? `
                    <div class="appointment-actions">
                        <button class="btn-reschedule" onclick="showRescheduleModal('${apt._id}')">Edit</button>
                        <button class="btn-cancel" onclick="cancelAppointment('${apt._id}')">Cancel</button>
                    </div>
                ` : ''}
            </div>
        `; }).join('');
    } catch (error) {
        appointmentsList.innerHTML = `<div style="color: var(--error); padding: 2rem;">${error.message}</div>`;
    }
}

async function loadDoctors() {
    const doctorsList = document.getElementById('doctorsList');
    if (!doctorsList) return;

    try {
        doctorsList.innerHTML = '<div class="loading">Loading doctors...</div>';
        
        const doctors = await apiCall('/doctors', 'GET');

        if (doctors.length === 0) {
            doctorsList.innerHTML = '<div style="text-align: center; padding: 2rem;">No doctors available</div>';
            return;
        }

        doctorsList.innerHTML = doctors.map(doctor => `
            <div class="doctor-card">
                <div class="doctor-avatar">
                    ${doctor.profileImage ? `<img src="${doctor.profileImage}" alt="${doctor.userId.name}" />` : '👨‍⚕️'}
                </div>
                <div class="doctor-info">
                    <div class="doctor-name">${doctor.userId.name}</div>
                    <div class="doctor-specialty">${doctor.specialization}</div>
                    <div class="doctor-details">
                        <div>📞 ${doctor.userId.phone}</div>
                        <div>⭐ ${doctor.yearsOfExperience} years experience</div>
                    </div>
                    <div class="doctor-rating">Rating: ${doctor.rating}/5 ⭐</div>
                    <div class="doctor-fee">$${doctor.consultationFee}</div>
                    <button class="btn btn-primary book-btn" onclick="showBookModal('${doctor._id}', '${doctor.userId.name}')">
                        Book Appointment
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        doctorsList.innerHTML = `<div style="color: var(--error); padding: 2rem;">${error.message}</div>`;
    }
}

function loadProfileForm() {
    const user = JSON.parse(localStorage.getItem('user'));

    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profilePhone').value = user.phone || '';
}

function loadPatientProfile(user) {
    // Update greeting
    document.getElementById('greetingText').textContent = `Hello, ${user.name}`;

    // Update profile card
    document.getElementById('patientNameDisplay').textContent = user.name;
    document.getElementById('patientEmailDisplay').textContent = user.email;
    document.getElementById('userName').textContent = `Welcome, ${user.name}`;

    // Load profile image if available
    if (user.profileImage) {
        displayPatientImage(user.profileImage);
    }
}

function loadDashboardDate() {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    document.getElementById('dashboardDateDay').textContent = dayName;
    document.getElementById('dashboardDateValue').textContent = formattedDate;
}

function displayPatientImage(imagePath) {
    const avatarDisplay = document.getElementById('patientAvatarDisplay');
    if (!avatarDisplay) return;
    const src = resolveProfileImageUrl(imagePath);
    avatarDisplay.innerHTML = src ? `<img src="${src}" alt="Profile image" class="profile-image" />` : '👤';
}

function resolveProfileImageUrl(imagePath) {
    if (!imagePath) return '';
    if (typeof imagePath !== 'string') return imagePath;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    if (imagePath.startsWith('/')) {
        return `http://localhost:5000${imagePath}`;
    }
    return imagePath;
}

let currentEditAppointmentId = null;

function showBookModal(doctorId, doctorName) {
    document.getElementById('appointmentDoctor').value = doctorName;
    document.getElementById('appointmentDoctorId').value = doctorId;
    document.getElementById('appointmentModal').classList.add('show');
}

async function showRescheduleModal(appointmentId) {
    try {
        const appointment = await apiCall(`/appointments/${appointmentId}`, 'GET');
        currentEditAppointmentId = appointmentId;

        document.getElementById('editAppointmentDate').value = appointment.date ? appointment.date.split('T')[0] : appointment.appointmentDate?.split('T')[0] || '';
        document.getElementById('editAppointmentTime').value = appointment.time || appointment.appointmentTime || '';
        document.getElementById('editAppointmentTreatment').value = appointment.treatment || appointment.reason || '';
        document.getElementById('editAppointmentNotes').value = appointment.description || '';
        document.getElementById('editAppointmentModal').classList.add('show');
    } catch (error) {
        alert(error.message);
    }
}

async function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
            await apiCall(`/appointments/cancel/${appointmentId}`, 'PATCH');
            showMessage('appointmentsList', 'Appointment cancelled successfully!', 'success');
            loadAppointments();
        } catch (error) {
            alert(error.message);
        }
    }
}


// ========== BOOKING MODAL FUNCTIONS ==========
function openBookingForm() {
    // Load available doctors
    loadDoctorsForBooking();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').min = today;
    
    // Reset slots
    document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Select a date first</p>';
    document.getElementById('appointmentTime').value = '';
    
    document.getElementById('bookingModal').classList.add('show');
}

function closeBookingForm() {
    document.getElementById('bookingModal').classList.remove('show');
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingError').textContent = '';
    document.getElementById('bookingSuccess').textContent = '';
}

async function loadDoctorsForBooking() {
    try {
        const doctors = await apiCall('/doctors', 'GET');
        const doctorSelect = document.getElementById('bookingDoctor');
        
        // Clear existing options except the first one
        doctorSelect.innerHTML = '<option value="">Choose a doctor</option>';
        
        doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor._id;
            option.textContent = `Dr. ${doctor.name} - ${doctor.specialization}`;
            doctorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading doctors:', error);
        document.getElementById('bookingError').textContent = 'Failed to load doctors. Please try again.';
    }
}

function initBookingSlots() {
    const doctorSelect = document.getElementById('bookingDoctor');
    const dateInput = document.getElementById('bookingDate');
    
    if (!doctorSelect || !dateInput) return;
    
    // When doctor changes, reset slots
    doctorSelect.addEventListener('change', () => {
        document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Please select a doctor first</p>';
        document.getElementById('appointmentTime').value = '';
    });
    
    // When date changes, fetch slots
    dateInput.addEventListener('change', () => {
        const doctorId = doctorSelect.value;
        const date = dateInput.value;
        
        if (!doctorId) {
            document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Please select a doctor first</p>';
            return;
        }
        
        if (!date) {
            document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Select a date first</p>';
            return;
        }
        
        loadBookingSlots(doctorId, date);
    });
}

async function loadBookingSlots(doctorId, date) {
    try {
        document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Loading available slots...</p>';
        
        const response = await fetch(`${API_URL}/appointments/available-slots/${doctorId}?date=${date}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load available slots');
        }
        
        const data = await response.json();
        renderBookingTimeSlots(data.slots);
    } catch (error) {
        console.error('Error loading slots:', error);
        document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e74c3c;">Failed to load available slots</p>';
    }
}

function renderBookingTimeSlots(slots) {
    const container = document.getElementById('timeSlotContainer');
    
    if (!slots || slots.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No slots available</p>';
        return;
    }
    
    let html = '';
    slots.forEach(slot => {
        const isBooked = slot.isBooked;
        const buttonClass = isBooked ? 'time-slot booked' : 'time-slot available';
        const disabled = isBooked ? 'disabled' : '';
        
        html += `
            <button 
                type="button" 
                class="${buttonClass}" 
                data-time="${slot.time}"
                ${disabled}
                onclick="selectBookingTimeSlot('${slot.time}', ${isBooked})"
            >
                ${slot.time}
            </button>
        `;
    });
    
    container.innerHTML = html;
}

function selectBookingTimeSlot(time, isBooked) {
    if (isBooked) {
        showNotification('⚠️ This time slot is already booked. Please select another slot.', 'error');
        return;
    }
    
    // Update hidden input
    document.getElementById('appointmentTime').value = time;
    
    // Update UI - remove previous selection and add to new
    document.querySelectorAll('#timeSlotContainer .time-slot').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selected class to clicked button
    event.target.classList.add('selected');
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Initialize dark mode on all pages
    initDarkMode();
    initImagePreview();
    initSocket();

    // Handle booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                doctorId: document.getElementById('bookingDoctor').value,
                treatment: document.getElementById('bookingTreatment').value,
                date: document.getElementById('bookingDate').value,
                time: document.getElementById('appointmentTime').value,
                notes: document.getElementById('bookingNotes').value
            };

            try {
                document.getElementById('bookingError').textContent = '';
                document.getElementById('bookingSuccess').textContent = '';
                
                const result = await apiCall('/appointments', 'POST', formData);
                
                document.getElementById('bookingSuccess').textContent = 'Appointment booked successfully!';
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    closeBookingForm();
                    // Reload appointments if on patient dashboard
                    if (window.location.pathname.includes('patient-dashboard.html')) {
                        loadAppointments();
                    }
                }, 2000);
                
            } catch (error) {
                document.getElementById('bookingError').textContent = error.message;
            }
        });
    }

    // Close modal when clicking outside
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) {
        bookingModal.addEventListener('click', function(e) {
            if (e.target === bookingModal) {
                closeBookingForm();
            }
        });
    }

    // Initialize booking form slot fetching
    initBookingSlots();

    if (currentPage === 'auth.html') {
        initAuthPage();
    } else if (currentPage === 'patient-dashboard.html') {
        initPatientDashboard();
    } else if (currentPage === 'doctor-dashboard.html') {
        if (typeof initSmileDoctorDashboard === 'function') {
            initSmileDoctorDashboard();
        }
    }
});

// ========== PATIENT DASHBOARD FUNCTIONS ==========
function initPatientDashboard() {
    initDarkMode();
    initSocket();
    loadUserProfile();
    loadDashboardData();
    loadAppointments();
    loadDoctors();
    loadPatientHistory();

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }

    // History form
    const historyForm = document.getElementById('historyForm');
    if (historyForm) {
        historyForm.addEventListener('submit', addPatientHistory);
    }

    // Doctor search
    const doctorSearch = document.getElementById('doctorSearch');
    if (doctorSearch) {
        doctorSearch.addEventListener('input', filterDoctors);
    }
}

function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Activate nav item
    const targetNav = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        appointments: 'My Appointments',
        doctors: 'Find Doctor',
        history: 'Patient History',
        profile: 'Patient Profile'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Patient Dashboard';
}

async function loadDashboardData() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        // Load next appointment
        const appointments = await apiCall(`/appointments?patientId=${user._id}`);
        const upcomingAppointments = appointments.filter(app => 
            (app.status === 'confirmed' || app.status === 'scheduled') && new Date(app.date) >= new Date()
        );
        const nextAppointment = upcomingAppointments.sort((a, b) => new Date(a.date) - new Date(b.date))[0];

        const appointmentContent = document.getElementById('nextAppointmentContent');
        if (nextAppointment) {
            const doctor = await apiCall(`/doctors/${nextAppointment.doctorId}`);
            appointmentContent.innerHTML = `
                <p><strong>Doctor:</strong> ${doctor.userId.name}</p>
                <p><strong>Day:</strong> ${new Date(nextAppointment.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                <p><strong>Date:</strong> ${new Date(nextAppointment.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${nextAppointment.time}</p>
                <p><strong>Treatment:</strong> ${nextAppointment.treatment}</p>
            `;
        } else {
            appointmentContent.innerHTML = '<div class="no-appointment">No upcoming appointments</div>';
        }

        // Set current date
        const now = new Date();
        document.getElementById('dashboardDateDay').textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
        document.getElementById('dashboardDateValue').textContent = now.toLocaleDateString();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadUserProfile() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        // Load full profile
        const profile = await apiCall('/user/profile');

        // Update display
        document.getElementById('userName').textContent = `Welcome, ${profile.name}`;

        // Profile page
        document.getElementById('profileNameDisplay').textContent = profile.name;
        document.getElementById('profileEmailDisplay').textContent = profile.email;
        document.getElementById('profilePhoneDisplay').textContent = profile.phone || 'Not provided';
        const age = profile.dateOfBirth ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear() : 'Not provided';
        document.getElementById('profileAgeDisplay').textContent = `Age: ${age}`;

        // Profile image
        if (profile.profileImage) {
            document.getElementById('profileImageDisplay').src = `http://localhost:5000/uploads/${profile.profileImage}`;
            document.getElementById('profileImageDisplay').style.display = 'block';
            document.getElementById('profileAvatarPlaceholder').style.display = 'none';
        } else {
            document.getElementById('profileImageDisplay').style.display = 'none';
            document.getElementById('profileAvatarPlaceholder').style.display = 'block';
        }

        // Form values
        document.getElementById('profileName').value = profile.name;
        document.getElementById('profileEmail').value = profile.email;
        document.getElementById('profilePhone').value = profile.phone || '';
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function updateProfile(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('profileName').value);
    formData.append('email', document.getElementById('profileEmail').value);
    formData.append('phone', document.getElementById('profilePhone').value);
    
    const profileImage = document.getElementById('profileImage').files[0];
    if (profileImage) {
        formData.append('profileImage', profileImage);
    }

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const result = await fetch(`${API_URL}/patient/update/${user._id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!result.ok) {
            throw new Error('Update failed');
        }

        const updatedUser = await result.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        showMessage('profileMessage', 'Profile updated successfully!', 'success');
        loadUserProfile();
    } catch (error) {
        showMessage('profileMessage', error.message);
    }
}

async function loadPatientHistory() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const history = await apiCall(`/patient/history/${user._id}`);
        
        const historyList = document.getElementById('historyList');
        if (history.length === 0) {
            historyList.innerHTML = '<p>No history records found.</p>';
            return;
        }

        historyList.innerHTML = history.map(entry => `
            <div class="history-entry">
                <h4>${entry.disease}</h4>
                <p>${entry.notes}</p>
                <small>${new Date(entry.createdAt).toLocaleDateString()}</small>
                ${entry.prescriptionImage ? `<img src="http://localhost:5000/uploads/${entry.prescriptionImage}" alt="Prescription">` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('historyList').innerHTML = '<p>Error loading history.</p>';
    }
}

async function addPatientHistory(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('patientId', JSON.parse(localStorage.getItem('user'))._id);
    formData.append('disease', document.getElementById('disease').value);
    formData.append('notes', document.getElementById('notes').value);
    
    const prescriptionImage = document.getElementById('prescriptionImage').files[0];
    if (prescriptionImage) {
        formData.append('prescriptionImage', prescriptionImage);
    }

    try {
        await fetch(`${API_URL}/patient/history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        showMessage('historyMessage', 'History added successfully!', 'success');
        document.getElementById('historyForm').reset();
        loadPatientHistory();
    } catch (error) {
        showMessage('historyMessage', error.message);
    }
}
