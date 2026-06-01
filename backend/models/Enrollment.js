const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    default: 'N/A'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  certificateUrl: {
    type: String,
    default: null
  },
  certificateHtml: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);