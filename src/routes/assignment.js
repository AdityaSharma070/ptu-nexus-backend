const express = require('express');
const router = express.Router();
const {
  getAssignments,
  createAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  upload 
} = require('../controllers/assignmentController');
const { auth, isTeacher } = require('../middleware/auth');

router.get('/', auth, getAssignments);
router.post('/', auth, isTeacher, createAssignment);
router.delete('/:id', auth, isTeacher, deleteAssignment);
router.post('/:id/submit', auth, upload.single('file'), submitAssignment);
router.get('/:id/submissions', auth, isTeacher, getSubmissions);

module.exports = router;