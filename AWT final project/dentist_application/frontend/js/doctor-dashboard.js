let currentDoctorId = null;
let doctorSocket = null;
let activityChartInstance = null;
let analyticsChartInstance = null;

function initDoctorDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'doctor') {
        window.location.href = 'auth.html';
        return;
    }

    document.getElementById('userName').textContent = `Welcome, Dr. ${user.name}`;
    initDarkMode();
    initDoctorSidebar();
    initSettingsForm();
    initDashboardImageUpload();
    initCharts();
    loadDoctorData();

    const filter = document.getElementById('appointmentFilter');
    if (filter) {
        filter.addEventListener('change', loadAllAppointments);
    }
}

function initDoctorSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.textContent.includes('Logout')) return;
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) sectionElement.classList.add('active');

    const navItem = document.querySelector(`[data-section="${section}"]`);
    if (navItem) navItem.classList.add('active');

    document.getElementById('pageTitle').textContent =
        section === 'dashboard' ? 'Dashboard' :
        section === 'appointments' ? 'Appointments' :
        section === 'records' ? 'Patient Records' :
        'Settings';

    if (section === 'dashboard') {
        loadDoctorData();
    } else if (section === 'appointments') {
        loadAllAppointments();
    } else if (section === 'records') {
        loadPatientRecords();
    }
}

async function loadDoctorData() {
    try {
        const data = await apiCall('/doctors/dashboard/data');
        currentDoctorId = data.doctor.id;

        document.getElementById('doctorNameDisplay').textContent = data.doctor.name;
        document.getElementById('specialtyDisplay').textContent = data.doctor.specialization || 'General Medicine';
        document.getElementById('doctorBio').textContent = data.doctor.bio || 'Empathetic medical leader with strong focus on patient care and clinical excellence.';

        document.getElementById('settingsName').value = data.doctor.name;
        document.getElementById('settingsEmail').value = data.doctor.email;
        document.getElementById('settingsPhone').value = data.doctor.phone;
        document.getElementById('settingsSpecialty').value = data.doctor.specialization;
        document.getElementById('settingsExperience').value = data.doctor.yearsOfExperience || '';
        document.getElementById('settingsLicense').value = data.doctor.licenseNumber;
        document.getElementById('settingsBio').value = data.doctor.bio || '';

        if (data.doctor.profileImage) {
            displayDoctorImage(data.doctor.profileImage);
        }

        await Promise.all([
            loadTodayStats(),
            loadAllAppointments(),
            loadPatientRecords(),
        ]);
    } catch (error) {
        console.error('Error loading doctor data:', error);
    }
}

