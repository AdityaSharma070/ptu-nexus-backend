const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { auth, isTeacher } = require('../middleware/auth');

// @route   GET /api/announcements
router.get('/', auth, getAnnouncements);

// @route   POST /api/announcements
router.post('/', auth, isTeacher, createAnnouncement);

// @route   PUT /api/announcements/:id
router.put('/:id', auth, isTeacher, updateAnnouncement);

// @route   DELETE /api/announcements/:id
router.delete('/:id', auth, isTeacher, deleteAnnouncement);

module.exports = router;