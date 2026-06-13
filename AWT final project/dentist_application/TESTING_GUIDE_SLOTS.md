# Testing Guide - Slot Availability System

## Prerequisites
- Backend running on `http://localhost:5000`
- Frontend accessible at `http://localhost:5000` (or your dev server)
- MongoDB connected with appointment data
- At least one doctor in database
- Valid authentication token

---

## Quick Sanity Check (5 minutes)

### Test 1: Slots Load on Date Selection
1. Open browser → Navigate to patient dashboard
2. Login as patient with valid credentials
3. Click "Book Appointment" button
4. **Select Doctor** from dropdown
5. **Click date picker** and select today or future date
6. **Expected:** Time slots appear below date picker ✓
7. **Visual:** Some slots gray with "Booked" label, others clickable

### Test 2: Slot Selection Works
1. Click any non-booked time slot (white/teal button)
2. **Expected:** Slot highlights/changes color ✓
3. Enter treatment type (optional)
4. Click "Confirm Booking"
5. **Expected:** Success message appears ✓

### Test 3: Booked Slots Disabled
1. Find a slot marked "Booked" (gray button)
2. Click on it
3. **Expected:** Error message "This time slot is already booked..." ✓

---

## Full Test Suite (30 minutes)

### Test 4: Browser Refresh Updates Slots
**Purpose:** Verify slots update after booking

1. **Window 1:** Book an appointment for 10:00 AM (Dr. Smith, Today)
2. **Window 2:** Refresh the "Book Appointment" modal with same doctor & date
3. **Expected:** 10:00 AM slot now shows "Booked" ✓
4. **Note:** May take 2-3 seconds to reflect

### Test 5: Multiple Bookings Same Doctor, Same Time
**Purpose:** Prevent exact double-booking

