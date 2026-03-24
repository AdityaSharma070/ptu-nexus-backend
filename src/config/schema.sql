-- Create database


-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(200),
  role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Subjects table
CREATE TABLE subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  semester INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_semester (semester)
);

-- Classrooms table
CREATE TABLE classrooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  subject_id INT,
  teacher_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher (teacher_id),
  INDEX idx_code (code)
);

-- Enrollments (Students in Classrooms)
CREATE TABLE enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  classroom_id INT NOT NULL,
  student_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (classroom_id, student_id),
  INDEX idx_student (student_id)
);

-- Join Requests
CREATE TABLE join_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  classroom_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_request (classroom_id, student_id),
  INDEX idx_status (status)
);

-- Assignments
CREATE TABLE assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  classroom_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  topic VARCHAR(100),
  total_marks INT NOT NULL,
  deadline DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
  INDEX idx_classroom (classroom_id),
  INDEX idx_deadline (deadline)
);

-- Submissions
CREATE TABLE submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  file_path VARCHAR(255),
  marks INT,
  feedback TEXT,
  is_late BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graded_at TIMESTAMP NULL,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_submission (assignment_id, student_id),
  INDEX idx_student (student_id)
);

-- Doubts
CREATE TABLE doubts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  classroom_id INT NOT NULL,
  student_id INT NOT NULL,
  topic VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_classroom (classroom_id),
  INDEX idx_resolved (resolved)
);

-- Doubt Answers
CREATE TABLE doubt_answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doubt_id INT NOT NULL,
  user_id INT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doubt_id) REFERENCES doubts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_doubt (doubt_id)
);

-- Announcements
CREATE TABLE announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  classroom_id INT NOT NULL,
  text TEXT NOT NULL,
  important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
  INDEX idx_classroom (classroom_id)
);

-- Question Papers
CREATE TABLE question_papers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  year INT NOT NULL,
  semester VARCHAR(20),
  exam_type VARCHAR(50),
  pdf_path VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_subject (subject_id),
  INDEX idx_year (year)
);

-- Topics (for analytics)
CREATE TABLE topics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) UNIQUE NOT NULL,
  category VARCHAR(100),
  frequency INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);