<?php
// view.php
require 'config.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo 'Missing id';
    exit;
}
$stmt = $pdo->prepare('SELECT * FROM flipbooks WHERE id = ?');
$stmt->execute([$id]);
$flipbook = $stmt->fetch();
if (!$flipbook) {
    http_response_code(404);
    echo 'Flipbook not found';
    exit;
}
$filepath = __DIR__ . '/uploads/' . $flipbook['filepath'];
if (!file_exists($filepath)) {
    http_response_code(404);
    echo 'File not found';
    exit;
}
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . $flipbook['filename'] . '"');
readfile($filepath);
?>
