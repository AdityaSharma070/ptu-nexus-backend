const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads/submissions directory if it doesn't exist
const submissionsDir = path.join(__dirname, '../../uploads/submissions');
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}

// Configure multer for PDF-only submissions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, submissionsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Export upload middleware
exports.upload = upload;

// @desc    Get assignments for a classroom
exports.getAssignments = async (req, res) => {
  try {
    const classroomId = req.query.classroom;
    const userId = req.user.id;

    if (!classroomId) {
      return res.status(400).json({ 
        success: false,
        message: 'Classroom ID is required' 
      });
    }

    const [assignments] = await db.query(`
      SELECT 
        a.*,
        COUNT(DISTINCT s.id) as submission_count
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE a.classroom_id = ?
      GROUP BY a.id
      ORDER BY a.deadline DESC
    `, [classroomId]);

    res.json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('Get Assignments Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Create assignment
exports.createAssignment = async (req, res) => {
  try {
    const { classroom_id, title, description, topic, total_marks, deadline } = req.body;

    const [result] = await db.query(
      'INSERT INTO assignments (classroom_id, title, description, topic, total_marks, deadline) VALUES (?, ?, ?, ?, ?, ?)',
      [classroom_id, title, description, topic, total_marks, deadline]
    );

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment: {
        id: result.insertId,
        classroom_id,
        title,
        description,
        topic,
        total_marks,
        deadline
      }
    });
  } catch (error) {
    console.error('Create Assignment Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Delete assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    await db.query('DELETE FROM assignments WHERE id = ?', [assignmentId]);
    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete Assignment Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Submit assignment (PDF only)
exports.submitAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const studentId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file required'
      });
    }

    await db.query(
      `INSERT INTO submissions (assignment_id, student_id, file_path, file_name, submitted_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [assignmentId, studentId, req.file.filename, req.file.originalname]
    );

    res.json({
      success: true,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Submit Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get submissions for an assignment (Teacher)
exports.getSubmissions = async (req, res) => {
  try {
    const assignmentId = req.params.id;

    const [submissions] = await db.query(`
      SELECT 
        s.*,
        u.username,
        u.email,
        u.full_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at DESC
    `, [assignmentId]);

    res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Get Submissions Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};