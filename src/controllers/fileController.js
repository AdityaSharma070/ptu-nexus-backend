const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// @desc    Upload file to classroom
// @route   POST /api/files/upload
// @access  Private (Teachers only)
exports.uploadFile = async (req, res) => {
  try {
    const { classroom_id, description } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if user is teacher of this classroom
    const [classroom] = await db.query(
      'SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?',
      [classroom_id, userId]
    );

    if (classroom.length === 0) {
      // Delete uploaded file if not authorized
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload files to this classroom'
      });
    }

    // Insert file record into database
    const [result] = await db.query(
      `INSERT INTO classroom_files 
       (classroom_id, uploader_id, file_name, file_path, file_type, file_size, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        classroom_id,
        userId,
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
        description || null
      ]
    );

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: result.insertId,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload File Error:', error);
    
    // Delete file if database insertion fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get files for a classroom
// @route   GET /api/files/:classroomId
// @access  Private
exports.getClassroomFiles = async (req, res) => {
  try {
    const classroomId = req.params.classroomId;

    // Check if user is teacher of this classroom OR a member
    // For now, just check if classroom exists and user has access
    const [classroom] = await db.query(
      'SELECT * FROM classrooms WHERE id = ?',
      [classroomId]
    );

    if (classroom.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Get all files for this classroom
    const [files] = await db.query(
      `SELECT 
        cf.*,
        u.full_name as uploader_name,
        u.username as uploader_username
       FROM classroom_files cf
       JOIN users u ON cf.uploader_id = u.id
       WHERE cf.classroom_id = ?
       ORDER BY cf.created_at DESC`,
      [classroomId]
    );

    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Get Files Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Download file
// @route   GET /api/files/download/:fileId
// @access  Private
exports.downloadFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Get file details
    const [files] = await db.query(
      'SELECT * FROM classroom_files WHERE id = ?',
      [fileId]
    );

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = files[0];

    // Send file
    const filePath = path.join(__dirname, '../../uploads', file.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set proper headers and send file
    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download File Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:fileId
// @access  Private (Teacher only)
exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Get file details
    const [files] = await db.query(
      'SELECT * FROM classroom_files WHERE id = ?',
      [fileId]
    );

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = files[0];

    // Check if user is the uploader or teacher of the classroom
    const [classroom] = await db.query(
      'SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?',
      [file.classroom_id, req.user.id]
    );

    if (classroom.length === 0 && file.uploader_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads', file.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await db.query('DELETE FROM classroom_files WHERE id = ?', [fileId]);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete File Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};