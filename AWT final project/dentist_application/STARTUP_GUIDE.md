# DentalCare - Full Stack Dental Management Application

A modern, responsive web application for managing dental clinic appointments, patient management, and doctor profiles.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   
   The `.env` file is pre-configured. Make sure MongoDB is running:
   ```
   MONGODB_URI=mongodb://localhost:27017/dentist_app
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_change_in_production
   NODE_ENV=development
   ```

3. **Start MongoDB** (if local)
   ```bash
   mongod
   ```

4. **Start the Server**
   ```bash
   npm start
   ```
   Server will run on: `http://localhost:5000`

5. **Open Frontend**
   
   Open `frontend/index.html` in your browser (use Live Server extension or open directly)

## 📁 Project Structure

```
dentist_app/
├── backend/
│   ├── config/db.js              MongoDB connection
│   ├── middleware/auth.js        JWT authentication
│   ├── models/
│   │   ├── User.js               User schema
│   │   ├── Doctor.js             Doctor profile
│   │   └── Appointment.js        Appointment details
│   ├── routes/
│   │   ├── authRoutes.js         Auth endpoints
│   │   ├── doctorRoutes.js       Doctor endpoints
│   │   └── appointmentRoutes.js  Appointment endpoints
│   ├── server.js                 Express server
│   └── package.json
├── frontend/
│   ├── index.html                Landing page
│   ├── auth.html                 Login/Register
│   ├── patient-dashboard.html    Patient dashboard
│   ├── doctor-dashboard.html     Doctor dashboard
│   ├── profile.html              Profile page
│   ├── appointment.html          Appointments
│   ├── css/style.css             Styling (Mint green theme)
│   ├── js/main.js                JavaScript logic
│   └── images/                   Assets
├── .env                          Configuration
├── .gitignore
└── README.md
```

## 🎨 Features

### For Patients
✅ Register and login  
✅ View all available doctors  
✅ Search doctors by specialization  
✅ Book appointments with selected doctors  
✅ View upcoming appointments  
✅ Cancel or reschedule appointments  
✅ Update personal profile  
✅ Track appointment status

### For Doctors
✅ Register and login  
✅ Create and manage professional profile  
✅ Set specialization and consultation fee  
✅ View upcoming appointments  
✅ See patient details  
✅ Track statistics (total patients, appointments, completed appointments)  
✅ Manage availability hours

### General
✅ Modern, responsive design  
✅ Mint green color theme  
✅ Mobile-friendly interface  
✅ Real-time status updates  
✅ Secure JWT authentication  
✅ Password hashing (bcryptjs)  
✅ CORS enabled for frontend-backend communication

## 🔐 Authentication

The app uses JWT (JSON Web Tokens) for authentication:

1. **Register**: Create new account with email, password, phone, and role
2. **Login**: Authenticate with email, password, and role selection
3. **Token Storage**: JWT token stored in localStorage
4. **Protected Routes**: Dashboards require valid token
5. **Auto Logout**: Invalid token redirects to login

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors` - Create doctor profile
- `PUT /api/doctors/:id` - Update profile
- `GET /api/doctors/specialization/:spec` - Filter by specialization

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/user/appointments` - Get logged-in user's appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### User Profile
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update profile

## 💡 How to Use

### For Patients:
1. Go to `index.html` → Click "Get Started"
2. Click "Register" → Fill form → Create account
3. You'll be redirected to patient dashboard
4. Click "Find Doctors" → Browse available doctors
5. Click "Book Appointment" on any doctor
6. Fill appointment details → Confirm
7. View appointments in "My Appointments"

### For Doctors:
1. Go to `index.html` → Click "Get Started"
2. Click "Register" → Select "Doctor" role → Create account
3. You'll be redirected to doctor dashboard
4. Go to "My Profile" → Fill professional details
5. Save profile → View statistics
6. Check "Appointments" for scheduled appointments

## 🎨 Design Features

- **Mint Green Theme**: Professional healthcare color scheme
- **Responsive Layout**: Works on desktop, tablet, mobile
- **Modern UI**: Clean, minimalist design
- **Smooth Animations**: Bounce effects, transitions
- **Accessibility**: Proper labels, contrast, keyboard navigation
- **Dashboard Layout**: Sidebar navigation with organized sections
- **Modal Forms**: Clean appointment booking experience

## 🔧 Technology Stack

### Frontend
- HTML5
- CSS3 (Grid, Flexbox, Gradients)
- JavaScript (Fetch API)
- Responsive Design

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose ODM
- bcryptjs (Password hashing)
- jsonwebtoken (JWT)

### Database
- MongoDB (Collections: users, doctors, appointments)
- Mongoose schemas with validation

## 📝 Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/dentist_app
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_in_production
FRONTEND_URL=http://localhost:3000
```

## ⚠️ Important Notes

- **JWT Secret**: Change JWT_SECRET in production
- **CORS**: Configured for localhost - update in production
- **Database**: Install MongoDB or use MongoDB Atlas
- **Email Service**: Currently disabled - add for notifications
- **Password**: Stored as bcrypt hash, not plain text

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)
1. Set environment variables
2. Ensure MongoDB connection string is valid
3. Deploy backend server
4. Update API_URL in frontend/js/main.js

### Frontend Deployment (Vercel/Netlify)
1. Build static files
2. Update API_URL to production backend
3. Deploy to CDN

## 🐛 Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running: `mongod`
- Check connection string in .env
- Verify MongoDB port (default: 27017)

**CORS Error**
- Check CORS middleware in server.js
- Verify frontend URL in Backend
- Clear browser cache

**Login Not Working**
- Check email/password format
- Verify role selection
- Check browser console for errors

**Appointments Not Loading**
- Ensure you're logged in
- Check token in localStorage
- Verify backend is running

## 📞 Support

For issues or questions:
1. Check console errors (F12)
2. Verify backend is running
3. Check .env configuration
4. Ensure MongoDB is connected

## 📄 License

ISC

---

**Created**: March 2024  
**Version**: 1.0.0
