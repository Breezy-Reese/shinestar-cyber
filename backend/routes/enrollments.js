const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const router = express.Router();

// Configure local storage
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
    allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
  }
});

// ── Middleware: verify admin ──────────────────────────────────────
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ── Middleware: verify student ────────────────────────────────────
const verifyStudent = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'user')
      return res.status(403).json({ message: 'Student access required' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── ADMIN: Get all enrollments ───────────────────────────────────
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const enrollments = await Enrollment.find().sort({ enrollmentDate: -1 });
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STUDENT: Enroll in a course ─────────────────────────────────
router.post('/', verifyStudent, async (req, res) => {
  try {
    const { courseId, courseTitle } = req.body;

    if (!courseId || !courseTitle) {
      return res.status(400).json({ message: 'courseId and courseTitle are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Use username as fallback for name
    const studentName = user.name || user.username;
    const phone = user.phone || 'N/A';

    console.log('Enrolling student:', { studentName, email: user.email, courseTitle });

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      email: user.email.toLowerCase(),
      courseId
    });
    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }

    const enrollment = new Enrollment({
      courseId,
      courseTitle,
      studentName,      // ✅ fixed
      email: user.email.toLowerCase(),
      phone,            // ✅ fallback to 'N/A' so required field is satisfied
      status: 'pending',
      enrollmentDate: new Date(),
      notes: req.body.notes || ''
    });

    await enrollment.save();
    console.log('Enrollment saved:', enrollment._id);

    res.status(201).json({
      message: 'Successfully enrolled! Admin will review and send your course details.',
      enrollment
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Failed to enroll in course', error: error.message });
  }
});

// ─── STUDENT: Get my enrollments ─────────────────────────────────
router.get('/my-enrollments', verifyStudent, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const enrollments = await Enrollment.find({ email: user.email.toLowerCase() })
      .populate('courseId', 'title description duration fee_ksh level image')
      .sort({ enrollmentDate: -1 });

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: Update enrollment status ─────────────────────────────
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    res.json(enrollment);
  } catch (error) {
    console.error('Error updating enrollment:', error);
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

    res.json({ message: 'Certificate uploaded successfully', certificateUrl, enrollment });
  } catch (error) {
    console.error('Certificate upload error:', error);
    res.status(500).json({ message: 'Failed to upload certificate' });
  }
});

// ─── STUDENT: Get profile + enrollments ──────────────────────────
router.get('/profile', verifyStudent, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const enrollments = await Enrollment.find({ email: user.email.toLowerCase() })
      .populate('courseId', 'title description duration fee_ksh level image')
      .sort({ enrollmentDate: -1 });

    res.json({ user, enrollments });
  } catch (error) {
    console.error('Profile error:', error);
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
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;