<?php
require 'config.php';

// 1. Find the first class (Section A)
$stmt = $pdo->query("SELECT id, course_id, section_name FROM classes ORDER BY id ASC LIMIT 1");
$classA = $stmt->fetch();

if (!$classA) {
    die("No classes found. Please go to Admin -> Assign Class first.");
}

// 2. Count current students
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM enrollments WHERE class_id = ?");
$countStmt->execute([$classA['id']]);
$currentCount = $countStmt->fetchColumn();

// 3. Set max_students to exactly the current count (making it FULL)
$pdo->prepare("UPDATE classes SET max_students = ? WHERE id = ?")->execute([$currentCount, $classA['id']]);

echo "<h1>🧪 Stress Test Mode Activated</h1>";
echo "<p>Class <strong>{$classA['section_name']}</strong> is now marked as FULL ({$currentCount}/{$currentCount}).</p>";
echo "<p>Next student who tries to enroll should automatically <strong>JUMP</strong> to the next section.</p>";

// Check if Section B exists
$stmtB = $pdo->prepare("SELECT id FROM classes WHERE course_id = ? AND id != ?");
$stmtB->execute([$classA['course_id'], $classA['id']]);
$classB = $stmtB->fetch();

if ($classB) {
    echo "<p>✅ Section B detected. The jump target is ready.</p>";
} else {
    echo "<p>⚠️ <strong>Warning:</strong> No Section B found! Please go to Admin Module and create 'Sec B' for this course so the student has somewhere to jump to.</p>";
}
echo "<br><a href='index.php'>Go to Login</a>";
?>
