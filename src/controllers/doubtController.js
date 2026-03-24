const db = require("../config/db");

// @desc    Get all doubts for a classroom
// @route   GET /api/doubts?classroom=:classroomId
// @access  Private
exports.getDoubts = async (req, res) => {
  try {
    const classroomId = req.query.classroom;
    const filter = req.query.filter || "all";
    const userId = req.user.id;

    if (!classroomId) {
      return res.status(400).json({
        success: false,
        message: "Classroom ID is required",
      });
    }

    let query = `
      SELECT 
        d.*,
        u.username as student_name,
        u.full_name as student_full_name,
        COUNT(DISTINCT da.id) as answer_count,
        EXISTS(
          SELECT 1 
          FROM doubt_upvotes du 
          WHERE du.doubt_id = d.id AND du.user_id = ?
        ) as user_has_upvoted
      FROM doubts d
      JOIN users u ON d.student_id = u.id
      LEFT JOIN doubt_answers da ON d.id = da.doubt_id
      WHERE d.classroom_id = ?
    `;

    const params = [userId, classroomId];

    if (filter === "resolved") {
      query += " AND d.resolved = TRUE";
    } else if (filter === "unresolved") {
      query += " AND d.resolved = FALSE";
    }

    query +=
      " GROUP BY d.id ORDER BY d.resolved ASC, d.upvotes DESC, d.created_at DESC";

    const [doubts] = await db.query(query, params);

    res.json({
      success: true,
      count: doubts.length,
      doubts,
    });
  } catch (error) {
    console.error("Get Doubts Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get single doubt with answers
// @route   GET /api/doubts/:id
// @access  Private
exports.getDoubt = async (req, res) => {
  try {
    const doubtId = req.params.id;
    const userId = req.user.id;

    const [doubts] = await db.query(
      `
      SELECT 
        d.*,
        u.username as student_name,
        u.full_name as student_full_name,
        EXISTS(
          SELECT 1 
          FROM doubt_upvotes du 
          WHERE du.doubt_id = d.id AND du.user_id = ?
        ) as user_has_upvoted
      FROM doubts d
      JOIN users u ON d.student_id = u.id
      WHERE d.id = ?
      `,
      [userId, doubtId],
    );

    if (doubts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doubt not found",
      });
    }

    const [answers] = await db.query(
      `
      SELECT 
        da.*,
        u.username,
        u.full_name,
        u.role
      FROM doubt_answers da
      JOIN users u ON da.user_id = u.id
      WHERE da.doubt_id = ?
      ORDER BY da.created_at ASC
      `,
      [doubtId],
    );

    res.json({
      success: true,
      doubt: {
        ...doubts[0],
        answers,
      },
    });
  } catch (error) {
    console.error("Get Doubt Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Post a doubt
// @route   POST /api/doubts
// @access  Private (Student only)
exports.createDoubt = async (req, res) => {
  try {
    const { classroom_id, topic, question } = req.body;
    const student_id = req.user.id;

    const [result] = await db.query(
      "INSERT INTO doubts (classroom_id, student_id, topic, question) VALUES (?, ?, ?, ?)",
      [classroom_id, student_id, topic, question],
    );

    res.status(201).json({
      success: true,
      message: "Doubt posted successfully",
      doubt: {
        id: result.insertId,
        classroom_id,
        student_id,
        topic,
        question,
        resolved: false,
        upvotes: 0,
      },
    });
  } catch (error) {
    console.error("Create Doubt Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Answer a doubt
// @route   POST /api/doubts/:id/answer
// @access  Private
exports.answerDoubt = async (req, res) => {
  try {
    const doubtId = req.params.id;
    const { answer } = req.body;
    const user_id = req.user.id;

    const [result] = await db.query(
      "INSERT INTO doubt_answers (doubt_id, user_id, answer) VALUES (?, ?, ?)",
      [doubtId, user_id, answer],
    );

    res.status(201).json({
      success: true,
      message: "Answer posted successfully",
      answer: {
        id: result.insertId,
        doubt_id: doubtId,
        user_id,
        answer,
      },
    });
  } catch (error) {
    console.error("Answer Doubt Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Mark doubt as resolved
// @route   PUT /api/doubts/:id/resolve
// @access  Private (Teacher only)
exports.resolveDoubt = async (req, res) => {
  try {
    const doubtId = req.params.id;

    await db.query("UPDATE doubts SET resolved = TRUE WHERE id = ?", [doubtId]);

    res.json({
      success: true,
      message: "Doubt marked as resolved",
    });
  } catch (error) {
    console.error("Resolve Doubt Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Upvote a doubt
// @route   PUT /api/doubts/:id/upvote
// @access  Private
exports.upvoteDoubt = async (req, res) => {
  try {
    const doubtId = req.params.id;
    const userId = req.user.id;

    const [existing] = await db.query(
      "SELECT * FROM doubt_upvotes WHERE doubt_id = ? AND user_id = ?",
      [doubtId, userId],
    );

    if (existing.length > 0) {
      await db.query(
        "DELETE FROM doubt_upvotes WHERE doubt_id = ? AND user_id = ?",
        [doubtId, userId],
      );

      await db.query(
        "UPDATE doubts SET upvotes = upvotes - 1 WHERE id = ? AND upvotes > 0",
        [doubtId],
      );

      return res.json({
        success: true,
        message: "Upvote removed",
        action: "removed",
      });
    } else {
      await db.query(
        "INSERT INTO doubt_upvotes (doubt_id, user_id) VALUES (?, ?)",
        [doubtId, userId],
      );

      await db.query("UPDATE doubts SET upvotes = upvotes + 1 WHERE id = ?", [
        doubtId,
      ]);

      return res.json({
        success: true,
        message: "Doubt upvoted",
        action: "added",
      });
    }
  } catch (error) {
    console.error("Upvote Doubt Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete doubt (and all its answers)
// @route   DELETE /api/doubts/:id
// @access  Private (Teacher or doubt creator)
exports.deleteDoubt = async (req, res) => {
  try {
    const doubtId = req.params.id;
    const userId = req.user.id;

    // Get doubt details
    const [doubts] = await db.query(
      `SELECT d.*, c.teacher_id 
       FROM doubts d
       JOIN classrooms c ON d.classroom_id = c.id
       WHERE d.id = ?`,
      [doubtId]
    );

    if (doubts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    const doubt = doubts[0];

    // Check if user is teacher or the one who posted the doubt
    if (doubt.teacher_id !== userId && doubt.student_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this doubt'
      });
    }

    // Delete doubt (answers will be deleted automatically due to CASCADE)
    await db.query('DELETE FROM doubts WHERE id = ?', [doubtId]);

    res.json({
      success: true,
      message: 'Doubt and all its answers deleted successfully'
    });
  } catch (error) {
    console.error('Delete Doubt Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
// @desc    Get single doubt with answers
// @route   GET /api/doubts/:id
// @access  Private
exports.getDoubt = async (req, res) => {
  try {
    const doubtId = req.params.id;

    // Get doubt details
    const [doubts] = await db.query(
      `
      SELECT 
        d.*,
        u.username as student_name,
        u.full_name as student_full_name
      FROM doubts d
      JOIN users u ON d.student_id = u.id
      WHERE d.id = ?
    `,
      [doubtId],
    );

    if (doubts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doubt not found",
      });
    }

    // Get answers for this doubt
    const [answers] = await db.query(
      `
      SELECT 
        da.*,
        u.username as answerer_name,
        u.full_name as answerer_full_name,
        u.role as answerer_role
      FROM doubt_answers da
      JOIN users u ON da.user_id = u.id
      WHERE da.doubt_id = ?
      ORDER BY da.created_at DESC
    `,
      [doubtId],
    );

    res.json({
      success: true,
      doubt: doubts[0],
      answers,
    });
  } catch (error) {
    console.error("Get Doubt Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// @desc    Delete answer
// @route   DELETE /api/doubts/answer/:answerId
// @access  Private (Teacher or answer creator)
exports.deleteAnswer = async (req, res) => {
  try {
    const answerId = req.params.answerId;
    const userId = req.user.id;

    // Get answer details with classroom info
    const [answers] = await db.query(
      `SELECT da.*, d.classroom_id, c.teacher_id 
       FROM doubt_answers da
       JOIN doubts d ON da.doubt_id = d.id
       JOIN classrooms c ON d.classroom_id = c.id
       WHERE da.id = ?`,
      [answerId]
    );

    if (answers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    const answer = answers[0];

    // Check if user is teacher or the one who posted the answer
    if (answer.teacher_id !== userId && answer.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this answer'
      });
    }

    // Delete answer
    await db.query('DELETE FROM doubt_answers WHERE id = ?', [answerId]);

    res.json({
      success: true,
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    console.error('Delete Answer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};