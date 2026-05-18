const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Middleware: verify admin token
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

// Middleware: verify student token
const verifyStudent = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── ADMIN: Upload certificate for an enrollment ──────────────────
router.post('/:enrollmentId/certificate', verifyAdmin, upload.single('certificate'), async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'certificates',
          resource_type: 'auto',
          public_id: `cert_${enrollmentId}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Save certificate URL and mark as completed
    enrollment.certificateUrl = result.secure_url;
    enrollment.status = 'completed';
    await enrollment.save();

    res.json({
      message: 'Certificate uploaded successfully',
      certificateUrl: result.secure_url,
      enrollment
    });
  } catch (error) {
    console.error('Certificate upload error:', error);
    res.status(500).json({ message: 'Failed to upload certificate' });
  }
});

// ─── STUDENT: Get profile + enrollments ───────────────────────────
router.get('/profile', verifyStudent, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enrollments = await Enrollment.find({ email: user.email })
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

    // Update localStorage name on frontend side
    res.json({ user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;