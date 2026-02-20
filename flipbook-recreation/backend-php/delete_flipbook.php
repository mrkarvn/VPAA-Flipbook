<?php
require 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$user_id = $_SESSION['user_id'];
$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing flipbook ID']);
    exit;
}

// Get file path
$stmt = $pdo->prepare('SELECT filepath FROM flipbooks WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $user_id]);
$row = $stmt->fetch();
if (!$row) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Flipbook not found']);
    exit;
}

$filepath = __DIR__ . '/uploads/' . $row['filepath'];
if (file_exists($filepath)) {
    unlink($filepath);
}

// Delete from DB
$stmt = $pdo->prepare('DELETE FROM flipbooks WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $user_id]);

echo json_encode(['success' => true]);