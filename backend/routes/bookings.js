const express = require('express');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { adminAuth } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const axios = require('axios');

const router = express.Router();

// ─── Nodemailer (Gmail) setup ─────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

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

// ─── WhatsApp via CallMeBot ───────────────────────────────────────
const sendWhatsApp = async (phone, message) => {
  try {
    const encoded = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${process.env.WHATSAPP_APIKEY}`;
    await axios.get(url);
    console.log(`WhatsApp sent to ${phone}`);
  } catch (err) {
    console.error('WhatsApp error:', err.message);
  }
};

// ─── Email ────────────────────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Shinestar Cyber" <${process.env.GMAIL_USER}>`,
      to, subject, html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

// ─── Notifications ────────────────────────────────────────────────
const sendBookingNotifications = async (booking) => {
  const date = new Date(booking.preferredDate).toLocaleDateString('en-KE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const clientSMS = `Hello ${booking.fullName}! Your booking for "${booking.serviceName}" on ${date} has been received. We'll confirm within 2 hours. - Shinestar Cyber`;
  const adminSMS = `NEW BOOKING: ${booking.fullName} | ${booking.serviceName} | ${date} | Phone: ${booking.phoneNumber}`;

  const clientWhatsApp = `Hello *${booking.fullName}*! 👋\n\nYour booking has been received:\n📋 *Service:* ${booking.serviceName}\n📅 *Date:* ${date}\n\nWe'll confirm within 2 hours.\n\n_Shinestar Cyber & Tech Solutions_`;
  const adminWhatsApp = `🔔 *New Booking Alert!*\n\n👤 *Client:* ${booking.fullName}\n📞 *Phone:* ${booking.phoneNumber}\n📋 *Service:* ${booking.serviceName}\n📅 *Date:* ${date}\n${booking.additionalNotes ? `📝 *Notes:* ${booking.additionalNotes}\n` : ''}\nLogin to admin panel to confirm.`;

  const clientEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #2563eb, #06b6d4); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Booking Received!</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0;">Shinestar Cyber & Tech Solutions</p>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hello <strong>${booking.fullName}</strong>,</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr style="background:#e5e7eb;"><td style="padding:12px;font-weight:bold;">Service</td><td style="padding:12px;">${booking.serviceName}</td></tr>
          <tr><td style="padding:12px;font-weight:bold;">Date</td><td style="padding:12px;">${date}</td></tr>
          <tr style="background:#e5e7eb;"><td style="padding:12px;font-weight:bold;">Status</td><td style="padding:12px;color:#f59e0b;"><strong>Pending</strong></td></tr>
          <tr><td style="padding:12px;font-weight:bold;">Phone</td><td style="padding:12px;">${booking.phoneNumber}</td></tr>
        </table>
        ${booking.additionalNotes ? `<p><strong>Notes:</strong> ${booking.additionalNotes}</p>` : ''}
        <p>We will confirm within <strong>2 hours</strong>.</p>
        <p style="color:#6b7280;font-size:14px;">Shinestar Cyber & Tech Solutions Kenya</p>
      </div>
    </div>`;

  const adminEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background:#1e40af;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h2 style="color:white;margin:0;">🔔 New Booking Received</h2>
      </div>
      <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:#e5e7eb;"><td style="padding:12px;font-weight:bold;">Client</td><td style="padding:12px;">${booking.fullName}</td></tr>
          <tr><td style="padding:12px;font-weight:bold;">Phone</td><td style="padding:12px;">${booking.phoneNumber}</td></tr>
          <tr style="background:#e5e7eb;"><td style="padding:12px;font-weight:bold;">Service</td><td style="padding:12px;">${booking.serviceName}</td></tr>
          <tr><td style="padding:12px;font-weight:bold;">Date</td><td style="padding:12px;">${date}</td></tr>
          ${booking.additionalNotes ? `<tr style="background:#e5e7eb;"><td style="padding:12px;font-weight:bold;">Notes</td><td style="padding:12px;">${booking.additionalNotes}</td></tr>` : ''}
        </table>
        <p style="margin-top:20px;">
          <a href="${process.env.ADMIN_URL || 'http://localhost:5173/admin/bookings'}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">View in Admin Panel →</a>
        </p>
      </div>
    </div>`;

  await Promise.allSettled([
    sendSMS(booking.phoneNumber, clientSMS),
    sendSMS(process.env.ADMIN_PHONE || '0743181585', adminSMS),
    sendWhatsApp(process.env.WHATSAPP_PHONE, clientWhatsApp),
    sendWhatsApp(process.env.ADMIN_WHATSAPP, adminWhatsApp),
    sendEmail(process.env.ADMIN_EMAIL, `New Booking: ${booking.serviceName} - ${booking.fullName}`, adminEmailHtml),
  ]);

  if (booking.clientEmail) {
    await sendEmail(booking.clientEmail, 'Your Booking has been Received - Shinestar Cyber', clientEmailHtml);
  }
};

// ─── ROUTES ───────────────────────────────────────────────────────

router.get('/', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().populate('service').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { fullName, phoneNumber, clientEmail, service, preferredDate, additionalNotes } = req.body;

    if (!fullName || !phoneNumber || !service || !preferredDate) {
      return res.status(400).json({ message: 'fullName, phoneNumber, service, and preferredDate are required' });
    }

    const serviceDoc = await Service.findById(service);
    if (!serviceDoc) return res.status(404).json({ message: 'Service not found' });

    const booking = new Booking({ fullName, phoneNumber, clientEmail, service, serviceName: serviceDoc.title, preferredDate, additionalNotes });
    await booking.save();

    sendBookingNotifications(booking).catch(err => console.error('Notification error:', err));

    res.status(201).json({
      message: "Booking submitted! We'll confirm within 2 hours.",
      booking: { id: booking._id, serviceName: booking.serviceName, status: booking.status, preferredDate: booking.preferredDate },
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      const date = new Date(booking.preferredDate).toLocaleDateString('en-KE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      sendSMS(booking.phoneNumber, `Hello ${booking.fullName}! Your booking for "${booking.serviceName}" on ${date} is CONFIRMED. See you then! Call 0743181585. - Shinestar Cyber`);
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;