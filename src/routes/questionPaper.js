// const express = require('express');
// const router = express.Router();
// const {
//   getQuestionPapers,
//   downloadQuestionPaper,
//   getStats
// } = require('../controllers/questionPaperController');

// router.get('/', getQuestionPapers);
// router.get('/stats', getStats);
// router.get('/download/:id', downloadQuestionPaper);

// module.exports = router;


const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getQuestionPapers,
  downloadQuestionPaper
} = require('../controllers/questionPaperController');

router.get('/', getQuestionPapers);
router.get('/download/:id', downloadQuestionPaper);

module.exports = router;