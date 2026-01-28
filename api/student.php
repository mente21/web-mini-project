<?php
include '../config.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'student') {
    jsonResponse(['status' => 'error', 'message' => 'Unauthorized'], 403);
}

$studentId = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

if ($action === 'overview') {
    try {
        // --- DATA SCHEMA SELF-HEAL ---
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS grade_scale (
                id INT AUTO_INCREMENT PRIMARY KEY,
                min_score DECIMAL(5,2),
                max_score DECIMAL(5,2),
                grade VARCHAR(5),
                grade_point DECIMAL(3,2)
            )");
            $count = $pdo->query("SELECT COUNT(*) FROM grade_scale")->fetchColumn();
            if ($count == 0) {
                $pdo->exec("INSERT INTO grade_scale (min_score, max_score, grade, grade_point) VALUES
                    (85, 100, 'A+', 4.00),
                    (80, 84.99, 'A', 3.75),
                    (75, 79.99, 'A-', 3.50),
                    (70, 74.99, 'B+', 3.25),
                    (65, 69.99, 'B', 3.00),
                    (60, 64.99, 'B-', 2.75),
                    (50, 59.99, 'C', 2.00),
                    (0, 49.99, 'F', 0.00)");
            }
            // Self-heal for schedules
            $pdo->exec("CREATE TABLE IF NOT EXISTS class_schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                day_of_week VARCHAR(20) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                room VARCHAR(50),
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            )");
            // Self-heal for announcements
            $pdo->exec("CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id INT NOT NULL,
                class_id INT,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id)
            )");
            // Self-heal for users table columns
            @$pdo->exec("ALTER TABLE users ADD COLUMN school_id VARCHAR(50) UNIQUE NULL");
            @$pdo->exec("ALTER TABLE users ADD COLUMN device_token VARCHAR(191) NULL"); // Ensure device token exists
            @$pdo->exec("ALTER TABLE users ADD COLUMN department VARCHAR(50) DEFAULT 'CS'");
            @$pdo->exec("ALTER TABLE users ADD COLUMN grade_level INT DEFAULT 1");
            @$pdo->exec("ALTER TABLE attendance ADD COLUMN class_id INT NULL"); // For new multi-section tracking
            @$pdo->exec("ALTER TABLE attendance_sessions ADD COLUMN class_id INT NOT NULL DEFAULT 0"); // Fix missing column
        } catch(Exception $e) {}

        // 1. Fetch Profile
        // 1. Fetch Profile
        try {
            $profile = $pdo->prepare("SELECT name, email, school_id, department, grade_level FROM users WHERE id = ?");
            $profile->execute([$studentId]);
            $studentInfo = $profile->fetch();
        } catch (PDOException $e) {
            // Fallback if columns don't exist yet
            $profile = $pdo->prepare("SELECT name, email FROM users WHERE id = ?");
            $profile->execute([$studentId]);
            $basic = $profile->fetch() ?: [];
            $studentInfo = array_merge($basic, ['school_id' => 'N/A', 'department' => 'CS', 'grade_level' => 1]);
        }
        $studentInfo = $studentInfo ?: [];

        // 2. Fetch Active Semester
        $active_sem_id = $pdo->query("SELECT id FROM semesters WHERE is_active = 1")->fetchColumn() ?: 0;
        
        // 3. Fetch Enrolled Courses
        $coursesQuery = "
            SELECT c.id as class_id, co.title as course_title, co.code as course_code, co.credit_hours, 
                   u.name as teacher_name, c.section_name
            FROM enrollments e
            JOIN classes c ON e.class_id = c.id
            JOIN courses co ON c.course_id = co.id
            JOIN users u ON c.teacher_id = u.id
            WHERE e.student_id = ? AND (c.semester_id = ? OR ? = 0)
        ";
        $stmt = $pdo->prepare($coursesQuery);
        $stmt->execute([$studentId, $active_sem_id, $active_sem_id]);
        $courses = $stmt->fetchAll() ?: [];

        // 4. Fetch Grades and Scale
        $gradesStmt = $pdo->prepare("SELECT assessment_id, score FROM grades WHERE student_id = ?");
        $gradesStmt->execute([$studentId]);
        $allStudentGrades = $gradesStmt->fetchAll();

        // 5. Build Grade Map for fast access
        $gradeMap = [];
        foreach($allStudentGrades as $g) { $gradeMap[$g['assessment_id']] = $g['score']; }

        // 6. Fetch Grade Scale
        $scale = $pdo->query("SELECT * FROM grade_scale ORDER BY min_score DESC")->fetchAll();

        // 7. Process each course
        $processedCourses = [];
        $totalQualityPoints = 0;
        $totalCredits = 0;
        $allCoursesComplete = true;

        foreach ($courses as $c) {
            $classId = $c['class_id'];
            // Fetch all assessments defined for this course/class
            $assStmt = $pdo->prepare("SELECT id, title, max_points FROM assessments WHERE class_id = ? OR course_id = (SELECT course_id FROM classes WHERE id = ?)");
            $assStmt->execute([$classId, $classId]);
            $assessments = $assStmt->fetchAll();

            $totalObtained = 0;
            $totalMaxPossible = 0; 
            $missingMark = false;
            $classBreakdown = [];
            
            foreach ($assessments as $a) {
                $totalMaxPossible += $a['max_points'];
                $hasMark = isset($gradeMap[$a['id']]);
                
                if (!$hasMark) {
                    $missingMark = true;
                    $score = 0;
                } else {
                    $score = $gradeMap[$a['id']];
                }
                
                $totalObtained += $score;
                $classBreakdown[] = [
                    'title' => $a['title'],
                    'score' => $score,
                    'max' => $a['max_points'],
                    'is_graded' => $hasMark
                ];
            }

            // A course is complete if it sums to 100 AND all fields are filled
            $isComplete = ($totalMaxPossible == 100 && !$missingMark && !empty($assessments));
            if (!$isComplete) $allCoursesComplete = false;

            $courseGrade = '---';
            $coursePoint = 0.00;
            $credits = (int)$c['credit_hours'];
            $totalCredits += $credits;

            if ($isComplete) {
                foreach ($scale as $s) {
                    if ($totalObtained >= $s['min_score']) {
                        $courseGrade = $s['grade'];
                        $coursePoint = (float)$s['grade_point'];
                        break;
                    }
                }
                $totalQualityPoints += ($coursePoint * $credits);
            }

            $processedCourses[] = array_merge($c, [
                'total_score' => $totalObtained,
                'grade' => $courseGrade,
                'grade_point' => $coursePoint,
                'breakdown' => $classBreakdown,
                'is_complete' => $isComplete,
                'load_status' => $totalMaxPossible . '/100'
            ]);
        }

        // GPA is ONLY calculated if ALL registered courses are submitted
        $gpa = ($allCoursesComplete && $totalCredits > 0) ? round($totalQualityPoints / $totalCredits, 2) : 0.00;

        // 8. Attendance
        $attMap = ['present' => 0, 'absent' => 0, 'late' => 0];
        $attendance = $pdo->prepare("SELECT status, COUNT(*) as count FROM attendance WHERE student_id = ? GROUP BY status");
        $attendance->execute([$studentId]);
        foreach ($attendance->fetchAll() as $row) { $attMap[$row['status']] = $row['count']; }

        // 9. Fetch Announcements
        // Fetch announcements for classes the student is in
        $annQuery = "
            SELECT a.*, u.name as teacher_name, co.code as course_code
            FROM announcements a
            JOIN users u ON a.teacher_id = u.id
            LEFT JOIN classes c ON a.class_id = c.id
            LEFT JOIN courses co ON c.course_id = co.id
            WHERE a.class_id IN (SELECT class_id FROM enrollments WHERE student_id = ?)
               OR (a.class_id IS NULL AND a.teacher_id IN (
                   SELECT teacher_id FROM classes WHERE id IN (SELECT class_id FROM enrollments WHERE student_id = ?)
               ))
            ORDER BY a.created_at DESC
            LIMIT 10
        ";
        $annStmt = $pdo->prepare($annQuery);
        $annStmt->execute([$studentId, $studentId]);
        $announcements = $annStmt->fetchAll() ?: [];

        // 10. Fetch Schedules
        $scStmt = $pdo->prepare("
            SELECT cs.*, co.title as course_title, co.code as course_code, c.section_name
            FROM class_schedules cs
            JOIN classes c ON cs.class_id = c.id
            JOIN courses co ON c.course_id = co.id
            WHERE c.id IN (SELECT class_id FROM enrollments WHERE student_id = ?)
            ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time
        ");
        $scStmt->execute([$studentId]);
        $schedules = $scStmt->fetchAll() ?: [];

        // 11. Fetch Active Attendance Sessions (One-Tap Discovery)
        // Ultra-safe fallback that doesn't rely on s.class_id existing
        $activeSession = null;
        try {
            $enrolledClasses = $pdo->prepare("SELECT DISTINCT c.teacher_id, co.code as course_code FROM enrollments e JOIN classes c ON e.class_id = c.id JOIN courses co ON c.course_id = co.id WHERE e.student_id = ?");
            $enrolledClasses->execute([$studentId]);
            $enrollments = $enrolledClasses->fetchAll();

            error_log("Student $studentId enrolled classes: " . print_r($enrollments, true));

            if ($enrollments) {
                foreach($enrollments as $enr) {
                    error_log("Searching for session by teacher_id: " . $enr['teacher_id']);
                    
                    // Find any active session by this teacher
                    $sStmt = $pdo->prepare("
                        SELECT s.id, s.token, s.latitude, s.longitude, s.radius_meters, ? as course_code
                        FROM attendance_sessions s
                        WHERE s.teacher_id = ?
                        AND s.expires_at > NOW()
                        ORDER BY s.created_at DESC LIMIT 1
                    ");
                    $sStmt->execute([$enr['course_code'], $enr['teacher_id']]);
                    $found = $sStmt->fetch();
                    
                    error_log("Found session: " . print_r($found, true));
                    
                    if ($found) {
                        $activeSession = $found;
                        error_log("✅ Active session found for student $studentId!");
                        break; 
                    }
                }
            } else {
                error_log("❌ Student $studentId has no enrollments!");
            }
        } catch (PDOException $e) {
            error_log("Session discovery error: " . $e->getMessage());
            // If even this fails, just set null and continue
            $activeSession = null;
        }

        jsonResponse([
            'student' => $studentInfo,
            'courses' => $processedCourses,
            'gpa' => $gpa,
            'is_gpa_ready' => $allCoursesComplete,
            'attendance' => $attMap,
            'announcements' => $announcements,
            'schedules' => $schedules,
            'active_session' => $activeSession
        ]);
    } catch (Exception $e) {
        jsonResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

elseif ($action === 'discover_classes') {
    // Find classes for current semester that student is NOT in
    // AND student is not in any OTHER section of the same course
    // AND the course is for the student's CURRENT year level AND DEPARTMENT
    $active_sem = $pdo->query("SELECT id FROM semesters WHERE is_active = 1")->fetchColumn();
    $student = $pdo->prepare("SELECT grade_level, department FROM users WHERE id = ?");
    $student->execute([$studentId]);
    $studentData = $student->fetch();
    
    $studentYear = $studentData['grade_level'] ?? 1;
    $studentDept = $studentData['department'] ?? 'CS';

    try {
        // Fetch classes that match semester AND (optionally) department/year
        // but EXCLUDE those the student is already in.
        $sql = "
            SELECT c.*, co.title as course_title, co.code as course_code, u.name as teacher_name,
            (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) as current_enrollment
            FROM classes c
            JOIN courses co ON c.course_id = co.id
            JOIN users u ON c.teacher_id = u.id
            WHERE c.semester_id = ?
        ";
        
        $params = [$active_sem];
        
        if ($studentYear > 0) {
            $sql .= " AND (c.year_level = ? OR c.year_level = 0)";
            $params[] = $studentYear;
        }
        
        if (!empty($studentDept) && $studentDept !== 'N/A') {
            $sql .= " AND (c.department = ? OR c.department = 'All')";
            $params[] = $studentDept;
        }

        $sql .= " AND c.id NOT IN (SELECT class_id FROM enrollments WHERE student_id = ?)";
        $params[] = $studentId;
        
        $sql .= " AND co.id NOT IN (
            SELECT cl2.course_id FROM enrollments en2
            JOIN classes cl2 ON en2.class_id = cl2.id WHERE en2.student_id = ?
        )";
        $params[] = $studentId;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        jsonResponse($stmt->fetchAll());
    } catch (Exception $e) {
        jsonResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

elseif ($action === 'enroll') {
    $input = json_decode(file_get_contents("php://input"), true);
    $courseId = $input['course_id'];
    $active_sem = $pdo->query("SELECT id FROM semesters WHERE is_active = 1")->fetchColumn();

    // Check if already enrolled in ANY section of this course
    $check = $pdo->prepare("
        SELECT COUNT(*) FROM enrollments en
        JOIN classes cl ON en.class_id = cl.id
        WHERE en.student_id = ? AND cl.course_id = ? AND cl.semester_id = ?
    ");
    $check->execute([$studentId, $courseId, $active_sem]);
    if ($check->fetchColumn() > 0) {
        jsonResponse(['status' => 'error', 'message' => 'You are already enrolled in a section of this course.'], 400);
    }

    // The "Jump" Logic (Antigravity Algorithm)
    // 1. Find all available sections for this course
    $stmt = $pdo->prepare("
        SELECT id, max_students, 
        (SELECT COUNT(*) FROM enrollments WHERE class_id = classes.id) as current_count
        FROM classes 
        WHERE course_id = ? AND semester_id = ?
        ORDER BY section_name ASC
    ");
    $stmt->execute([$courseId, $active_sem]);
    $sections = $stmt->fetchAll();

    $targetClassId = null;
    foreach ($sections as $sec) {
        if ($sec['current_count'] < $sec['max_students']) {
            $targetClassId = $sec['id'];
            break;
        }
    }

    if (!$targetClassId) {
        jsonResponse(['status' => 'error', 'message' => 'All sections for this course are full.'], 400);
    }

    // Enroll
    $stmt = $pdo->prepare("INSERT INTO enrollments (student_id, class_id, semester_id) VALUES (?, ?, ?)");
    $stmt->execute([$studentId, $targetClassId, $active_sem]);
    
    // Fetch section name for clarity
    $secName = $pdo->query("SELECT section_name FROM classes WHERE id = $targetClassId")->fetchColumn();

    jsonResponse(['status' => 'success', 'message' => 'Enrolled successfully in section: ' . $secName]);
}

elseif ($action === 'view_grades_by_class') {
    $classId = $_GET['class_id'] ?? null;
    if (!$classId) {
        jsonResponse(['status' => 'error', 'message' => 'Class ID required'], 400);
    }

    $stmt = $pdo->prepare("
        SELECT a.title, a.max_points, g.score, g.feedback
        FROM grades g
        JOIN assessments a ON g.assessment_id = a.id
        WHERE g.student_id = ? AND a.class_id = ?
    ");
    $stmt->execute([$studentId, $classId]);
    jsonResponse($stmt->fetchAll());
}

elseif ($action === 'submit_complaint') {
    $input = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO complaints (student_id, subject, message) VALUES (?, ?, ?)");
    $stmt->execute([$studentId, $input['subject'], $input['message']]);
    jsonResponse(['status' => 'success']);
}

elseif ($action === 'submit_attendance') {
    $input = json_decode(file_get_contents("php://input"), true);
    $token = $input['token'];
    $clientDeviceToken = $input['device_token'] ?? null;
    $studentLat = $input['latitude'];
    $studentLng = $input['longitude'];
    $deviceInfo = $_SERVER['HTTP_USER_AGENT'];

    // Verify Device Binding (Security Enhancement)
    $userStmt = $pdo->prepare("SELECT device_token FROM users WHERE id = ?");
    $userStmt->execute([$studentId]);
    $dbDeviceToken = $userStmt->fetchColumn();

    if (!$dbDeviceToken) {
        // Auto-bind on first use
        $pdo->prepare("UPDATE users SET device_token = ? WHERE id = ?")->execute([$clientDeviceToken, $studentId]);
        $dbDeviceToken = $clientDeviceToken;
    } elseif ($dbDeviceToken !== $clientDeviceToken) {
        jsonResponse(['status' => 'error', 'message' => 'Unauthorized device. Please use your registered smartphone.'], 403);
    }

    // Find active session by token
    $stmt = $pdo->prepare("SELECT * FROM attendance_sessions WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        jsonResponse(['status' => 'error', 'message' => 'The attendance window has closed.'], 400);
    }

    // Haversine formula for distance (Precise Geo-Fencing)
    $earthRadius = 6371000; 
    $latFrom = deg2rad($session['latitude']);
    $lonFrom = deg2rad($session['longitude']);
    $latTo = deg2rad($studentLat);
    $lonTo = deg2rad($studentLng);
    $latDelta = $latTo - $latFrom;
    $lonDelta = $lonTo - $lonFrom;

    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) + cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
    $distance = $angle * $earthRadius;

    if ($distance > ($session['radius_meters'] + 20)) { // 20m grace for GPS jitter
        jsonResponse(['status' => 'error', 'message' => 'Invalid Location. Please stay in your seat within the classroom.'], 400);
    }

    // Record attendance
    try {
        $stmt = $pdo->prepare("
            INSERT INTO attendance (student_id, session_id, class_id, attendance_date, status, device_info) 
            VALUES (?, ?, ?, CURDATE(), 'present', ?)
        ");
        $stmt->execute([$studentId, $session['id'], $session['class_id'], $deviceInfo]);
        jsonResponse(['status' => 'success', 'message' => 'Verified! You are marked present.']);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            jsonResponse(['status' => 'error', 'message' => 'Attendance already recorded for this class.'], 400);
        }
        jsonResponse(['status' => 'error', 'message' => 'System error: ' . $e->getMessage()], 500);
    }
}

elseif ($action === 'discover_sessions') {
    $studentLat = $_GET['latitude'] ?? null;
    $studentLng = $_GET['longitude'] ?? null;

    if (!$studentLat || !$studentLng) {
        jsonResponse(['status' => 'error', 'message' => 'Location required'], 400);
    }

    // Find all active sessions
    $stmt = $pdo->query("SELECT id, subject, teacher_id, latitude, longitude, radius_meters, expires_at FROM attendance_sessions WHERE expires_at > NOW()");
    $sessions = $stmt->fetchAll();

    $nearby = [];
    foreach ($sessions as $s) {
        // Haversine
        $earthRadius = 6371000;
        $latFrom = deg2rad($s['latitude']);
        $lonFrom = deg2rad($s['longitude']);
        $latTo = deg2rad($studentLat);
        $lonTo = deg2rad($studentLng);
        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
        $distance = $angle * $earthRadius;

        if ($distance <= ($s['radius_meters'] + 50)) { // 50m buffer for GPS jitter
            $teacherName = $pdo->query("SELECT name FROM users WHERE id = ".$s['teacher_id'])->fetchColumn();
            $nearby[] = [
                'session_id' => $s['id'],
                'subject' => $s['subject'],
                'teacher' => $teacherName,
                'distance' => round($distance)
            ];
        }
    }

    jsonResponse($nearby);
}

elseif ($action === 'submit_discovery_attendance') {
    $input = json_decode(file_get_contents("php://input"), true);
    $sessionId = $input['session_id'];
    $clientDeviceToken = $input['device_token'] ?? null;
    $studentLat = $input['latitude'];
    $studentLng = $input['longitude'];
    $deviceInfo = $_SERVER['HTTP_USER_AGENT'];

    // Verify Device Binding
    $userStmt = $pdo->prepare("SELECT device_token FROM users WHERE id = ?");
    $userStmt->execute([$studentId]);
    $dbDeviceToken = $userStmt->fetchColumn();

    if ($dbDeviceToken && $dbDeviceToken !== $clientDeviceToken) {
        jsonResponse(['status' => 'error', 'message' => 'Unauthorized device.'], 403);
    }

    // Verify Session exists and active
    $stmt = $pdo->prepare("SELECT * FROM attendance_sessions WHERE id = ? AND expires_at > NOW()");
    $stmt->execute([$sessionId]);
    $session = $stmt->fetch();

    if (!$session) {
        jsonResponse(['status' => 'error', 'message' => 'Session finished or invalid'], 400);
    }

    // Double check radius
    // (Haversine code repeated or abstracted)
    $earthRadius = 6371000;
    $latFrom = deg2rad($session['latitude']);
    $lonFrom = deg2rad($session['longitude']);
    $latTo = deg2rad($studentLat);
    $lonTo = deg2rad($studentLng);
    $latDelta = $latTo - $latFrom;
    $lonDelta = $lonTo - $lonFrom;
    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) + cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
    $distance = $angle * $earthRadius;

    if ($distance > $session['radius_meters']) {
        jsonResponse(['status' => 'error', 'message' => 'Too far from classroom'], 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO attendance (student_id, session_id, attendance_date, status, device_info) VALUES (?, ?, CURDATE(), 'present', ?)");
        $stmt->execute([$studentId, $session['id'], $deviceInfo]);
        jsonResponse(['status' => 'success', 'message' => 'Attendance recorded!']);
    } catch (PDOException $e) {
        jsonResponse(['status' => 'error', 'message' => 'Already marked present'], 400);
    }
}
?>
