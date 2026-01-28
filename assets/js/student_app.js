
let overviewPoller = null;

document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    loadOverview();
    discoverNearbySessions(); 

    // Auto-refresh dashboard for real-time attendance discovery
    overviewPoller = setInterval(() => {
        // Only refresh if not currently interacting with a modal
        if (!document.querySelector('.modal')) {
            loadOverview(true); // true = silent reload
        }
    }, 4000);
});

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <ion-icon name="${type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}"></ion-icon>
        </div>
        <div class="toast-content" style="font-size:0.9rem; font-weight:600;">${message}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function discoverNearbySessions() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`api/student.php?action=discover_sessions&latitude=${latitude}&longitude=${longitude}`);
        const sessions = await res.json();

        if (sessions.length > 0) {
            renderDiscoveryCard(sessions[0]); // Show the most relevant one
        }
    });
}

function renderDiscoveryCard(session) {
    const banner = document.createElement('div');
    banner.id = 'discoveryBanner';
    banner.style = `
        background: linear-gradient(135deg, var(--student-primary), #004d99);
        color: white;
        padding: 2rem;
        border-radius: 20px;
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 10px 30px rgba(0,51,102,0.2);
        animation: slideIn 0.5s ease;
    `;
    
    banner.innerHTML = `
        <div>
            <h2 style="color: var(--amu-gold); font-size: 1.5rem; margin-bottom: 0.5rem;">📍 Live Session Found!</h2>
            <p style="font-size: 1.1rem;"><strong>${session.subject}</strong> with ${session.teacher}</p>
            <p style="font-size: 0.85rem; opacity: 0.8; margin-top: 5px;">You are about ${session.distance}m away.</p>
        </div>
        <button onclick="checkInDiscovery(${session.session_id})" id="checkInBtn" style="
            background: var(--amu-gold);
            color: var(--student-primary);
            border: none;
            padding: 15px 30px;
            border-radius: 12px;
            font-weight: 800;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            ONE-TAP ATTENDANCE
        </button>
    `;
    
    contentArea.prepend(banner);
}

window.checkInDiscovery = async (sessionId) => {
    const btn = document.getElementById('checkInBtn');
    btn.innerText = '⌛ Processing...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const deviceToken = await getDeviceFingerprint();

        const res = await fetch('api/student.php?action=submit_discovery_attendance', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                session_id: sessionId,
                latitude,
                longitude,
                device_token: deviceToken
            })
        });
        const result = await res.json();

        if (result.status === 'success') {
            document.getElementById('discoveryBanner').innerHTML = `
                <div style="text-align:center; width: 100%;">
                    <h2 style="color: var(--amu-gold); font-size: 1.5rem;">✅ Attendance Verified!</h2>
                    <p>You are marked present for ${new Date().toLocaleTimeString()}</p>
                </div>
            `;
            setTimeout(() => {
                document.getElementById('discoveryBanner').remove();
                loadOverview();
            }, 3000);
        } else {
            alert(result.message);
            btn.innerText = 'ONE-TAP ATTENDANCE';
            btn.disabled = false;
        }
    });
};

const contentArea = document.getElementById('contentArea');

async function loadOverview(silent = false) {
    if (!silent) contentArea.innerHTML = '<div style="text-align:center; padding:2rem;">Loading Data...</div>';
    
    try {
        const res = await fetch('api/student.php?action=overview');
        const data = await res.json();
        if (data.status === 'error') throw new Error(data.message);
        renderOverview(data);
    } catch (err) {
        if (!silent) contentArea.innerHTML = `<div style="text-align:center; color:red; padding:2rem;">Failed to load data: ${err.message}</div>`;
    }
}

