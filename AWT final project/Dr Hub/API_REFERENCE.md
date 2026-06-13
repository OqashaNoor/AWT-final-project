# API Reference - Slot Availability Endpoints

## Overview
New endpoint to fetch available time slots for a doctor on a specific date.

---

## 1. Get Available Slots

### Endpoint
```
GET /api/appointments/available-slots/:doctorId?date=YYYY-MM-DD
```

### Authentication
```
Authorization: Bearer [JWT_TOKEN]
```

### Parameters

#### Path Parameters:
| Parameter | Type | Required | Example |
|---|---|---|---|
| `doctorId` | String (MongoDB ID) | Yes | `507f1f77bcf86cd799439011` |

#### Query Parameters:
| Parameter | Type | Required | Format | Example |
|---|---|---|---|---|
| `date` | String | Yes | YYYY-MM-DD | `2025-05-10` |

### Request Example
```bash
curl -X GET "http://localhost:5000/api/appointments/available-slots/507f1f77bcf86cd799439011?date=2025-05-10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Response (Success - 200)
```json
{
  "date": "2025-05-10",
  "doctorId": "507f1f77bcf86cd799439011",
  "totalSlots": 16,
  "bookedCount": 3,
  "availableCount": 13,
  "slots": [
    {
      "time": "09:00",
      "isBooked": false
    },
    {
      "time": "09:30",
      "isBooked": true
    },
    {
      "time": "10:00",
      "isBooked": false
    },
    {
      "time": "10:30",
      "isBooked": false
    },
    {
      "time": "11:00",
      "isBooked": true
    },
    {
      "time": "11:30",
      "isBooked": false
    },
    {
      "time": "12:00",
      "isBooked": false
    },
    {
      "time": "12:30",
      "isBooked": false
    },
    {
      "time": "13:00",
      "isBooked": false
    },
    {
      "time": "13:30",
      "isBooked": false
    },
    {
      "time": "14:00",
      "isBooked": true
    },
    {
      "time": "14:30",
      "isBooked": false
    },
    {
      "time": "15:00",
      "isBooked": false
    },
    {
      "time": "15:30",
      "isBooked": false
    },
    {
      "time": "16:00",
      "isBooked": false
    },
    {
      "time": "16:30",
      "isBooked": false
    }
  ],
  "bookedTimes": [
    "09:30",
    "11:00",
    "14:00"
  ]
}
```

### Response Errors

#### 400 - Bad Request
```json
{
  "message": "doctorId and date are required"
}
```

#### 404 - Doctor Not Found
```json
{
  "message": "Doctor not found"
}
```

#### 401 - Unauthorized
```json
{
  "message": "No token provided" // or "Invalid token"
}
```

#### 500 - Server Error
```json
{
  "message": "[Error message]"
}
```

---

## 2. Book Appointment (Updated)

### Endpoint
```
POST /api/patient/appointments
```

### Authentication
```
Authorization: Bearer [JWT_TOKEN]
```

### Request Body
```json
{
  "patientId": "507f1f77bcf86cd799439012",
  "doctorId": "507f1f77bcf86cd799439011",
  "date": "2025-05-10",
  "time": "10:00",
  "treatment": "Teeth Cleaning"
}
```

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `patientId` | String | Yes | MongoDB ID of patient |
| `doctorId` | String | Yes | MongoDB ID of doctor |
| `date` | String | Yes | Date in YYYY-MM-DD format |
| `time` | String | Yes | Time in HH:MM format (24-hour) |
| `treatment` | String | No | Type of treatment (defaults to "Consultation") |

### Request Example
```bash
curl -X POST "http://localhost:5000/api/patient/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "patientId": "507f1f77bcf86cd799439012",
    "doctorId": "507f1f77bcf86cd799439011",
    "date": "2025-05-10",
    "time": "10:00",
    "treatment": "Teeth Cleaning"
  }'
```

### Response (Success - 201)
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "patientName": "John Doe",
  "patientId": "507f1f77bcf86cd799439012",
  "doctorId": "507f1f77bcf86cd799439011",
  "date": "2025-05-10T00:00:00.000Z",
  "time": "10:00",
  "treatment": "Teeth Cleaning",
  "appointmentDate": "2025-05-10T00:00:00.000Z",
  "appointmentTime": "10:00",
  "status": "pending",
  "createdAt": "2025-05-02T10:30:00.000Z",
  "updatedAt": "2025-05-02T10:30:00.000Z"
}
```

### Response Errors

#### 400 - Slot Already Booked
```json
{
  "message": "Slot already booked. Please select another time after 15 minutes."
}
```

