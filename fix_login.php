<?php
include 'config.php';

try {
    // 1. Reset Admin (Teacher) Account
    $teacherPassword = '123456';
    $teacherHash = password_hash($teacherPassword, PASSWORD_DEFAULT);
    
    $stmt1 = $pdo->prepare("INSERT INTO users (id, name, email, password, role) VALUES (1, 'Admin Teacher', 'admin@edutrack.com', ?, 'teacher') 
                           ON DUPLICATE KEY UPDATE password = VALUES(password)");
    $stmt1->execute([$teacherHash]);

    // 2. Reset Student Account
    $studentPassword = '123456';
    $studentHash = password_hash($studentPassword, PASSWORD_DEFAULT);
    
    $stmt2 = $pdo->prepare("INSERT INTO users (id, name, email, password, role) VALUES (2, 'John Student', 'student@edutrack.com', ?, 'student') 
                           ON DUPLICATE KEY UPDATE password = VALUES(password)");
    $stmt2->execute([$studentHash]);

    // 3. Ensure Student Details Exist
    $pdo->query("INSERT INTO student_details (user_id, school_id) VALUES (2, 'S-001') ON DUPLICATE KEY UPDATE user_id = user_id");

    echo "<div style='font-family: sans-serif; padding: 20px; border: 1px solid #003366; border-radius: 10px; max-width: 500px; margin: 50px auto; text-align: center;'>";
    echo "<h1 style='color: #10B981;'>✅ Credentials Fixed!</h1>";
    echo "<p>Both teacher and student accounts have been synchronized.</p>";
    echo "<div style='text-align: left; background: #f4f4f4; padding: 15px; border-radius: 8px;'>";
    echo "<h3>Teacher Account:</h3><ul><li>Email: <strong>admin@edutrack.com</strong></li><li>Pass: <strong>123456</strong></li></ul>";
    echo "<h3>Student Account:</h3><ul><li>Email: <strong>student@edutrack.com</strong></li><li>Pass: <strong>123456</strong></li></ul>";
    echo "</div>";
    echo "<br><a href='index.php' style='background: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Back to AMU Portal</a>";
    echo "</div>";

} catch (PDOException $e) {
    echo "<h1 style='color: #EF4444;'>❌ Error</h1>";
    echo "<p>Database connection failed. Please check config.php</p>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
?>
