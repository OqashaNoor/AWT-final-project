# Visual Guide - Slot Availability System

## Before Implementation (Old Flow)

```
┌─────────────────────────────────────────────┐
│        BOOK APPOINTMENT MODAL               │
├─────────────────────────────────────────────┤
│                                             │
│  Select Doctor      [▼ Dr. Smith        ]  │
│                                             │
│  Date               [📅 2025-05-10     ]   │
│                                             │
│  Time               [🕐 00:00 ↕️        ]   │ ← Manual input
│                     (User types time)       │   Not ideal!
│                                             │
│  Treatment Type     [________Cleaning_]    │
│                                             │
│         [Confirm Booking]                  │
│                                             │
└─────────────────────────────────────────────┘

Problems:
❌ No visibility into what times are booked
❌ User tries invalid times
❌ No visual feedback
❌ Can accidentally double-book
```

---

## After Implementation (New Flow)

```
┌─────────────────────────────────────────────┐
│        BOOK APPOINTMENT MODAL               │
├─────────────────────────────────────────────┤
│                                             │
│  Select Doctor      [▼ Dr. Smith        ]  │
│                                             │
│  Date               [📅 2025-05-10     ]   │
│              ↓ (API fetches booked slots)  │
│  Select Time Slot                         │
│  ┌─────────────────────────────────────┐  │
│  │ 09:00│09:30 │10:00 │10:30 │        │  │
│  │      │Booked│      │      │        │  │ ← Visual
│  ├─────────────────────────────────────┤  │   availability
│  │ 11:00│11:30 │12:00 │12:30 │        │  │
│  │      │      │      │Booked│        │  │
│  ├─────────────────────────────────────┤  │
│  │ 13:00│13:30 │14:00 │14:30 │        │  │
│  │      │      │      │      │        │  │ ← User clicks
│  ├─────────────────────────────────────┤  │   available
│  │ 15:00│15:30 │16:00 │16:30 │        │  │
│  │      │      │      │      │        │  │ ← Slot highlights
│  └─────────────────────────────────────┘  │
│  ✓ Selected: 13:00                        │
│                                             │
│  Treatment Type     [________Cleaning_]    │
│                                             │
│         [Confirm Booking]                  │
│                                             │
└─────────────────────────────────────────────┘

Benefits:
✅ Clear visual of available/booked slots
✅ Cannot select booked slots
✅ No double-booking possible
✅ Better user experience
✅ Professional appearance
```

---

## UI States

### State 1: Initial (Before Doctor Selected)
```
Select Doctor      [▼ Choose a doctor...  ]

Select Time Slot    [Select a date first]
                    (Message displayed)
```

### State 2: Doctor Selected (Waiting for Date)
```
Select Doctor      [▼ Dr. Smith        ]

Select Time Slot    [Select a date first]
                    (Message displayed)
```

### State 3: Date Selected (Slots Loading)
```
Select Doctor      [▼ Dr. Smith        ]

Select Time Slot    [Loading available slots...]
                    (Spinner/message shown)
```

### State 4: Slots Loaded
```
Select Doctor      [▼ Dr. Smith        ]

Select Time Slot
┌─────────────────────────────┐
│ [09:00] [09:30 │ [10:00]   │
│         Booked              │ ← Grayed out
│ [10:30] [11:00] [11:30]   │
│ [12:00] [12:30 │ [13:00]   │
│         Booked              │
│ [13:30] [14:00] [14:30]   │
│ [15:00] [15:30] [16:00]   │
│ [16:30]                     │
└─────────────────────────────┘

▢ Selected: (none)
```

### State 5: Slot Selected
```
Select Time Slot
┌─────────────────────────────┐
│ [09:00] [09:30 │ [10:00]   │
│         Booked              │
│ [10:30] [11:00] [11:30]   │
│ [12:00] [12:30 │ [13:00]   │
│         Booked              │
│ [13:30] [14:00] [14:30]   │
│ [15:00] [15:30] [16:00]   │
│ [16:30]                     │
└─────────────────────────────┘

✓ Selected: 13:30 ← Highlighted in teal/green
```

### State 6: Error on Booked Slot Click
```
When user clicks "Booked" slot:

⚠️ This time slot is already booked.
   Please select another slot.
```

### State 7: Success (After Booking)
```
✅ Appointment booked successfully!

Modal closes and dashboard refreshes
```

---

## Color Scheme

