# Dental Care App

A full-stack web application for managing dental clinic appointments, patient management, and doctor profiles.

## Project Structure

```
dentist_app/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection configuration
│   ├── models/
│   │   ├── User.js               # User schema (patients, doctors, admin)
│   │   ├── Doctor.js             # Doctor profile schema
│   │   └── Appointment.js        # Appointment schema
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication endpoints
│   │   ├── doctorRoutes.js       # Doctor management endpoints
│   │   └── appointmentRoutes.js  # Appointment management endpoints
│   ├── controllers/              # Business logic (to be implemented)
│   └── server.js                 # Main server file
├── frontend/
│   ├── index.html                # Home page
│   ├── auth.html                 # Login/Register page
│   ├── patient-dashboard.html    # Patient dashboard
│   ├── doctor-dashboard.html     # Doctor dashboard
│   ├── profile.html              # User profile
│   ├── appointment.html          # Appointment booking
│   ├── css/
│   │   └── style.css             # Styling
│   ├── js/
│   │   └── main.js               # Frontend JavaScript
│   └── images/                   # Images and assets
├── .env                          # Environment variables
├── .gitignore                    # Git ignore file
├── package.json                  # Dependencies
└── README.md                     # Documentation
```

## Features

### Backend
- **Authentication**: User registration and login with JWT
- **Doctor Management**: Create and manage doctor profiles with specializations
- **Appointment System**: Book, reschedule, and cancel appointments
- **Database**: MongoDB with Mongoose ODM
- **Security**: Password hashing with bcryptjs

### Frontend
- **Responsive Design**: Mobile-friendly UI
- **User Dashboard**: Different dashboards for patients and doctors
- **Appointment Booking**: Easy appointment scheduling
- **Profile Management**: User profile updates

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   
   Update `.env` file with your configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017/dentist_app
   PORT=5000
   JWT_SECRET=your_secret_key
   NODE_ENV=development
   ```

3. **Start MongoDB**
   
   Make sure MongoDB is running on your machine or update the connection string for MongoDB Atlas.

4. **Run the Server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

   The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors` - Create doctor profile
- `PUT /api/doctors/:id` - Update doctor profile
- `GET /api/doctors/specialization/:spec` - Get doctors by specialization

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Book new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/doctor/:doctorId` - Get doctor's appointments

## Frontend Usage

1. Navigate to `index.html` in your browser
2. Login or register as a patient or doctor
3. Access the dashboard based on your role
4. Book or manage appointments

## Technologies Used

### Backend
- Express.js - Web framework
- MongoDB - Database
- Mongoose - ODM
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Fetch API for HTTP requests

## Future Enhancements

- [ ] Email notifications
- [ ] SMS reminders
- [ ] Payment integration
- [ ] Doctor ratings and reviews
- [ ] Medical records management
- [ ] Online video consultation
- [ ] Real-time notifications
- [ ] Advanced scheduling

## License

ISC

## Support

For issues or questions, please create an issue in the repository.