async function loadTodayStats() {
    if (!currentDoctorId) return;

    try {
        const [data, appointmentsData] = await Promise.all([
            apiCall(`/doctor/dashboard/${currentDoctorId}`),
            apiCall('/doctors/appointments/list')
        ]);

        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        const timeValue = today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const formattedDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        document.getElementById('dashboardDateValue').textContent = formattedDate;
        document.getElementById('dashboardDateTime').textContent = `${timeValue} | ${dayName}`;
        document.getElementById('summaryTotalPatients').textContent = data.totalPatients || '0';
        document.getElementById('todayAppointmentsCount').textContent = data.appointments?.length || '0';

        const completedCount = appointmentsData.appointments?.filter(apt => apt.status?.toLowerCase() === 'completed').length || 0;
        document.getElementById('completedAppointmentsText').textContent = `${completedCount} completed`;

        const upcomingCount = appointmentsData.appointments
            .filter(apt => new Date(apt.date) > today)
            .length;
        document.getElementById('upcomingAppointmentsCount').textContent = upcomingCount || '0';

        renderActivityChart(appointmentsData.appointments || []);
        renderAnalyticsChart();

        scheduleList.innerHTML = data.appointments.map(apt => `
            <div class="appointment-card">
                <div class="appointment-header">
                    <div class="appointment-time">${apt.time}</div>
                    <div class="status-badge status-${apt.status.toLowerCase()}">${formatStatus(apt.status)}</div>
                </div>
                <div class="appointment-body">
                    <div class="patient-info">
                        <div class="patient-avatar">${apt.patientName.charAt(0).toUpperCase()}</div>
                        <div class="patient-details">
                            <div class="patient-name">${apt.patientName}</div>
                            <div class="treatment-type">${apt.treatment}</div>
                        </div>
                    </div>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-accept" onclick="confirmAppointment('${apt.id}')">
                        <span class="btn-icon">✓</span>
                        Accept
                    </button>
                    <button class="btn btn-reject" onclick="rejectAppointment('${apt.id}')">
                        <span class="btn-icon">✗</span>
                        Reject
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading doctor stats:', error);
        document.getElementById('scheduleList').innerHTML = '<div class="error">Failed to load appointments</div>';
    }
}

function initDashboardImageUpload() {
    const avatarContainer = document.getElementById('avatarContainer');
    const fileInput = document.getElementById('dashboardProfileImage');

    if (!avatarContainer || !fileInput) return;

    avatarContainer.style.cursor = 'pointer';
    avatarContainer.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
        if (!fileInput.files || fileInput.files.length === 0) return;
        if (!currentDoctorId) {
            await loadDoctorData();
        }

        try {
            await uploadDoctorImage(currentDoctorId, fileInput.files[0]);
            fileInput.value = '';
            alert('Profile image updated successfully.');
        } catch (error) {
            console.error('Profile upload failed:', error);
            alert(error.message || 'Failed to upload profile image.');
        }
    });
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

async function loadAllAppointments() {
    try {
        const filterValue = document.getElementById('appointmentFilter')?.value || '';
        const query = filterValue && filterValue !== 'all' ? `?status=${filterValue}` : '';
        const data = await apiCall(`/doctors/appointments/list${query}`);
        const appointmentsList = document.getElementById('appointmentsList');

        if (!data.appointments || data.appointments.length === 0) {
            appointmentsList.innerHTML = '<div class="empty-state">No appointments found</div>';
            return;
        }

        appointmentsList.innerHTML = data.appointments.map(apt => `
            <div class="appointment-item">
                <div class="appointment-header">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <div class="patient-avatar" style="background: var(--primary-light); width: 50px; height: 50px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                            ${apt.patientProfileImage ? `<img src="${resolveImageUrl(apt.patientProfileImage)}" alt="${apt.patientName}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 1.5rem; font-weight: bold;">${apt.patientInitial}</span>`}
                        </div>
                        <div>
                            <div class="appointment-title">${apt.patientName}</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">${apt.time} - ${apt.treatment}</div>
                        </div>
                    </div>
                    <div class="appointment-status status-${apt.status.toLowerCase()}">${formatStatus(apt.status)}</div>
                </div>
                ${apt.status === 'pending' ? `
                    <div class="appointment-actions">
                        <button class="btn btn-primary btn-sm" onclick="confirmAppointment('${apt.id}')">Accept</button>
                        <button class="btn btn-secondary btn-sm" onclick="rejectAppointment('${apt.id}')">Reject</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading appointments:', error);
        document.getElementById('appointmentsList').innerHTML = '<div class="error">Failed to load appointments</div>';
    }
}

async function loadPatientRecords() {
    try {
        const data = await apiCall('/doctors/patients/list');
        const recordsList = document.getElementById('patientRecordsList');
        const registryRows = document.getElementById('patientRegistryRows');

        if (!data.patients || data.patients.length === 0) {
            if (recordsList) {
                recordsList.innerHTML = '<div class="empty-state">No patient records found</div>';
            }
            if (registryRows) {
                registryRows.innerHTML = '<tr><td colspan="6" class="empty-state">No patient records found</td></tr>';
            }
            return;
        }

        if (recordsList) {
            recordsList.innerHTML = data.patients.map(patient => `
                <div class="appointment-item">
                    <div class="appointment-header">
                        <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                            <div class="patient-avatar">${patient.initial}</div>
                            <div>
                                <div class="appointment-title">${patient.name}</div>
                                <div style="color: var(--text-secondary); font-size: 0.9rem;">${patient.email} • ${patient.phone}</div>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="viewPatientRecord('${patient.id}')">View Record</button>
                    </div>
                </div>
            `).join('');
        }

        if (registryRows) {
            registryRows.innerHTML = data.patients.map(patient => {
                const statusClass = patient.status === 'Pending' ? 'status-pending' : patient.status === 'Urgent' ? 'status-urgent' : 'status-active';
                const nextAppointment = patient.nextAppointment || 'None';
                const lastVisit = patient.lastVisit || 'N/A';
                const contact = `${patient.email || '—'}<br><span class="patient-subtext">${patient.id ? `ID: ${patient.id}` : ''}${patient.age ? ` • ${patient.age} yrs` : ''}</span>`;
                return `
                    <tr>
                        <td>${patient.name || 'Unknown'}</td>
                        <td>${contact}</td>
                        <td>${lastVisit}</td>
                        <td>${nextAppointment}</td>
                        <td><span class="status-pill ${statusClass}">${patient.status || 'Active'}</span></td>
                        <td class="actions-cell">
                            <button class="action-btn" onclick="viewPatientRecord('${patient.id}')">View</button>
                            <button class="action-btn" onclick="switchSection('records')">Edit</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading patient records:', error);
        if (document.getElementById('patientRecordsList')) {
            document.getElementById('patientRecordsList').innerHTML = '<div class="error">Failed to load patient records</div>';
        }
        if (document.getElementById('patientRegistryRows')) {
            document.getElementById('patientRegistryRows').innerHTML = '<tr><td colspan="6" class="error">Failed to load patient records</td></tr>';
        }
    }
}

function initSettingsForm() {
    const form = document.getElementById('settingsForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const doctorData = await apiCall('/doctors/dashboard/data');
            const doctorId = doctorData.doctor.id;
            const fileInput = document.getElementById('settingsProfileImage');

            if (fileInput && fileInput.files.length > 0) {
                await uploadDoctorImage(doctorId, fileInput.files[0]);
            }

            const data = {
                name: document.getElementById('settingsName').value,
                email: document.getElementById('settingsEmail').value,
                phone: document.getElementById('settingsPhone').value,
                specialization: document.getElementById('settingsSpecialty').value,
                yearsOfExperience: parseInt(document.getElementById('settingsExperience').value, 10) || 0,
                licenseNumber: document.getElementById('settingsLicense').value,
                bio: document.getElementById('settingsBio').value,
            };

            await apiCall('/doctors/profile/update', 'PUT', data);
            showMessage('settingsMessage', 'Profile updated successfully!', 'success');

            const user = JSON.parse(localStorage.getItem('user')) || {};
            user.name = data.name;
            user.email = data.email;
            localStorage.setItem('user', JSON.stringify(user));
            document.getElementById('userName').textContent = `Welcome, Dr. ${user.name}`;
            document.getElementById('doctorNameDisplay').textContent = data.name;
            document.getElementById('specialtyDisplay').textContent = data.specialization;
            document.getElementById('licenseDisplay').textContent = `License #${data.licenseNumber}`;
        } catch (error) {
            showMessage('settingsMessage', error.message);
        }
    });
}

