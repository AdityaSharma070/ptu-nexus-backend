const express = require('express');
const router = express.Router();
const {
  getMyClassrooms,
  getClassroom,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  joinClassroom,
  getJoinRequests,
  handleJoinRequest,
  getClassroomStudents
} = require('../controllers/classroomController');
const { auth, isTeacher, isStudent } = require('../middleware/auth');

// @route   GET /api/classrooms/my-classrooms
router.get('/my-classrooms', auth, getMyClassrooms);

// @route   GET /api/classrooms/:id
router.get('/:id', auth, getClassroom);

// @route   POST /api/classrooms
router.post('/', auth, isTeacher, createClassroom);

// @route   PUT /api/classrooms/:id
router.put('/:id', auth, isTeacher, updateClassroom);

// @route   DELETE /api/classrooms/:id
router.delete('/:id', auth, isTeacher, deleteClassroom);

// @route   POST /api/classrooms/join
router.post('/join', auth, isStudent, joinClassroom);

// @route   GET /api/classrooms/:id/join-requests
router.get('/:id/join-requests', auth, isTeacher, getJoinRequests);

// @route   PUT /api/classrooms/join-requests/:requestId
router.put('/join-requests/:requestId', auth, isTeacher, handleJoinRequest);

// @route   GET /api/classrooms/:id/students
router.get('/:id/students', auth, getClassroomStudents);

module.exports = router;