const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const Enrollment = require('../models/Enrollment');

const router = express.Router();

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const generateCertificateHTML = (studentName, courseTitle, completionDate, certificateId, qrSvg) => {
  const formattedDate = new Date(completionDate).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Completion - ${studentName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4 landscape;
      margin: 0;
    }

    html, body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #2c2c2c;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Open Sans', Arial, sans-serif;
    }

    .cert-wrap {
      /* Fills the screen while keeping the 297:210 (A4 landscape) ratio */
      width: min(297mm, 100vw);
      height: min(210mm, 100vh);
      aspect-ratio: 297 / 210;
      background: linear-gradient(135deg, #c8a850, #f0d070, #c8a850);
      padding: 8px;
      display: flex;
      flex-direction: column;
    }

    .cert-outer {
      flex: 1;
      background: linear-gradient(135deg, #e8c050, #f8e080, #e8c050);
      padding: 5px;
      display: flex;
      flex-direction: column;
    }

    .cert-inner {
      flex: 1;
      background: white;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .top-bar {
      height: 12px;
      flex-shrink: 0;
      background: linear-gradient(90deg, #c8a850, #f0d070, #c8a850, #f0d070, #c8a850);
    }
    .red-line { height: 4px; flex-shrink: 0; background: #c0392b; }
    .bottom-bar {
      height: 12px;
      flex-shrink: 0;
      background: linear-gradient(90deg, #c8a850, #f0d070, #c8a850, #f0d070, #c8a850);
    }

    .cert-body {
      flex: 1;
      padding: 18px 40px 16px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-size: 100px;
      font-weight: 900;
      color: rgba(30, 64, 175, 0.04);
      white-space: nowrap;
      pointer-events: none;
      font-family: Georgia, serif;
      letter-spacing: 8px;
      user-select: none;
    }

    /* Top row */
    .top-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .logo-box {
      background: linear-gradient(135deg, #0b3d82, #1a6bb5);
      padding: 7px 12px;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .logo-main {
      font-size: 17px;
      font-weight: 900;
      color: white;
      font-style: italic;
      font-family: 'Playfair Display', Georgia, serif;
      line-height: 1;
    }
    .logo-sub {
      font-size: 9px;
      font-weight: 700;
      color: #90d0ff;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .logo-tagline {
      font-size: 8px;
      color: #666;
      margin-top: 3px;
    }

    .org-center { text-align: center; }
    .org-name-text {
      font-size: 9px;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.5;
      margin-top: 4px;
    }

    .badge-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .ref-no { font-size: 8px; color: #555; }
    .gold-badge {
      width: 65px; height: 65px;
      border-radius: 50%;
      background: linear-gradient(135deg, #b8941e, #f0d070, #b8941e);
      border: 3px solid #c8a850;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 10px rgba(200,168,80,0.5);
    }
    .gold-badge-text {
      font-size: 10px;
      font-weight: 900;
      color: white;
      line-height: 1.3;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
      text-align: center;
    }

    .cert-divider {
      height: 1.5px;
      background: linear-gradient(90deg, transparent, #c8a850 20%, #c8a850 80%, transparent);
      margin: 8px 0;
    }

    /* Title */
    .cert-title {
      text-align: center;
      font-size: 32px;
      font-weight: 700;
      color: #c0392b;
      font-family: 'Playfair Display', Georgia, serif;
      margin: 4px 0 2px;
    }
    .cert-subtitle {
      text-align: center;
      font-size: 12px;
      color: #333;
    }

    /* Middle */
    .middle-row {
      display: flex;
      align-items: center;
      gap: 20px;
      margin: 8px 0;
    }

    .qr-box {
      width: 72px; height: 72px;
      border: 2px solid #c8a850;
      padding: 4px;
      background: white;
      flex-shrink: 0;
    }
    .qr-box svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .main-text { flex: 1; text-align: center; }
    .student-name {
      font-size: 28px;
      font-weight: 700;
      color: #0b3d82;
      font-family: 'Playfair Display', Georgia, serif;
      margin: 2px 0;
    }
    .student-org {
      font-size: 14px;
      font-weight: 700;
      color: #c0392b;
      font-family: 'Playfair Display', Georgia, serif;
      margin: 2px 0 6px;
    }
    .body-line { font-size: 11px; color: #333; margin: 3px 0; line-height: 1.5; }
    .course-title {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      font-family: 'Playfair Display', Georgia, serif;
      margin: 4px 0 2px;
    }
    .course-sub { font-size: 10px; color: #555; font-style: italic; margin: 2px 0; }

    /* Medal */
    .medal-wrap { flex-shrink: 0; }
    .medal { width: 70px; height: 92px; position: relative; }
    .ribbon-l {
      position: absolute; top: 0; left: 4px;
      width: 22px; height: 38px;
      background: #c0392b;
      clip-path: polygon(0 0,100% 0,100% 100%,50% 86%,0 100%);
      transform: rotate(-6deg);
    }
    .ribbon-r {
      position: absolute; top: 0; right: 4px;
      width: 22px; height: 38px;
      background: #8B0000;
      clip-path: polygon(0 0,100% 0,100% 100%,50% 86%,0 100%);
      transform: rotate(6deg);
    }
    .medal-circle {
      position: absolute; bottom: 0;
      left: 50%; transform: translateX(-50%);
      width: 64px; height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c8a850, #f0d070, #c8a850);
      border: 3px solid #b8941e;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
    }
    .medal-star { font-size: 18px; color: #5C3A00; line-height: 1; }
    .medal-text { font-size: 9px; font-weight: 900; color: #5C3A00; line-height: 1.2; text-align: center; }

    /* Footer */
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 10px;
      border-top: 1.5px solid #e0c060;
    }
    .sig-block { text-align: center; min-width: 150px; }
    .sig-script {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 18px;
      font-style: italic;
      color: #1a1a1a;
      height: 24px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 3px;
    }
    .sig-line { width: 140px; height: 1.5px; background: #333; margin: 0 auto 4px; }
    .sig-name { font-size: 10px; font-weight: 700; color: #1a1a1a; }
    .sig-title { font-size: 9px; color: #555; }

    @media print {
      html, body {
        width: 297mm;
        height: 210mm;
        background: white;
      }
      .cert-wrap {
        width: 297mm;
        height: 210mm;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
<div class="cert-wrap">
  <div class="cert-outer">
    <div class="cert-inner">
      <div class="top-bar"></div>
      <div class="red-line"></div>
      <div class="cert-body">
        <div class="watermark">SHINESTAR CYBER</div>

        <!-- Top row -->
        <div class="top-row">
          <div>
            <div class="logo-box">
              <div class="logo-main">shinestar</div>
              <div class="logo-sub">cyber</div>
            </div>
            <div class="logo-tagline">Shinestar Cyber &amp; Tech Solutions Kenya</div>
          </div>
          <div class="org-center">
            <svg viewBox="0 0 60 60" width="50" height="50">
              <circle cx="30" cy="30" r="28" fill="#0b3d82" stroke="#c8a850" stroke-width="2"/>
              <circle cx="30" cy="30" r="22" fill="none" stroke="#c8a850" stroke-width="0.8" stroke-dasharray="2.5 2.5"/>
              <path d="M30 10 L33 20 L44 20 L36 26 L39 36 L30 30 L21 36 L24 26 L16 20 L27 20 Z" fill="#c8a850"/>
              <text x="30" y="48" text-anchor="middle" font-family="Arial" font-size="5.5" font-weight="700" fill="white" letter-spacing="1">KENYA</text>
            </svg>
            <div class="org-name-text">Shinestar Cyber &amp; Tech Solutions<br>Official Training Certificate</div>
          </div>
          <div class="badge-right">
            <div class="ref-no">Cert No: ${certificateId}</div>
            <div class="gold-badge">
              <div class="gold-badge-text">Gold<br>Cert</div>
            </div>
          </div>
        </div>

        <div class="cert-divider"></div>

        <div class="cert-title">Certificate of Completion</div>
        <div class="cert-subtitle">It is hereby certified that</div>

        <!-- Middle row -->
        <div class="middle-row">
          <div class="qr-box">
            ${qrSvg}
          </div>

          <div class="main-text">
            <div class="student-name">${studentName}</div>
            <div class="student-org">Shinestar Cyber Kenya</div>
            <div class="body-line">has successfully completed the professional training programme on</div>
            <div class="course-title">${courseTitle}</div>
            <div class="course-sub">under Shinestar Cyber &amp; Tech Solutions Kenya</div>
            <div class="course-sub">Completion Date: ${formattedDate}</div>
          </div>

          <div class="medal-wrap">
            <div class="medal">
              <div class="ribbon-l"></div>
              <div class="ribbon-r"></div>
              <div class="medal-circle">
                <div class="medal-star">&#9733;</div>
                <div class="medal-text">Gold<br>Cert</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-row">
          <div class="sig-block">
            <div class="sig-script">Chief Instructor</div>
            <div class="sig-line"></div>
            <div class="sig-name">Chief Instructor</div>
            <div class="sig-title">Shinestar Cyber Kenya</div>
          </div>
          <div style="text-align:center;">
            <svg viewBox="0 0 88 88" width="80" height="80">
              <circle cx="44" cy="44" r="41" fill="#0b3d82" stroke="#c8a850" stroke-width="2.5"/>
              <circle cx="44" cy="44" r="34" fill="none" stroke="#c8a850" stroke-width="0.8" stroke-dasharray="3 3"/>
              <path d="M44 18 L48 30 L62 30 L52 38 L56 50 L44 42 L32 50 L36 38 L26 30 L40 30 Z" fill="#c8a850"/>
              <text x="44" y="62" text-anchor="middle" font-family="Arial" font-size="6" font-weight="700" fill="white" letter-spacing="1">SHINESTAR</text>
              <text x="44" y="70" text-anchor="middle" font-family="Arial" font-size="5" fill="#c8a850" letter-spacing="0.8">CYBER KENYA</text>
            </svg>
          </div>
          <div class="sig-block">
            <div class="sig-script">Director</div>
            <div class="sig-line"></div>
            <div class="sig-name">Director</div>
            <div class="sig-title">Shinestar Cyber Kenya</div>
          </div>
        </div>
      </div>
      <div class="red-line"></div>
      <div class="bottom-bar"></div>
    </div>
  </div>
</div>
</body>
</html>`;
};

router.post('/generate/:enrollmentId', verifyAdmin, async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.status !== 'completed') return res.status(400).json({ message: 'Enrollment must be completed first' });

    const certDir = path.join(__dirname, '..', 'uploads', 'certificates');
    if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

    const certificateId = `SCTSK-${Date.now().toString(36).toUpperCase()}`;
    const filename = `cert_${enrollmentId}.html`;
    const filepath = path.join(certDir, filename);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const certificateUrl = `${baseUrl}/uploads/certificates/${filename}`;

    // Generate a real scannable QR code pointing to the certificate URL
    const qrSvg = await QRCode.toString(certificateUrl, {
      type: 'svg',
      width: 64,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });

    const html = generateCertificateHTML(
      enrollment.studentName,
      enrollment.courseTitle,
      enrollment.updatedAt || new Date(),
      certificateId,
      qrSvg
    );

    fs.writeFileSync(filepath, html, 'utf8');

    enrollment.certificateUrl = certificateUrl;
    await enrollment.save();

    res.json({ message: 'Certificate generated successfully', certificateUrl, enrollment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate certificate', error: error.message });
  }
});

// ─── ADMIN: Issue certificate — sends email + SMS to student ─────
router.post('/issue/:enrollmentId', verifyAdmin, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (!enrollment.certificateUrl) return res.status(400).json({ message: 'Certificate has not been generated yet' });

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/login`;

    // ── Email ─────────────────────────────────────────────────────
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    });
    await transporter.sendMail({
      from: `"Shinestar Cyber" <${process.env.GMAIL_USER}>`,
      to: enrollment.email,
      subject: `🎓 Your Certificate for ${enrollment.courseTitle} is Ready!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(to right,#f59e0b,#d97706);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;">🎓 Your Certificate is Ready!</h1>
            <p style="color:#fef3c7;">Congratulations on completing your course</p>
          </div>
          <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px;">
            <p>Hello <strong>${enrollment.studentName}</strong>,</p>
            <p>Your certificate for <strong>${enrollment.courseTitle}</strong> has been issued and is now available on your dashboard.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${loginUrl}" style="background:linear-gradient(to right,#f59e0b,#d97706);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
                View & Download Certificate →
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;">For help, call us on <strong>0743181585</strong></p>
          </div>
        </div>
      `
    }).catch(err => console.error('Issue cert email error:', err.message));

    // ── SMS ───────────────────────────────────────────────────────
    if (enrollment.phone && enrollment.phone !== 'N/A') {
      let phone = enrollment.phone.trim().replace(/\s+/g, '');
      if (phone.startsWith('0')) phone = '254' + phone.slice(1);
      else if (phone.startsWith('+')) phone = phone.slice(1);

      await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: process.env.TEXTSMS_API_KEY,
          partnerID: process.env.TEXTSMS_SENDER_ID,
          shortcode: 'TextSMS',
          mobile: phone,
          message: `🎓 ${enrollment.studentName}, your certificate for ${enrollment.courseTitle} has been issued! Login to download it: ${loginUrl} - Shinestar Cyber Kenya.`
        })
      }).catch(err => console.error('Issue cert SMS error:', err.message));
    }

    res.json({ message: `Certificate issued to ${enrollment.email}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to issue certificate', error: error.message });
  }
});

module.exports = router;