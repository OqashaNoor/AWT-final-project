// ===== API Configuration =====
const SERVER_URL = 'http://localhost:5000';
const API_URL = `${SERVER_URL}/api`;

// ===== State Management =====
let currentPatientId = null;
let currentUser = null;
let doctorsList = [];

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'auth.html';
            return;
        }

        // Get current user from token
        currentPatientId = localStorage.getItem('userId');
        if (!currentPatientId) {
            window.location.href = 'auth.html';
            return;
        }

        // Load initial data
        await loadDashboardData();
        setupEventListeners();
        updateDateTime();
        
        // Update time every second
        setInterval(updateDateTime, 1000);
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Error initializing dashboard', 'error');
    }
});

// ===== Setup Event Listeners =====
function setupEventListeners() {
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToSection(item.dataset.section);
        });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Profile form
    document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);

    // History form
    document.getElementById('historyForm').addEventListener('submit', handleHistorySubmit);

    // Profile image upload
    const profileImageUpload = document.getElementById('profileImageUpload');
    if (profileImageUpload) {
        profileImageUpload.addEventListener('change', handleProfileImageUpload);
    }

    // Book appointment form
    document.getElementById('bookAppointmentForm').addEventListener('submit', handleBookAppointment);

    // Date change for slot loading
    document.getElementById('appointmentDate').addEventListener('change', loadAvailableSlots);

    // Doctor change for resetting slots
    document.getElementById('appointmentDoctor').addEventListener('change', () => {
        document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Select a date first</p>';
        document.getElementById('appointmentTime').value = '';
    });
}

