const express = require('express');
const cors = require('cors');
const path = require('path'); // ADD THIS LINE
require('dotenv').config();
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const serviceRoutes = require('./routes/services');
const settingsRoutes = require('./routes/settings');
const enrollmentRoutes = require('./routes/enrollments');
const bookingRoutes = require('./routes/bookings');
const certificateRoutes = require('./routes/certificates');

mongoose.set('strictQuery', false);

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.options(/.*/, cors());

app.use(express.json());

// ================= STATIC FILES (ADD THIS) =================
// Serve uploaded files (certificates, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= ROUTES =================
app.get('/', (req, res) => res.send('Backend is running!'));
app.get('/api/test', (req, res) => res.json({ message: 'API is working!' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/certificates', certificateRoutes);

// ================= DB CONNECTION =================
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });