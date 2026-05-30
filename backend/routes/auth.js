const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

const router = express.Router();

// ─── SMS ──────────────────────────────────────────────────────────
const sendSMS = async (mobile, message) => {
  if (!mobile || mobile === 'N/A') return { success: false, error: 'No phone number' };
  try {
    let phone = mobile.toString().trim().replace(/\s+/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    else if (phone.startsWith('+')) phone = phone.slice(1);
    else if (!phone.startsWith('254') && phone.length === 10) phone = '254' + phone;

    console.log(`📱 Sending SMS to: ${phone}`);

    const requestBody = {
      apikey: process.env.TEXTSMS_API_KEY,
      partnerID: process.env.TEXTSMS_PARTNER_ID,
      shortcode: process.env.TEXTSMS_SENDER_ID,
      mobile: phone,
      message
    };

    const response = await axios.post(
      'https://sms.textsms.co.ke/api/services/sendsms/',
      requestBody,
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    console.log('📥 SMS response:', JSON.stringify(response.data, null, 2));

    const smsResult = response.data?.responses?.[0];
    if (smsResult && smsResult['response-code'] === 200) {
      console.log(`✅ SMS sent to ${phone}`);
      return { success: true, messageId: smsResult['message-id'] };
    } else {
      const errorMsg = smsResult?.['response-description'] || 'Unknown error';
      console.error(`❌ SMS failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  } catch (err) {
    console.error('❌ SMS error:', err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
};

// ─── Email ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Shinestar Cyber" <${process.env.GMAIL_USER}>`,
      to, subject, html
    });
    console.log(`✅ Email sent to ${to}`);
    return { success: true };
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return { success: false, error: err.message };
  }
};

// ─── Send credentials (email + SMS) ──────────────────────────────
const sendBothEmailAndSMS = async (email, phone, studentName, tempPassword, courseTitle, loginUrl) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #2563eb, #06b6d4); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to Shinestar Cyber!</h1>
        <p style="color: #bfdbfe;">Your enrollment has been confirmed</p>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hello <strong>${studentName}</strong>,</p>
        <p>Your enrollment for <strong>${courseTitle}</strong> has been confirmed.</p>
        <div style="background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: bold;">YOUR LOGIN CREDENTIALS</p>
          <p style="margin: 12px 0 5px; font-size: 15px;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0 0 5px; font-size: 15px;"><strong>Temporary Password:</strong></p>
          <span style="background: #fef3c7; padding: 8px 20px; border-radius: 6px; font-size: 22px; font-weight: bold; letter-spacing: 3px; display: inline-block; margin-top: 5px;">${tempPassword}</span>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 10px; color: #15803d; font-weight: bold;">📋 Steps to access your course:</p>
          <ol style="color: #166534; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li>Click <strong>Login to Student Portal</strong> below</li>
            <li>Enter your email and the temporary password</li>
            <li>You will be asked to <strong>set your own new password</strong></li>
            <li>Your course <strong>${courseTitle}</strong> will be on your dashboard</li>
          </ol>
        </div>
        <p style="color: #dc2626; font-weight: bold; text-align: center;">⚠️ Temporary password is one-time use only.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: linear-gradient(to right, #2563eb, #06b6d4); color: white; padding: 16px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Login to Student Portal →
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">For help, call us on <strong>0743181585</strong></p>
      </div>
    </div>`;

  const smsMessage = `${studentName}, enrollment confirmed for ${courseTitle}! Email: ${email} Temp Password: ${tempPassword} Login: ${loginUrl} - Shinestar Cyber`;

  const [emailResult, smsResult] = await Promise.allSettled([
    sendEmail(email, `✅ Your Enrollment for ${courseTitle} is Confirmed!`, emailHtml),
    sendSMS(phone, smsMessage)
  ]);

  return {
    email: emailResult.status === 'fulfilled' ? emailResult.value : { success: false, error: emailResult.reason },
    sms: smsResult.status === 'fulfilled' ? smsResult.value : { success: false, error: smsResult.reason }
  };
};

// ─── Generate temp password ───────────────────────────────────────
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  return password;
};

// ─── Middleware: verify admin ─────────────────────────────────────
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

// ─── ADMIN LOGIN ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.role !== 'admin')
      return res.status(403).json({ message: 'Access denied. Please use the student login.' });

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
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'user' });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.active === false)
      return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });

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
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

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

// ─── ADMIN: Send credentials ──────────────────────────────────────
router.post('/send-credentials/:enrollmentId', verifyAdmin, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const studentEmail = enrollment.email.toLowerCase().trim();
    const loginUrl = `${process.env.FRONTEND_URL}/student/login`;

    let user = await User.findOne({ email: studentEmail });
    if (user) {
      user.password_hash = hashedPassword;
      user.mustChangePassword = true;
      user.tempPassword = tempPassword;
      user.name = user.name || enrollment.studentName;
      user.username = user.username || enrollment.studentName;
      user.phone = user.phone || enrollment.phone;
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
        phone: enrollment.phone || 'N/A',
      });
      await user.save();
    }

    enrollment.status = 'confirmed';
    await enrollment.save();

    const result = await sendBothEmailAndSMS(
      studentEmail,
      enrollment.phone,
      enrollment.studentName,
      tempPassword,
      enrollment.courseTitle,
      loginUrl
    );

    res.json({
      message: `Credentials sent to ${studentEmail}`,
      tempPassword,
      deliveryStatus: {
        emailSent: result.email.success,
        smsSent: result.sms.success,
        smsDetails: result.sms
      }
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
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role === 'admin')
      return res.status(403).json({ message: 'Admins cannot access the student dashboard' });

    const user = await User.findById(decoded.id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const enrollments = await Enrollment.find({ email: user.email.toLowerCase().trim() })
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
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role === 'admin')
      return res.status(403).json({ message: 'Not a student account' });

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

// ─── TEST SMS ─────────────────────────────────────────────────────
router.post('/test-sms', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message)
    return res.status(400).json({ error: 'Phone and message are required' });
  const result = await sendSMS(phone, message);
  res.json(result);
});

module.exports = router;