1. **Window 1:** Dr. Smith, Today, 10:00 AM → Start booking (don't submit yet)
2. **Window 2:** Dr. Smith, Today, 10:00 AM → Book successfully
3. **Window 1:** Submit booking form
4. **Expected:** Error "Slot already booked. Please select another time after 15 minutes." ✓
5. **Note:** Backend prevents it even if frontend allowed

### Test 6: 15-Minute Gap Enforcement
**Purpose:** Verify appointments can't be within 15 minutes

1. **Existing appointment:** Dr. Smith at 10:00 AM (already booked)
2. Try booking times:
   - 09:45 AM → **Expected:** Blocked (within 15 min before) ✗
   - 09:50 AM → **Expected:** Blocked ✗
   - 10:15 AM → **Expected:** Blocked (within 15 min after) ✗
   - 10:30 AM → **Expected:** Allowed ✓
3. **Notes:**
   - All blocked times may or may not show as "Booked" on UI
   - Backend always validates

### Test 7: Different Doctors Can Have Same Slot
**Purpose:** Ensure slots are per-doctor, not global

1. **Window 1:** Dr. Smith, Today, 10:00 AM → Book
2. **Window 2:** Dr. Johnson, Today, 10:00 AM → Book
3. **Expected:** Both bookings succeed ✓
4. **Why:** Different doctors = independent schedules

### Test 8: Different Dates Can Have Same Slot
**Purpose:** Ensure slots are per-date, not global

1. **Window 1:** Dr. Smith, May 10, 10:00 AM → Book
2. **Window 2:** Dr. Smith, May 11, 10:00 AM → Book
3. **Expected:** Both bookings succeed ✓
4. **Why:** Different dates = independent schedules

### Test 9: Past Dates Are Blocked
**Purpose:** Cannot book appointments in past

1. Select doctor
2. Try selecting yesterday's date
3. **Expected:** Date picker doesn't allow past dates OR
4. **If booking is attempted:** Error from form validation

### Test 10: All Slots for a Day
**Purpose:** Verify slot generation (9 AM - 5 PM, 30-min intervals)

1. Select doctor with no appointments
2. Select any date
3. **Expected:** Exactly 16 slots appear:
   ```
   09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30,
   13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00, 16:30
   ```
4. **All should be available** (white/teal buttons)

### Test 11: Cancelled Appointments Don't Block Slots
**Purpose:** Ensure cancelled appointments reopen slots

1. Check if appointment has status `cancelled`
2. Slot for that time should be available
3. **Expected:** Can book that slot ✓

### Test 12: Form Validation - No Time Selected
**Purpose:** Prevent booking without slot selection

1. Select doctor and date
2. **Skip selecting a time slot** (don't click any slot button)
3. Enter treatment type
4. Click "Confirm Booking"
5. **Expected:** Error "Please select a time slot" ✓

---

## API Testing (Advanced)

### Test 13: API - Get Available Slots
**Using cURL or Postman:**

```bash
GET /api/appointments/available-slots/[DOCTOR_ID]?date=2025-05-10

Headers:
Authorization: Bearer [YOUR_TOKEN]

Expected Response:
{
  "slots": [
    {"time": "09:00", "isBooked": false},
    {"time": "09:30", "isBooked": true},
    ...
  ],
  "totalSlots": 16,
  "bookedCount": 2,
  "availableCount": 14
}
```

### Test 14: API - Double-Booking Prevention
**Code Test:**

```javascript
// Try to book a slot that's already taken
const response = await fetch('/api/patient/appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    patientId: userId,
    doctorId: doctorId,
    date: '2025-05-10',
    time: '10:00', // Already booked
    treatment: 'Cleaning'
  })
});

// Expected: 400 error with message "Slot already booked..."
if (!response.ok) {
  const error = await response.json();
  console.log(error.message); // Should show slot conflict
}
```

---

## Edge Cases & Troubleshooting

### Issue: Slots Not Loading
**Checklist:**
- [ ] Doctor is selected? (must select before date)
- [ ] Date is selected? (must select after doctor)
- [ ] Date is in future? (system may reject past dates)
- [ ] Browser console shows errors? (F12 → Console)
- [ ] Network tab shows API response? (F12 → Network)
- [ ] Backend running on port 5000?
- [ ] Valid authentication token? (check localStorage)

**Fix:**
```javascript
// Check if token exists
console.log(localStorage.getItem('token'));

// Check API manually
const doctorId = document.getElementById('appointmentDoctor').value;
const date = document.getElementById('appointmentDate').value;
console.log(`Fetching: /api/appointments/available-slots/${doctorId}?date=${date}`);
```

### Issue: All Slots Show as "Booked"
**Possible Causes:**
- Too many appointments booked for that day
- Different doctor selected (has own schedule)
- System miscounting appointments

**Check:**
1. Open MongoDB
2. Query: `db.appointments.find({ doctorId: "[ID]", date: ... })`
3. Are there really that many appointments?
4. Are their statuses `pending`, `confirmed`, `scheduled`, or `rescheduled`?

### Issue: Slot Was Available but Suddenly Booked
**This is the slot protection working!**
- Another user just booked it (0-5 second lag)
- This is intentional behavior
- Solution: Refresh and select another slot

### Issue: Wrong Time Format
**Symptoms:** "Invalid time format" error or malformed database values

**Check your data:**
```javascript
// Time format should be: "HH:MM" (24-hour)
Correct:   "10:00", "14:30", "09:00"
Wrong:     "10:00 AM", "2:30 PM", "10:0"
```

---

## Performance Tests

### Test 15: Load 100 Appointments
**Purpose:** Test performance with many bookings

1. Create ~100 test appointments for one doctor (using database)
2. Select that doctor and a date with many appointments
3. **Expected:** Slots still load in < 2 seconds ✓
4. **Observation:** Booked slots should be scattered

### Test 16: Concurrent Users
**Purpose:** Test double-booking prevention under load

1. Open 5 browser windows as different patients
2. All select: Same Doctor, Same Date (e.g., 10:00 AM slot)
3. All click "Book Appointment" simultaneously
4. **Expected:** Only 1 succeeds, other 4 get "Slot already booked" error ✓

---

## Regression Testing

**Before deploying, verify these still work:**

### Original Functionality
- [ ] Appointment form submits successfully
- [ ] Doctor list loads
- [ ] Patient dashboard loads
- [ ] Treatment types selectable
- [ ] Appointment details display correctly
- [ ] Logout functionality works
- [ ] Auth still required (can't access without login)

### User Experience
- [ ] No visual glitches or layout breaks
- [ ] Responsive on mobile
- [ ] No console errors (F12 → Console)
- [ ] All buttons clickable
- [ ] Form labels clear
- [ ] Error messages helpful

---

## Test Case Summary

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | Slots load on date select | Show 16 slots | ✓ |
| 2 | Slot selection works | Highlights selected | ✓ |
| 3 | Booked slots disabled | Error on click | ✓ |
| 4 | Refresh updates slots | Shows recent bookings | ✓ |
| 5 | Prevent exact double-book | Backend error | ✓ |
| 6 | 15-min gap enforced | Nearby slots blocked | ✓ |
| 7 | Different doctors independent | Both can book | ✓ |
| 8 | Different dates independent | Both can book | ✓ |
| 9 | Past dates blocked | Cannot select | ✓ |
| 10 | All 16 slots generated | Count = 16 | ✓ |
| 11 | Cancelled don't block | Can book cancelled time | ✓ |
| 12 | Form validates | Error without slot | ✓ |
| 13 | API returns slots | JSON response | ✓ |
| 14 | API prevents double-book | 400 error | ✓ |
| 15 | High volume | Loads fast | ✓ |
| 16 | Concurrent users | Only 1 succeeds | ✓ |

---

## Sign-Off Checklist

**Mark each as complete before production:**

- [ ] All 16 test cases pass
- [ ] No console errors in browser dev tools
- [ ] No backend errors in server logs
- [ ] Database data is accurate
- [ ] Performance is acceptable (< 2s load time)
- [ ] Mobile responsive (if applicable)
- [ ] Error messages are clear
- [ ] UI looks good (no design changes)
- [ ] Documentation updated
- [ ] Ready for production!

---

**Test Date:** _______________  
**Tester Name:** _______________  
**Status:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________________________________