#### 403 - Unauthorized
```json
{
  "message": "Unauthorized"
}
```

#### 404 - Doctor Not Found
```json
{
  "message": "Doctor not found"
}
```

#### 404 - Patient Not Found
```json
{
  "message": "Patient not found"
}
```

---

## 3. Usage Flow

### JavaScript Frontend Example
```javascript
// Step 1: Get available slots
const doctorId = "507f1f77bcf86cd799439011";
const date = "2025-05-10";

const slotsResponse = await fetch(
  `/api/appointments/available-slots/${doctorId}?date=${date}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const slotsData = await slotsResponse.json();
console.log("Available slots:", slotsData.slots);

// Step 2: User selects a slot (e.g., 10:00)
const selectedTime = "10:00";

// Step 3: Book appointment
const bookResponse = await fetch('/api/patient/appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    patientId: patientId,
    doctorId: doctorId,
    date: date,
    time: selectedTime,
    treatment: "Cleaning"
  })
});

if (bookResponse.ok) {
  const appointment = await bookResponse.json();
  console.log("Booked successfully:", appointment);
} else {
  const error = await bookResponse.json();
  console.error("Booking failed:", error.message);
}
```

---

## 4. Time Format Reference

### Time Slot Format
- **Format:** HH:MM (24-hour)
- **Range:** 09:00 to 16:30
- **Interval:** 30 minutes
- **Total slots per day:** 16

Example valid times:
- 09:00 (9 AM)
- 10:30 (10:30 AM)
- 14:00 (2 PM)
- 16:30 (4:30 PM)

### Date Format
- **Format:** YYYY-MM-DD
- **Examples:**
  - 2025-05-10 ✓
  - 2025-12-25 ✓
  - 05-10-2025 ✗ (wrong format)
  - 2025-5-10 ✗ (missing leading zero)

---

## 5. Status Codes

| Code | Meaning | Scenario |
|---|---|---|
| 200 | OK | Slots fetched successfully |
| 201 | Created | Appointment created successfully |
| 400 | Bad Request | Missing/invalid parameters or slot conflict |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | User not allowed to book for another patient |
| 404 | Not Found | Doctor or patient doesn't exist |
| 500 | Server Error | Database or server error |

---

## 6. Notes

### Booked Slots Criteria
A slot is marked as "Booked" if there's an existing appointment with:
- Same `doctorId`
- Same `date` (start of day matching)
- Status: `pending`, `confirmed`, `scheduled`, or `rescheduled`
- Time within 15-minute gap (before/after)

### Cancelled Appointments
- Appointments with status `cancelled` or `completed` do **NOT** block slots
- Slots can be reused if previous appointment was cancelled

### Validation Rules
1. **Exact time match:** Cannot book same exact minute
2. **15-minute gap:** Cannot book within 15 mins before/after existing
3. **Both rules enforced on backend:** Even if frontend allows, backend validates

### Performance
- Endpoint returns cached slot list (not real-time)
- Backend validates again before saving (true real-time check)
- Safe for ~100 appointments per doctor per day
- For higher load, consider caching strategy

---

## 7. Troubleshooting

### "doctorId not found"
```
Problem: Doctor ID is invalid or doesn't exist in DB
Solution: Verify doctorId is a valid MongoDB ID of an existing doctor
```

### "Slot already booked, but I see it as available"
```
Problem: Frontend shows stale data (another user just booked)
Solution: This is normal! Backend catches this and rejects with error
          User can refresh and select another slot
```

### "All slots show as booked"
```
Problem: Many appointments already exist for that date
Solution: Check appointments in MongoDB for that doctor+date
          Or change the date and try another day
```

### "Token error"
```
Problem: JWT token missing or expired
Solution: Login again to get fresh token
          Include Authorization header in requests
```

---

## 8. Testing Helpers

### Test with cURL
```bash
# Get available slots
curl -X GET "http://localhost:5000/api/appointments/available-slots/[DOCTOR_ID]?date=2025-05-10" \
  -H "Authorization: Bearer [TOKEN]"

# Book appointment
curl -X POST "http://localhost:5000/api/patient/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "patientId": "[PATIENT_ID]",
    "doctorId": "[DOCTOR_ID]",
    "date": "2025-05-10",
    "time": "10:00",
    "treatment": "Cleaning"
  }'
```

### Test with Postman
1. Create request: `GET /api/appointments/available-slots/:doctorId`
2. Add header: `Authorization: Bearer [token]`
3. Add query param: `date=2025-05-10`
4. Send and view response

---

**Last Updated:** 2025-05-02
**API Version:** 1.0
