# Code Changes Summary

## Files Modified: 3 Backend Files + 3 Frontend Files

---

## 1. BACKEND: appointmentRoutes.js

### Change 1: Added New Endpoint (Lines 47-87)

```javascript
// Get available slots for a doctor on a specific date
router.get('/available-slots/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'doctorId and date are required' });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Parse date to YYYY-MM-DD format for consistent comparison
    const selectedDate = new Date(date);
    const dateStartOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const dateEndOfDay = new Date(dateStartOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Fetch all booked appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: dateStartOfDay, $lt: dateEndOfDay },
      status: { $in: ['pending', 'confirmed', 'scheduled', 'rescheduled'] },
    }).select('time');

    // Extract booked times
    const bookedTimes = bookedAppointments.map(apt => apt.time);

    // Generate all available slots (9 AM to 5 PM in 30-minute intervals)
    const availableSlots = [];
    const startHour = 9;
    const endHour = 17; // 5 PM

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const isBooked = bookedTimes.includes(timeString);
        
        availableSlots.push({
          time: timeString,
          isBooked,
        });
      }
    }

    res.json({
      date: date,
      doctorId,
      totalSlots: availableSlots.length,
      bookedCount: bookedTimes.length,
      availableCount: availableSlots.length - bookedTimes.length,
      slots: availableSlots,
      bookedTimes, // For frontend reference
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

### Change 2: Improved POST Endpoint Validation (Lines ~95-165)

**Before:**
```javascript
const appointmentDateValue = date ? new Date(date) : new Date(appointmentDate);
// ... other code ...
const existingAppointments = await Appointment.find({
  doctorId,
  date: appointmentDateValue,  // ← May not match properly
  status: { $in: ['pending', 'confirmed', 'scheduled', 'rescheduled'] },
});
```

**After:**
```javascript
const appointmentDateValue = date ? new Date(date) : new Date(appointmentDate);

// Normalize date to start of day for comparison
const dateStartOfDay = new Date(appointmentDateValue.getFullYear(), appointmentDateValue.getMonth(), appointmentDateValue.getDate());
const dateEndOfDay = new Date(dateStartOfDay.getTime() + 24 * 60 * 60 * 1000);

// Check for existing appointments on the same day
const existingAppointments = await Appointment.find({
  doctorId,
  date: { $gte: dateStartOfDay, $lt: dateEndOfDay },  // ← Fixed comparison
  status: { $in: ['pending', 'confirmed', 'scheduled', 'rescheduled'] },
});

// ... rest of validation remains same ...
// Also update save to use normalized date:
const appointment = new Appointment({
  // ...
  date: dateStartOfDay,  // ← Use normalized date
  // ...
});
```

---

## 2. FRONTEND: patient-dashboard-new.html

### Change 1: Updated Form Structure (Lines ~295-330)

**Before:**
```html
<form id="bookAppointmentForm">
    <div class="form-group">
        <label for="appointmentDoctor">Select Doctor</label>
        <select id="appointmentDoctor" name="doctorId" required>
            <option value="">Choose a doctor...</option>
        </select>
    </div>
    <div class="form-group">
        <label for="appointmentDate">Appointment Date</label>
        <input type="date" id="appointmentDate" name="date" required>
    </div>
    <div class="form-group">
        <label for="appointmentTime">Appointment Time</label>
        <input type="time" id="appointmentTime" name="time" required>
    </div>
    <div class="form-group">
        <label for="appointmentTreatment">Treatment Type</label>
        <input type="text" id="appointmentTreatment" name="treatment">
    </div>
    <button type="submit" class="btn btn-primary">Confirm Booking</button>
