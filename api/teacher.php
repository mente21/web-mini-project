<?php
include '../config.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'teacher') {
    jsonResponse(['status' => 'error', 'message' => 'Unauthorized'], 403);
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Helper to get POST JSON
$input = json_decode(file_get_contents("php://input"), true);

// --- GLOBAL SELF-HEAL SCHEMA ---
try {
    @$pdo->exec("ALTER TABLE assessments ADD COLUMN course_id INT NULL");
    @$pdo->exec("UPDATE assessments a SET course_id = (SELECT course_id FROM classes c WHERE c.id = a.class_id LIMIT 1) WHERE course_id IS NULL");
    @$pdo->exec("CREATE TABLE IF NOT EXISTS class_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT NOT NULL,
        day_of_week VARCHAR(20) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        room VARCHAR(50),
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    )");
} catch(Exception $e) {}

if ($method === 'GET') {
    if ($action === 'overview') {
        $teacherId = $_SESSION['user_id'];
        
        // 1. Get count of unique students enrolled in any of this teacher's classes
        $studentCount = $pdo->prepare("
            SELECT COUNT(DISTINCT e.student_id) 
            FROM enrollments e 
            JOIN classes c ON e.class_id = c.id 
            WHERE c.teacher_id = ?
        ");
        $studentCount->execute([$teacherId]);
        $count = $studentCount->fetchColumn();
        
        // 2. Avg Score for teacher's students only
        $avgScore = $pdo->prepare("
            SELECT AVG(g.score) 
            FROM grades g
            JOIN users u ON g.student_id = u.id
            JOIN enrollments e ON u.id = e.student_id
            JOIN classes c ON e.class_id = c.id
            WHERE c.teacher_id = ?
        ");
        $avgScore->execute([$teacherId]);
        $avg = $avgScore->fetchColumn() ?: 0;
        
        // 3. Top Students in teacher's classes
        $topStudents = $pdo->prepare("
            SELECT u.name, SUM(g.score) as total 
            FROM users u 
            JOIN grades g ON u.id = g.student_id 
            JOIN enrollments e ON u.id = e.student_id
            JOIN classes c ON e.class_id = c.id
            WHERE c.teacher_id = ?
            GROUP BY u.id 
            ORDER BY total DESC 
            LIMIT 5
        ");
        $topStudents->execute([$teacherId]);
        $top = $topStudents->fetchAll();

        // 4. Low Attendance (Refined)
        $lowAttendance = $pdo->prepare("
            SELECT u.name, ROUND((COUNT(a.id) / NULLIF((SELECT COUNT(*) FROM attendance_sessions s WHERE s.teacher_id = ?), 0)) * 100) as percentage
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            JOIN classes c ON e.class_id = c.id
            LEFT JOIN attendance a ON u.id = a.student_id
            WHERE c.teacher_id = ?
            GROUP BY u.id, u.name
            HAVING percentage < 75 OR percentage IS NULL
            LIMIT 5
        ");
        $lowAttendance->execute([$teacherId, $teacherId]);
        $low = $lowAttendance->fetchAll();

        // Schedule
        $stmt = $pdo->prepare("
            SELECT cs.*, co.code as course_code, c.section_name 
            FROM class_schedules cs
            JOIN classes c ON cs.class_id = c.id
            JOIN courses co ON c.course_id = co.id
            WHERE c.teacher_id = ?
        ");
        $stmt->execute([$teacherId]);
        $schedule = $stmt->fetchAll();

        jsonResponse([
            'student_count' => $count,
            'avg_score' => round($avg, 1),
            'top_students' => $top,
            'low_attendance' => $low,
            'schedule' => $schedule
        ]);
    }
    
    elseif ($action === 'classes') {
        $classes = $pdo->prepare("
            SELECT c.*, co.title as course_title, co.code as course_code
            FROM classes c
            JOIN courses co ON c.course_id = co.id
            WHERE c.teacher_id = ? AND c.semester_id = (SELECT id FROM semesters WHERE is_active = 1)
        ");
        $classes->execute([$_SESSION['user_id']]);
        jsonResponse($classes->fetchAll());
    }

    elseif ($action === 'class_students') {
        $classId = $_GET['class_id'];
        $stmt = $pdo->prepare("
            SELECT u.id, u.name, u.email 
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            WHERE e.class_id = ?
        ");
        $stmt->execute([$classId]);
        jsonResponse($stmt->fetchAll());
    }

    elseif ($action === 'announcements') {
        $stmt = $pdo->prepare("
            SELECT a.*, co.code as course_code, c.section_name 
            FROM announcements a
            LEFT JOIN classes c ON a.class_id = c.id
            LEFT JOIN courses co ON c.course_id = co.id
            WHERE a.teacher_id = ? 
            ORDER BY a.created_at DESC
        ");
        $stmt->execute([$_SESSION['user_id']]);
        jsonResponse($stmt->fetchAll());
    }

    elseif ($action === 'students') {
        $students = $pdo->query("
            SELECT u.id, u.name, u.email, sd.school_id, sd.parent_email
            FROM users u
            LEFT JOIN student_details sd ON u.id = sd.user_id
            WHERE u.role = 'student'
        ")->fetchAll();
        jsonResponse($students);
    }

    elseif ($action === 'student_class_grades') {
        $sid = $_GET['student_id'];
        $cid = $_GET['class_id'];
        
        // Find course_id
        $stmt = $pdo->prepare("SELECT course_id FROM classes WHERE id = ?");
        $stmt->execute([$cid]);
        $coid = $stmt->fetchColumn();

        $stmt = $pdo->prepare("
            SELECT g.assessment_id, g.score 
            FROM grades g
            JOIN assessments a ON g.assessment_id = a.id
            WHERE g.student_id = ? AND (a.course_id = ? OR a.class_id = ?)
        ");
        $stmt->execute([$sid, $coid, $cid]);
        jsonResponse($stmt->fetchAll());
    }

    elseif ($action === 'assessments') {
        $courseId = $_GET['course_id'] ?? null;
        $classId = $_GET['class_id'] ?? null;

        if ($courseId) {
            $stmt = $pdo->prepare("SELECT * FROM assessments WHERE course_id = ?");
            $stmt->execute([$courseId]);
        } elseif ($classId) {
            $stmt = $pdo->prepare("SELECT a.* FROM assessments a JOIN classes c ON a.course_id = c.course_id WHERE c.id = ?");
            $stmt->execute([$classId]);
        } else {
            $stmt = $pdo->prepare("
                SELECT DISTINCT a.*, co.code as course_code, co.title as course_title
                FROM assessments a
                JOIN courses co ON a.course_id = co.id
                JOIN classes c ON co.id = c.course_id
                WHERE c.teacher_id = ?
            ");
            $stmt->execute([$_SESSION['user_id']]);
        }
        jsonResponse($stmt->fetchAll());
    }

    elseif ($action === 'schedules') {
        $stmt = $pdo->prepare("
            SELECT cs.*, co.code as course_code, co.title as course_title, c.section_name
            FROM class_schedules cs
            JOIN classes c ON cs.class_id = c.id
            JOIN courses co ON c.course_id = co.id
            WHERE c.teacher_id = ?
            ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time
        ");
        $stmt->execute([$_SESSION['user_id']]);
        jsonResponse($stmt->fetchAll());
    }

    elseif ($action === 'attendance') {
        $stmt = $pdo->prepare("SELECT * FROM attendance_sessions WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 5");
        $stmt->execute([$_SESSION['user_id']]);
        jsonResponse($stmt->fetchAll());
    }
}

elseif ($method === 'POST') {
    if ($action === 'save_assessment') {
        $title = $input['title'];
        $max = $input['maxPoints'];
        $classId = $input['class_id'] ?? null;
        $courseId = $input['course_id'] ?? null;
        $active_sem = $pdo->query("SELECT id FROM semesters WHERE is_active = 1")->fetchColumn();
        
        // Ensure course_id column
        try { @$pdo->exec("ALTER TABLE assessments ADD COLUMN course_id INT NULL"); } catch(Exception $e){}

        if (isset($input['id'])) {
            $stmt = $pdo->prepare("UPDATE assessments SET title=?, max_points=? WHERE id=?");
            $stmt->execute([$title, $max, $input['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO assessments (title, max_points, class_id, course_id, semester_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$title, $max, $classId, $courseId, $active_sem]);
        }
        jsonResponse(['status' => 'success']);
    }
    
    elseif ($action === 'save_class_assessments') {
        $courseId = $input['course_id'];
        $assessments = $input['assessments']; 
        $active_sem = $pdo->query("SELECT id FROM semesters WHERE is_active = 1")->fetchColumn();
        
        try { @$pdo->exec("ALTER TABLE assessments ADD COLUMN course_id INT NULL"); } catch(Exception $e){}

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("SELECT id FROM assessments WHERE course_id = ?");
            $stmt->execute([$courseId]);
            $existingIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $newIds = [];
            foreach ($assessments as $a) {
                if (!empty($a['id'])) {
                    $stmt = $pdo->prepare("UPDATE assessments SET title = ?, max_points = ? WHERE id = ?");
                    $stmt->execute([$a['title'], $a['maxPoints'], $a['id']]);
                    $newIds[] = $a['id'];
                } else {
                    $stmt = $pdo->prepare("INSERT INTO assessments (title, max_points, course_id, semester_id) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$a['title'], $a['maxPoints'], $courseId, $active_sem]);
                    $newIds[] = $pdo->lastInsertId();
                }
            }

            $toDelete = array_diff($existingIds, $newIds);
            if (!empty($toDelete)) {
                $placeholders = implode(',', array_fill(0, count($toDelete), '?'));
                $pdo->prepare("DELETE FROM assessments WHERE id IN ($placeholders)")->execute(array_values($toDelete));
            }

            $pdo->commit();
            jsonResponse(['status' => 'success']);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            jsonResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    elseif ($action === 'delete_assessment') {
        $pdo->prepare("DELETE FROM assessments WHERE id = ?")->execute([$input['id']]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'save_grade') {
        $sid = $input['student_id'];
        $aid = $input['assessment_id'];
        $score = $input['score'];

        // Upsert
        $stmt = $pdo->prepare("
            INSERT INTO grades (student_id, assessment_id, score) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE score = VALUES(score)
        ");
        $stmt->execute([$sid, $aid, $score]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'save_attendance') {
        $sid = $input['student_id'];
        $status = $input['status'];
        $date = $input['date'] ?? date('Y-m-d');

        $stmt = $pdo->prepare("
            INSERT INTO attendance (student_id, attendance_date, status) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        ");
        $stmt->execute([$sid, $date, $status]);
        jsonResponse(['status' => 'success']);
    }
    
    elseif ($action === 'save_schedule') {
        $day = $input['day'];
        $time = $input['time'];
        $subject = $input['subject'];
        $room = $input['room'];
        
        $stmt = $pdo->prepare("INSERT INTO schedule (day_of_week, start_time, subject, room) VALUES (?, ?, ?, ?)");
        $stmt->execute([$day, $time, $subject, $room]);
        jsonResponse(['status' => 'success']);
    }
    
    elseif ($action === 'start_attendance_session') {
        try {
            // Ensure table has class_id column (check first to avoid duplicate error)
            $checkCol = $pdo->query("SHOW COLUMNS FROM attendance_sessions LIKE 'class_id'")->fetch();
            if (!$checkCol) {
                $pdo->exec("ALTER TABLE attendance_sessions ADD COLUMN class_id INT NULL");
            }
            
            $classId = $input['class_id'];
            $lat = $input['latitude'];
            $lng = $input['longitude'];
            $duration = 2; // Fixed 'Time Slice' of 2 minutes for high security
            $token = bin2hex(random_bytes(16));
            $expires_at = date('Y-m-d H:i:s', strtotime("+$duration minutes"));

            // Close any existing active sessions for this teacher first
            $pdo->prepare("UPDATE attendance_sessions SET expires_at = NOW() WHERE teacher_id = ? AND expires_at > NOW()")->execute([$_SESSION['user_id']]);

            $stmt = $pdo->prepare("
                INSERT INTO attendance_sessions (teacher_id, class_id, token, latitude, longitude, expires_at) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$_SESSION['user_id'], $classId, $token, $lat, $lng, $expires_at]);
            
            jsonResponse([
                'status' => 'success', 
                'session_id' => $pdo->lastInsertId(),
                'token' => $token,
                'expires_at' => $expires_at
            ]);
        } catch (Exception $e) {
            error_log("Attendance session error: " . $e->getMessage());
            jsonResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    elseif ($action === 'save_class_schedule') {
        $classId = $input['class_id'];
        $day = $input['day_of_week'];
        $start = $input['start_time'];
        $end = $input['end_time'];
        $room = $input['room'] ?? '';

        $stmt = $pdo->prepare("INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$classId, $day, $start, $end, $room]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'delete_schedule') {
        $stmt = $pdo->prepare("DELETE FROM class_schedules WHERE id = ?");
        $stmt->execute([$input['id']]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'send_announcement') {
        $content = $input['content'];
        $classId = $input['class_id'] ?: null; // Can be null for "General"
        
        $stmt = $pdo->prepare("INSERT INTO announcements (teacher_id, class_id, content) VALUES (?, ?, ?)");
        $stmt->execute([$_SESSION['user_id'], $classId, $content]);
        jsonResponse(['status' => 'success']);
    }

    elseif ($action === 'delete_announcement') {
        $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = ? AND teacher_id = ?");
        $stmt->execute([$input['id'], $_SESSION['user_id']]);
        jsonResponse(['status' => 'success']);
    }
}
?>
