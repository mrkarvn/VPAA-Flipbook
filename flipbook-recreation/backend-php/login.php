<?php
// login.php
require 'config.php';
header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing fields']);
            exit;
        }
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if ($user && password_verify($password, $user['password'])) {
            session_start();
            $_SESSION['user_id'] = $user['id'];
            echo json_encode(['message' => 'Login successful']);
        } else {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid credentials']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
}
?>
