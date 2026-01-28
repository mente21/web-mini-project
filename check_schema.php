<?php
include 'config.php';
try {
    $e = $pdo->query("EXPLAIN enrollments")->fetchAll();
    echo "ENROLLMENTS:\n";
    print_r($e);
    $c = $pdo->query("EXPLAIN classes")->fetchAll();
    echo "\nCLASSES:\n";
    print_r($c);
} catch (Exception $ex) {
    echo $ex->getMessage();
}
?>
