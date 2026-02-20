
<?php
require_once 'backend-php/config.php';
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: ../login.html');
    exit;
}
$uploadError = '';
$uploadSuccess = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $user_id = $_SESSION['user_id'];
    $file = $_FILES['file'];
    $upload_dir = __DIR__ . '/backend-php/uploads/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    if ($file['type'] !== 'application/pdf') {
        $uploadError = 'Only PDF files are allowed.';
    } elseif ($file['size'] > 100 * 1024 * 1024) {
        $uploadError = 'File size exceeds 100MB.';
    } else {
        $filename = uniqid() . '_' . basename($file['name']);
        $filepath = $upload_dir . $filename;
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            // Save to DB with file size
            $file_size = filesize($filepath);
            $stmt = $pdo->prepare('INSERT INTO flipbooks (user_id, filename, filepath, file_size) VALUES (?, ?, ?, ?)');
            $stmt->execute([$user_id, $file['name'], $filename, $file_size]);
            $uploadSuccess = 'PDF uploaded successful!';
        } else {
            $uploadError = 'Failed to upload file.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Flipbook Creator</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        .dashboard-left-btn {
            position: fixed;
            top: 24px;
            left: 32px;
            z-index: 1000;
            background: #fff;
            color: #1976d2;
            border: 2px solid #1976d2;
            padding: 12px 28px;
            border-radius: 8px;
            font-size: 17px;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(25, 118, 210, 0.10);
            font-weight: bold;
            transition: background 0.2s, color 0.2s;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .dashboard-left-btn:hover {
            background: #1976d2;
            color: #fff;
        }
        .dashboard-left-btn svg {
            width: 22px;
            height: 22px;
        }
        body {
            background-image: url('../flipbook-recreation/assets/geometric-blue.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
        }
    </style>
</head>
<body>
    <button class="dashboard-left-btn" onclick="window.location.href='../dashboard.html'">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h18v18H3V3z" />
        </svg>
        Dashboard
    </button>
    <!-- SLU Logo -->
    <img src="assets/SLU Logo - with stroke (1).png" alt="SLU Logo" class="slu-logo-fixed">
    <img src="assets/Corner.png" alt="Corner Decoration" class="corner-top-left">
    <img src="assets/Corner.png" alt="Corner Decoration" class="corner-bottom-right">
    <div class="container">
        <header>
            <h1>PDF Flipbook Creator</h1>
            <p>Transform your PDF into an interactive 3D flipbook</p>
        </header>
        <div class="upload-area">
            <?php if ($uploadSuccess && isset($filename)): ?>
                <div style="color: green; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    Success: <?= htmlspecialchars($uploadSuccess) ?>
                    <?php
                        // Get the last inserted flipbook ID for this user
                        $stmt = $pdo->prepare('SELECT id FROM flipbooks WHERE user_id = ? AND filepath = ? ORDER BY created_at DESC LIMIT 1');
                        $stmt->execute([$user_id, $filename]);
                        $row = $stmt->fetch();
                        $flipbookId = $row ? $row['id'] : null;
                        if ($flipbookId):
                            $flipbookUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/flipbook.html?id=' . $flipbookId;
                    ?>
                        <button id="goto-flipbook-btn" style="margin-left:10px; padding: 4px 12px; border-radius: 5px; border: 1px solid #1976d2; background: #1976d2; color: #fff; cursor: pointer;">Go to Flipbook</button>
                        <button id="copy-link-btn" style="padding: 4px 12px; border-radius: 5px; border: 1px solid #1976d2; background: #fff; color: #1976d2; cursor: pointer;">Copy Link</button>
                        <script>
                        document.getElementById('goto-flipbook-btn').onclick = function() {
                            window.location.href = 'flipbook.html?id=<?= $flipbookId ?>';
                        };
                        document.getElementById('copy-link-btn').onclick = function() {
                            navigator.clipboard.writeText('<?= $flipbookUrl ?>');
                            this.textContent = 'Copied!';
                            setTimeout(() => { this.textContent = 'Copy Link'; }, 1500);
                        };
                        </script>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
            <form method="post" enctype="multipart/form-data">
                <label for="pdf-file" class="upload-label">
                    <div class="upload-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                    <div class="upload-text">
                        <span class="primary-text" id="primary-text">Choose PDF file</span>
                        <span class="secondary-text" id="secondary-text">or drag and drop here</span>
                        <span class="file-name" id="file-name" style="display: none;"></span>
                    </div>
                    <input type="file" id="pdf-file" name="file" accept=".pdf" required>
                </label>
                <button type="submit" class="upload-btn" id="upload-btn">
                    <span class="btn-text">Create Flipbook</span>
                </button>
            </form>
        </div>
        <div class="instructions" id="instructions">
            <div class="instruction-item">
                <i class="fas fa-check-circle"></i>
                <span>Select a PDF file (max 100MB)</span>
            </div>
            <div class="instruction-item">
                <i class="fas fa-check-circle"></i>
                <span>The first page will be the cover</span>
            </div>
            <div class="instruction-item">
                <i class="fas fa-check-circle"></i>
                <span>Enjoy your interactive flipbook!</span>
            </div>
        </div>
    </div>
</body>
</html>
