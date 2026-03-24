const express = require('express');
const router = express.Router();
const {
  getDoubts,
  getDoubt,
  createDoubt,
  answerDoubt,
  resolveDoubt,
  upvoteDoubt,
  deleteDoubt,
  deleteAnswer  // ✅ ADD THIS - Import deleteAnswer
} = require('../controllers/doubtController');
const { auth, isTeacher, isStudent } = require('../middleware/auth');

// @route   GET /api/doubts
router.get('/', auth, getDoubts);

// @route   GET /api/doubts/:id
// IMPORTANT: This must be BEFORE other /:id routes
router.get('/:id', auth, getDoubt);

// @route   POST /api/doubts
router.post('/', auth, isStudent, createDoubt);

// @route   POST /api/doubts/:id/answer
router.post('/:id/answer', auth, answerDoubt);

// @route   PUT /api/doubts/:id/resolve
router.put('/:id/resolve', auth, isTeacher, resolveDoubt);

// @route   PUT /api/doubts/:id/upvote
router.put('/:id/upvote', auth, upvoteDoubt);

// @route   DELETE /api/doubts/answer/:answerId
// ✅ IMPORTANT: Delete answer route MUST come BEFORE /:id route
router.delete('/answer/:answerId', auth, deleteAnswer);

// @route   DELETE /api/doubts/:id
router.delete('/:id', auth, deleteDoubt);

module.exports = router;