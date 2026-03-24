const db = require('../config/db');

// @desc    Get all classrooms for current user
// @route   GET /api/classrooms/my-classrooms
// @access  Private
exports.getMyClassrooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;
    let params;

    if (userRole === 'teacher') {
      query = `
        SELECT 
          c.*,
          s.name as subject_name,
          s.code as subject_code,
          COUNT(DISTINCT e.student_id) as student_count,
          COUNT(DISTINCT a.id) as assignment_count,
          COUNT(DISTINCT d.id) as doubt_count,
          (SELECT COUNT(*) FROM join_requests jr WHERE jr.classroom_id = c.id AND jr.status = 'pending') as pending_requests
        FROM classrooms c
        LEFT JOIN subjects s ON c.subject_id = s.id
        LEFT JOIN enrollments e ON c.id = e.classroom_id
        LEFT JOIN assignments a ON c.id = a.classroom_id
        LEFT JOIN doubts d ON c.id = d.classroom_id AND d.resolved = FALSE
        WHERE c.teacher_id = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    } else {
      query = `
        SELECT 
          c.*,
          s.name as subject_name,
          s.code as subject_code,
          u.full_name as teacher_name,
          COUNT(DISTINCT e2.student_id) as student_count,
          COUNT(DISTINCT a.id) as assignment_count,
          COUNT(DISTINCT d.id) as doubt_count
        FROM enrollments e
        INNER JOIN classrooms c ON e.classroom_id = c.id
        LEFT JOIN subjects s ON c.subject_id = s.id
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN enrollments e2 ON c.id = e2.classroom_id
        LEFT JOIN assignments a ON c.id = a.classroom_id
        LEFT JOIN doubts d ON c.id = d.classroom_id AND d.resolved = FALSE
        WHERE e.student_id = ?
        GROUP BY c.id
        ORDER BY e.enrolled_at DESC
      `;
      params = [userId];
    }

    const [classrooms] = await db.query(query, params);

    res.json({
      success: true,
      count: classrooms.length,
      classrooms
    });
  } catch (error) {
    console.error('Get My Classrooms Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Get single classroom
// @route   GET /api/classrooms/:id
// @access  Private
exports.getClassroom = async (req, res) => {
  try {
    const classroomId = req.params.id;

    const [classrooms] = await db.query(`
      SELECT 
        c.*,
        s.name as subject_name,
        s.code as subject_code,
        u.full_name as teacher_name,
        u.email as teacher_email
      FROM classrooms c
      LEFT JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `, [classroomId]);

    if (classrooms.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Classroom not found' 
      });
    }

    res.json({
      success: true,
      classroom: classrooms[0]
    });
  } catch (error) {
    console.error('Get Classroom Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Create classroom
// @route   POST /api/classrooms
// @access  Private (Teacher only)
exports.createClassroom = async (req, res) => {
  try {
    const { name, code, subject_id } = req.body;
    const teacher_id = req.user.id;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Classroom name and code are required'
      });
    }

    // Check if code already exists
    const [existing] = await db.query(
      'SELECT * FROM classrooms WHERE code = ?',
      [code]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Classroom code already exists. Please use a different code.' 
      });
    }

    // IMPORTANT FIX: Convert empty string, null, or undefined to NULL for MySQL
    const finalSubjectId = (subject_id === '' || subject_id === null || subject_id === undefined) ? null : parseInt(subject_id);

    // Insert classroom
    const [result] = await db.query(
      'INSERT INTO classrooms (name, code, subject_id, teacher_id) VALUES (?, ?, ?, ?)',
      [name, code, finalSubjectId, teacher_id]
    );

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      classroom: {
        id: result.insertId,
        name,
        code,
        subject_id: finalSubjectId,
        teacher_id
      }
    });
  } catch (error) {
    console.error('Create Classroom Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error while creating classroom' 
    });
  }
};

// @desc    Update classroom
// @route   PUT /api/classrooms/:id
// @access  Private (Teacher only)
exports.updateClassroom = async (req, res) => {
  try {
    const classroomId = req.params.id;
    const { name, subject_id } = req.body;

    // Verify ownership
    const [classrooms] = await db.query(
      'SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?',
      [classroomId, req.user.id]
    );

    if (classrooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or you do not have permission to edit it'
      });
    }

    // Update classroom
    await db.query(
      'UPDATE classrooms SET name = ?, subject_id = ? WHERE id = ? AND teacher_id = ?',
      [name, subject_id || null, classroomId, req.user.id]
    );

    res.json({
      success: true,
      message: 'Classroom updated successfully'
    });
  } catch (error) {
    console.error('Update Classroom Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Delete classroom
// @route   DELETE /api/classrooms/:id
// @access  Private (Teacher only)
exports.deleteClassroom = async (req, res) => {
  try {
    const classroomId = req.params.id;

    // Verify ownership
    const [classrooms] = await db.query(
      'SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?',
      [classroomId, req.user.id]
    );

    if (classrooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or you do not have permission to delete it'
      });
    }

    await db.query(
      'DELETE FROM classrooms WHERE id = ? AND teacher_id = ?',
      [classroomId, req.user.id]
    );

    res.json({
      success: true,
      message: 'Classroom deleted successfully'
    });
  } catch (error) {
    console.error('Delete Classroom Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Request to join classroom
// @route   POST /api/classrooms/join
// @access  Private (Student only)
exports.joinClassroom = async (req, res) => {
  try {
    const { code } = req.body;
    const student_id = req.user.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Classroom code is required'
      });
    }

    // Find classroom
    const [classrooms] = await db.query(
      'SELECT * FROM classrooms WHERE code = ?',
      [code]
    );

    if (classrooms.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Classroom not found with this code' 
      });
    }

    const classroom = classrooms[0];

    // Check if already enrolled
    const [enrolled] = await db.query(
      'SELECT * FROM enrollments WHERE classroom_id = ? AND student_id = ?',
      [classroom.id, student_id]
    );

    if (enrolled.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'You are already enrolled in this classroom' 
      });
    }

    // Check if join request already exists
    const [existingRequest] = await db.query(
      'SELECT * FROM join_requests WHERE classroom_id = ? AND student_id = ? AND status = ?',
      [classroom.id, student_id, 'pending']
    );

    if (existingRequest.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already sent a join request for this classroom'
      });
    }

    // Create join request
    const [result] = await db.query(
      'INSERT INTO join_requests (classroom_id, student_id) VALUES (?, ?)',
      [classroom.id, student_id]
    );

    res.json({
      success: true,
      message: 'Join request sent successfully. Waiting for teacher approval.',
      request_id: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        message: 'Join request already exists' 
      });
    }
    console.error('Join Classroom Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Get pending join requests for classroom
// @route   GET /api/classrooms/:id/join-requests
// @access  Private (Teacher only)
exports.getJoinRequests = async (req, res) => {
  try {
    const classroomId = req.params.id;

    // Verify teacher owns this classroom
    const [classrooms] = await db.query(
      'SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?',
      [classroomId, req.user.id]
    );

    if (classrooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or you do not have permission'
      });
    }

    const [requests] = await db.query(`
      SELECT 
        jr.*,
        u.username,
        u.email,
        u.full_name
      FROM join_requests jr
      JOIN users u ON jr.student_id = u.id
      WHERE jr.classroom_id = ? AND jr.status = 'pending'
      ORDER BY jr.requested_at DESC
    `, [classroomId]);

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get Join Requests Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Handle join request (accept/reject)
// @route   PUT /api/classrooms/join-requests/:requestId
// @access  Private (Teacher only)
exports.handleJoinRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const { action } = req.body;

    // Get the join request
    const [requests] = await db.query(
      'SELECT * FROM join_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    const request = requests[0];

    if (action === 'accept') {
      // Check if already enrolled
      const [existing] = await db.query(
        'SELECT * FROM enrollments WHERE classroom_id = ? AND student_id = ?',
        [request.classroom_id, request.student_id]
      );

      if (existing.length === 0) {
        // Not enrolled yet, add them
        await db.query(
          'INSERT INTO enrollments (classroom_id, student_id) VALUES (?, ?)',
          [request.classroom_id, request.student_id]
        );
      }

      // Update request status
      await db.query(
        "UPDATE join_requests SET status = 'approved' WHERE id = ?",
        [requestId]
      );

      res.json({
        success: true,
        message: 'Student approved successfully'
      });
    } else if (action === 'reject') {
      await db.query(
        "UPDATE join_requests SET status = 'rejected' WHERE id = ?",
        [requestId]
      );

      res.json({
        success: true,
        message: 'Join request rejected'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }
  } catch (error) {
    console.error('Handle Join Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get classroom students
// @route   GET /api/classrooms/:id/students
// @access  Private
exports.getClassroomStudents = async (req, res) => {
  try {
    const classroomId = req.params.id;

    const [students] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        e.enrolled_at
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.classroom_id = ?
      ORDER BY u.full_name
    `, [classroomId]);

    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get Classroom Students Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};