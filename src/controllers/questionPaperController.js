const db = require('../config/db');   // ← THIS was commented out — that was the bug
const path = require('path');
const fs = require('fs');

// @desc    Get all question papers with filters
// @route   GET /api/question-papers
// @access  Public
exports.getQuestionPapers = async (req, res) => {
  try {
    const { course, semester, year, search } = req.query;

    let query = 'SELECT * FROM question_papers WHERE 1=1';
    const params = [];

    if (course) {
      query += ' AND course = ?';
      params.push(course);
    }

    if (semester) {
      query += ' AND semester = ?';
      params.push(semester);
    }

    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }

    if (search) {
      query += ' AND (title LIKE ? OR subject LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY year DESC, semester DESC, uploaded_at DESC';

    const [papers] = await db.query(query, params);

    res.json({
      success: true,
      count: papers.length,
      papers
    });
  } catch (error) {
    console.error('Get Question Papers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Download question paper
// @route   GET /api/question-papers/download/:id
// @access  Public
exports.downloadQuestionPaper = async (req, res) => {
  try {
    const paperId = req.params.id;

    const [papers] = await db.query(
      'SELECT * FROM question_papers WHERE id = ?',
      [paperId]
    );

    if (papers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found'
      });
    }

    const paper = papers[0];

    // Local file path — matches how populateQuestionPapers.js stored it
    const filePath = path.join(__dirname, '../../uploads/question-papers', paper.file_path);

    console.log('Looking for file at:', filePath);

    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Increment download count
    await db.query(
      'UPDATE question_papers SET download_count = download_count + 1 WHERE id = ?',
      [paperId]
    );

    res.download(filePath, paper.title + '.pdf');
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};