function renderOverview(data = {}) {
    const { student = {}, courses = [], gpa = 0.00, attendance = { present: 0, absent: 0, late: 0 }, announcements = [], active_session = null } = data;
    
    console.log('Student Dashboard Data:', data);
    console.log('Active Session:', active_session);
    
    if (active_session) {
        console.log('✅ ACTIVE SESSION DETECTED! Token:', active_session.token);
    } else {
        console.log('❌ No active session found');
    }

    contentArea.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 20px; margin-bottom: 30px; display: flex; align-items: center; gap: 20px; border: 1px solid #eef2f6; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--student-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800;">
                ${(student.name || 'S').charAt(0)}
            </div>
            <div style="flex:1;">
                <h2 style="margin: 0; color: var(--student-primary); font-size: 1.2rem;">Welcome back, ${student.name || 'Student'}!</h2>
                <div style="display: flex; gap: 15px; margin-top: 5px; font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">
                    <span><ion-icon name="id-card-outline" style="vertical-align: middle;"></ion-icon> ${student.school_id || 'N/A'}</span>
                    <span><ion-icon name="school-outline" style="vertical-align: middle;"></ion-icon> ${student.department || 'N/A'}</span>
                    <span><ion-icon name="trending-up-outline" style="vertical-align: middle;"></ion-icon> Year ${student.grade_level || 'N/A'}</span>
                </div>
            </div>
            ${data.active_session ? `
                <button id="oneTapBtn" onclick="submitOneTapAttendance('${data.active_session.token}')" style="background:linear-gradient(45deg, #10b981, #059669); color:white; border:none; padding:15px 25px; border-radius:15px; font-weight:900; cursor:pointer; display:flex; align-items:center; gap:10px; animation: bounce 1s infinite alternate; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);">
                    <ion-icon name="radio-outline" style="font-size:1.5rem;"></ion-icon>
                    CONFIRM ATTENDANCE (${data.active_session.course_code})
                </button>
            ` : ''}
        </div>

        <div class="stats-grid">
            <div class="card stat-card" style="border-left: 5px solid var(--amu-gold);">
                <h3>Semester GPA</h3>
                <div class="value" style="color:var(--student-primary)">
                    ${data.is_gpa_ready ? gpa.toFixed(2) : '<span style="font-size:1.1rem; color:#94a3b8;">PENDING*</span>'}
                </div>
                ${!data.is_gpa_ready ? '<p style="font-size:0.7rem; color:#94a3b8; margin-top:5px;">* Waiting for all course marks</p>' : ''}
            </div>
            <div class="card stat-card" style="border-left: 5px solid #10b981;">
                <h3>Class Attendance</h3>
                <div class="value">${attendance.present || 0} <small style="font-size:0.8rem; color:var(--text-secondary)">Sessions Recorded</small></div>
            </div>
        </div>

        <div style="margin-top:2.5rem; display:grid; grid-template-columns: 2fr 1fr; gap:2rem;">
            <!-- Left Side: Announcements -->
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3 style="color:var(--student-primary); font-weight:800; font-size:1.3rem;">📢 Announcements</h3>
                </div>
                <div style="display:flex; flex-direction:column; gap:1rem;">
                    ${announcements.length > 0 ? announcements.map(a => `
                        <div class="card" style="padding:1.5rem; border-radius:16px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                                <span class="badge" style="background:#f1f5f9; color:var(--student-primary); font-weight:700; font-size:0.7rem;">
                                    ${a.course_code ? a.course_code : 'GENERAL BROADCAST'}
                                </span>
                                <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:600;">
                                    ${new Date(a.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p style="font-weight:600; color:#334155; line-height:1.5;">${a.content}</p>
                            <div style="margin-top:12px; display:flex; align-items:center; gap:8px;">
                                <div style="width:24px; height:24px; border-radius:50%; background:var(--amu-gold); color:var(--student-primary); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:900;">
                                    ${a.teacher_name.charAt(0)}
                                </div>
                                <span style="font-size:0.8rem; font-weight:700; color:var(--text-secondary);">Instr. ${a.teacher_name}</span>
                            </div>
                        </div>
                    `).join('') : `
                        <div style="text-align:center; padding:3rem; background:#f8fafc; border-radius:16px; border:2px dashed #e2e8f0; color:#94a3b8;">
                            <ion-icon name="notifications-off-outline" style="font-size:2rem; margin-bottom:10px;"></ion-icon>
                            <p style="font-weight:600;">No recent announcements.</p>
                        </div>
                    `}
                </div>
            </div>

            <!-- Right Side: Vertical Column (Attendance + Resources) -->
            <div style="display:flex; flex-direction:column; gap:2rem;">
                <div class="card" style="padding:1.5rem;">
                    <h3 style="font-size:1.1rem; margin-bottom:1.5rem;">📅 Attendance Summary</h3>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #f1f5f9;">
                        <span style="color:var(--text-secondary); font-weight:500;">Present</span>
                        <span style="color:var(--success); font-weight:800;">${attendance.present || 0}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:var(--text-secondary); font-weight:500;">Absent</span>
                        <span style="color:var(--danger); font-weight:800;">${attendance.absent || 0}</span>
                    </div>
                </div>

                <div class="card" style="background:linear-gradient(135deg, var(--student-primary), #1e3a8a); color:white; border:none; padding:1.5rem;">
                    <h4 style="color: var(--amu-gold); margin-bottom:1.2rem;">Campus Resources</h4>
                    <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:12px;">
                        <li style="display:flex; align-items:center; gap:8px; font-size:0.85rem; opacity:0.9;">
                            <ion-icon name="document-text" style="font-size:1.1rem; color:var(--amu-gold)"></ion-icon> Semester Syllabus
                        </li>
                        <li style="display:flex; align-items:center; gap:8px; font-size:0.85rem; opacity:0.9;">
                            <ion-icon name="calendar" style="font-size:1.1rem; color:var(--amu-gold)"></ion-icon> Final Exam Schedule
                        </li>
                    </ul>
                </div>

                <!-- Weekly Timetable Card -->
                <div class="card" style="padding:1.5rem;">
                    <h3 style="font-size:1.1rem; margin-bottom:1.5rem; color:var(--student-primary); font-weight:800;">🗓️ Weekly Timetable</h3>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${data.schedules && data.schedules.length > 0 ? data.schedules.map(s => `
                            <div style="padding:10px; border-radius:10px; background:#f8fafc; border:1px solid #f1f5f9;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                    <span style="font-size:0.7rem; font-weight:800; color:var(--amu-gold); text-transform:uppercase;">${s.day_of_week}</span>
                                    <span style="font-size:0.7rem; font-weight:700; color:#64748b;">${s.start_time.substring(0,5)} - ${s.end_time.substring(0,5)}</span>
                                </div>
                                <div style="font-weight:700; color:var(--student-primary); font-size:0.85rem;">${s.course_code} (${s.section_name})</div>
                                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;"><ion-icon name="location-outline"></ion-icon> ${s.room || 'TBA'}</div>
                            </div>
                        `).join('') : '<p style="text-align:center; color:#94a3b8; font-size:0.8rem; padding:10px;">No classes scheduled yet.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateDate() {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').textContent = new Date().toLocaleDateString(undefined, opts);
}

