const express = require('express');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { adminAuth } = require('../middleware/auth');
const { BrevoClient } = require("@getbrevo/brevo");
const axios = require('axios');

const router = express.Router();

// ─── Brevo Email ──────────────────────────────────────────────────
const brevoClient = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });


const sendEmail = async (to, subject, html) => {
  try {
    await brevoClient.transactionalEmails.sendTransacEmail({
      sender: { name: 'Shinestar Cyber', email: process.env.BREVO_SENDER_EMAIL || 'noreply@shinestar.co.ke' },
      to: [{ email: to }],
      subject,
      htmlContent: html
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

// ─── SMS (TextSMS Kenya) ──────────────────────────────────────────
const sendSMS = async (mobile, message) => {
  if (!mobile || mobile === 'N/A') return;
  try {
    let phone = mobile.toString().trim().replace(/\s+/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    else if (phone.startsWith('+')) phone = phone.slice(1);
    else if (!phone.startsWith('254') && phone.length === 10) phone = '254' + phone;

    const response = await axios.post(
      'https://sms.textsms.co.ke/api/services/sendsms/',
      {
        apikey: process.env.TEXTSMS_API_KEY,
        partnerID: process.env.TEXTSMS_PARTNER_ID,
        shortcode: process.env.TEXTSMS_SENDER_ID,
        mobile: phone,
        message
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    console.log(`SMS to ${phone}:`, JSON.stringify(response.data));
  } catch (err) {
    console.error('SMS error:', err.response?.data || err.message);
  }
};

// ─── Notifications on new booking ────────────────────────────────
const sendBookingNotifications = async (booking) => {
  const date = new Date(booking.preferredDate).toLocaleDateString('en-KE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── Admin email ───────────────────────────────────────────────
  const adminEmailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
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
          <a href="${process.env.FRONTEND_URL}/admin/bookings" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">View in Admin Panel →</a>
        </p>
      </div>
    </div>`;

  // ── Client email ──────────────────────────────────────────────
  const clientEmailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(to right,#2563eb,#06b6d4);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;">Booking Received!</h1>
        <p style="color:#bfdbfe;margin:8px 0 0;">Shinestar Cyber & Tech Solutions</p>
      </div>
      <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px;">
        <p>Hello <strong>${booking.fullName}</strong>,</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr style="background:#e5e7eb;"><td style="padding:12px;font-weight:bold;">Service</td><td style="padding:12px;">${booking.serviceName}</td></tr>
          <tr><td style="padding:12px;font-weight:bold;">Date</td><td style="padding:12px;">${date}</td></tr>
          <tr style="background:#e5e7eb;"><td style="padding:12px;font-weight:bold;">Status</td><td style="padding:12px;color:#f59e0b;"><strong>Pending Confirmation</strong></td></tr>
        </table>
        <p>We will confirm your appointment within <strong>2 hours</strong>.</p>
        <p style="color:#6b7280;font-size:14px;">For help call <strong>0743181585</strong> — Shinestar Cyber Kenya</p>
      </div>
    </div>`;

  // ── Admin SMS ─────────────────────────────────────────────────
  const adminSMS = `NEW BOOKING: ${booking.fullName} | ${booking.serviceName} | ${date} | Phone: ${booking.phoneNumber}`;

  // ── Client SMS ────────────────────────────────────────────────
  const clientSMS = `Hello ${booking.fullName}! Your booking for "${booking.serviceName}" on ${date} has been received. We will confirm within 2 hours. Call 0743181585. - Shinestar Cyber`;

  await Promise.allSettled([
    sendEmail(process.env.ADMIN_EMAIL, `New Booking: ${booking.serviceName} - ${booking.fullName}`, adminEmailHtml),
    sendSMS(process.env.ADMIN_PHONE, adminSMS),
    sendSMS(booking.phoneNumber, clientSMS),
    ...(booking.clientEmail ? [sendEmail(booking.clientEmail, 'Booking Received — Shinestar Cyber', clientEmailHtml)] : []),
  ]);
};

// ─── ROUTES ───────────────────────────────────────────────────────

// GET all bookings (admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().populate('service').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new booking (public)
router.post('/', async (req, res) => {
  try {
    const { fullName, phoneNumber, clientEmail, service, preferredDate, additionalNotes } = req.body;

    if (!fullName || !phoneNumber || !service || !preferredDate) {
      return res.status(400).json({ message: 'fullName, phoneNumber, service, and preferredDate are required' });
    }

    const serviceDoc = await Service.findById(service);
    if (!serviceDoc) return res.status(404).json({ message: 'Service not found' });

    const booking = new Booking({
      fullName, phoneNumber, clientEmail,
      service, serviceName: serviceDoc.title,
      preferredDate, additionalNotes
    });
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

// PUT update booking status (admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    // ── Send confirmation to client when admin confirms ───────
    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      const date = new Date(booking.preferredDate).toLocaleDateString('en-KE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      const confirmSMS = `Hello ${booking.fullName}! Your booking for "${booking.serviceName}" on ${date} is CONFIRMED. See you then! Call 0743181585. - Shinestar Cyber`;

      const confirmEmailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(to right,#16a34a,#15803d);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;">✅ Booking Confirmed!</h1>
            <p style="color:#bbf7d0;margin:8px 0 0;">Shinestar Cyber & Tech Solutions</p>
          </div>
          <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px;">
            <p>Hello <strong>${booking.fullName}</strong>,</p>
            <p>Your appointment has been <strong>confirmed</strong>!</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <tr style="background:#e5e7eb;"><td style="padding:12px;font-weight:bold;">Service</td><td style="padding:12px;">${booking.serviceName}</td></tr>
              <tr><td style="padding:12px;font-weight:bold;">Date</td><td style="padding:12px;">${date}</td></tr>
              <tr style="background:#e5e7eb;"><td style="padding:12px;font-weight:bold;">Status</td><td style="padding:12px;color:#16a34a;"><strong>Confirmed</strong></td></tr>
            </table>
            <p>See you then! For any changes call <strong>0743181585</strong>.</p>
            <p style="color:#6b7280;font-size:14px;">Shinestar Cyber & Tech Solutions Kenya</p>
          </div>
        </div>`;

      await Promise.allSettled([
        sendSMS(booking.phoneNumber, confirmSMS),
        ...(booking.clientEmail ? [sendEmail(booking.clientEmail, `Booking Confirmed — ${booking.serviceName}`, confirmEmailHtml)] : []),
      ]);
    }

    // ── Send cancellation notice ──────────────────────────────
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      const cancelSMS = `Hello ${booking.fullName}, your booking for "${booking.serviceName}" has been cancelled. To rebook call 0743181585. - Shinestar Cyber`;
      await sendSMS(booking.phoneNumber, cancelSMS);
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE booking (admin)
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