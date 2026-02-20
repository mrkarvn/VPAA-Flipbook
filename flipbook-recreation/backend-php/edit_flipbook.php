<?php
// edit_flipbook.php
require 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$newName = isset($_POST['name']) ? trim($_POST['name']) : '';
$user_id = $_SESSION['user_id'];

if ($id <= 0 || $newName === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

// Only update the display name (filename/title), not the file path or actual file
$stmt = $pdo->prepare('UPDATE flipbooks SET filename = ? WHERE id = ? AND user_id = ?');
$stmt->execute([$newName, $id, $user_id]);

if ($stmt->rowCount() > 0) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Update failed or no permission']);
}
?>
