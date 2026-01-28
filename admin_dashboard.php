<?php
include 'config.php';
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduTrack | Admin Control Center</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css?v=<?php echo time(); ?>">
    <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
    <style>
        :root {
            --admin-primary: #1e293b;
            --admin-accent: #3b82f6;
        }
        .admin-sidebar { background: var(--admin-primary) !important; }
        .nav-btn.active { background: var(--admin-accent) !important; color: white !important; }
        .nav-btn:hover { background: rgba(59, 130, 246, 0.1); color: var(--admin-accent); }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="admin-sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <img src="assets/img/amu-logo.png" alt="AMU Logo">
                    <span>AMU | Admin</span>
                </div>
            </div>
            <nav>
                <button class="nav-btn active" onclick="switchTab('overview', this)">
                    <ion-icon name="grid-outline"></ion-icon> Overview
                </button>
                <button class="nav-btn" onclick="switchTab('courses', this)">
                    <ion-icon name="book-outline"></ion-icon> Courses
                </button>
                <button class="nav-btn" onclick="switchTab('teachers', this)">
                    <ion-icon name="people-outline"></ion-icon> Teachers
                </button>
                <button class="nav-btn" onclick="switchTab('students', this)">
                    <ion-icon name="school-outline"></ion-icon> Students
                </button>
                <button class="nav-btn" onclick="switchTab('classes', this)">
                    <ion-icon name="business-outline"></ion-icon> Classes
                </button>
                <button class="nav-btn" onclick="switchTab('rollover', this)">
                    <ion-icon name="refresh-circle-outline"></ion-icon> Semester Rollover
                </button>
                <button class="nav-btn" onclick="switchTab('grade_scale', this)">
                    <ion-icon name="podium-outline"></ion-icon> Grade Scale
                </button>
            </nav>
            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="avatar"><?php echo strtoupper(substr($_SESSION['name'], 0, 1)); ?></div>
                    <div class="details">
                        <span class="name"><?php echo $_SESSION['name']; ?></span>
                        <span class="role">System Admin</span>
                    </div>
                    <button class="logout-btn" onclick="logout()">
                        <ion-icon name="log-out-outline"></ion-icon>
                    </button>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="top-bar">
                <div class="search-bar">
                    <ion-icon name="search-outline"></ion-icon>
                    <input type="text" placeholder="Search systems, logs, users...">
                </div>
                <div class="top-actions">
                    <div class="current-date" id="dateDisplay"></div>
                </div>
            </header>

            <div id="contentArea" class="content-scroll">
                <!-- Content will be loaded dynamically via JS -->
                 <div style="text-align:center; padding: 2rem;">Loading Admin Data...</div>
            </div>
        </main>
    </div>

    <!-- Modals (Add Course, Teacher, etc.) -->
    <div id="modalOverlay" class="modal-overlay hidden">
        <div class="modal" id="modalContent">
            <!-- Modal content injected by JS -->
        </div>
    </div>

    <script src="assets/js/admin_app.js?v=<?php echo time(); ?>"></script>
    <script>
        async function logout() {
            await fetch('api/auth.php?action=logout', {method:'POST'});
            window.location.href = 'index.php';
        }
    </script>
</body>
</html>
