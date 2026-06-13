# 🧪 Testing Guide - Dentist Application

## Setup Before Testing

1. **Backend Running**
   ```bash
   npm start
   # Should show "MongoDB Connected" + "Server running on port 5000"
   ```

2. **MongoDB Running**
   - Local: `mongod` command in terminal
   - Atlas: Connection string in .env

3. **Frontend Accessible**
   - Open `frontend/index.html` or use Live Server

4. **Browser Developer Tools**
   - Press F12 to open
   - Check Console tab for errors
   - Check Network tab for API calls

## Test Categories

### 1. Landing Page Tests

#### 1.1 Page Load
- [ ] Open frontend/index.html
- [ ] Verify page loads without errors (no 404s in Network tab)
- [ ] Console has no errors
- [ ] All images load correctly
- [ ] Mint green color visible (#10b981)

#### 1.2 Navigation
- [ ] Navbar visible with logo
- [ ] "Get Started" button visible
- [ ] Click "Get Started" → Opens auth.html (no new tab)

#### 1.3 Content Sections
- [ ] Hero section visible with text
- [ ] Services section displays 6 cards
- [ ] Features section displays 4 cards
- [ ] Call-to-action section visible
- [ ] Footer visible with links

#### 1.4 Responsive Design
- [ ] Desktop (1920x1080): Page looks perfect
- [ ] Tablet (768x1024): Layout adjusts, readable
- [ ] Mobile (375x667): All content accessible, no horizontal scroll
  - Test using F12 Device toolbar (Ctrl+Shift+M)

#### 1.5 Styling
- [ ] Colors correct (Mint green theme)
- [ ] Hover effects work on buttons
- [ ] Text readable with good contrast
- [ ] Spacing/padding looks balanced

---

### 2. Authentication Tests

#### 2.1 Register as Patient

**Test Case 1: Valid Registration**
```
Steps:
1. Click "Get Started" on landing page
2. Go to auth.html (Registration tab)
3. Fill form:
   - Full Name: John Doe
   - Email: john@test.com
   - Password: Test@12345
   - Phone: 5551234567
   - Role: Patient
4. Click Register

Expected:
✅ Success message appears
✅ Redirected to frontend/patient-dashboard.html
✅ Token stored in localStorage
✅ User data visible in localStorage
```

**Test Case 2: Duplicate Email**
```
Steps:
1. Fill same form with existing email
2. Click Register

Expected:
❌ Error message: "Email already in use"
❌ Page stays on auth.html
❌ No token generated
```

**Test Case 3: Invalid Password**
```
Steps:
1. Fill form with weak password (e.g., "123")
2. Click Register

Expected:
Form validation (client-side or server-side error)
```

**Test Case 4: Missing Fields**
```
Steps:
1. Leave one field empty
2. Click Register

Expected:
❌ Form validation error
```

#### 2.2 Register as Doctor

**Test Case 5: Valid Doctor Registration**
```
Steps:
1. On auth.html, go to Registration tab
2. Fill form:
   - Full Name: Dr. Smith
   - Email: drsmith@test.com
   - Password: Test@12345
   - Phone: 5559876543
   - Role: Doctor
3. Click Register

Expected:
✅ Success message
✅ Redirected to frontend/doctor-dashboard.html
✅ Different dashboard layout from patient
```

#### 2.3 Login Tests

**Test Case 6: Valid Login as Patient**
```
Steps:
1. On auth.html, go to Login tab
2. Fill form:
   - Email: john@test.com
   - Password: Test@12345
   - Role: Patient
3. Click Login

Expected:
✅ Success message
✅ Redirected to patient-dashboard.html
✅ localStorage token updated
```

**Test Case 7: Valid Login as Doctor**
```
Steps:
1. Login with doctor credentials
2. Email: drsmith@test.com
3. Password: Test@12345
4. Role: Doctor

Expected:
✅ Redirected to doctor-dashboard.html
✅ Doctor dashboard visible (different from patient)
```

**Test Case 8: Wrong Password**
```
Steps:
1. Enter correct email, wrong password
2. Click Login

Expected:
❌ Error message: "Invalid credentials"
❌ Stay on login page
```

**Test Case 9: Non-Existent Email**
```
Steps:
1. Enter email that doesn't exist
2. Click Login

Expected:
❌ Error message
❌ Stay on login page
```

**Test Case 10: Role Mismatch**
```
Steps:
1. Register as patient with email: patient@test.com
2. Try login with Role: Doctor

Expected:
❌ Error message: "Invalid credentials" or similar
```

---

### 3. Patient Dashboard Tests

#### 3.1 Dashboard Layout
```
Steps:
1. Login as patient
2. Observe dashboard

Expected:
✅ Sidebar visible on left with menu items:
   - My Appointments
   - Find Doctors
   - My Profile
   - Logout
✅ Main content area on right
✅ Mint green header
```

#### 3.2 Appointments Section

**Test Case 11: View Appointments (First Time)**
```
Steps:
1. Click "My Appointments" in sidebar
2. Observe for any previous bookings

Expected:
✅ "No appointments yet" message appears
   OR
✅ List of existing appointments displays
```

**Test Case 12: Book Appointment**
```
Steps:
1. Click "Find Doctors"
2. View list of doctors

Expected:
✅ At least one doctor displays with:
   - Doctor name
   - Specialization
   - Years of experience
   - Consultation fee
   - "Book Appointment" button
```

**Test Case 13: Open Booking Modal**
```
Steps:
1. Click "Book Appointment" button on a doctor
2. Observe modal

Expected:
✅ Modal opens with form containing:
   - Doctor name (pre-filled, read-only)
   - Date picker
   - Time picker
   - Reason textarea
   - Notes textarea
   - Submit button
   - Cancel button
```

**Test Case 14: Book Appointment Valid**
```
Steps:
1. Fill appointment form:
   - Date: Tomorrow's date
   - Time: 10:00 AM
   - Reason: Dental checkup
   - Notes: Routine cleaning
2. Click Submit

Expected:
✅ Success message: "Appointment booked successfully"
✅ Modal closes
✅ Appointment appears in "My Appointments"
```

**Test Case 15: Book Appointment Conflicting Time**
```
Steps:
1. Try booking same doctor, same date/time
   (that already exists)

Expected:
❌ Error: "Time slot not available" or similar
❌ Appointment not created
```

**Test Case 16: View Booked Appointment**
```
Steps:
1. Click "My Appointments"
2. Observe the booked appointment

Expected:
✅ Shows:
   - Doctor name
   - Date and time
   - Reason
   - Status (scheduled)
   - Cancel button
```

#### 3.3 Doctors List
```
Steps:
1. Click "Find Doctors"

Expected:
✅ Grid/list of all doctors displays
✅ Each card shows:
   - Doctor name
   - Specialization
   - Experience
   - Fee
   - "Book Appointment" button
```

#### 3.4 Profile Management

**Test Case 17: View Patient Profile**
```
Steps:
1. Click "My Profile" in sidebar

Expected:
✅ Form displays with patient info:
   - Name (pre-filled)
   - Email (pre-filled)
   - Phone
   - Address
   - Date of Birth
   - Edit/Save buttons
```

**Test Case 18: Edit Patient Profile**
```
Steps:
1. In profile section, modify:
   - Phone: 5551111111
   - Address: 123 Main St
2. Click Save

Expected:
✅ Success message
✅ Changes saved to database
✅ Refresh page, data persists
```

#### 3.5 Logout
```
Steps:
1. Click "Logout" in sidebar

Expected:
✅ localStorage cleared (token removed)
✅ Redirected to auth.html
```

---

### 4. Doctor Dashboard Tests

#### 4.1 Dashboard Layout
```
Steps:
1. Login as doctor
2. Observe dashboard

Expected:
✅ Stats grid visible with 4 cards:
   - Total Patients
   - Total Appointments
   - Completed Appointments
   - Average Rating
✅ Numbers populated
✅ Sidebar with menu:
   - My Appointments
   - My Profile
   - Logout
```

#### 4.2 Statistics

**Test Case 19: View Statistics**
```
Steps:
1. Login as doctor with appointments
2. Observe stats cards

Expected:
✅ Total Patients: Correct count of unique patients
✅ Total Appointments: Count of all appointments
✅ Completed: Count of status='completed'
✅ Rating: Display rating (0-5)
```

#### 4.3 Doctor Profile Setup

**Test Case 20: Create Doctor Profile**
```
Steps:
1. Click "My Profile"
2. Fill form:
   - Specialization: Pediatric Dentistry
   - License Number: LIC123456
   - Years of Experience: 10
   - Qualifications: DDS, MS Pediatric Dentistry
   - Bio: Experienced pediatric dentist
   - Consultation Fee: 100
3. Click Save

Expected:
✅ Success message: "Profile updated"
✅ Data saved to database
```

**Test Case 21: Update Doctor Profile**
```
Steps:
1. Modify existing profile:
   - Change Bio
   - Update Fee: 150
2. Click Save

Expected:
✅ Success message
✅ Changes visible immediately
✅ Data persists on refresh
```

#### 4.4 Appointments View

**Test Case 22: View Doctor Appointments**
```
Steps:
1. Click "My Appointments"

Expected:
✅ List shows all appointments scheduled with this doctor:
   - Patient name
   - Date and time
   - Reason
   - Status
   - Action buttons
```

---

### 5. API Integration Tests

Use Network Tab (F12) to verify API calls.

#### 5.1 Authentication Endpoints

**Test Register API Call**
```
Method: POST
URL: http://localhost:5000/api/auth/register
Status (Expected): 201 or 200
Response: { token, user }
```

**Test Login API Call**
```
Method: POST
URL: http://localhost:5000/api/auth/login
Status (Expected): 200
Response: { token, user }
```

#### 5.2 Doctor Endpoints

**Test Get Doctors**
```
Method: GET
URL: http://localhost:5000/api/doctors
Status (Expected): 200
Response: Array of doctors
```

**Test Create Doctor Profile**
```
Method: POST
URL: http://localhost:5000/api/doctors
Headers: Authorization: Bearer <token>
Status (Expected): 201 or 200
Response: Doctor object
```

#### 5.3 Appointment Endpoints

**Test Book Appointment**
```
Method: POST
URL: http://localhost:5000/api/appointments
Headers: Authorization: Bearer <token>
Body: { doctorId, date, time, reason, notes }
Status (Expected): 201 or 200
Response: Appointment object
```

**Test Get Appointments**
```
Method: GET
URL: http://localhost:5000/api/appointments/user
Headers: Authorization: Bearer <token>
Status (Expected): 200
Response: Array of appointments
```

---

### 6. Error Handling Tests

#### 6.1 Unauthorized Access

**Test Case 23: Access Without Token**
```
Steps:
1. Open developer console (F12)
2. Go to Application tab
3. Remove token from localStorage
4. Refresh page
5. Try accessing protected content

Expected:
❌ Redirected to auth.html
❌ Error message or silent redirect
```

**Test Case 24: Expired Token**
```
Steps:
1. Manually edit token in localStorage (corrupt it)
2. Try making API call

Expected:
❌ 401 Unauthorized
❌ Auto-logout
❌ Redirect to auth.html
```

#### 6.2 Network Errors

**Test Case 25: Backend Down**
```
Steps:
1. Stop backend (`npm start` terminal, Ctrl+C)
2. Try any API call (e.g., book appointment)

Expected:
❌ Network error in console
❌ Error message to user: "Network error" or similar
❌ Backend should show connection attempt
```

**Test Case 26: MongoDB Down**
```
Steps:
1. Stop MongoDB
2. Try login

Expected:
❌ Backend error (check server console)
❌ API returns 500 error
❌ User sees error message
```

---

### 7. Data Persistence Tests

#### 7.1 localStorage Tests

**Test Case 27: Token Persistence**
```
Steps:
1. Login successfully
2. Check localStorage (F12 > Application > LocalStorage)
3. Verify token and user data present
4. Refresh page
5. Still logged in?

Expected:
✅ User stays logged in after refresh
✅ Token and user visible in localStorage
```

**Test Case 28: Logout Clears Storage**
```
Steps:
1. Login
2. Verify data in localStorage
3. Click Logout
4. Check localStorage again

Expected:
✅ localStorage cleared (empty)
✅ Token removed
✅ User data removed
```

#### 7.2 Database Persistence

**Test Case 29: Data Survives Refresh**
```
Steps:
1. Book appointment
2. Refresh page
3. View appointments

Expected:
✅ Appointment still visible
✅ Data not lost
```

**Test Case 30: Data Survives Logout/Login**
```
Steps:
1. Create doctor profile as doctor
2. Logout
3. Login again with same doctor account
4. Check profile

Expected:
✅ Profile data still there
✅ No data loss
```

---

### 8. Responsive Design Tests

#### 8.1 Mobile Testing (375x667)

**Test Each Page:**
- [ ] index.html - readable, no horizontal scroll
- [ ] auth.html - form usable on phone
- [ ] patient-dashboard.html - sidebar collapses or drawer opens
- [ ] doctor-dashboard.html - stats stack vertically
- [ ] Profile pages - form inputs accessible

**Test Case 31: Touch Interactions**
```
Steps (on mobile):
1. Tap buttons - should register click
2. Tap form inputs - keyboard appears
3. Tap menu items - respond to touch
4. Swipe navigation (if implemented)

Expected:
✅ All interactive elements work on touch
```

#### 8.2 Tablet Testing (768x1024)

- [ ] Layout fits width
- [ ] Content readable
- [ ] Sidebar visible or accessible
- [ ] Tables scroll if needed

#### 8.3 Desktop Testing (1920x1080)

- [ ] Full layout visible
- [ ] No wasted space
- [ ] All content accessible
- [ ] Hover states work

---

### 9. Security Tests

#### 9.1 Authentication Security

**Test Case 32: Password Not Visible**
```
Steps:
1. Register/Login with password
2. Check Network tab → Response
3. Check localStorage

Expected:
❌ Password NOT in response
❌ Password NOT in localStorage
✅ Only token stored
```

**Test Case 33: Role-Based Access**
```
Steps:
1. Login as patient
2. Try accessing doctor-specific features
   (e.g., manually changing profile)

Expected:
❌ Cannot access doctor features
```

---

### 10. End-to-End Workflow Tests

#### Workflow 1: Complete Patient Journey

1. [ ] Visit landing page
2. [ ] Register as patient
3. [ ] Login
4. [ ] View doctors
5. [ ] Book appointment
6. [ ] View appointment in "My Appointments"
7. [ ] Update profile
8. [ ] Logout

#### Workflow 2: Complete Doctor Journey

1. [ ] Visit landing page
2. [ ] Register as doctor
3. [ ] Login
4. [ ] Create professional profile
5. [ ] View dashboard stats
6. [ ] View appointments (should be empty)
7. [ ] Update profile
8. [ ] Logout

#### Workflow 3: Multi-User Interaction

1. [ ] Patient 1 books appointment with Doctor
2. [ ] Doctor views appointment from their dashboard
3. [ ] Patient 1 cancels appointment
4. [ ] Doctor's stats update
5. [ ] Patient 2 books different time with same Doctor
6. [ ] No conflict occurs

---

## Test Results Tracking

### Test Execution Checklist

| Test Area | Total | Passed | Failed | Notes |
|-----------|-------|--------|--------|-------|
| Landing Page | 5 | _ | _ | |
| Auth | 10 | _ | _ | |
| Patient Dashboard | 7 | _ | _ | |
| Doctor Dashboard | 4 | _ | _ | |
| API Integration | 3 | _ | _ | |
| Error Handling | 3 | _ | _ | |
| Data Persistence | 2 | _ | _ | |
| Responsive | 3 | _ | _ | |
| Security | 2 | _ | _ | |
| E2E Workflows | 3 | _ | _ | |
| **TOTAL** | **42** | **_** | **_** | |

### Bug Template

If you find an issue, document it:

```
BUG #1
---
Title: [Brief description]
Severity: High / Medium / Low
Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Environment:
- Browser: [Chrome/Firefox/Safari/Edge]
- Device: [Desktop/Tablet/Mobile]
- OS: [Windows/Mac/Linux]

Console Error:
[Any error messages from F12 console]

Network Error:
[Any 404/500 errors from Network tab]

Screenshots:
[Link or description]
```

---

## Performance Testing

### Load Time
- [ ] Landing page loads: < 2 seconds
- [ ] Authentication: < 1 second
- [ ] Dashboard load: < 2 seconds
- [ ] API calls: < 500ms

### Testing with DevTools
```
Open F12 → Performance tab
1. Record performance
2. Perform action (e.g., book appointment)
3. Stop recording
4. Analyze for bottlenecks
```

---

## Browser Compatibility Matrix

Test each browser:

| Browser | Desktop | Tablet | Mobile | Notes |
|---------|---------|--------|--------|-------|
| Chrome  | [ ]     | [ ]    | [ ]    | |
| Firefox | [ ]     | [ ]    | [ ]    | |
| Safari  | [ ]     | [ ]    | [ ]    | |
| Edge    | [ ]     | [ ]    | [ ]    | |

---

## Quick Test Commands

```bash
# Start fresh testing
1. Clear localStorage: F12 → Application → LocalStorage → Delete all

# Check backend
2. curl http://localhost:5000

# Check database
3. Open MongoDB Compass
4. Connect to localhost:27017
5. Browse dentist_app database

# Monitor backend logs
4. Keep npm start terminal visible
5. Watch for errors

# Monitor frontend
5. Keep F12 console open
6. Watch for JavaScript errors
```

---

## Automated Testing (Future)

Consider adding:
- Jest unit tests
- Cypress E2E tests
- Postman API tests
- Load testing with Apache JMeter

---

**Happy Testing!** 🚀

Report any issues and they'll be addressed in the next version.
