const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
require('./config/db');

const app = express();


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://ptu-nexus.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // 🔥 STOP HERE (fixes your issue)
  }

  next();
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Single static files route (fixed duplicate)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const classroomRoutes = require('./routes/classroom');
const assignmentRoutes = require('./routes/assignment');
const doubtRoutes = require('./routes/doubt');
const announcementRoutes = require('./routes/announcement');
const questionPaperRoutes = require('./routes/questionPaper');
const fileRoutes = require('./routes/file');

app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/question-papers', questionPaperRoutes);
app.use('/api/files', fileRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'PTU Nexus API is running! 🚀' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;