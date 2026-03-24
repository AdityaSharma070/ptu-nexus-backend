const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { auth } = require('../middleware/auth');
const upload = require('../config/multer');

// Upload file
router.post('/upload', auth, upload.single('file'), fileController.uploadFile);

// Get classroom files
router.get('/:classroomId', auth, fileController.getClassroomFiles);

// Download file
router.get('/download/:fileId', auth, fileController.downloadFile);

// Delete file
router.delete('/:fileId', auth, fileController.deleteFile);

module.exports = router;