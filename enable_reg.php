<?php
require 'config.php';
try {
    // Force set a deadline 14 days from now for the active semester
    $pdo->exec("UPDATE semesters SET registration_deadline = DATE_ADD(NOW(), INTERVAL 14 DAY) WHERE is_active = 1");
    // Also ensure manual flag just in case
    $active = $pdo->query("SELECT * FROM semesters WHERE is_active = 1")->fetch();
    echo "<h1>✅ Fixed!</h1>";
    echo "<p>Registration Deadline for <strong>" . $active['name'] . "</strong> is now set to: " . $active['registration_deadline'] . "</p>";
    echo "<p>Go back to the <a href='index.php'>Login Page</a> and the button should appear.</p>";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
