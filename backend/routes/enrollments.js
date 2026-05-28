const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const router = express.Router();

// ─── Email ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Shinestar Cyber" <${process.env.GMAIL_USER}>`,
      to, subject, html
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

// ─── SMS (TextSMS Kenya) ──────────────────────────────────────────
// .env mapping:
//   TEXTSMS_API_KEY  → apikey      (the UUID key)
//   TEXTSMS_SENDER_ID → partnerID  (the numeric ID e.g. 12998)
//   API_TOKEN        → shortcode   (your sender name / shortcode)
const sendSMS = async (phone, message) => {
  if (!phone || phone === 'N/A') return;

  // Normalise to international format: 07XX → 2547XX
  let normalised = phone.trim().replace(/\s+/g, '');
  if (normalised.startsWith('0')) {
    normalised = '254' + normalised.slice(1);
  } else if (normalised.startsWith('+')) {
    normalised = normalised.slice(1);
  }

  try {
    const res = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: process.env.TEXTSMS_API_KEY,       // fdc89d3c-...
        partnerID: process.env.TEXTSMS_SENDER_ID,  // 12998
        message,
        shortcode: process.env.API_TOKEN,          // WTNskwtB6s... (sender name)
        mobile: normalised                         // 254712345678
      })
    });
    const data = await res.json();
    if (!res.ok) console.error('SMS error:', data);
  } catch (err) {
    console.error('SMS error:', err.message);
  }
};

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
    const { courseId, courseTitle, phone: enrollPhone } = req.body;

    if (!courseId || !courseTitle) {
      return res.status(400).json({ message: 'courseId and courseTitle are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const studentName = user.name || user.username;

    // Use phone from enrollment form if provided, else fall back to profile phone
    const phone = enrollPhone?.trim() || user.phone || 'N/A';

    // If student provided a phone, save it to their profile too
    if (enrollPhone?.trim() && (!user.phone || user.phone === 'N/A')) {
      await User.findByIdAndUpdate(req.user.id, { phone: enrollPhone.trim() });
    }

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
      studentName,
      email: user.email.toLowerCase(),
      phone,
      status: 'pending',
      enrollmentDate: new Date(),
      notes: req.body.notes || ''
    });

    await enrollment.save();

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

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/login`;

    // ── Completed (no certificate yet) ───────────────────────────
    if (status === 'completed') {
      sendEmail(
        enrollment.email,
        `🎉 Congratulations! You've completed ${enrollment.courseTitle}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #16a34a, #15803d); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">🎉 Course Completed!</h1>
            <p style="color: #bbf7d0;">Congratulations on your achievement</p>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hello <strong>${enrollment.studentName}</strong>,</p>
            <p>Congratulations! You have successfully completed <strong>${enrollment.courseTitle}</strong>.</p>
            <p>Your certificate will be uploaded to your student dashboard shortly.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background: linear-gradient(to right, #2563eb, #06b6d4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Go to My Dashboard →
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px;">For help, call us on <strong>0743181585</strong></p>
          </div>
        </div>
        `
      );

      sendSMS(
        enrollment.phone,
        `Congratulations ${enrollment.studentName}! You have successfully completed ${enrollment.courseTitle} at Shinestar Cyber Kenya. Your certificate will be available on your dashboard shortly. Login: ${loginUrl}. Help: 0743181585`
      );
    }

    // ── Cancelled ─────────────────────────────────────────────────
    if (status === 'cancelled') {
      sendEmail(
        enrollment.email,
        `Your enrollment for ${enrollment.courseTitle} has been cancelled`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Enrollment Cancelled</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hello <strong>${enrollment.studentName}</strong>,</p>
            <p>Your enrollment for <strong>${enrollment.courseTitle}</strong> has been cancelled.</p>
            <p>If you believe this is a mistake or need more information, please contact us.</p>
            <p style="color: #6b7280; font-size: 13px;">For help, call us on <strong>0743181585</strong></p>
          </div>
        </div>
        `
      );

      sendSMS(
        enrollment.phone,
        `Hello ${enrollment.studentName}, your enrollment for ${enrollment.courseTitle} at Shinestar Cyber Kenya has been cancelled. If this is a mistake, please contact us on 0743181585.`
      );
    }

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

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/login`;

    // ── Email with certificate link ───────────────────────────────
    sendEmail(
      enrollment.email,
      `🎓 Your Certificate for ${enrollment.courseTitle} is Ready!`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">🎓 Your Certificate is Ready!</h1>
          <p style="color: #fef3c7;">Congratulations on completing your course</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hello <strong>${enrollment.studentName}</strong>,</p>
          <p>Congratulations! You have successfully completed <strong>${enrollment.courseTitle}</strong> and your certificate is now available.</p>
          <div style="background: white; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px;">Your certificate is waiting in your dashboard</p>
            <a href="${loginUrl}" style="background: linear-gradient(to right, #f59e0b, #d97706); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Download Certificate →
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">For help, call us on <strong>0743181585</strong></p>
        </div>
      </div>
      `
    );

    // ── SMS with certificate link ─────────────────────────────────
    sendSMS(
      enrollment.phone,
      `🎓 ${enrollment.studentName}, your certificate for ${enrollment.courseTitle} is ready! Download it from your dashboard: ${loginUrl}. Shinestar Cyber Kenya. Help: 0743181585`
    );

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

// ─── TEMP: Test SMS ── Remove after testing ────────────────────
router.post('/test-sms', verifyAdmin, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'phone is required' });
  await sendSMS(phone, 'Test from Shinestar Cyber Kenya - SMS is working!');
  res.json({ message: `SMS sent to ${phone}` });
});

module.exports = router;