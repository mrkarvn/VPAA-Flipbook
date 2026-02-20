<?php
// get_user.php
require 'config.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare('SELECT username, email FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if ($user) {
    echo json_encode([
        'username' => $user['username'],
        'email' => $user['email']
    ]);
} else {
    http_response_code(404);
    echo json_encode(['message' => 'User not found']);
}
