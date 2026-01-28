<?php
include 'config.php';
try {
    echo "--- SEMESTERS ---\n";
    $sems = $pdo->query("SELECT * FROM semesters")->fetchAll();
    print_r($sems);

    echo "\n--- ACTIVE SEMESTER ---\n";
    $active = $pdo->query("SELECT id FROM semesters WHERE is_active = 1")->fetchColumn();
    var_dump($active);

    echo "\n--- RECENT ENROLLMENTS ---\n";
    $enr = $pdo->query("SELECT e.*, u.name, co.code FROM enrollments e JOIN users u ON e.student_id = u.id JOIN classes c ON e.class_id = c.id JOIN courses co ON c.course_id = co.id ORDER BY e.id DESC LIMIT 5")->fetchAll();
    print_r($enr);

    echo "\n--- ALL ENROLLMENTS COUNT ---\n";
    $count = $pdo->query("SELECT COUNT(*) FROM enrollments")->fetchColumn();
    var_dump($count);

} catch (Exception $e) {
    echo $e->getMessage();
}
?>