function switchTab(tabName, btn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadTab(tabName);
}

async function loadTab(tabName) {
    contentArea.innerHTML = '<div style="text-align:center; padding:5rem;"><p style="margin-top:1rem; color:var(--text-secondary);">Syncing records...</p></div>';
    try {
        if (tabName === 'overview') {
            loadOverview();
        } else if (tabName === 'enrollment') {
            const res = await fetch('api/student.php?action=discover_classes');
            const data = await res.json();
            renderEnrollment(data);
        } else if (tabName === 'grade') {
            const res = await fetch('api/student.php?action=overview');
            const data = await res.json();
            renderGradeReport(data);
        } else if (tabName === 'feedback') {
            renderFeedback();
        }
    } catch (err) {
        contentArea.innerHTML = '<div style="text-align:center; color:red; padding:2rem;">Failed to load data or network error.</div>';
    }
}

function renderGradeReport(data) {
    const courses = data.courses || [];
    const gpa = data.gpa || 0.00;

    contentArea.innerHTML = `
        <div style="background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 20px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                <div>
                    <h3 style="margin:0; color:var(--student-primary); font-size:1.1rem; font-weight:800;">Academic Grade Report</h3>
                    <p style="margin:5px 0 0; color:var(--text-secondary); font-size:0.85rem;">Official semester results scaled by university metrics.</p>
                </div>
                <button class="btn-primary" onclick="loadTab('grade')" style="background: linear-gradient(135deg, var(--student-primary), #1e3a8a); color:white; padding:12px 25px; border-radius:12px; font-weight:700; border:none; box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.3);">
                    <ion-icon name="refresh-outline" style="vertical-align:middle; margin-right:5px;"></ion-icon> Update Records
                </button>
            </div>
        </div>

        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:20px; overflow:hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); margin-bottom: 30px;">
            <div style="padding:20px 25px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:900; color:var(--student-primary); font-size:1.1rem; letter-spacing:0.5px; text-transform:uppercase;">OFFICIAL ACADEMIC REPORT</span>
                <span class="badge" style="background:${data.is_gpa_ready ? 'var(--amu-gold)' : '#f1f5f9'}; color:${data.is_gpa_ready ? 'var(--student-primary)' : '#64748b'}; font-weight:800; padding:6px 15px; border-radius:30px;">
                    ${data.is_gpa_ready ? 'SEMESTER GPA: ' + gpa.toFixed(2) : 'RESULTS PENDING'}
                </span>
            </div>

            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse: collapse; font-size:0.9rem;">
                    <thead>
                        <tr style="text-align:left; background:#fff; border-bottom:2px solid #f1f5f9;">
                            <th style="padding:20px 25px; width:60px; color:#64748b; font-size:0.75rem; font-weight:800; text-transform:uppercase;">#</th>
                            <th style="padding:20px 25px; width:150px; color:#64748b; font-size:0.75rem; font-weight:800; text-transform:uppercase;">Code</th>
                            <th style="padding:20px 25px; color:#64748b; font-size:0.75rem; font-weight:800; text-transform:uppercase;">Course Title</th>
                            <th style="padding:20px 25px; text-align:center; color:#64748b; font-size:0.75rem; font-weight:800; text-transform:uppercase; width:80px;">CR</th>
                            <th style="padding:20px 25px; text-align:center; color:#64748b; font-size:0.75rem; font-weight:800; text-transform:uppercase; width:80px;">Grade</th>
                            <th style="padding:20px 25px; text-align:center; color:#64748b; font-size:0.75rem; font-weight:800; text-transform:uppercase; width:100px;">Point</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${courses.length > 0 ? courses.map((c, i) => {
                            const gradeColor = c.grade.includes('A') ? '#10b981' : (c.grade.includes('B') ? '#3b82f6' : (c.grade === 'F' ? '#ef4444' : '#f59e0b'));
                            return `
                            <tr style="border-bottom:1px solid #f1f5f9; transition: background 0.2s; cursor:pointer;" onclick="this.nextElementSibling.classList.toggle('hidden')">
                                <td style="padding:20px 25px; font-weight:600; color:#94a3b8;">${i+1}</td>
                                <td style="padding:20px 25px; font-weight:800; color:var(--student-primary);">${c.course_code}</td>
                                <td style="padding:20px 25px; font-weight:600;">${c.course_title}</td>
                                <td style="padding:20px 25px; text-align:center; font-weight:700;">${c.credit_hours}</td>
                                <td style="padding:20px 25px; text-align:center;">
                                    <span style="display:inline-block; min-width:40px; background:${gradeColor}15; color:${gradeColor}; padding:6px; border-radius:8px; font-weight:900;">${c.grade}</span>
                                </td>
                                <td style="padding:20px 25px; text-align:center; font-weight:900; color:var(--student-primary);">${c.grade_point.toFixed(2)}</td>
                            </tr>
                            <tr class="hidden" style="background:#fcfcfc;">
                                <td colspan="6" style="padding:30px; border-bottom:1px solid #f1f5f9;">
                                    <div style="background:#fff; border:1px solid #e2e8f0; padding:20px; border-radius:15px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                                            <div style="display:flex; align-items:center; gap:10px;">
                                                <ion-icon name="person-circle-outline" style="font-size:1.5rem; color:var(--amu-gold)"></ion-icon>
                                                <span style="font-weight:700; color:var(--student-primary);">Instructor: ${c.teacher_name || 'Staff'}</span>
                                            </div>
                                            <span style="font-size:0.8rem; color:#94a3b8; font-weight:600;">Breakdown</span>
                                        </div>
                                        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:15px;">
                                            ${c.breakdown.map(g => `
                                                <div style="background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #f1f5f9;">
                                                    <div style="font-size:0.7rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:4px;">${g.title}</div>
                                                    <div style="font-weight:900; color:var(--student-primary); font-size:1.1rem;">${g.score} <small style="font-size:0.75rem; color:#94a3b8;">/ ${g.max}</small></div>
                                                </div>
                                            `).join('')}
                                            <div style="background:var(--student-primary); padding:12px; border-radius:10px; color:white; text-align:center;">
                                                <div style="font-size:0.7rem; font-weight:700; opacity:0.8;">FINAL</div>
                                                <div style="font-weight:900; font-size:1.4rem;">${c.total_score.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `;}).join('') : `<tr><td colspan="6" style="text-align:center; padding:100px 50px;">No academic records found.</td></tr>`}
                        <tr style="background:#f8fafc; border-top:2px solid #f1f5f9;">
                            <td colspan="3" style="padding:20px 25px; text-align:right; font-weight:900; color:var(--student-primary);">Total Credit Hours</td>
                            <td style="padding:20px 25px; text-align:center; font-weight:900; color:var(--student-primary); font-size:1.1rem; background:white;">${courses.reduce((sum, c) => sum + parseInt(c.credit_hours), 0)}</td>
                            <td colspan="2" style="padding:20px 25px; text-align:right; font-weight:900; color:var(--student-primary);">
                                GPA: ${data.is_gpa_ready ? gpa.toFixed(2) : 'PENDING'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
            <div class="card" style="padding:20px;">
                <h3 style="margin:0; font-size:0.95rem; font-weight:800; color:var(--student-primary);">Semester Progress</h3>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <span style="font-weight:700; color:#64748b; font-size:0.85rem;">Enrolled Load</span>
                    <span style="font-weight:900; color:var(--student-primary); font-size:1.5rem;">${courses.length} Courses</span>
                </div>
            </div>
            <div style="background: linear-gradient(135deg, var(--student-primary), #1e3a8a); padding:20px; border-radius:20px; color:white;">
                <h3 style="margin:0; font-size:0.95rem; font-weight:800; color:white;">Academic Status</h3>
                <div style="font-size:1.1rem; font-weight:800; color:var(--amu-gold); margin-top:10px;">ACTIVE & STANDING</div>
            </div>
        </div>
    `;
}

function renderEnrollment(classes) {
    contentArea.innerHTML = `
        <div class="card" style="margin-bottom:2rem; background: var(--student-primary); color:white;">
            <h2>Register for Courses</h2>
            <p>Select a course to enroll. If a section is full, the "Antigravity" engine will automatically assign you to the next available one.</p>
        </div>
        <div class="stats-grid" id="courseList">
            ${classes.map(c => {
                const isFull = c.current_enrollment >= c.max_students;
                return `
                <div class="card" style="${isFull ? 'opacity: 0.8; border-color: #fee2e2;' : ''}">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h3 style="color:var(--student-primary)">${c.course_code}</h3>
                        ${isFull ? '<span style="background:#fee2e2; color:#ef4444; padding:2px 8px; border-radius:6px; font-size:0.7rem; font-weight:700;">FULL</span>' : ''}
                    </div>
                    <p><strong>${c.course_title}</strong></p>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:5px;">Instructor: ${c.teacher_name}</p>
                    <div style="margin-top:1rem; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.8rem; font-weight:600; color:${isFull ? '#ef4444' : '#15803d'}">
                            Seats: ${c.current_enrollment} / ${c.max_students}
                        </span>
                        <button class="btn-primary" 
                            onclick="${isFull ? 'showToast(\'This course section is full\', \'error\')' : `enrollInCourse(${c.course_id})`}" 
                            style="font-size:0.75rem; padding: 10px 15px; border-radius: 10px; background:${isFull ? '#94a3b8' : ''}; cursor:${isFull ? 'not-allowed' : 'pointer'}">
                            ${isFull ? 'Unavailable' : 'Enroll Now'}
                        </button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;
}

async function enrollInCourse(courseId) {
    const res = await fetch('api/student.php?action=enroll', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ course_id: courseId })
    });
    const result = await res.json();
    alert(result.message);
    loadTab('enrollment');
}

