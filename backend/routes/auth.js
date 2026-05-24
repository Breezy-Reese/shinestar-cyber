const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

const router = express.Router();

// ─── TextSMS ──────────────────────────────────────────────────────
const sendSMS = async (mobile, message) => {
  try {
    let phone = mobile.toString().trim();
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    else if (phone.startsWith('+')) phone = phone.slice(1);

    await axios.post('https://api.textsms.co.ke/api/services/sendsms/', {
      apikey: process.env.TEXTSMS_API_KEY || 'fdc89d3c-1a4e-4cf1-9b13-8bd659cbf7b7',
      partnerID: process.env.TEXTSMS_SENDER_ID || '12998',
      message,
      shortcode: process.env.TEXTSMS_SENDER_ID || '12998',
      mobile: phone
    }, { headers: { 'Content-Type': 'application/json' } });

    console.log(`SMS sent to ${phone}`);
  } catch (err) {
    console.error('SMS error:', err.response?.data || err.message);
  }
};

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
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

// ─── Generate temp password ───────────────────────────────────────
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// ─── Middleware: verify admin ─────────────────────────────────────
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── STUDENT REGISTER ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existingUser) return res.status(400).json({ message: 'Email or username already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      name: username,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      role: 'user',
      active: true,
    });
    await user.save();

    res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN LOGIN ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Please use the student login.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STUDENT LOGIN ────────────────────────────────────────────────
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'user' });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.active === false) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name || user.username,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword || false,
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STUDENT: Change password ─────────────────────────────────────
router.post('/student/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(decoded.id, {
      password_hash: hashedPassword,
      mustChangePassword: false,
      tempPassword: null
    });

    const user = await User.findById(decoded.id).select('-password_hash');
    const freshToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Password changed successfully',
      token: freshToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name || user.username,
        email: user.email,
        role: user.role,
        mustChangePassword: false,
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: Send credentials to student ──────────────────────────
router.post('/send-credentials/:enrollmentId', verifyAdmin, async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const studentEmail = enrollment.email.toLowerCase().trim();

    let user = await User.findOne({ email: studentEmail });

    if (user) {
      user.password_hash = hashedPassword;
      user.mustChangePassword = true;
      user.tempPassword = tempPassword;
      user.name = user.name || enrollment.studentName;
      user.username = user.username || enrollment.studentName;
      await user.save();
    } else {
      user = new User({
        name: enrollment.studentName,
        username: enrollment.studentName,
        email: studentEmail,
        password_hash: hashedPassword,
        role: 'user',
        mustChangePassword: true,
        tempPassword,
        active: true,
      });
      await user.save();
    }

    enrollment.email = studentEmail;
    enrollment.status = 'confirmed';
    await enrollment.save();

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/login`;

    if (enrollment.phone) {
      sendSMS(
        enrollment.phone,
        `Hello ${enrollment.studentName}! Your Shinestar Cyber student account is ready. Email: ${studentEmail} | Temp Password: ${tempPassword} | Login: ${loginUrl}`
      );
    }

    sendEmail(
      studentEmail,
      'Your Shinestar Cyber Student Account is Ready',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #2563eb, #06b6d4); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to Shinestar Cyber!</h1>
          <p style="color: #bfdbfe;">Your student account is ready</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hello <strong>${enrollment.studentName}</strong>,</p>
          <p>Your enrollment for <strong>${enrollment.courseTitle}</strong> has been confirmed.</p>
          <div style="background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Login Credentials</p>
            <p style="margin: 10px 0 5px;"><strong>Email:</strong> ${studentEmail}</p>
            <p style="margin: 0 0 10px;"><strong>Temporary Password:</strong>
              <span style="background: #fef3c7; padding: 4px 12px; border-radius: 4px; font-size: 18px; font-weight: bold; letter-spacing: 2px;">${tempPassword}</span>
            </p>
          </div>
          <p style="color: #dc2626; font-weight: bold;">⚠️ Please change this password after your first login.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(to right, #2563eb, #06b6d4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Login to Student Portal →
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">For help, call us on <strong>0743181585</strong></p>
        </div>
      </div>
      `
    );

    res.json({
      message: `Credentials sent to ${studentEmail}`,
      tempPassword
    });
  } catch (error) {
    console.error('Send credentials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STUDENT DASHBOARD DATA ───────────────────────────────────────
router.get('/student/dashboard', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);

    if (decoded.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot access the student dashboard' });
    }

    const user = await User.findById(decoded.id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const studentEmail = user.email.toLowerCase().trim();

    const enrollments = await Enrollment.find({ email: studentEmail })
      .populate('courseId', 'title description duration fee_ksh level image')
      .sort({ enrollmentDate: -1 });

    res.json({ user, enrollments });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STUDENT PROFILE UPDATE ───────────────────────────────────────
router.put('/student/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role === 'admin') return res.status(403).json({ message: 'Not a student account' });

    const { name, phone } = req.body;
    const updated = await User.findByIdAndUpdate(
      decoded.id,
      { name, username: name, phone },
      { new: true }
    ).select('-password_hash');

    res.json({ user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;