async function uploadDoctorImage(doctorId, file) {
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`http://localhost:5000/api/doctor/upload-image/${doctorId}`, {
            method: 'PUT',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Image upload failed');
        }

        const result = await response.json();
        if (result.doctor?.profileImage) {
            displayDoctorImage(result.doctor.profileImage);
        }
    } catch (error) {
        throw error;
    }
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

function displayDoctorImage(imagePath) {
    const avatarDisplay = document.getElementById('avatarDisplay');
    if (!avatarDisplay) return;
    const src = resolveProfileImageUrl(imagePath);
    avatarDisplay.innerHTML = src ? `<img src="${src}" alt="Profile image" class="profile-image" />` : '👨‍⚕️';
}

async function confirmAppointment(appointmentId) {
    try {
        await apiCall(`/appointments/confirm/${appointmentId}`, 'PATCH');
        loadAllAppointments();
        loadTodayStats();
        alert('Appointment confirmed successfully!');
    } catch (error) {
        console.error('Error confirming appointment:', error);
        alert(error.message);
    }
}

async function completeAppointment(appointmentId) {
    try {
        await apiCall(`/appointments/complete/${appointmentId}`, 'PATCH');
        loadAllAppointments();
        loadTodayStats();
        alert('Appointment marked as completed.');
    } catch (error) {
        console.error('Error completing appointment:', error);
        alert(error.message);
    }
}

async function rejectAppointment(appointmentId) {
    try {
        await apiCall(`/appointments/reject/${appointmentId}`, 'PATCH');
        loadAllAppointments();
        loadTodayStats();
        alert('Appointment rejected successfully.');
    } catch (error) {
        console.error('Error rejecting appointment:', error);
        alert(error.message);
    }
}

function formatStatus(status) {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(date) {
    if (!date) return 'Not set';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function launchTreatmentMap() {
    alert('Treatment Map feature - Coming Soon!\nThis will launch an interactive 3D care-planning system.');
}

function viewPatientRecord(patientId) {
    loadPatientHistory(patientId);
}

async function loadPatientHistory(patientId) {
    try {
        const history = await apiCall(`/doctors/patient-history/${patientId}`);
        
        const modal = document.getElementById('patientHistoryModal');
        const contentDiv = document.getElementById('patientHistoryContent');
        
        if (!history || history.length === 0) {
            contentDiv.innerHTML = '<div class="empty-state">No medical history found for this patient</div>';
            modal.style.display = 'flex';
            return;
        }

        contentDiv.innerHTML = history.map(record => `
            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; border-left: 4px solid var(--primary-color);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0; color: var(--text-primary);">${record.disease}</h4>
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">${formatDate(record.createdAt)}</span>
                </div>
                <p style="margin: 0.5rem 0; color: var(--text-secondary); white-space: pre-wrap;">${record.notes}</p>
                ${record.prescriptionImage ? `
                    <div style="margin-top: 0.75rem;">
                        <img src="${record.prescriptionImage}" alt="Prescription" style="max-width: 100%; max-height: 300px; border-radius: 4px; border: 1px solid var(--border-color);">
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading patient history:', error);
        document.getElementById('patientHistoryContent').innerHTML = '<div class="error">Failed to load patient history</div>';
        document.getElementById('patientHistoryModal').style.display = 'flex';
    }
}

function closePatientHistoryModal() {
    document.getElementById('patientHistoryModal').style.display = 'none';
}
