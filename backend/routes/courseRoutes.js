const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { adminAuth } = require('../middleware/auth');

// CREATE COURSE (ADMIN ONLY)
router.post('/', adminAuth, async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL COURSES
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;