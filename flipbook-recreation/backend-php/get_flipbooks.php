<?php
// get_flipbooks.php
require 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare('SELECT id, filename, filepath, file_size, created_at FROM flipbooks WHERE user_id = ? ORDER BY created_at DESC');
$stmt->execute([$user_id]);
// Just return DB values, including file_size
$flipbooks = $stmt->fetchAll();
echo json_encode(['flipbooks' => $flipbooks]);
?>
