const db = require('../config/db');

// @desc    Get announcements for a classroom
// @route   GET /api/announcements?classroom=:classroomId
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    const classroomId = req.query.classroom;

    if (!classroomId) {
      return res.status(400).json({ 
        success: false,
        message: 'Classroom ID is required' 
      });
    }

    const [announcements] = await db.query(
      'SELECT * FROM announcements WHERE classroom_id = ? ORDER BY important DESC, created_at DESC',
      [classroomId]
    );

    res.json({
      success: true,
      count: announcements.length,
      announcements
    });
  } catch (error) {
    console.error('Get Announcements Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Teacher only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { classroom_id, text, important } = req.body;

    const [result] = await db.query(
      'INSERT INTO announcements (classroom_id, text, important) VALUES (?, ?, ?)',
      [classroom_id, text, important || false]
    );

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: {
        id: result.insertId,
        classroom_id,
        text,
        important: important || false
      }
    });
  } catch (error) {
    console.error('Create Announcement Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Teacher only)
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcementId = req.params.id;
    const { text, important } = req.body;

    await db.query(
      'UPDATE announcements SET text = ?, important = ? WHERE id = ?',
      [text, important, announcementId]
    );

    res.json({
      success: true,
      message: 'Announcement updated successfully'
    });
  } catch (error) {
    console.error('Update Announcement Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Teacher only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcementId = req.params.id;

    await db.query('DELETE FROM announcements WHERE id = ?', [announcementId]);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete Announcement Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};