function renderFeedback() {
    contentArea.innerHTML = `
        <div class="card" style="max-width:600px; margin: 0 auto;">
            <h2>Feedback & Complaints</h2>
            <p style="color:var(--text-secondary); margin-bottom:1.5rem;">Have an issue with your grades or portal? Submit it here.</p>
            <form id="complaintForm">
                <input type="text" name="subject" placeholder="Subject (e.g. Grade Discrepancy)" required style="width:100%; margin-bottom:10px; padding:12px; border:1px solid #ddd; border-radius:8px;">
                <textarea name="message" placeholder="Describe your issue in detail..." required style="width:100%; margin-bottom:15px; padding:12px; border:1px solid #ddd; border-radius:8px; height:120px;"></textarea>
                <button type="submit" class="btn-primary" style="width:100%;">Submit Complaint</button>
            </form>
        </div>
    `;
    
    document.getElementById('complaintForm').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const res = await fetch('api/student.php?action=submit_complaint', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (await res.json()) {
            alert("Complaint submitted successfully.");
            loadTab('overview');
        }
    };
}

// --- Smart Attendance (QR + Location) ---
// --- Smart Attendance (GPS Verification) ---

async function getDeviceFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        let renderer = 'unknown';
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
        }
        const finger = [
            navigator.userAgent,
            screen.width + 'x' + screen.height,
            navigator.language,
            renderer,
            new Date().getTimezoneOffset()
        ].join('|');
        
        let hash = 0;
        for (let i = 0; i < finger.length; i++) {
            hash = ((hash << 5) - hash) + finger.charCodeAt(i);
            hash |= 0;
        }
        return 'amu_dev_' + Math.abs(hash).toString(16);
    } catch (e) {
        return 'amu_dev_fallback';
    }
}

