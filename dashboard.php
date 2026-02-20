<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - PDF Flipbook</title>
    <link rel="stylesheet" href="flipbook-recreation/css/style.css">
    <!-- FontAwesome removed to prevent 403 error -->
    <style>
        body {
            background: none;
            min-height: 100vh;
            margin: 0;
        }
        .dashboard-container {
            width: 100vw;
            min-height: 100vh;
            margin: 0;
            background: none;
            border-radius: 0;
            box-shadow: none;
            padding: 36px 32px 32px 32px;
        }
        .dashboard-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
        }
        .dashboard-header h2 {
            color: #1976d2;
            margin: 0;
        }
        .dashboard-header .logout-btn {
            background: linear-gradient(135deg, #1976d2 0%, #3f51b5 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 18px;
            font-size: 15px;
            cursor: pointer;
        }
        .dashboard-header .logout-btn:hover {
            background: linear-gradient(135deg, #2980b9 0%, #4a5bbe 100%);
        }
        .upload-btn {
            background: linear-gradient(135deg, #1976d2 0%, #3f51b5 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 14px 28px;
            font-size: 17px;
            cursor: pointer;
            margin-bottom: 24px;
            transition: background 0.2s;
        }
        .upload-btn:hover {
            background: linear-gradient(135deg, #2980b9 0%, #4a5bbe 100%);
        }
        .flipbook-list {
            margin-top: 18px;
        }
        .flipbook-item {
            background: #f5faff;
            border: 1px solid #e3eafc;
            border-radius: 10px;
            padding: 18px 18px 12px 18px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .flipbook-btn-group {
            display: flex;
            gap: 8px;
        }
        .edit-btn {
            background: #ffa726;
            color: #fff;
            border: none;
            padding: 6px 14px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .edit-btn:hover {
            background: #fb8c00;
        }
      
    
        .flipbook-link {
            color: #1976d2;
            text-decoration: underline;
            font-size: 16px;
            margin-right: 18px;
        }
        .copy-btn {
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 7px 14px;
            font-size: 14px;
            cursor: pointer;
        }
        .copy-btn:hover {
            background: #125ea7;
        }
    </style>
</head>
<body>
    <div class="admin-dashboard-layout">
        <aside class="sidebar">
                        <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar">
                            <span></span><span></span><span></span>
                        </button>
            <div class="sidebar-profile">
                <img src="flipbook-recreation/assets/default-profile.png" alt="Profile" class="sidebar-profile-pic" id="sidebar-profile-pic">
                <div class="sidebar-profile-info">
                    <div class="sidebar-profile-name" id="sidebar-profile-name">John Doe</div>
                    <div class="sidebar-profile-email" id="sidebar-profile-email">john.doe@email.com</div>
                </div>
            </div>
            <nav class="sidebar-nav">
                <a href="#" class="sidebar-link active"><span class="sidebar-icon">📊</span><span>Dashboard</span></a>
                <a href="#" class="sidebar-link" id="edit-profile-link"><span class="sidebar-icon">👤</span><span>Edit Profile</span></a>
                <a href="#" class="sidebar-link" onclick="logout()"><span class="sidebar-icon">🚪</span><span>Logout</span></a>
            </nav>
        </aside>
        <main class="dashboard-main">
            <div class="dashboard-header">
                <h2>Welcome, <span id="dashboard-username">User</span></h2>
            </div>
            <button class="upload-btn" onclick="goToUpload()"><i class="fas fa-upload"></i> Upload Here</button>
            <div class="flipbook-list" id="flipbook-list">
                <!-- User's uploaded flipbooks will be listed here -->
            </div>
        </main>
    </div>
    <link rel="stylesheet" href="flipbook-recreation/css/sidebar.css">

    <script>
                                // Fetch user info for sidebar
                                fetch('flipbook-recreation/backend-php/get_user.php', { credentials: 'include' })
                                    .then(res => res.json())
                                    .then(user => {
                                        if (user.username) {
                                            document.getElementById('sidebar-profile-name').textContent = user.username;
                                            document.getElementById('dashboard-username').textContent = user.username;
                                        }
                                        if (user.email) {
                                            document.getElementById('sidebar-profile-email').textContent = user.email;
                                        }
                                    });
                        // Highlight active sidebar link based on location
                        document.querySelectorAll('.sidebar-link').forEach(link => {
                            if (link.href && window.location.pathname.endsWith(link.getAttribute('href'))) {
                                link.classList.add('active');
                            }
                        });
                // Sidebar collapse for mobile
                const sidebar = document.querySelector('.sidebar');
                const sidebarToggle = document.getElementById('sidebar-toggle');
                sidebarToggle && sidebarToggle.addEventListener('click', function() {
                    sidebar.classList.toggle('collapsed');
                });
        function goToUpload() {
            window.location.href = './flipbook-recreation/index.php';
        }
        function logout() {
            // TODO: Clear session and redirect to login
            window.location.href = 'login.html';
        }
        // Fetch and render only the logged-in user's uploaded flipbooks from the backend
        const list = document.getElementById('flipbook-list');
        async function loadFlipbooks() {
            list.innerHTML = '<div style="text-align:center;color:#888;font-size:20px;margin-top:40px;">Loading...</div>';
            try {
                const res = await fetch('flipbook-recreation/backend-php/get_flipbooks.php', { credentials: 'include' });
                const data = await res.json();
                if (res.ok && data.flipbooks && data.flipbooks.length > 0) {
                    list.innerHTML = '';
                    data.flipbooks.forEach(fb => {
                        const item = document.createElement('div');
                        item.className = 'flipbook-item';
                        // Use the flipbook ID for sharing
                        const link = `flipbook-recreation/flipbook.html?id=${fb.id}`;
                        const absLink = window.location.origin + window.location.pathname.replace(/\/dashboard\.html$/, '') + '/' + link;
                        // Format created date
                        let createdDate = fb.created_at ? new Date(fb.created_at.replace(' ', 'T')) : null;
                        let createdStr = createdDate ? createdDate.toLocaleString() : 'N/A';
                        // Format file size
                        let sizeStr = 'N/A';
                        if (typeof fb.file_size === 'number' && fb.file_size !== null) {
                            if (fb.file_size < 1024 * 1024) {
                                sizeStr = (fb.file_size / 1024).toFixed(2) + ' KB';
                            } else {
                                sizeStr = (fb.file_size / (1024 * 1024)).toFixed(2) + ' MB';
                            }
                        }
                        item.innerHTML = `
                            <div style="flex:1;min-width:0;">
                                <a class="flipbook-link" href="${link}" target="_blank">${fb.filename}</a><br>
                                <span style="color:#555;font-size:13px;">Created: ${createdStr} &nbsp; | &nbsp; Size: ${sizeStr}</span>
                            </div>
                            <span class="flipbook-btn-group">
                                <button class="copy-btn">Copy Link</button>
                                <button class="edit-btn" style="background:#ffa726;color:#fff;border:none;padding:6px 14px;border-radius:5px;cursor:pointer;" data-id="${fb.id}">Edit</button>
                                <button class="delete-btn" style="background:#d32f2f;color:#fff;border:none;padding:6px 14px;border-radius:5px;cursor:pointer;" data-id="${fb.id}">Delete</button>
                            </span>
                        `;
                        // Add copy link event
                                                // Add edit event
                                                item.querySelector('.edit-btn').onclick = async function() {
                                                    const btn = this;
                                                    const currentName = fb.filename;
                                                    const newName = prompt('Edit flipbook name:', currentName);
                                                    if (!newName || newName.trim() === '' || newName === currentName) return;
                                                    btn.disabled = true;
                                                    btn.textContent = 'Saving...';
                                                    try {
                                                        const res = await fetch('flipbook-recreation/backend-php/edit_flipbook.php', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                                            credentials: 'include',
                                                            body: 'id=' + encodeURIComponent(fb.id) + '&name=' + encodeURIComponent(newName)
                                                        });
                                                        const result = await res.json();
                                                        if(result.success) {
                                                            item.querySelector('.flipbook-link').textContent = newName;
                                                            fb.filename = newName;
                                                        } else {
                                                            alert(result.message || 'Edit failed');
                                                        }
                                                    } catch (err) {
                                                        alert('Error editing flipbook name.');
                                                    }
                                                    btn.disabled = false;
                                                    btn.textContent = 'Edit';
                                                };
                        item.querySelector('.copy-btn').onclick = function() {
                            navigator.clipboard.writeText(absLink);
                            this.textContent = 'Copied!';
                            setTimeout(() => { this.textContent = 'Copy Link'; }, 1500);
                        };
                        // Add delete event
                        item.querySelector('.delete-btn').onclick = async function() {
                            if(confirm('Are you sure you want to delete this flipbook?')) {
                                const btn = this;
                                btn.disabled = true;
                                btn.textContent = 'Deleting...';
                                const res = await fetch('flipbook-recreation/backend-php/delete_flipbook.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                    credentials: 'include',
                                    body: 'id=' + encodeURIComponent(fb.id)
                                });
                                const result = await res.json();
                                if(result.success) {
                                    item.remove();
                                } else {
                                    alert(result.message || 'Delete failed');
                                    btn.disabled = false;
                                    btn.textContent = 'Delete';
                                }
                            }
                        };
                        list.appendChild(item);
                    });
                } else {
                    list.innerHTML = '<div style="text-align:center;color:#888;font-size:20px;margin-top:40px;">No flipbooks uploaded yet.<br>Upload a PDF to create your first flipbook!</div>';
                }
            } catch (err) {
                list.innerHTML = '<div style="text-align:center;color:#d32f2f;font-size:20px;margin-top:40px;">Error loading flipbooks.</div>';
                console.error('Error fetching flipbooks:', err);
            }
        }
        loadFlipbooks();
    </script>
</body>
</html>
