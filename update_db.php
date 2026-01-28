<?php
include 'config.php';

echo "<h2>EduTrack | System Optimization & Upgrade</h2>";

try {
    // 1. Semesters Tracking
    $pdo->exec("CREATE TABLE IF NOT EXISTS semesters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT false,
        is_locked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✅ Semesters table ready.<br>";

    // 2. Adjust Users table
    // Check if role ENUM needs update
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student'");
    
    // Add grade_level if missing
    $columns = $pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('grade_level', $columns)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN grade_level INT DEFAULT 1");
    }
    echo "✅ Users table upgraded (Admin role + Grade Level).<br>";

    // 3. Courses Management
    $pdo->exec("CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        title VARCHAR(100) NOT NULL,
        credit_hours INT DEFAULT 3,
        description TEXT
    )");
    echo "✅ Courses table ready.<br>";

    // 4. Class Management
    $pdo->exec("CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        teacher_id INT NOT NULL,
        semester_id INT NOT NULL,
        section_name VARCHAR(10),
        max_students INT DEFAULT 40,
        room VARCHAR(50),
        schedule_time TIME
    )");
    echo "✅ Classes table ready.<br>";

    // 5. Enrollments
    $pdo->exec("CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        class_id INT NOT NULL,
        semester_id INT NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_enrollment (student_id, class_id)
    )");
    echo "✅ Enrollments table ready.<br>";

    // NEW: Add registration_deadline to semesters if missing
    $cols = $pdo->query("DESCRIBE semesters")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('registration_deadline', $cols)) {
        $pdo->exec("ALTER TABLE semesters ADD COLUMN registration_deadline DATETIME DEFAULT NULL");
        echo "✅ Added registration_deadline to Semesters.<br>";
    }

    // NEW: Add school_id to users for easier login check
    $uCols = $pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('school_id', $uCols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN school_id VARCHAR(50) UNIQUE DEFAULT NULL");
        echo "✅ Added school_id to Users.<br>";
    }

    // NEW: Add gender, dob, phone, address to student_details
    // First ensure student_details exists (it likely does from auth.php register logic)
    $pdo->exec("CREATE TABLE IF NOT EXISTS student_details (
        user_id INT PRIMARY KEY,
        school_id VARCHAR(50),
        parent_email VARCHAR(100),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $sdCols = $pdo->query("DESCRIBE student_details")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('gender', $sdCols)) {
        $pdo->exec("ALTER TABLE student_details 
            ADD COLUMN gender ENUM('M', 'F') DEFAULT NULL,
            ADD COLUMN dob DATE DEFAULT NULL,
            ADD COLUMN phone VARCHAR(20) DEFAULT NULL,
            ADD COLUMN address TEXT DEFAULT NULL
        ");
        echo "✅ Added profile fields to Student Details.<br>";
    }

    // 6. Complaints
    $pdo->exec("CREATE TABLE IF NOT EXISTS complaints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject VARCHAR(100),
        message TEXT,
        status ENUM('pending', 'resolved') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✅ Complaints system ready.<br>";

    // NEW: Grading System
    $pdo->exec("CREATE TABLE IF NOT EXISTS assessments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT,
        title VARCHAR(100),
        max_points INT DEFAULT 100,
        type ENUM('exam', 'quiz', 'assignment') DEFAULT 'standard',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        assessment_id INT NOT NULL,
        score DECIMAL(5,2),
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_grade (student_id, assessment_id)
    )");
    echo "✅ Grading system ready.<br>";

    // NEW: Attendance System
    $pdo->exec("CREATE TABLE IF NOT EXISTS attendance_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        class_id INT, 
        subject VARCHAR(100),
        token VARCHAR(50),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        radius_meters INT DEFAULT 100,
        expires_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        session_id INT,
        attendance_date DATE,
        status ENUM('present', 'absent', 'late') DEFAULT 'present',
        device_info VARCHAR(255),
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_daily_attendance (student_id, attendance_date, session_id)
    )");
    echo "✅ Attendance system ready.<br>";

    // 7. Announcements
    $pdo->exec("CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        class_id INT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✅ Announcements system ready.<br>";

    // 8. Seed Default Admin if none exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    if ($stmt->fetchColumn() == 0) {
        $pass = password_hash('123456', PASSWORD_DEFAULT);
        $pdo->exec("INSERT INTO users (name, email, password, role) VALUES ('Super Admin', 'admin@amu.edu.et', '$pass', 'admin')");
        echo "⭐️ Default Admin Created: admin@amu.edu.et / 123456<br>";
    }

    // 9. Initial Semester
    $stmt = $pdo->query("SELECT COUNT(*) FROM semesters WHERE is_active = 1");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("INSERT INTO semesters (name, is_active) VALUES ('Spring 2026', true)");
        echo "📅 Active Term set to Spring 2026.<br>";
    }

    echo "<h3 style='color:green;'>System upgrade complete! Log in to the Admin Dashboard to begin setup.</h3>";

} catch (PDOException $e) {
    echo "<h3 style='color:red;'>Upgrade Failed: " . $e->getMessage() . "</h3>";
}
