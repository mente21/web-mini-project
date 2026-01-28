<?php
include 'config.php';
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'teacher') {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduTrack | Teacher Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css?v=<?php echo time(); ?>">
    <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <style>
        :root {
            --teacher-primary: #0f172a;
            --teacher-accent: #10b981;
        }
        .teacher-sidebar { background: var(--teacher-primary) !important; }
        .nav-btn.active { background: var(--teacher-accent) !important; color: white !important; }
        .nav-btn:hover { background: rgba(16, 185, 129, 0.1); color: var(--teacher-accent); }
    </style>
</head>
<body>

    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="teacher-sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <img src="assets/img/amu-logo.png" alt="AMU Logo">
                    <span>AMU | Instructor</span>
                </div>
            </div>
            
            <nav style="margin-top: 1.5rem;">
                <button class="nav-btn active" onclick="switchTab('overview', this)">
                    <ion-icon name="stats-chart-outline"></ion-icon> Insights
                </button>
                <button class="nav-btn" onclick="switchTab('classes', this)">
                    <ion-icon name="briefcase-outline"></ion-icon> My Classes
                </button>
                <button class="nav-btn" onclick="switchTab('assessments', this)">
                    <ion-icon name="clipboard-outline"></ion-icon> Assessments
                </button>
                <button class="nav-btn" onclick="switchTab('announcements', this)">
                    <ion-icon name="megaphone-outline"></ion-icon> Announcements
                </button>
                <button class="nav-btn" onclick="switchTab('attendance', this)">
                    <ion-icon name="qr-code-outline"></ion-icon> Attendance
                </button>
                <button class="nav-btn" onclick="switchTab('schedules', this)">
                    <ion-icon name="calendar-outline"></ion-icon> Class Schedule
                </button>
            </nav>

            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="avatar"><?php echo strtoupper(substr($_SESSION['name'], 0, 1)); ?></div>
                    <div class="details">
                        <span class="name"><?php echo htmlspecialchars($_SESSION['name']); ?></span>
                        <span class="role">Instructor</span>
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
                    <input type="text" placeholder="Search students, classes, records...">
                </div>
                <div class="top-actions">
                    <div class="current-date" id="dateDisplay" style="font-weight:700; color:var(--teacher-primary); background:white; padding:10px 20px; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05);"></div>
                </div>
            </header>
            
            <div id="contentArea" class="content-scroll">
                <div style="text-align:center; padding: 2rem;">Loading academic insights...</div>
            </div>
        </main>
    </div>

    <!-- Modals -->
    <div id="modalOverlay" class="modal-overlay hidden">
        <div class="modal" id="modalContent">
            <!-- Modal content injected by JS -->
        </div>
    </div>

    <!-- Live Attendance Modal -->
    <div id="liveAttendanceOverlay" class="modal-overlay hidden" style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px);">
        <div class="modal" style="width: 850px; max-width: 95%; text-align: center; border-radius: 24px; padding: 3rem; background: white; border: none; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <div style="margin-bottom: 2rem;">
                <h2 id="liveSessionTitle" style="color: var(--teacher-primary); font-size: 2rem; font-weight: 800;">Live Attendance</h2>
                <p id="liveSessionExpiry" style="color: var(--text-secondary);"></p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 3rem; align-items: start;">
                <div style="background: white; padding: 25px; border-radius: 24px; border: 2px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
                    <div id="qrcode" style="display: flex; justify-content: center;"></div>
                    <div style="margin-top: 1.5rem; padding: 10px; background: #f0fdf4; border-radius: 12px; color: #15803d; font-weight: 700; font-size: 0.9rem;">
                        <ion-icon name="scan-outline" style="vertical-align: middle;"></ion-icon> SCAN QR TO MARK PRESENT
                    </div>
                </div>
                
                <div style="text-align: left;">
                    <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 16px;">
                        <h3 style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ENROLLED STUDENTS</h3>
                        <div id="liveCount" style="font-size: 3.5rem; font-weight: 900; color: var(--teacher-primary); line-height: 1;">0</div>
                    </div>
                    <div style="max-height: 300px; overflow-y: auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 0.5rem;">
                        <table style="width: 100%; font-size: 0.85rem; border-collapse: separate; border-spacing: 0 8px;">
                            <tbody id="liveLog">
                                <!-- Student entries -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 3rem; display: flex; gap: 1rem; justify-content: center;">
                <button class="btn-modern secondary" onclick="closeLiveAttendance()" style="padding: 12px 30px;">
                    <ion-icon name="stop-circle-outline"></ion-icon> End Session
                </button>
                <button class="btn-modern primary" id="exportBtn" style="background: #10b981; border: none; padding: 12px 30px;">
                    <ion-icon name="download-outline"></ion-icon> Export Excel
                </button>
            </div>
        </div>
    </div>

    <script src="assets/js/teacher_app.js?v=<?php echo time(); ?>"></script>
    <script>
        async function logout() {
            await fetch('api/auth.php?action=logout', {method:'POST'});
            window.location.href = 'index.php';
        }
    </script>
</body>
</html>