// ===== Navigation =====
function navigateToSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const navItem = document.querySelector(`[data-section="${section}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        doctors: 'Find Doctor',
        history: 'Patient History',
        profile: 'Patient Profile',
        emergency: 'Emergency Doctors'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

    // Load section data
    if (section === 'doctors' && doctorsList.length === 0) {
        loadDoctors();
    } else if (section === 'history') {
        loadPatientHistory();
    } else if (section === 'profile') {
        loadPatientProfile();
    }
}

// ===== Load Dashboard Data =====
async function loadDashboardData() {
    try {
        const response = await apiCall(`/patient/dashboard/${currentPatientId}`);
        
        // Update greeting
        document.getElementById('greetingName').textContent = `Hello ${response.patient.name},`;
        document.getElementById('userEmail').textContent = response.patient.email;
        
        // Update medical summary
        updateMedicalSummary(response.medicalSummary);
        
        // Update appointments
        renderAppointments(response.upcomingAppointments);
        
        // Update reward points (random for now)
        document.getElementById('rewardPoints').textContent = Math.floor(Math.random() * 2000);
        
        currentUser = response.patient;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// ===== Update Medical Summary =====
function updateMedicalSummary(summary) {
    // Update allergies
    const allergiesList = document.getElementById('allergiesList');
    if (summary.allergies && summary.allergies.length > 0) {
        allergiesList.innerHTML = summary.allergies
            .map(allergy => `<span class="allergy-tag">${allergy}</span>`)
            .join('');
    } else {
        allergiesList.innerHTML = '<span class="no-data">No allergies recorded</span>';
    }

    // Update treatment
    const treatmentInfo = document.getElementById('treatmentInfo');
    if (summary.treatment && summary.treatment !== 'None') {
        treatmentInfo.textContent = summary.treatment;
    } else {
        treatmentInfo.innerHTML = '<span class="no-data">None</span>';
    }

    // Update blood type
    document.getElementById('bloodTypeInfo').innerHTML = `<span class="blood-type">${summary.bloodType}</span>`;

    // Update last cleaning date
    const lastCleaningDate = document.getElementById('lastCleaningDate');
    if (summary.lastVisitDate) {
        lastCleaningDate.textContent = formatDate(summary.lastVisitDate);
    } else {
        lastCleaningDate.textContent = 'Not recorded';
    }
}

// ===== Render Appointments =====
function renderAppointments(appointments) {
    const appointmentsList = document.getElementById('appointmentsList');
    
    if (!appointments || appointments.length === 0) {
        appointmentsList.innerHTML = '<div class="no-appointment"><p>No upcoming appointments</p></div>';
        return;
    }

    appointmentsList.innerHTML = appointments.map(apt => `
        <div class="appointment-item">
            <div class="appointment-header">
                <div class="appointment-title">${apt.treatment || 'Consultation'}</div>
                <span class="appointment-status ${apt.status}">${apt.status}</span>
            </div>
            <div class="appointment-details">
                <div class="appointment-detail">
                    <span>📅</span>
                    <span>${formatDate(apt.date)}</span>
                </div>
                <div class="appointment-detail">
                    <span>🕐</span>
                    <span>${apt.time}</span>
                </div>
                <div class="appointment-detail">
                    <span>👨‍⚕️</span>
                    <span>${apt.doctorName}</span>
                </div>
                <div class="appointment-detail">
                    <span>�</span>
                    <span>${apt.specialty}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Load Doctors =====
async function loadDoctors() {
    try {
        document.getElementById('doctorsList').innerHTML = '<div class="loading">Loading doctors...</div>';
        const doctors = await apiCall('/patient/doctors');
        
        doctorsList = doctors;
        document.getElementById('totalDoctors').textContent = doctors.length;
        
        renderDoctors(doctors);
        updateDoctorSelect(doctors);
    } catch (error) {
        console.error('Error loading doctors:', error);
        document.getElementById('doctorsList').innerHTML = '<div class="loading">Failed to load doctors</div>';
    }
}

// ===== Render Doctors Grid =====
function renderDoctors(doctors) {
    const doctorsList = document.getElementById('doctorsList');
    
    if (!doctors || doctors.length === 0) {
        doctorsList.innerHTML = '<div class="loading">No doctors available</div>';
        return;
    }

    doctorsList.innerHTML = doctors.map(doctor => `
        <div class="doctor-card">
            <div class="doctor-image">
                ${doctor.image ? `<img src="${resolveImageUrl(doctor.image)}" alt="${doctor.name}">` : '👨‍⚕️'}
            </div>
            <div class="doctor-content">
                <div class="doctor-name">${doctor.name}</div>
                <div class="doctor-specialty">${doctor.specialty}</div>
                <div class="doctor-rating">
                    <span class="stars">⭐ ${doctor.rating}</span>
                </div>
                <div class="doctor-available">
                    <span>📅 Available: ${doctor.available}</span>
                </div>
                <div class="doctor-actions">
                    <button class="btn btn-primary btn-sm" onclick="selectDoctorAndBook('${doctor.id}', '${doctor.name}')">
                        Book Appointment
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Update Doctor Select =====
function updateDoctorSelect(doctors) {
    const select = document.getElementById('appointmentDoctor');
    select.innerHTML = '<option value="">Choose a doctor...</option>';
    
    doctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.id;
        option.textContent = `${doctor.name} - ${doctor.specialty}`;
        select.appendChild(option);
    });
}

// ===== Load Patient History =====
async function loadPatientHistory() {
    try {
        document.getElementById('historyList').innerHTML = '<div class="loading">Loading history...</div>';
        const history = await apiCall(`/patient/history/${currentPatientId}`);
        
        renderPatientHistory(history);
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('historyList').innerHTML = '<div class="loading">Failed to load history</div>';
    }
}

// ===== Render Patient History =====
function renderPatientHistory(history) {
    const historyList = document.getElementById('historyList');
    
    if (!history || history.length === 0) {
        historyList.innerHTML = '<div class="loading">No history records yet</div>';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-entry">
            <div class="history-entry-title">${item.disease}</div>
            <div class="history-entry-date">${formatDate(item.date)}</div>
            <div class="history-entry-notes">${item.notes}</div>
            ${item.prescriptionImage ? `<img src="${resolveImageUrl(item.prescriptionImage)}" alt="Prescription" class="history-entry-image" onclick="openImage('${item.prescriptionImage}')">` : ''}
        </div>
    `).join('');
}

// ===== Load Patient Profile =====
async function loadPatientProfile() {
    try {
        const profile = await apiCall(`/patient/profile/${currentPatientId}`);
        
        // Populate form
        document.getElementById('profileName').value = profile.name;
        document.getElementById('profileEmail').value = profile.email;
        document.getElementById('profilePhone').value = profile.phone;
        document.getElementById('profileAddress').value = profile.address || '';
        document.getElementById('profileAge').value = profile.age || '';
        document.getElementById('profileGender').value = profile.gender || '';
        
        // Display profile image in card
        if (profile.profileImage) {
            const cardImg = document.getElementById('profileCardImage');
            cardImg.src = resolveImageUrl(profile.profileImage);
            cardImg.style.display = 'block';
            cardImg.onload = function() {
                document.getElementById('profileCardPlaceholder').style.display = 'none';
            };
            cardImg.onerror = function() {
                cardImg.style.display = 'none';
                document.getElementById('profileCardPlaceholder').style.display = 'flex';
            };
        } else {
            document.getElementById('profileCardPlaceholder').style.display = 'flex';
            document.getElementById('profileCardImage').style.display = 'none';
        }
        
        // Display patient name, email, phone, gender and patient ID in profile card
        document.getElementById('profileCardName').textContent = profile.name;
        document.getElementById('profileCardEmail').textContent = profile.email;
        document.getElementById('profileCardPhone').textContent = `Phone: ${profile.phone || 'N/A'}`;
        document.getElementById('profileCardGender').textContent = `Gender: ${profile.gender || 'N/A'}`;
        document.getElementById('profileCardPatientId').textContent = `ID: ${profile.patientId || 'N/A'}`;
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile data', 'error');
    }
}

// ===== Handle Profile Form Submit =====
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('profileName').value);
        formData.append('email', document.getElementById('profileEmail').value);
        formData.append('phone', document.getElementById('profilePhone').value);
        formData.append('address', document.getElementById('profileAddress').value);
        formData.append('age', document.getElementById('profileAge').value);
        formData.append('gender', document.getElementById('profileGender').value);

        // Include image if one is selected
        const profileImageInput = document.getElementById('profileImageUpload');
        if (profileImageInput && profileImageInput.files.length > 0) {
            formData.append('profileImage', profileImageInput.files[0]);
        }

        const response = await fetch(`${API_URL}/patient/profile/${currentPatientId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Update failed');
        }

        const result = await response.json();

        // Update image display if image was uploaded
        if (result.patient.profileImage) {
            const img = document.getElementById('profileCardImage');
            img.src = resolveImageUrl(result.patient.profileImage) + '?t=' + Date.now();
            img.style.display = 'block';
            img.onload = function() {
                document.getElementById('profileCardPlaceholder').style.display = 'none';
            };
            img.onerror = function() {
                img.style.display = 'none';
                document.getElementById('profileCardPlaceholder').style.display = 'flex';
            };
            profileImageInput.value = ''; // Clear file input
        }

        showNotification('Profile updated successfully!', 'success');
        setTimeout(() => loadPatientProfile(), 500);
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile', 'error');
    }
}

// ===== Handle Profile Image Upload =====
async function handleProfileImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const formData = new FormData();
        formData.append('profileImage', file);

        const response = await fetch(`${API_URL}/patient/profile/${currentPatientId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Upload failed');
        }

        const result = await response.json();
        
        // Update image display with returned path from server
        if (result.patient && result.patient.profileImage) {
            const cardImg = document.getElementById('profileCardImage');
            cardImg.src = resolveImageUrl(result.patient.profileImage) + '?t=' + Date.now();
            cardImg.style.display = 'block';
            cardImg.onload = function() {
                document.getElementById('profileCardPlaceholder').style.display = 'none';
            };
            cardImg.onerror = function() {
                cardImg.style.display = 'none';
                document.getElementById('profileCardPlaceholder').style.display = 'flex';
            };
        }

        showNotification('Profile image updated successfully!', 'success');
    } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Failed to upload image', 'error');
    }
}

