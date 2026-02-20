<?php
// upload.php

require 'config.php';
session_start();
// Debug: log session contents
file_put_contents(__DIR__.'/upload_debug.txt', json_encode($_SESSION));

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'message' => 'Not authenticated',
        'session' => $_SESSION,
        'debug' => 'Session user_id missing. Make sure you are logged in.'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $user_id = $_SESSION['user_id'];
    $file = $_FILES['file'];
    $upload_dir = __DIR__ . '/uploads/';
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0777, true)) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create uploads directory', 'debug' => $upload_dir]);
            exit;
        }
    }
    if (!is_writable($upload_dir)) {
        http_response_code(500);
        echo json_encode(['message' => 'Uploads directory is not writable', 'debug' => $upload_dir]);
        exit;
    }
    $filename = uniqid() . '_' . basename($file['name']);
    $filepath = $upload_dir . $filename;
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        // Save the flipbook info to DB, including file size
        $file_size = filesize($filepath);
        try {
            $stmt = $pdo->prepare('INSERT INTO flipbooks (user_id, filename, filepath, file_size) VALUES (?, ?, ?, ?)');
            $stmt->execute([$user_id, $file['name'], $filename, $file_size]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'DB insert failed', 'debug' => $e->getMessage()]);
            exit;
        }
        $id = $pdo->lastInsertId();
        $flipbook_link = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/flipbook-recreation/flipbook.html?id=' . $id;
        echo json_encode(['message' => 'Upload successful', 'link' => $flipbook_link]);
    } else {
        http_response_code(500);
        echo json_encode([
            'message' => 'Upload failed',
            'debug' => [
                'tmp_name' => $file['tmp_name'],
                'filepath' => $filepath,
                'error' => $file['error'],
                'is_writable_upload_dir' => is_writable($upload_dir)
            ]
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}
?>