/* Legacy QR Code Functions - Deprecated in favor of One-Tap GPS
async function onScanSuccess(decodedText) {
    // 1. Pause scanner
    await html5QrCode.pause();
    
    // 2. Show status
    const statusDiv = document.getElementById('scannerStatus');
    statusDiv.style.display = 'block';
    statusDiv.style.background = '#e0f2fe';
    statusDiv.style.color = '#0369a1';
    statusDiv.innerHTML = '🔄 Verifying location & device...';

    // 3. Get GPS
    if (!navigator.geolocation) {
        showError("GPS required for attendance.");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const deviceToken = await getDeviceFingerprint();
        
        try {
            const res = await fetch('api/student.php?action=submit_attendance', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    token: decodedText,
                    latitude: latitude,
                    longitude: longitude,
                    device_token: deviceToken
                })
            });
            const result = await res.json();

            if (result.status === 'success') {
                statusDiv.style.background = '#dcfce7';
                statusDiv.style.color = '#15803d';
                statusDiv.innerHTML = `✅ ${result.message}`;
                setTimeout(() => {
                    stopScanner();
                    loadOverview();
                }, 2000);
            } else {
                showError(result.message);
                setTimeout(() => html5QrCode.resume(), 3000);
            }
        } catch (err) {
            showError("Network error.");
            html5QrCode.resume();
        }
    }, (err) => {
        showError("Location access denied.");
        html5QrCode.resume();
    });
}

function showError(msg) {
    const statusDiv = document.getElementById('scannerStatus');
    statusDiv.style.display = 'block';
    statusDiv.style.background = '#fee2e2';
    statusDiv.style.color = '#b91c1c';
    statusDiv.innerHTML = `⚠️ ${msg}`;
}

window.stopScanner = async () => {
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
        } catch(e) {}
    }
    document.getElementById('scannerOverlay').classList.add('hidden');
};
*/

async function submitOneTapAttendance(sessionToken) {
    const btn = document.getElementById('oneTapBtn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> VERIFYING...';
    if (!navigator.geolocation) {
        showToast("GPS Required", "error");
        btn.disabled = false;
        return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const deviceToken = await getDeviceFingerprint();
        try {
            const res = await fetch('api/student.php?action=submit_attendance', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ token: sessionToken, latitude: latitude, longitude: longitude, device_token: deviceToken })
            });
            const result = await res.json();
            if (result.status === 'success') {
                btn.style.background = '#059669';
                btn.innerHTML = '✅ VERIFIED';
                showToast("Attendance Recorded!", "success");
                setTimeout(() => loadOverview(), 2000);
            } else {
                showToast(result.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'RETRY';
            }
        } catch (err) {
            showToast("Network error.", "error");
            btn.disabled = false;
        }
    }, (err) => {
        showToast("GPS access denied.", "error");
        btn.disabled = false;
    });
}

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    toast.innerHTML = `<div class="toast-content" style="padding:15px 25px; border-radius:12px; font-weight:800; background:white; color:#1e293b; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); border-left:5px solid ${type === 'success' ? '#10b981' : '#ef4444'}; position:fixed; bottom:20px; right:20px; z-index:9999;">${msg}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
