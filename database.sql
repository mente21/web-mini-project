-- Database Schema for EduTrack (AMU Extended Edition)

-- 1. Semesters Tracking
CREATE TABLE IF NOT EXISTS semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- e.g. 'Fall 2025', 'Spring 2026'
    is_active BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false, -- For Phase 1 Lockdown
    reg_start_date DATE NULL,
    reg_deadline DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (Updated with admin role and level)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student',
    grade_level INT DEFAULT 1, -- For Phase 3 Promotion
    device_token VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Course Management
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g. CS101
    title VARCHAR(100) NOT NULL,
    credit_hours INT DEFAULT 3,
    description TEXT
);

-- 4. Class Management (The specific instances of a course)
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    semester_id INT NOT NULL,
    section_name VARCHAR(10), -- e.g. 'Sec A'
    max_students INT DEFAULT 40, -- The "Max Students" constraint
    room VARCHAR(50),
    schedule_time TIME,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- 5. Enrollment (Student -> Class)
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    semester_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    UNIQUE KEY unique_enrollment (student_id, class_id)
);

-- 6. Complaints/Tickets
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(100),
    message TEXT,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Existing tables update (Assessments linked to classes)
CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    max_points INT NOT NULL,
    type ENUM('test', 'mid', 'final', 'lab') DEFAULT 'test',
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- Grades (Links Student -> Assessment)
CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    assessment_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id),
    UNIQUE KEY unique_grade (student_id, assessment_id)
);

-- Attendance (Links Student -> Session)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    teacher_id INT NOT NULL,
    token VARCHAR(191) UNIQUE NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius_meters INT DEFAULT 50,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    status ENUM('present', 'absent', 'late') DEFAULT 'present',
    device_info VARCHAR(255),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id)
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    class_id INT, -- Optional: global or class-specific
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Initial Setup
INSERT INTO semesters (name, is_active) VALUES ('Spring 2026', true);
INSERT INTO users (name, email, password, role) VALUES 
('Super Admin', 'admin@amu.edu.et', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
