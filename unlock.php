<?php
/**
 * EduTrack - Emergency Device Unlock
 * Run this script to clear your device binding if you are locked out.
 */
include 'config.php';

// The email of the student to unlock
$studentEmail = 'student@edutrack.com'; 

try {
    $stmt = $pdo->prepare("UPDATE users SET device_token = NULL WHERE email = ? AND role = 'student'");
    $stmt->execute([$studentEmail]);
    
    if ($stmt->rowCount() > 0) {
        echo "<h2 style='color:green; font-family:sans-serif;'>✅ Success! Device binding for $studentEmail has been reset.</h2>";
        echo "<p>You can now log in from your current browser (Chrome).</p>";
    } else {
        echo "<h2 style='color:orange; font-family:sans-serif;'>ℹ️ No changes made.</h2>";
        echo "<p>Either the email is wrong, or the account wasn't bound to a device yet.</p>";
    }
    echo "<br><a href='index.php'>Go to Login</a>";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
