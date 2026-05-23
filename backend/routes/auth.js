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

// ─── ADMIN REGISTER ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'admin' } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, email, password_hash: hashedPassword, role });
    await user.save();

    res.status(201).json({ message: 'User created successfully' });
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

    if (user.role !== 'admin') return res.status(403).json({ message: 'Access denied. Use student login.' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
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

    const user = await User.findOne({ email: email.toLowerCase(), role: 'user' });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword  // ← key flag
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STUDENT: Change password (forced on first login) ─────────────
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

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: Send credentials to student ──────────────────────────
// Called from admin Enrollments panel after reviewing an enrollment
router.post('/send-credentials/:enrollmentId', verifyAdmin, async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Check if student account already exists
    let user = await User.findOne({ email: enrollment.email.toLowerCase() });

    if (user) {
      // Update existing account with new temp password
      user.password_hash = hashedPassword;
      user.mustChangePassword = true;
      user.tempPassword = tempPassword;
      user.name = user.name || enrollment.studentName;
      user.phone = user.phone || enrollment.phone;
      await user.save();
    } else {
      // Create new student account
      user = new User({
        name: enrollment.studentName,
        username: enrollment.studentName,
        email: enrollment.email.toLowerCase(),
        password_hash: hashedPassword,
        phone: enrollment.phone,
        role: 'user',
        mustChangePassword: true,
        tempPassword
      });
      await user.save();
    }

    // Update enrollment status to confirmed
    enrollment.status = 'confirmed';
    await enrollment.save();

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/login`;

    // SMS to student
    if (enrollment.phone) {
      sendSMS(
        enrollment.phone,
        `Hello ${enrollment.studentName}! Your Shinestar Cyber student account is ready. Email: ${enrollment.email} | Temp Password: ${tempPassword} | Login: ${loginUrl} - Please change your password after login.`
      );
    }

    // Email to student
    sendEmail(
      enrollment.email,
      'Your Shinestar Cyber Student Account is Ready',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #2563eb, #06b6d4); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to Shinestar Cyber!</h1>
          <p style="color: #bfdbfe;">Your student account is ready</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hello <strong>${enrollment.studentName}</strong>,</p>
          <p>Your enrollment for <strong>${enrollment.courseTitle}</strong> has been confirmed and your student account is ready.</p>
          
          <div style="background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Login Credentials</p>
            <p style="margin: 10px 0 5px;"><strong>Email:</strong> ${enrollment.email}</p>
            <p style="margin: 0 0 10px;"><strong>Temporary Password:</strong> 
              <span style="background: #fef3c7; padding: 4px 12px; border-radius: 4px; font-size: 18px; font-weight: bold; letter-spacing: 2px;">${tempPassword}</span>
            </p>
          </div>

          <p style="color: #dc2626; font-weight: bold;">⚠️ You will be required to change this password when you first login.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(to right, #2563eb, #06b6d4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Login to Student Portal →
            </a>
          </div>

          <p style="color: #6b7280; font-size: 13px;">If you have any issues, call us on <strong>0743181585</strong></p>
          <p style="color: #6b7280; font-size: 13px;">Shinestar Cyber & Tech Solutions Kenya</p>
        </div>
      </div>
      `
    );

    res.json({
      message: `Credentials sent to ${enrollment.email} and ${enrollment.phone}`,
      tempPassword // returned so admin can see it too
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
    const user = await User.findById(decoded.id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const enrollments = await Enrollment.find({ email: user.email })
      .populate('courseId', 'title description duration fee_ksh level image')
      .sort({ enrollmentDate: -1 });

    res.json({ user, enrollments });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;