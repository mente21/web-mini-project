<?php
include 'config.php';
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'student') {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduTrack | Student Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css?v=<?php echo time(); ?>">
    <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
    <style>
        :root {
            --student-primary: #003366;
            --student-accent: #f59e0b;
        }
        .student-sidebar { background: var(--student-primary) !important; }
        .nav-btn.active { background: var(--student-accent) !important; color: #003366 !important; }
        .nav-btn:hover { background: rgba(245, 158, 11, 0.1); color: var(--student-accent); }
    </style>
</head>
<body>

    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="student-sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <img src="assets/img/amu-logo.png" alt="AMU Logo">
                    <span>AMU | Student</span>
                </div>
            </div>
            
            <nav>
                <button class="nav-btn active" onclick="switchTab('overview', this)">
                    <ion-icon name="apps-outline"></ion-icon> Overview
                </button>
                <button class="nav-btn" onclick="switchTab('enrollment', this)">
                    <ion-icon name="add-circle-outline"></ion-icon> Register Courses
                </button>
                <button class="nav-btn" onclick="switchTab('grade', this)">
                    <ion-icon name="trophy-outline"></ion-icon> Grade Report
                </button>
                <button class="nav-btn" onclick="switchTab('feedback', this)">
                    <ion-icon name="chatbubble-ellipses-outline"></ion-icon> Feedback
                </button>
            </nav>

            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="avatar" style="background: var(--student-accent); color: var(--student-primary);"><?php echo strtoupper(substr($_SESSION['name'], 0, 1)); ?></div>
                    <div class="details">
                        <span class="name"><?php echo $_SESSION['name']; ?></span>
                        <span class="role">Academic Track</span>
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
                    <input type="text" placeholder="Search grades, courses, campus news...">
                </div>
                <div class="top-actions">
                    <div class="current-date" id="dateDisplay"></div>
                </div>
            </header>

            <div id="contentArea" class="content-scroll">
                <!-- Content injected by JS -->
            </div>
        </main>
    </div>

    <!-- Attendance Scanner Modal -->
    <div id="scannerOverlay" class="modal-overlay hidden" style="background: rgba(0,0,0,0.9);">
        <div class="modal" id="modalContent" style="text-align: center; max-width: 500px;">
            <h2 style="margin-bottom: 0.5rem; color: var(--student-primary);">Scan Class QR</h2>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Position the teacher's QR code in the frame</p>
            
            <div id="reader" style="width: 100%; border-radius: 15px; overflow: hidden; background: #000;"></div>
            
            <div id="scannerStatus" style="margin-top: 1.5rem; padding: 10px; border-radius: 8px; display: none;"></div>
            
            <div class="modal-footer" style="margin-top: 2rem;">
                <button type="button" class="btn-modern secondary" onclick="stopScanner()">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Quick Action Fab -->
    <button onclick="startScanner()" style="position: fixed; bottom: 30px; right: 30px; width: 65px; height: 65px; border-radius: 50%; background: var(--student-accent); color: var(--student-primary); border: none; font-size: 1.8rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(245,158,11,0.4); cursor: pointer; z-index: 999; transition: all 0.3s;" onmouseover="this.style.transform='scale(1.1) rotate(15deg)'" onmouseout="this.style.transform='scale(1)'">
        <ion-icon name="qr-code-outline"></ion-icon>
    </button>

    <script src="assets/js/student_app.js?v=<?php echo time(); ?>"></script>
    <script>
        async function logout() {
            await fetch('api/auth.php?action=logout', {method:'POST'});
            window.location.href = 'index.php';
        }
    </script>
</body>
</html>
