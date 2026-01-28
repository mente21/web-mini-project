<?php
include '../config.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    jsonResponse(['status' => 'error', 'message' => 'Unauthorized'], 403);
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);

if ($method === 'GET') {
    if ($action === 'overview') {
        // Safe check for new columns before query
        try {
            $active_sem = $pdo->query("SELECT * FROM semesters WHERE is_active = 1")->fetch();
        } catch (Exception $e) {
            // If query fails, columns might be missing, run migration immediately
            @$pdo->exec("ALTER TABLE semesters ADD COLUMN reg_start_date DATE NULL");
            @$pdo->exec("ALTER TABLE semesters ADD COLUMN reg_deadline DATE NULL");
            $active_sem = $pdo->query("SELECT * FROM semesters WHERE is_active = 1")->fetch();
        }

        $stats = [
            'courses' => $pdo->query("SELECT COUNT(*) FROM courses")->fetchColumn(),
            'teachers' => $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'teacher'")->fetchColumn(),
            'students' => $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'student'")->fetchColumn(),
            'active_semester' => $active_sem ? $active_sem['name'] : 'None',
            'reg_start' => isset($active_sem['reg_start_date']) ? $active_sem['reg_start_date'] : null,
            'reg_deadline' => isset($active_sem['reg_deadline']) ? $active_sem['reg_deadline'] : null,
            'depts' => ['CS', 'Software Eng', 'IT', 'Electrical', 'Mechanical', 'Civil', 'Water Eng'] // Default dept list
        ];
        jsonResponse($stats);
    }

    elseif ($action === 'courses') {
        try {
            $courses = $pdo->query("SELECT * FROM courses ORDER BY code")->fetchAll();
        } catch (Exception $e) {
            @$pdo->exec("ALTER TABLE courses ADD COLUMN department VARCHAR(50) DEFAULT 'CS'");
            @$pdo->exec("ALTER TABLE courses ADD COLUMN year_level INT DEFAULT 1");
            $courses = $pdo->query("SELECT * FROM courses ORDER BY code")->fetchAll();
        }
        jsonResponse($courses);
    }

    elseif ($action === 'teachers') {
        $teachers = $pdo->query("SELECT id, name, email FROM users WHERE role = 'teacher' ORDER BY name")->fetchAll();
        jsonResponse($teachers);
    }

    elseif ($action === 'classes') {
        try {
            $classes = $pdo->query("
                SELECT c.*, co.title as course_title, co.code as course_code, u.name as teacher_name, s.name as semester_name,
                (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) as enrolled_count
                FROM classes c
                JOIN courses co ON c.course_id = co.id
                JOIN users u ON c.teacher_id = u.id
                JOIN semesters s ON c.semester_id = s.id
                WHERE s.is_active = 1
            ")->fetchAll();
        } catch (Exception $e) {
            @$pdo->exec("ALTER TABLE classes ADD COLUMN department VARCHAR(50) DEFAULT 'CS'");
            @$pdo->exec("ALTER TABLE classes ADD COLUMN year_level INT DEFAULT 1");
            $classes = $pdo->query("
                SELECT c.*, co.title as course_title, co.code as course_code, u.name as teacher_name, s.name as semester_name,
                (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) as enrolled_count
                FROM classes c
                JOIN courses co ON c.course_id = co.id
                JOIN users u ON c.teacher_id = u.id
                JOIN semesters s ON c.semester_id = s.id
                WHERE s.is_active = 1
            ")->fetchAll();
        }
        jsonResponse($classes);
    }

    elseif ($action === 'students') {
        try {
            $students = $pdo->query("SELECT id, name, email, school_id, grade_level, department, device_token FROM users WHERE role = 'student' ORDER BY name")->fetchAll();
        } catch (Exception $e) {
            @$pdo->exec("ALTER TABLE users ADD COLUMN department VARCHAR(50) DEFAULT 'CS'");
            @$pdo->exec("ALTER TABLE users ADD COLUMN school_id VARCHAR(50) UNIQUE NULL");
            $students = $pdo->query("SELECT id, name, email, school_id, grade_level, department, device_token FROM users WHERE role = 'student' ORDER BY name")->fetchAll();
        }
        jsonResponse($students);
    }

    elseif ($action === 'grade_scale') {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS grade_scale (
                id INT AUTO_INCREMENT PRIMARY KEY,
                min_score DECIMAL(5,2),
                max_score DECIMAL(5,2),
                grade VARCHAR(5),
                grade_point DECIMAL(3,2)
            )");
            $scale = $pdo->query("SELECT * FROM grade_scale ORDER BY min_score DESC")->fetchAll();
            jsonResponse($scale);
        } catch (Exception $e) {
            jsonResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}

if ($method === 'POST') {
    if ($action === 'add_course') {
        try {
            $stmt = $pdo->prepare("INSERT INTO courses (code, title, credit_hours, description, year_level, department) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['code'], $input['title'], $input['credit_hours'], $input['description'], $input['year_level'], $input['department']]);
        } catch (Exception $e) {
            // Self-heal: Ensure columns exist
            @$pdo->exec("ALTER TABLE courses ADD COLUMN department VARCHAR(50) DEFAULT 'CS'");
            @$pdo->exec("ALTER TABLE courses ADD COLUMN year_level INT DEFAULT 1");
            
            // Retry
            $stmt = $pdo->prepare("INSERT INTO courses (code, title, credit_hours, description, year_level, department) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['code'], $input['title'], $input['credit_hours'], $input['description'], $input['year_level'], $input['department']]);
        }
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'edit_course') {
        try {
            $stmt = $pdo->prepare("UPDATE courses SET code=?, title=?, credit_hours=?, year_level=?, department=? WHERE id=?");
            $stmt->execute([$input['code'], $input['title'], $input['credit_hours'], $input['year_level'], $input['department'], $input['id']]);
        } catch (Exception $e) {
            @$pdo->exec("ALTER TABLE courses ADD COLUMN department VARCHAR(50) DEFAULT 'CS'");
            $stmt = $pdo->prepare("UPDATE courses SET code=?, title=?, credit_hours=?, year_level=?, department=? WHERE id=?");
            $stmt->execute([$input['code'], $input['title'], $input['credit_hours'], $input['year_level'], $input['department'], $input['id']]);
        }
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'delete_course') {
        $stmt = $pdo->prepare("DELETE FROM courses WHERE id = ?");
        $stmt->execute([$input['id']]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'add_teacher') {
        $password = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'teacher')");
        $stmt->execute([$input['name'], $input['email'], $password]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'edit_teacher') {
        $stmt = $pdo->prepare("UPDATE users SET name=?, email=? WHERE id=? AND role='teacher'");
        $stmt->execute([$input['name'], $input['email'], $input['id']]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'delete_teacher') {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role = 'teacher'");
        $stmt->execute([$input['id']]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'add_student') {
        $password = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, school_id, grade_level, department, password, role) VALUES (?, ?, ?, ?, ?, ?, 'student')");
        $stmt->execute([$input['name'], $input['email'], $input['school_id'], $input['grade_level'], $input['department'], $password]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'edit_student') {
        $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, school_id=?, grade_level=?, department=? WHERE id=? AND role='student'");
        $stmt->execute([$input['name'], $input['email'], $input['school_id'], $input['grade_level'], $input['department'], $input['id']]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'delete_student') {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role = 'student'");
        $stmt->execute([$input['id']]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'add_class') {
        $active_sem = $pdo->query("SELECT id FROM semesters WHERE is_active = 1")->fetchColumn();
        if (!$active_sem) jsonResponse(['status' => 'error', 'message' => 'No active semester'], 400);

        // Auto-fetch Dept and Year from the Source Course
        $courseId = $input['course_id'];
        $courseData = $pdo->prepare("SELECT department, year_level FROM courses WHERE id = ?");
        $courseData->execute([$courseId]);
        $course = $courseData->fetch();
        
        $dept = $course['department'] ?? 'CS';
        $year = $course['year_level'] ?? 1;

        try {
            $stmt = $pdo->prepare("INSERT INTO classes (course_id, teacher_id, semester_id, section_name, max_students, room, schedule_time, department, year_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$courseId, $input['teacher_id'], $active_sem, $input['section_name'], $input['max_students'], $input['room'], $input['schedule_time'], $dept, $year]);
        } catch (Exception $e) {
            @$pdo->exec("ALTER TABLE classes ADD COLUMN department VARCHAR(50) DEFAULT 'CS'");
            @$pdo->exec("ALTER TABLE classes ADD COLUMN year_level INT DEFAULT 1");
            $stmt = $pdo->prepare("INSERT INTO classes (course_id, teacher_id, semester_id, section_name, max_students, room, schedule_time, department, year_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$courseId, $input['teacher_id'], $active_sem, $input['section_name'], $input['max_students'], $input['room'], $input['schedule_time'], $dept, $year]);
        }
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'edit_class') {
        $stmt = $pdo->prepare("UPDATE classes SET course_id=?, teacher_id=?, section_name=?, max_students=?, schedule_time=? WHERE id=?");
        $stmt->execute([$input['course_id'], $input['teacher_id'], $input['section_name'], $input['max_students'], $input['schedule_time'], $input['id']]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'delete_class') {
        $stmt = $pdo->prepare("DELETE FROM classes WHERE id = ?");
        $stmt->execute([$input['id']]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'rollover_phase1') {
        // Lockdown & Calculate GPAs
        $active_sem = $pdo->query("SELECT id FROM semesters WHERE is_active = 1")->fetchColumn();
        $pdo->prepare("UPDATE semesters SET is_locked = 1 WHERE id = ?")->execute([$active_sem]);
        // Note: Real GPA calc would involve complex math across all grades, here we just lock it.
        jsonResponse(['status' => 'success', 'message' => 'Semester grades locked.']);
    }

    elseif ($action === 'rollover_phase2') {
        // Clone for Next Semester
        $old_sem = $pdo->query("SELECT * FROM semesters WHERE is_active = 1")->fetch();
        $new_name = $input['new_semester_name'];

        // 1. Create new sem (Active = 0 initially, wait for phase 4)
        // Also set registration deadline (Default: +14 days from now if not set)
        $deadline = $input['registration_deadline'] ?? date('Y-m-d H:i:s', strtotime('+14 days'));
        
        $pdo->prepare("INSERT INTO semesters (name, is_active, registration_deadline) VALUES (?, 0, ?)")->execute([$new_name, $deadline]);
        $new_sem_id = $pdo->lastInsertId();

        // 2. Clone classes if requested
        if ($input['clone_classes']) {
            $stmt = $pdo->prepare("
                INSERT INTO classes (course_id, teacher_id, semester_id, section_name, max_students, room, schedule_time)
                SELECT course_id, teacher_id, ?, section_name, max_students, room, schedule_time
                FROM classes WHERE semester_id = ?
            ");
            $stmt->execute([$new_sem_id, $old_sem['id']]);
        }

        jsonResponse(['status' => 'success', 'new_id' => $new_sem_id]);
    }

    elseif ($action === 'rollover_phase3_4') {
        // Promote & Swap
        $old_sem_id = $pdo->query("SELECT id FROM semesters WHERE is_active = 1")->fetchColumn(); // Fix: fetchColumn()
        $new_sem_id = $input['new_sem_id'];

        // Promote Students
        $pdo->exec("UPDATE users SET grade_level = grade_level + 1 WHERE role = 'student'");
        
        // Swap active
        if ($old_sem_id) {
            $pdo->prepare("UPDATE semesters SET is_active = 0 WHERE id = ?")->execute([$old_sem_id]);
        }
        $pdo->prepare("UPDATE semesters SET is_active = 1 WHERE id = ?")->execute([$new_sem_id]);

        jsonResponse(['status' => 'success', 'message' => 'New semester is now LIVE!']);
    }

    elseif ($action === 'reset_device') {
        $studentId = $input['student_id'];
        $stmt = $pdo->prepare("UPDATE users SET device_token = NULL WHERE id = ?");
        $stmt->execute([$studentId]);
        jsonResponse(['status' => 'success', 'message' => 'Device reset successful.']);
    }

    elseif ($action === 'update_semester_dates') {
        $active_sem_id = $pdo->query("SELECT id FROM semesters WHERE is_active = 1")->fetchColumn();
        if (!$active_sem_id) jsonResponse(['status' => 'error', 'message' => 'No active semester'], 400);

        $stmt = $pdo->prepare("UPDATE semesters SET reg_start_date = ?, reg_deadline = ? WHERE id = ?");
        $stmt->execute([$input['reg_start'], $input['reg_deadline'], $active_sem_id]);
        jsonResponse(['status' => 'success', 'message' => 'Registration dates updated.']);
    }

    elseif ($action === 'run_migration') {
        try {
            @$pdo->exec("ALTER TABLE semesters ADD COLUMN reg_start_date DATE NULL");
            @$pdo->exec("ALTER TABLE semesters ADD COLUMN reg_deadline DATE NULL");
            @$pdo->exec("ALTER TABLE users ADD COLUMN school_id VARCHAR(50) UNIQUE NULL");
            @$pdo->exec("ALTER TABLE users ADD COLUMN department VARCHAR(50) DEFAULT 'CS'");
            @$pdo->exec("ALTER TABLE courses ADD COLUMN year_level INT DEFAULT 1");
            @$pdo->exec("ALTER TABLE courses ADD COLUMN department VARCHAR(50) DEFAULT 'CS'");
            jsonResponse(['status' => 'success', 'message' => 'Database migrated successfully.']);
        } catch (Exception $e) {
            jsonResponse(['status' => 'error', 'message' => 'Migration failed: ' . $e->getMessage()]);
        }
    }

    elseif ($action === 'save_grade_scale') {
        try {
            $pdo->exec("TRUNCATE TABLE grade_scale");
            $stmt = $pdo->prepare("INSERT INTO grade_scale (min_score, max_score, grade, grade_point) VALUES (?, ?, ?, ?)");
            foreach ($input['scale'] as $row) {
                $stmt->execute([$row['min_score'], $row['max_score'], $row['grade'], $row['grade_point']]);
            }
            jsonResponse(['status' => 'success']);
        } catch (Exception $e) {
            jsonResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
