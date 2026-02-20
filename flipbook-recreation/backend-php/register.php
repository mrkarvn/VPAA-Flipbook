
<?php
require 'config.php';
header('Content-Type: application/json');


function respond($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['message' => $msg]);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $username = $_POST['username'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        // Randomize profile picture from available images
        $profile_pics = ['chill.png','elephant.png','fish.png','fox.png','hippo.png','kang.png','squirel.png'];
        $profile_pic = $profile_pics[array_rand($profile_pics)];
        // Required fields
        if (!$username || !$email || !$password) {
            respond('Missing fields');
        }
        // Username must contain at least one letter
        if (!preg_match('/[A-Za-z]/', $username)) respond('Username must contain at least one letter.');
        // Username, email, and password must not start with a space
        if (preg_match('/^\s/', $username)) respond('Username must not start with a space.');
        if (preg_match('/^\s/', $email)) respond('Email must not start with a space.');
        if (preg_match('/^\s/', $password)) respond('Password must not start with a space.');
        // Username, email, and password must not contain double or more consecutive spaces
        if (preg_match('/  +/', $username)) respond('Username cannot contain consecutive spaces.');
        if (preg_match('/  +/', $email)) respond('Email cannot contain consecutive spaces.');
        if (preg_match('/  +/', $password)) respond('Password cannot contain consecutive spaces.');
        // Email cannot contain any spaces at all
        if (preg_match('/\s/', $email)) respond('Email cannot contain spaces.');
        // ...existing code...
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO users (username, email, password, profile_pic) VALUES (?, ?, ?, ?)');
        try {
            $stmt->execute([$username, $email, $hash, $profile_pic]);
            echo json_encode(['message' => 'User registered']);
        } catch (PDOException $e) {
            respond('User already exists');
        }
    } else {
        respond('Method not allowed', 405);
    }
} catch (Throwable $e) {
    respond('Server error', 500);
}
?>