</form>
```

**After:**
```html
<form id="bookAppointmentForm">
    <div class="form-group">
        <label for="appointmentDoctor">Select Doctor</label>
        <select id="appointmentDoctor" name="doctorId" required>
            <option value="">Choose a doctor...</option>
        </select>
    </div>
    <div class="form-group">
        <label for="appointmentDate">Appointment Date</label>
        <input type="date" id="appointmentDate" name="date" required>
    </div>
    <div class="form-group">
        <label>Select Time Slot</label>
        <div id="timeSlotContainer" class="time-slots-grid">
            <p style="grid-column: 1/-1; text-align: center; color: #999;">Select a date first</p>
        </div>
        <input type="hidden" id="appointmentTime" name="time" required>
    </div>
    <div class="form-group">
        <label for="appointmentTreatment">Treatment Type</label>
        <input type="text" id="appointmentTreatment" name="treatment">
    </div>
    <button type="submit" class="btn btn-primary">Confirm Booking</button>
</form>
```

---

## 3. FRONTEND CSS: patient-dashboard.css

### Added Styles (End of file, ~Lines 1161-1225)

```css
/* ===== Time Slots Grid ===== */
.time-slots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding: 1rem;
    background: #fafafa;
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
}

.time-slot {
    padding: 0.75rem;
    text-align: center;
    border: 2px solid var(--border-color);
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    background: var(--bg-white);
    color: var(--text-primary);
    font-size: 0.9rem;
}

.time-slot:hover:not(:disabled) {
    border-color: var(--primary-color);
    background: var(--primary-light);
    transform: translateY(-2px);
}

.time-slot.available:hover {
    box-shadow: var(--shadow-md);
}

.time-slot.selected {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.time-slot.booked {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
    border-color: #d1d5db;
    opacity: 0.6;
}

.time-slot.booked::after {
    content: " Booked";
}

.time-slot:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}
```

---

## 4. FRONTEND JavaScript: patient-dashboard.js

### Change 1: Added Event Listeners (Lines ~68-74)

```javascript
// Date change for slot loading
document.getElementById('appointmentDate').addEventListener('change', loadAvailableSlots);

// Doctor change for resetting slots
document.getElementById('appointmentDoctor').addEventListener('change', () => {
    document.getElementById('timeSlotContainer').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Select a date first</p>';
    document.getElementById('appointmentTime').value = '';
});
```

### Change 2: Added Three New Functions (Lines ~470-555)

```javascript
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
```

### Change 3: Enhanced handleBookAppointment Function (Lines ~557-607)

**Before:**
```javascript
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

        const response = await fetch(`${API_URL}/patient/appointments`, {
            // ... rest remains same ...
        });
        
        // ... rest of function ...
    }
}
```

**After:**
```javascript
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
```

---

## Summary of Changes

| File | Type | Lines | Change |
|---|---|---|---|
| appointmentRoutes.js | Backend | ~40 | New GET endpoint |
| appointmentRoutes.js | Backend | ~20 | Improved date validation |
| patient-dashboard-new.html | Frontend | ~10 | Updated form UI |
| patient-dashboard.css | Frontend | ~65 | New styles |
| patient-dashboard.js | Frontend | ~6 | Event listeners |
| patient-dashboard.js | Frontend | ~90 | New functions |
| patient-dashboard.js | Frontend | ~50 | Enhanced validation |

**Total Lines Added:** ~280 lines of new code  
**Total Lines Modified:** ~30 lines of existing code  
**Backward Compatible:** Yes (only adds new feature)

---

## Quick Verification

Check these exact strings in each file to verify changes:

```javascript
// appointmentRoutes.js
✓ router.get('/available-slots/:doctorId', async (req, res) => {
✓ const dateStartOfDay = new Date(selectedDate.getFullYear(), ...
✓ const availableSlots = [];

// patient-dashboard-new.html
✓ <div id="timeSlotContainer" class="time-slots-grid">
✓ <input type="hidden" id="appointmentTime"

// patient-dashboard.css
✓ .time-slots-grid {
✓ .time-slot.booked {

// patient-dashboard.js
✓ async function loadAvailableSlots() {
✓ function renderTimeSlots(slots) {
✓ function selectTimeSlot(time, isBooked) {
✓ if (!time) {
```

All changes are present if you find all these strings! ✓

