<?php
include 'config.php';
try {
    $res = ["enrollments" => [], "classes" => [], "semesters" => []];
    $res["enrollments"] = $pdo->query("SELECT * FROM enrollments LIMIT 20")->fetchAll();
    $res["classes"] = $pdo->query("SELECT * FROM classes LIMIT 20")->fetchAll();
    $res["semesters"] = $pdo->query("SELECT * FROM semesters")->fetchAll();
    echo json_encode($res, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
