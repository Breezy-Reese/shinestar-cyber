const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const router = express.Router();

// ─── TextSMS.co.ke ────────────────────────────────────────────────
const sendSMS = async (mobile, message) => {
  try {
    let phone = mobile.toString().trim();
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    else if (phone.startsWith('+')) phone = phone.slice(1);

    const response = await axios.post('https://api.textsms.co.ke/api/services/sendsms/', {
      apikey: process.env.TEXTSMS_API_KEY || 'fdc89d3c-1a4e-4cf1-9b13-8bd659cbf7b7',
      partnerID: process.env.TEXTSMS_SENDER_ID || '12998',
      message,
      shortcode: process.env.TEXTSMS_SENDER_ID || '12998',
      mobile: phone
    }, { headers: { 'Content-Type': 'application/json' } });

    console.log(`SMS sent to ${phone}:`, response.data);
  } catch (err) {
    console.error('SMS error:', err.response?.data || err.message);
  }
};

// ─── Local file storage ───────────────────────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/certificates/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const enrollmentId = req.params.enrollmentId;
    const ext = path.extname(file.originalname);
    cb(null, `cert_${enrollmentId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
  }
});

// ─── Middleware: verify admin ─────────────────────────────────────
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── Middleware: verify student ───────────────────────────────────
const verifyStudent = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'user') {
      return res.status(403).json({ message: 'Student access required' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const ADMIN_PHONE = process.env.ADMIN_PHONE || '0743181585';

// ─── ADMIN: Get all enrollments ───────────────────────────────────
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const enrollments = await Enrollment.find().sort({ enrollmentDate: -1 });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STUDENT: Enroll in a course ─────────────────────────────────
router.post('/', verifyStudent, async (req, res) => {
  try {
    const { courseId, courseTitle } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existingEnrollment = await Enrollment.findOne({
      email: user.email.toLowerCase(), courseId
    });
    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }

    const enrollment = new Enrollment({
      courseId,
      courseTitle,
      studentName: user.name,
      email: user.email.toLowerCase(),
      phone: user.phone || '',
      status: 'pending',
      enrollmentDate: new Date(),
      notes: `Enrolled by student on ${new Date().toLocaleDateString()}`
    });

    await enrollment.save();

    // SMS to student
    if (user.phone) {
      sendSMS(user.phone, `Hello ${user.name}! Your enrollment for ${courseTitle} at Shinestar Cyber has been received. We will confirm shortly. Call 0743181585 for help.`);
    }

    // SMS to admin
    sendSMS(ADMIN_PHONE, `New enrollment: ${user.name} (${user.phone || user.email}) enrolled in ${courseTitle}. Login to admin panel to confirm.`);

    res.status(201).json({ message: 'Successfully enrolled!', enrollment });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Failed to enroll in course' });
  }
});

// ─── STUDENT: Get my enrollments ─────────────────────────────────
router.get('/my-enrollments', verifyStudent, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const enrollments = await Enrollment.find({ email: user.email })
      .populate('courseId', 'title description duration fee_ksh level image')
      .sort({ enrollmentDate: -1 });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: Update enrollment status ─────────────────────────────
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const previousStatus = enrollment.status;
    enrollment.status = status;
    await enrollment.save();

    // SMS on confirmed
    if (status === 'confirmed' && previousStatus !== 'confirmed' && enrollment.phone) {
      sendSMS(enrollment.phone, `Hello ${enrollment.studentName}! Your enrollment for ${enrollment.courseTitle} at Shinestar Cyber is CONFIRMED. Welcome aboard! Call 0743181585 for more info.`);
    }

    // SMS on completed
    if (status === 'completed' && previousStatus !== 'completed' && enrollment.phone) {
      sendSMS(enrollment.phone, `Congratulations ${enrollment.studentName}! You have completed ${enrollment.courseTitle} at Shinestar Cyber. Your certificate is ready. Login to your student portal to download it.`);
    }

    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: Upload certificate ────────────────────────────────────
router.post('/:enrollmentId/certificate', verifyAdmin, upload.single('certificate'), async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const certificateUrl = `${baseUrl}/uploads/certificates/${req.file.filename}`;

    enrollment.certificateUrl = certificateUrl;
    enrollment.status = 'completed';
    await enrollment.save();

    // SMS to student
    if (enrollment.phone) {
      sendSMS(enrollment.phone, `Congratulations ${enrollment.studentName}! Your certificate for ${enrollment.courseTitle} is ready. Login to your Shinestar student portal to download it. Call 0743181585.`);
    }

    // SMS to admin
    sendSMS(ADMIN_PHONE, `Certificate uploaded for ${enrollment.studentName} - ${enrollment.courseTitle}.`);

    res.json({ message: 'Certificate uploaded successfully', certificateUrl, enrollment });
  } catch (error) {
    console.error('Certificate upload error:', error);
    res.status(500).json({ message: 'Failed to upload certificate', error: error.message });
  }
});

// ─── STUDENT: Get profile + enrollments ──────────────────────────
router.get('/profile', verifyStudent, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const enrollments = await Enrollment.find({ email: user.email })
      .populate('courseId', 'title description duration fee_ksh level image')
      .sort({ enrollmentDate: -1 });

    res.json({ user, enrollments });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STUDENT: Update profile ──────────────────────────────────────
router.put('/profile', verifyStudent, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, username: name, phone },
      { new: true }
    ).select('-password_hash');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;