// ===== Handle History Form Submit =====
async function handleHistorySubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData();
        formData.append('patientId', currentPatientId);
        formData.append('disease', document.getElementById('disease').value);
        formData.append('notes', document.getElementById('notes').value);
        
        const prescriptionFile = document.getElementById('prescriptionImage').files[0];
        if (prescriptionFile) {
            formData.append('prescriptionImage', prescriptionFile);
        }

        const response = await fetch(`${API_URL}/patient/history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Add history failed');

        showNotification('Medical history added successfully!', 'success');
        document.getElementById('historyForm').reset();
        loadPatientHistory();
    } catch (error) {
        console.error('Error adding history:', error);
        showNotification('Failed to add history', 'error');
    }
}

// ===== Book Appointment =====
// ===== Load Available Time Slots =====
async function loadAvailableSlots() {
    const doctorId = document.getElementById('appointmentDoctor').value;
    const date = document.getElementById('appointmentDate').value;

    if (!doctorId) {
        document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Please select a doctor first</p>';
        return;
    }

    if (!date) {
        document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Select a date first</p>';
        return;
    }

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
        renderTimeSlots(data.slots);
    } catch (error) {
        console.error('Error loading slots:', error);
        document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e74c3c;">Failed to load available slots</p>';
    }
}

// ===== Render Time Slots =====
function renderTimeSlots(slots) {
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
                onclick="selectTimeSlot('${slot.time}', ${isBooked})"
            >
                ${slot.time}
            </button>
        `;
    });

    container.innerHTML = html;
}

// ===== Select Time Slot =====
function selectTimeSlot(time, isBooked) {
    if (isBooked) {
        showNotification('⚠️ This time slot is already booked. Please select another slot.', 'error');
        return;
    }

    // Update hidden input
    document.getElementById('appointmentTime').value = time;

    // Update UI - remove previous selection and add to new
    document.querySelectorAll('.time-slot').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Mark selected
    event.target.classList.add('selected');
}