### Available Slot Button
```
Normal state:
┌────────┐
│ 10:00  │  ← White background
│        │  ← Black text
└────────┘  ← Gray border

Hover state:
┌────────┐
│ 10:00  │  ← Light teal background
│        │  ← Dark teal text
└────────┘  ← Teal border
           ← Slight elevation/shadow

Selected state:
┌────────┐
│ 10:00  │  ← Dark teal background
│        │  ← White text
└────────┘  ← Dark teal border
```

### Booked Slot Button
```
State:
┌────────┐
│ 09:30  │  ← Light gray background (~60% opacity)
│ Booked │  ← Gray text
└────────┘  ← Light gray border
           ← Not hoverable
           ← Not clickable
```

---

## API Response Example

### Request
```
GET /api/appointments/available-slots/507f1f77bcf86cd799439011?date=2025-05-10
Authorization: Bearer [token]
```

### Response (200 OK)
```json
{
  "date": "2025-05-10",
  "doctorId": "507f1f77bcf86cd799439011",
  "totalSlots": 16,
  "bookedCount": 3,
  "availableCount": 13,
  "slots": [
    { "time": "09:00", "isBooked": false },
    { "time": "09:30", "isBooked": true },
    { "time": "10:00", "isBooked": false },
    { "time": "10:30", "isBooked": false },
    { "time": "11:00", "isBooked": true },
    { "time": "11:30", "isBooked": false },
    { "time": "12:00", "isBooked": false },
    { "time": "12:30", "isBooked": false },
    { "time": "13:00", "isBooked": false },
    { "time": "13:30", "isBooked": false },
    { "time": "14:00", "isBooked": true },
    { "time": "14:30", "isBooked": false },
    { "time": "15:00", "isBooked": false },
    { "time": "15:30", "isBooked": false },
    { "time": "16:00", "isBooked": false },
    { "time": "16:30", "isBooked": false }
  ],
  "bookedTimes": ["09:30", "11:00", "14:00"]
}
```

Frontend renders this as:
```
[09:00] [09:30 │ [10:00] [10:30] [11:00 │ [11:30]
       Booked              Booked
[12:00] [12:30] [13:00] [13:30] [14:00 │ [14:30]
                               Booked
[15:00] [15:30] [16:00] [16:30]
```

---

## JavaScript State Management

```javascript
// Current values in form (hidden from user)
appointmentDoctor = "507f1f77bcf86cd799439011" (Dr. Smith)
appointmentDate = "2025-05-10"
appointmentTime = "13:30" (hidden input, set by slot click)
appointmentTreatment = "Teeth Cleaning"

// When submit is clicked:
// → POST /api/patient/appointments
// {
//   "patientId": "...",
//   "doctorId": "507f1f77bcf86cd799439011",
//   "date": "2025-05-10",
//   "time": "13:30",
//   "treatment": "Teeth Cleaning"
// }
```

---

## Error Scenarios

### Scenario 1: Double-Booking Attempt
```
User A: Selects 10:00 AM
User B: Selects 10:00 AM (simultaneously)

Frontend (User B):
✓ Shows 10:00 AM as available

User A: Submits → ✓ Booked successfully
User B: Submits → 
  Backend checks: Is 10:00 AM free?
  Query DB → Found User A's appointment
  
Response:
❌ "Slot already booked. Please select another time after 15 minutes."

User B: Sees error, selects 10:30 AM → ✓ Booked
```

### Scenario 2: 15-Minute Gap Enforcement
```
Existing appointment: Dr. Smith at 2:00 PM

Try booking:
- 1:45 PM → ❌ Blocked (within 15 mins before)
- 1:50 PM → ❌ Blocked (within 15 mins before)
- 2:00 PM → ❌ Blocked (exact match)
- 2:10 PM → ❌ Blocked (within 15 mins after)
- 2:15 PM → ❌ Blocked (within 15 mins after)
- 2:30 PM → ✅ Allowed (15 mins after)
- 2:45 PM → ✅ Allowed
```

### Scenario 3: No Slots Available
```
All 16 slots for the day are booked

Frontend displays:
Select Time Slot
[No slots available]

User action: Try different date or doctor
```

---

## Browser Console Debug

### Successful Slot Load
```
Network tab shows:
✓ GET /api/appointments/available-slots/... 200 OK
Console shows:
Slots loaded successfully (16 available, 3 booked)
```