// ===== Handle Book Appointment =====
async function handleBookAppointment(e) {
    e.preventDefault();
    
    try {
        const doctorId = document.getElementById('appointmentDoctor').value;
        const date = document.getElementById('appointmentDate').value;
        const time = document.getElementById('appointmentTime').value;
        const treatment = document.getElementById('appointmentTreatment').value;

        if (!doctorId) {
            showNotification('Please select a doctor', 'error');
            return;
        }

        if (!time) {
            showNotification('Please select a time slot', 'error');
            return;
        }

        const response = await fetch(`${API_URL}/patient/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                patientId: currentPatientId,
                doctorId,
                date,
                time,
                treatment: treatment || 'Consultation'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            // Check if it's a slot conflict error
            if (error.message && error.message.includes('Slot already booked')) {
                throw new Error('⚠️ This time slot is already booked. Please select another slot.');
            }
            throw new Error(error.message || 'Booking failed');
        }

        showNotification('Appointment booked successfully!', 'success');
        closeBookAppointmentModal();
        document.getElementById('bookAppointmentForm').reset();
        document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Select a date first</p>';
        loadDashboardData();
    } catch (error) {
        console.error('Error booking appointment:', error);
        showNotification(error.message || 'Failed to book appointment', 'error');
    }
}

// ===== Select Doctor and Book =====
function selectDoctorAndBook(doctorId, doctorName) {
    document.getElementById('appointmentDoctor').value = doctorId;
    openBookAppointmentModal();
    document.querySelector('.modal-content h2').scrollIntoView({ behavior: 'smooth' });
}

// ===== Modal Functions =====
function openBookAppointmentModal() {
    document.getElementById('appointmentModal').classList.add('active');
}

function closeBookAppointmentModal() {
    document.getElementById('appointmentModal').classList.remove('active');
}

document.getElementById('appointmentModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('appointmentModal')) {
        closeBookAppointmentModal();
    }
});

// ===== Utility Functions =====
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        };

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

function formatDate(date) {
    if (!date) return 'Not set';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateDateTime() {
    const now = new Date();
    
    // Update day name
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    document.getElementById('todayDay').textContent = dayName;
    
    // Update date
    const dateStr = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('todayDate').textContent = dateStr;
    
    // Update time
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    document.getElementById('currentTime').textContent = timeStr;
}

function resolveImageUrl(imagePath) {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    if (imagePath.startsWith('/')) {
        return `${SERVER_URL}${imagePath}`;
    }
    return `${SERVER_URL}/${imagePath}`;
}

function showNotification(message, type = 'error') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} show`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#d1fae5' : '#fee2e2'};
        color: ${type === 'success' ? '#047857' : '#991b1b'};
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = 'auth.html';
    }
}

function openImage(src) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = resolveImageUrl(src);
    img.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 0.5rem;';
    
    modal.appendChild(img);
    modal.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
}

// ===== Emergency Doctor Functions =====
function getRandomEmergencyDoctors(doctors) {
    const count = Math.min(3, doctors.length);
    const shuffled = [...doctors].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

async function showEmergencyDoctors() {
    try {
        const doctorsList = document.getElementById('emergencyDoctorsList');
        doctorsList.innerHTML = '<div class="loading">Loading emergency doctors...</div>';
        navigateToSection('emergency');
        
        const response = await fetch(`${API_URL}/doctors/emergency`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load emergency doctors');
        }

        let doctors = await response.json();
        
        if (!doctors || doctors.length === 0) {
            doctorsList.innerHTML = '<div class="empty-state">No emergency doctors available at the moment</div>';
            return;
        }

        doctors = getRandomEmergencyDoctors(doctors);

        doctorsList.innerHTML = doctors.map(doctor => `
            <div class="doctor-card">
                <div class="doctor-image">
                    ${doctor.userId && doctor.userId.name ? '👨‍⚕️' : '👨‍⚕️'}
                </div>
                <div class="doctor-content">
                    <div class="doctor-name">${doctor.userId ? doctor.userId.name : 'Dr. Unknown'}</div>
                    <div class="doctor-specialty">${doctor.specialization || 'General Medicine'}</div>
                    <div class="doctor-rating">
                        <span class="stars">⭐ ${doctor.rating || '5.0'}</span>
                    </div>
                    <div class="doctor-info" style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.5rem;">
                        <div>📧 ${doctor.userId ? doctor.userId.email : 'N/A'}</div>
                        <div>📞 ${doctor.userId ? doctor.userId.phone : 'N/A'}</div>
                    </div>
                    <div class="doctor-actions">
                        <button class="btn btn-primary btn-sm" onclick="selectDoctorAndBook('${doctor._id}', '${doctor.userId ? doctor.userId.name : 'Dr. Unknown'}')">
                            Book Appointment
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading emergency doctors:', error);
        document.getElementById('emergencyDoctorsList').innerHTML = '<div class="error">Failed to load emergency doctors</div>';
    }
}

function returnToDoctors() {
    navigateToSection('doctors');
}