### Failed Slot Load
```
Network tab shows:
✗ GET /api/appointments/available-slots/... 404 Not Found
Console error:
Failed to load available slots

Error: Doctor not found
(User entered invalid doctor ID)
```

### Successful Booking
```
Network tab shows:
✓ POST /api/patient/appointments 201 Created
Console output:
Appointment booked successfully!

Success message: "Appointment booked successfully!"
```

### Failed Booking (Double-Book)
```
Network tab shows:
✗ POST /api/patient/appointments 400 Bad Request
Response body:
{
  "message": "Slot already booked. Please select another time after 15 minutes."
}

Console output:
Error booking appointment: ⚠️ This time slot is already booked...

Error message shown to user: "⚠️ This time slot is already booked..."
```

---

## Mobile View

### Slots Grid on Small Screen
```
Portrait (Mobile):
┌──────────────────┐
│ Select Doctor    │
│ [Dr. Smith ▼  ] │
│                  │
│ Select Date      │
│ [📅 05-10     ] │
│                  │
│ Time Slots       │
│ ┌─────────────┐ │
│ │09:00 09:30  │ │
│ │             │ │
│ │10:00 10:30  │ │
│ │ Booked      │ │
│ │             │ │
│ │11:00 11:30  │ │
│ │             │ │
│ │ ...         │ │
│ └─────────────┘ │
│                  │
│ Treatment        │
│ [_________   ]   │
│                  │
│  [Confirm]       │
└──────────────────┘

Responsive: 2-3 slots per row on mobile
```

---

## Loading States

### Slots Loading
```
Select Time Slot
┌──────────────────────────────┐
│  Loading available slots...  │  ← Spinner
└──────────────────────────────┘
```

### API Error
```
Select Time Slot
┌──────────────────────────────┐
│  Failed to load available    │ ← Red error
│  slots. Try again.           │   message
└──────────────────────────────┘
```

---

## Form Validation Messages

| Situation | Message | Type |
|---|---|---|
| No time selected | "Please select a time slot" | Error |
| Booked slot clicked | "This time slot is already booked..." | Error |
| Booking success | "Appointment booked successfully!" | Success |
| Slot conflict | "Slot already booked. Please select another..." | Error |
| No doctor selected | "Please select a doctor" | Error |
| Doctor not found | "Doctor not found" | Error |

---

## Timeline

### Fast Path (No Conflicts)
```
1. User selects doctor: 0ms
2. User selects date: 0ms
3. API fetches slots: 300-500ms
4. Slots displayed: 100ms
5. User clicks slot: 10ms
6. Form validates: 50ms
7. Backend validates: 500ms
8. Appointment saved: 100ms
9. Success message: 50ms

Total: ~1.5 seconds from date selection to success
```

### Conflict Path
```
1-4. Same as above
5-7. User A books slot
    Backend saves: 100ms
8. User B submits same slot
   Backend checks DB: 200ms
   Finds conflict: 50ms
   Returns error: 50ms
9. Error displayed: 50ms

Total: ~0.5 seconds for error response
```

---

## Visual Hierarchy

### Modal Content Layout
```
┌─────────────────────────────────────────┐
│ ✕ Book Appointment                      │ ← Title, close button
├─────────────────────────────────────────┤
│ Select Doctor                           │ ← Label
│ [▼ Dr. Smith - Orthodontist         ]  │ ← Dropdown (fuller width)
│                                         │
│ Date                                    │ ← Label
│ [📅 2025-05-10                      ]  │ ← Date picker
│                                         │
│ Select Time Slot                        │ ← Label
│ ┌─────────────────────────────────────┐│
│ │ [09:00] [09:30] [10:00] [10:30]  ││ ← Slot buttons
│ │ [11:00] [11:30] [12:00] [12:30]  ││
│ │ [13:00] [13:30] [14:00] [14:30]  ││
│ │ [15:00] [15:30] [16:00] [16:30]  ││
│ └─────────────────────────────────────┘│
│ Selected: 13:30 ✓                      │ ← Feedback
│                                         │
│ Treatment Type                          │ ← Label
│ [________Teeth Cleaning____________]   │ ← Text input
│                                         │
│ ┌─────────────────────────────────────┐│
│ │      [Confirm Booking]              ││ ← Primary button
│ └─────────────────────────────────────┘│
│                                         │
│ ✅ Appointment booked successfully!     │ ← Success message
│                                         │
└─────────────────────────────────────────┘
```

---

**Visual Guide Complete!**

Use this document to understand exactly how the system looks and behaves.

