/**
 * EduTrack Teacher Dashboard Logic
 * Handles Class Management, Grading, Attendance, and Announcements
 */

document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    loadTab('overview');
});

const contentArea = document.getElementById('contentArea');
const modalOverlay = document.getElementById('modalOverlay');

function updateDate() {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const display = document.getElementById('dateDisplay');
    if (display) display.textContent = new Date().toLocaleDateString(undefined, opts);
}

function switchTab(tabName, btn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadTab(tabName);
}

async function loadTab(tabName) {
    contentArea.innerHTML = '<div style="text-align:center; padding:2rem;">Loading Data...</div>';
    try {
        const res = await fetch(`api/teacher.php?action=${tabName}`);
        const data = await res.json();
        
        switch(tabName) {
            case 'overview': renderOverview(data); break;
            case 'classes': renderClasses(data); break;
            case 'assessments': renderAssessments(data); break;
            case 'announcements': renderAnnouncements(data); break;
            case 'attendance': renderAttendance(); break;
            case 'schedules': renderSchedules(data); break;
        }
    } catch (err) {
        contentArea.innerHTML = '<div style="text-align:center; color:red; padding:2rem;">Failed to load tab data.</div>';
    }
}

// --- RENDER FUNCTIONS ---

async function renderAssessments(data) {
    const res = await fetch('api/teacher.php?action=classes');
    const classes = await res.json();

    const uniqueCourses = [];
    const courseIds = new Set();
    classes.forEach(c => {
        if (!courseIds.has(c.course_id)) {
            courseIds.add(c.course_id);
            uniqueCourses.push(c);
        }
    });

    contentArea.innerHTML = `
        <div style="margin-bottom:2.5rem;">
            <h2 style="font-size:2rem; color:var(--teacher-primary);">Academic Strategy</h2>
            <p style="color:var(--text-secondary); font-size:1.1rem;">Define your unified course assessment plans here.</p>
        </div>

        <div style="display:grid; grid-template-columns: 1fr; gap:2rem;">
            <div class="card" style="padding:2rem;">
                <div style="max-width:500px;">
                    <h3 style="margin-bottom:1rem; font-size:1.1rem;">Initialize Course Plan</h3>
                    <select id="courseSelector" onchange="loadCourseAssessmentBuilder(this.value)" 
                        style="width:100%; padding:15px; border-radius:12px; border:2px solid #e2e8f0; font-weight:700; font-size:1rem; outline:none; background:var(--bg-secondary); color:var(--teacher-primary);">
                        <option value="">-- Choose Course to Configure --</option>
                        ${uniqueCourses.map(c => `<option value="${c.course_id}">${c.course_code} - ${c.course_title}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div id="builderArea" style="min-height:200px;"></div>
        </div>
    `;
}

async function loadCourseAssessmentBuilder(courseId) {
    if (!courseId) {
        document.getElementById('builderArea').innerHTML = `
            <div style="text-align:center; padding:3rem; border:2px dashed #e2e8f0; border-radius:20px; color:#94a3b8;">
                <ion-icon name="clipboard-outline" style="font-size:3rem; margin-bottom:1rem;"></ion-icon>
                <p>Select a course above to start building your assessment plan.</p>
            </div>
        `;
        return;
    }

    const res = await fetch(`api/teacher.php?action=assessments&course_id=${courseId}`);
    const currentAssessments = await res.json();

    const builderArea = document.getElementById('builderArea');
    builderArea.innerHTML = `
        <div class="card" style="animation: slideIn 0.3s ease-out; border-top: 5px solid var(--amu-gold);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid #f1f5f9; padding-bottom:15px;">
                <div>
                    <h3 style="color:var(--teacher-primary);">Unified Assessment Schema</h3>
                    <p style="font-size:0.75rem; color:#94a3b8;">This plan will be shared across all your sections for this course.</p>
                </div>
                <button class="btn-primary" onclick="addAssessmentRow()" style="font-size:0.8rem; background:#f1f5f9; color:var(--teacher-primary); border:1px solid #e2e8f0;">+ Add New Row</button>
            </div>
            
            <div id="assessmentRows" style="display:flex; flex-direction:column; gap:15px; margin-bottom:25px;">
                ${currentAssessments.length > 0 ? currentAssessments.map((a, i) => renderStaticAssessmentRow(a, i)).join('') : ''}
            </div>

            ${currentAssessments.length === 0 ? '<p id="emptyState" style="text-align:center; color:#94a3b8; padding:30px; background:#f8fafc; border-radius:15px;">No assessments defined yet. Click "+ Add New Row" to start.</p>' : ''}

            <div style="display:flex; justify-content:flex-end; gap:10px; padding-top:20px; border-top:1px solid #f1f5f9;">
                <button class="btn-primary" onclick="saveCourseAssessments(${courseId})" style="padding:15px 30px; font-weight:800; background:linear-gradient(135deg, var(--teacher-primary), var(--amu-blue));">Sync Assessment Plan</button>
            </div>
        </div>
    `;
}

async function saveCourseAssessments(courseId) {
    const rows = document.querySelectorAll('.assessment-row');
    const assessments = Array.from(rows).map(row => ({
        id: row.dataset.id,
        title: row.querySelector('.row-title').value,
        maxPoints: row.querySelector('.row-max').value
    }));

    if (assessments.some(a => !a.title || !a.maxPoints)) {
        alert("Please fill in all assessment titles and point values.");
        return;
    }

    const res = await fetch('api/teacher.php?action=save_class_assessments', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ course_id: courseId, assessments })
    });
    const result = await res.json();
    if (result.status === 'success') {
        showToast('Course assessment plan synchronized!');
        loadCourseAssessmentBuilder(courseId);
    }
}

function renderStaticAssessmentRow(a, index) {
    return `
        <div class="assessment-row" data-id="${a.id || ''}" style="display:grid; grid-template-columns: 1fr 120px 50px; gap:15px; align-items:center; background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">
            <div>
                <label style="font-size:0.7rem; font-weight:700; color:#64748b; text-transform:uppercase;">Title (e.g. Midterm)</label>
                <input type="text" class="row-title" value="${a.title}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; margin-top:5px;">
            </div>
            <div>
                <label style="font-size:0.7rem; font-weight:700; color:#64748b; text-transform:uppercase;">Max Pts</label>
                <input type="number" class="row-max" value="${a.max_points}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; margin-top:5px;">
            </div>
            <button class="btn-text" onclick="this.parentElement.remove()" style="color:red; font-size:1.2rem; margin-top:15px;">&times;</button>
        </div>
    `;
}

function addAssessmentRow() {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.remove();
    
    const container = document.getElementById('assessmentRows');
    const div = document.createElement('div');
    div.innerHTML = renderStaticAssessmentRow({title: '', max_points: 10}, container ? container.children.length : 0);
    if (container) container.appendChild(div.firstElementChild);
}

// --- RENDER FUNCTIONS ---

function renderOverview(data) {
    const { student_count, avg_score, top_students, low_attendance } = data;
    contentArea.innerHTML = `
        <div class="stats-grid">
            <div class="card stat-card"><h3>Total Students</h3><div class="value">${student_count}</div></div>
            <div class="card stat-card"><h3>Avg Class Score</h3><div class="value">${avg_score}%</div></div>
            <div class="card stat-card" style="border-left: 5px solid ${low_attendance.length > 0 ? '#ef4444' : '#10b981'}">
                <h3>Attendance Health</h3>
                <div class="value" style="color:${low_attendance.length > 0 ? '#ef4444' : '#10b981'}">
                    ${low_attendance.length > 0 ? 'Action Reqd' : 'Healthy'}
                </div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top:2rem;">
            <div class="card">
                <h3>🌟 Top Performers</h3>
                <table>
                    <tbody>
                        ${top_students.map((s, i) => `
                            <tr>
                                <td style="width:30px">#${i+1}</td>
                                <td><strong>${s.name}</strong></td>
                                <td style="text-align:right; font-weight:bold; color:var(--primary)">${s.total} pts</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="card" style="${low_attendance.length > 0 ? 'background: #fff5f5;' : ''}">
                <h3>⚠️ Attention Required</h3>
                <div style="margin-top:1rem;">
                    ${low_attendance.length === 0 ? '<p>All students meet requirements.</p>' : 
                    low_attendance.map(s => `
                        <div style="padding:10px; background:white; margin-bottom:8px; border-radius:8px; display:flex; justify-content:space-between;">
                            <div><strong>${s.name}</strong><br><small style="color:red">Attendance: ${s.percentage}%</small></div>
                            <button class="btn-primary" style="font-size:0.7rem; background:red;">Warn</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderClasses(classes) {
    contentArea.innerHTML = `
        <div style="margin-bottom:2rem;">
            <h2>My Assigned Classes</h2>
            <p style="color:var(--text-secondary)">Semester: Spring 2026</p>
        </div>
        <div class="stats-grid">
            ${classes.map(c => `
                <div class="card class-card" style="cursor:pointer" onclick="viewClassDetails(${c.id})">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h3 style="color:var(--amu-blue)">${c.course_code}</h3>
                            <p><strong>${c.course_title}</strong></p>
                        </div>
                        <span class="badge" style="background:#e0f2fe; color:#0369a1">${c.section_name}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        <div id="classDetailArea" style="margin-top:2rem;"></div>
    `;
}

async function viewClassDetails(classId) {
    const res = await fetch(`api/teacher.php?action=class_students&class_id=${classId}`);
    const students = await res.json();
    
    const assRes = await fetch(`api/teacher.php?action=assessments&class_id=${classId}`);
    const assessments = await assRes.json();
    
    const area = document.getElementById('classDetailArea');
    area.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1.5rem;">
                <div>
                    <h3 style="color:var(--teacher-primary);">Class Roster & Academic Management</h3>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">
                        <span style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Active Assessments:</span>
                        ${assessments.map(a => `<span class="badge" style="background:#e0fdf4; color:#15803d; border:1px solid #bcf1e2;">${a.title}</span>`).join('')}
                        ${assessments.length === 0 ? '<span style="font-size:0.75rem; color:red;">No assessments added.</span>' : ''}
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="position:relative;">
                        <ion-icon name="search-outline" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8;"></ion-icon>
                        <input type="text" placeholder="Search student..." onkeyup="filterRoster(this)" style="padding:10px 10px 10px 35px; border-radius:10px; border:1px solid #e2e8f0; font-size:0.9rem;">
                    </div>
                </div>
            </div>

            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:2px solid #f1f5f9; text-align:left;">
                            <th style="padding:15px 20px; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Student Name</th>
                            <th style="padding:15px 20px; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Registration ID</th>
                            <th style="padding:15px 20px; font-size:0.75rem; color:#64748b; text-transform:uppercase; text-align:right;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="rosterBody">
                        ${students.map(s => `
                            <tr class="roster-row" style="border-bottom:1px solid #f1f5f9; cursor:pointer;" onclick="openQuickGrade(${s.id}, ${classId}, '${s.name.replace(/'/g, "\\'")}')" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                                <td style="padding:15px 20px;">
                                    <div style="font-weight:700; color:var(--teacher-primary);">${s.name}</div>
                                    <div style="font-size:0.75rem; color:#94a3b8;">${s.email}</div>
                                </td>
                                <td style="padding:15px 20px; font-family:monospace; font-weight:600; color:#64748b;">${s.school_id || 'NSR/000/26'}</td>
                                <td style="padding:15px 20px; text-align:right;">
                                    <span style="font-size:0.8rem; color:var(--amu-blue); font-weight:700;">Click to Grade &rarr;</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="quickGradeStation" style="margin-top:20px;"></div>
    `;
}

async function openQuickGrade(studentId, classId, studentName) {
    const res = await fetch(`api/teacher.php?action=assessments&class_id=${classId}`);
    const assessments = await res.json();
    
    const gradesRes = await fetch(`api/teacher.php?action=student_class_grades&student_id=${studentId}&class_id=${classId}`);
    const studentGrades = await gradesRes.json();
    
    const gradesMap = {};
    studentGrades.forEach(g => { gradesMap[g.assessment_id] = g.score; });

    const station = document.getElementById('quickGradeStation');
    station.innerHTML = `
        <div class="card" style="border: 2px solid var(--amu-gold); background: #fffdf7; animation: slideIn 0.2s ease-out; padding: 15px; border-radius:15px; box-shadow: 0 10px 25px -5px rgba(202, 138, 4, 0.1);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f9ebbe; padding-bottom:8px;">
                <div>
                    <h4 style="margin:0; color:var(--teacher-primary);">${studentName} <span style="font-weight:400; font-size:0.8rem; color:#94a3b8; margin-left:10px;">ID: #${studentId}</span></h4>
                </div>
                <button class="btn-text" onclick="this.closest('.card').remove()" style="font-size:0.8rem; font-weight:700;">&times; Close</button>
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end;">
                ${assessments.map(a => `
                    <div style="flex: 1; min-width: 120px; background:white; padding:8px 12px; border-radius:10px; border:1px solid #e2e8f0;">
                        <div style="font-weight:800; color:var(--teacher-primary); font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.title}</div>
                        <div style="font-size:0.65rem; color:#94a3b8; margin-bottom:4px;">Max ${a.max_points}</div>
                        <input type="number" class="bulk-grade-input" data-aid="${a.id}" value="${gradesMap[a.id] || ''}" placeholder="/${a.max_points}" 
                            style="width:100%; padding:6px; border-radius:6px; border:1.5px solid #f1f5f9; text-align:center; font-weight:800; font-size:1rem; color:var(--amu-blue); outline:none;">
                    </div>
                `).join('')}
                
                ${assessments.length > 0 ? `
                    <button class="btn-primary" onclick="bulkSaveGrades(${studentId})" style="height:48px; padding:0 25px; font-weight:900; background:var(--teacher-primary); font-size:0.85rem;">SYNC GRADES</button>
                ` : '<p style="color:red; font-size:0.8rem;">No assessment plan.</p>'}
            </div>
        </div>
    `;
    station.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function bulkSaveGrades(studentId) {
    const inputs = document.querySelectorAll('.bulk-grade-input');
    const promises = Array.from(inputs).map(input => {
        const score = input.value;
        const aid = input.dataset.aid;
        if (score !== "") {
            return fetch('api/teacher.php?action=save_grade', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ student_id: studentId, assessment_id: aid, score: score })
            });
        }
        return Promise.resolve();
    });

    try {
        await Promise.all(promises);
        showToast('Marks synchronized successfully!');
        document.getElementById('quickGradeStation').innerHTML = '';
    } catch(err) {
        showToast('Error syncing grades.');
    }
}

function filterRoster(input) {
    const val = input.value.toLowerCase();
    document.querySelectorAll('.roster-row').forEach(row => {
        const name = row.cells[0].innerText.toLowerCase();
        row.style.display = name.includes(val) ? '' : 'none';
    });
}

function renderAnnouncements(data) {
    contentArea.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
            <h2>Public Announcements</h2>
            <button class="btn-primary" onclick="showAddAnnouncementModal()">+ New Post</button>
        </div>
        <div>
            ${data.map(a => `
                <div class="card" style="margin-bottom:1rem; border-left: 5px solid var(--amu-gold);">
                    <p style="font-size:1.1rem; line-height:1.5;">${a.content}</p>
                    <div style="margin-top:1rem; font-size:0.8rem; color:var(--text-secondary); display:flex; justify-content:space-between;">
                        <span>Post ID: #${a.id}</span>
                        <span>${new Date(a.created_at).toLocaleString()}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderAttendance() {
    contentArea.innerHTML = `
        <div class="card" style="max-width: 800px; margin: 0 auto; text-align:center; padding: 4rem 2rem; border-radius:30px;">
            <div id="attendanceIconContainer" style="margin-bottom:2rem; transition: transform 0.5s ease;">
                <ion-icon name="radio-outline" style="font-size: 6rem; color: var(--teacher-accent); animation: pulse 2s infinite;"></ion-icon>
            </div>
            
            <h2 style="font-size: 2.2rem; color:var(--teacher-primary); font-weight:900;">Attendance Broadcast</h2>
            <p style="color:var(--text-secondary); margin-bottom:3rem; font-size:1.1rem; max-width:500px; margin-inline:auto;">
                Launch a 120-second attendance window. Students must be in your classroom to see the "Attend" button.
            </p>
            
            <div id="attendanceControls">
                <div style="background:#f8fafc; padding:25px; border-radius:20px; border:2px solid #f1f5f9; margin-bottom:2rem;">
                    <label style="display:block; margin-bottom:12px; font-weight:800; color:var(--text-secondary); font-size:0.85rem; text-transform:uppercase; text-align:left;">Target Course Section</label>
                    <select id="attendanceClassSelect" style="width:100%; padding:18px; border-radius:15px; border:2px solid #e2e8f0; font-weight:700; font-size:1.1rem; background:white;">
                        <!-- Classes will be loaded here -->
                    </select>
                </div>
                <button class="btn-primary" onclick="startSmartAttendance()" style="width:100%; padding:20px; font-weight:900; font-size:1.2rem; border-radius:18px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);">
                    <ion-icon name="flash-outline"></ion-icon> LAUNCH ONE-TAP SESSION
                </button>
            </div>
            
            <div id="activeSessionArea" class="hidden" style="margin-top:2rem;">
                <div style="background:var(--teacher-primary); color:white; padding:40px; border-radius:25px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                    <div id="countdownTimer" style="font-size:4rem; font-weight:900; color:var(--teacher-accent);">02:00</div>
                    <div style="font-weight:700; margin-top:10px; opacity:0.8; text-transform:uppercase; letter-spacing:1px;">Session Active - Students may check in</div>
                    <div class="badge badge-good" id="activeCount" style="margin-top:20px; padding:10px 25px; font-size:1.1rem; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);">0 Students Connected</div>
                </div>
                <button class="btn-text" onclick="loadTab('attendance')" style="margin-top:2rem; color:#ef4444; font-weight:800;">
                    <ion-icon name="close-circle-outline"></ion-icon> ABORT SESSION
                </button>
            </div>
        </div>

        <style>
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
        </style>
    `;
    
    // Load classes into select
    fetch('api/teacher.php?action=classes').then(res => res.json()).then(classes => {
        const select = document.getElementById('attendanceClassSelect');
        if (!select) return;
        classes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.course_code} - ${c.course_title} (${c.section_name})`;
            select.appendChild(opt);
        });
    });
}

// --- LOGIC FUNCTIONS ---

async function startSmartAttendance() {
    const classId = document.getElementById('attendanceClassSelect').value;
    const btn = event.target;
    
    if (!classId) {
        alert("Please select a class first!");
        return;
    }
    
    // Show loading state
    btn.disabled = true;
    btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> LAUNCHING...';
    
    console.log('Starting attendance session for class:', classId);
    
    if (!navigator.geolocation) {
        alert("GPS is required for location verification. Please enable location services.");
        btn.disabled = false;
        btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon> LAUNCH ONE-TAP SESSION';
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log('Got GPS coordinates:', latitude, longitude);
        
        try {
            const res = await fetch('api/teacher.php?action=start_attendance_session', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ class_id: classId, latitude, longitude })
            });
            const data = await res.json();
            console.log('Server response:', data);
            
            if (data.status === 'success') {
                document.getElementById('attendanceControls').classList.add('hidden');
                document.getElementById('activeSessionArea').classList.remove('hidden');
                
                showToast('Attendance session started! Students can now check in.');
                
                let secondsLeft = 120; // 2 minute time slice
                const timer = setInterval(() => {
                    secondsLeft--;
                    const mins = Math.floor(secondsLeft / 60);
                    const secs = secondsLeft % 60;
                    const timerEl = document.getElementById('countdownTimer');
                    if (timerEl) {
                        timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    }
                    
                    if (secondsLeft <= 0) {
                        clearInterval(timer);
                        renderAttendance(); // Reset back
                        showToast("Attendance session expired.");
                    }
                }, 1000);
            } else {
                alert('Failed to start session: ' + (data.message || 'Unknown error'));
                btn.disabled = false;
                btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon> LAUNCH ONE-TAP SESSION';
            }
        } catch (err) {
            console.error('Error starting session:', err);
            alert('Network error: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon> LAUNCH ONE-TAP SESSION';
        }
    }, (err) => {
        console.error('GPS error:', err);
        alert("Failed to get location. Please enable GPS permissions in your browser.");
        btn.disabled = false;
        btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon> LAUNCH ONE-TAP SESSION';
    });
}

function showAddAnnouncementModal() {
    const content = prompt("Enter announcement content:");
    if (content) {
        fetch('api/teacher.php?action=add_announcement', {
            method: 'POST',
            body: JSON.stringify({ content, class_id: null }) 
        }).then(() => loadTab('announcements'));
    }
}

async function showAddGradeModal(classId) {
    let classOptions = '';
    if (!classId) {
        const res = await fetch('api/teacher.php?action=classes');
        const classes = await res.json();
        classOptions = `
            <div style="margin-bottom:15px;">
                <label style="display:block; margin-bottom:5px; font-weight:600;">Target Class</label>
                <select name="class_id" required style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd;">
                    ${classes.map(c => `<option value="${c.id}">${c.course_code} - ${c.section_name}</option>`).join('')}
                </select>
            </div>
        `;
    } else {
        classOptions = `<input type="hidden" name="class_id" value="${classId}">`;
    }

    modalOverlay.classList.remove('hidden');
    document.getElementById('modalContent').innerHTML = `
        <div style="padding:2rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="color:var(--teacher-primary);">Add New Assessment</h2>
                <button class="btn-text" onclick="closeModal()" style="font-size:1.5rem;">&times;</button>
            </div>
            <p style="color:var(--text-secondary); margin-bottom:20px;">Create a new graded item (e.g. Mid Exam, Assignment 1).</p>
            
            <form id="assessmentForm" style="display:flex; flex-direction:column; gap:15px;">
                ${classOptions}
                <div>
                    <label style="display:block; margin-bottom:5px; font-weight:600;">Assessment Title</label>
                    <input type="text" name="title" placeholder="e.g. Midterm Examination" required style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd;">
                </div>
                <div>
                    <label style="display:block; margin-bottom:5px; font-weight:600;">Maximum Points</label>
                    <input type="number" name="maxPoints" placeholder="e.g. 30" required style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd;">
                </div>
                <button type="submit" class="btn-primary" style="padding:15px; font-weight:800; margin-top:10px;">Create Assessment</button>
            </form>
        </div>
    `;

    document.getElementById('assessmentForm').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        const res = await fetch('api/teacher.php?action=save_assessment', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.status === 'success') {
            closeModal();
            showToast('Assessment created!');
            if (classId) viewClassDetails(classId); 
            else loadTab('assessments');
        }
    };
}

async function deleteAssessment(id) {
    if (!confirm("Are you sure? This will also remove any grades submitted for this assessment.")) return;
    const res = await fetch('api/teacher.php?action=delete_assessment', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id })
    });
    const result = await res.json();
    if (result.status === 'success') {
        showToast('Assessment deleted');
        loadTab('assessments');
    }
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; background: var(--teacher-accent); 
        color: white; padding: 12px 25px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 9999; animation: slideIn 0.3s ease-out;
    `;
    toast.innerHTML = `<div style="display:flex; align-items:center; gap:10px;"><ion-icon name="checkmark-circle"></ion-icon> ${msg}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

async function quickInitAssessment(classId) {
    const res = await fetch('api/teacher.php?action=save_assessment', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ title: 'Course Performance', maxPoints: 100, class_id: classId })
    });
    const result = await res.json();
    if (result.status === 'success') {
        showToast('Assessment Initialized!');
        viewClassDetails(classId);
    }
}


async function renderAnnouncements(announcements) {
    const res = await fetch('api/teacher.php?action=classes');
    const classes = await res.json();

    contentArea.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2.5rem;">
            <div>
                <h2 style="font-size:2rem; color:var(--teacher-primary);">Classroom Broadcast</h2>
                <p style="color:var(--text-secondary); font-size:1.1rem;">Send important updates to your students direct to their dashboard.</p>
            </div>
            <button class="btn-primary" onclick="showAnnouncementModal()" style="padding:15px 30px; border-radius:15px; font-weight:800; box-shadow:0 10px 15px -3px rgba(30, 58, 138, 0.2);">
                <ion-icon name="megaphone-outline" style="font-size:1.2rem;"></ion-icon>
                NEW BROADCAST
            </button>
        </div>

        <div style="display:grid; grid-template-columns: 1fr; gap:1.5rem;">
            ${announcements.length > 0 ? announcements.map(a => `
                <div class="card" style="padding:1.5rem; position:relative;">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1rem;">
                        <div>
                            <span class="badge" style="background:var(--teacher-secondary); color:var(--teacher-primary); font-weight:800; font-size:0.7rem; padding:4px 10px;">
                                ${a.course_code ? `${a.course_code} - ${a.section_name}` : 'GENERAL BROADCAST'}
                            </span>
                            <span style="font-size:0.8rem; color:var(--text-secondary); margin-left:10px; font-weight:600;">
                                Posted: ${new Date(a.created_at).toLocaleString()}
                            </span>
                        </div>
                        <button class="btn-text" onclick="deleteAnnouncement(${a.id})" style="color:#ef4444; border:none; background:none; cursor:pointer; font-size:1.2rem;">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                    <p style="font-size:1.1rem; line-height:1.6; color:var(--teacher-primary); font-weight:500;">
                        ${a.content}
                    </p>
                </div>
            `).join('') : `
                <div style="text-align:center; padding:5rem; border:2px dashed #e2e8f0; border-radius:20px; color:#94a3b8;">
                    <ion-icon name="chatbox-ellipses-outline" style="font-size:4rem; margin-bottom:1rem;"></ion-icon>
                    <p style="font-weight:600; font-size:1.2rem;">No announcements sent yet.</p>
                </div>
            `}
        </div>
    `;
}

async function showAnnouncementModal() {
    const res = await fetch('api/teacher.php?action=classes');
    const classes = await res.json();

    modalOverlay.classList.remove('hidden');
    modalOverlay.innerHTML = `
        <div class="modal" style="max-width:600px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="font-size:1.4rem; font-weight:900; color:var(--teacher-primary);">Publish Announcement</h3>
                <button class="btn-text" onclick="closeModal()" style="font-size:1.8rem; color:#94a3b8;"><ion-icon name="close-outline"></ion-icon></button>
            </div>
            
            <form id="announcementForm">
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-weight:700; color:var(--text-secondary); font-size:0.85rem; text-transform:uppercase; margin-bottom:8px;">Target Audience</label>
                    <select id="targetClass" style="width:100%; padding:15px; border-radius:12px; border:2px solid #f1f5f9; font-weight:700; font-size:1rem; outline:none; background:#f8fafc;">
                        <option value="">All My Classes</option>
                        ${classes.map(c => `<option value="${c.id}">${c.course_code} - ${c.course_title} (${c.section_name})</option>`).join('')}
                    </select>
                </div>

                <div style="margin-bottom:25px;">
                    <label style="display:block; font-weight:700; color:var(--text-secondary); font-size:0.85rem; text-transform:uppercase; margin-bottom:8px;">Content</label>
                    <textarea id="announcementContent" required placeholder="Type your message here..." style="width:100%; height:150px; padding:15px; border-radius:12px; border:2px solid #f1f5f9; font-size:1.1rem; outline:none; font-family:inherit; transition:border-color 0.3s;"></textarea>
                </div>

                <button type="submit" class="btn-primary" style="width:100%; padding:18px; border-radius:12px; font-weight:900; font-size:1.1rem; box-shadow:0 10px 15px -3px rgba(30, 58, 138, 0.3);">
                    SEND BROADCAST NOW
                </button>
            </form>
        </div>
    `;

    document.getElementById('announcementForm').onsubmit = (e) => {
        e.preventDefault();
        sendAnnouncement();
    };
}

async function sendAnnouncement() {
    const classId = document.getElementById('targetClass').value;
    const content = document.getElementById('announcementContent').value;

    if (!content) return;

    try {
        const res = await fetch('api/teacher.php?action=send_announcement', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ class_id: classId, content: content })
        });
        const result = await res.json();
        if (result.status === 'success') {
            closeModal();
            loadTab('announcements');
        }
    } catch (e) {
        alert("Failed to send announcement.");
    }
}

async function deleteAnnouncement(id) {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
        await fetch('api/teacher.php?action=delete_announcement', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id })
        });
        loadTab('announcements');
    } catch (e) {}
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    modalOverlay.innerHTML = '';
}

async function renderSchedules(schedules) {
    const res = await fetch('api/teacher.php?action=classes');
    const classes = await res.json();

    contentArea.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2.5rem;">
            <div>
                <h2 style="font-size:2rem; color:var(--teacher-primary);">Academic Timetable</h2>
                <p style="color:var(--text-secondary); font-size:1.1rem;">Manage meeting times and room assignments for your classes.</p>
            </div>
            <button class="btn-primary" onclick="showScheduleModal()" style="padding:15px 30px; border-radius:15px; font-weight:800; box-shadow:0 10px 15px -3px rgba(30, 58, 138, 0.2);">
                <ion-icon name="add-outline" style="font-size:1.2rem;"></ion-icon>
                ADD TIME SLOT
            </button>
        </div>

        <div class="card" style="padding:2rem;">
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:2px solid #f1f5f9;">
                            <th style="padding:15px; text-align:left; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Day</th>
                            <th style="padding:15px; text-align:left; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Time (Start - End)</th>
                            <th style="padding:15px; text-align:left; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Course / Section</th>
                            <th style="padding:15px; text-align:left; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Room</th>
                            <th style="padding:15px; text-align:right;">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schedules.length > 0 ? schedules.map(s => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:15px;">
                                    <span class="badge" style="background:#f1f5f9; color:var(--teacher-primary); font-weight:800;">${s.day_of_week}</span>
                                </td>
                                <td style="padding:15px; font-weight:700; color:var(--teacher-primary);">
                                    ${s.start_time.substring(0,5)} - ${s.end_time.substring(0,5)}
                                </td>
                                <td style="padding:15px;">
                                    <div style="font-weight:800; color:var(--teacher-primary);">${s.course_code}</div>
                                    <div style="font-size:0.8rem; color:var(--text-secondary); font-weight:600;">${s.course_title} (${s.section_name})</div>
                                </td>
                                <td style="padding:15px;">
                                    <span style="font-weight:700; color:#3b82f6;"><ion-icon name="location-outline"></ion-icon> ${s.room || 'TBA'}</span>
                                </td>
                                <td style="padding:15px; text-align:right;">
                                    <button class="btn-text" onclick="deleteSchedule(${s.id})" style="color:#ef4444; font-size:1.2rem;"><ion-icon name="trash-outline"></ion-icon></button>
                                </td>
                            </tr>
                        `).join('') : `<tr><td colspan="5" style="padding:50px; text-align:center; color:#94a3b8;">No schedules defined yet.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showScheduleModal() {
    const res = await fetch('api/teacher.php?action=classes');
    const classes = await res.json();

    modalOverlay.classList.remove('hidden');
    modalOverlay.innerHTML = `
        <div class="modal" style="max-width:550px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="font-size:1.4rem; font-weight:900; color:var(--teacher-primary);">Add Schedule Slot</h3>
                <button class="btn-text" onclick="closeModal()" style="font-size:1.8rem; color:#94a3b8;"><ion-icon name="close-outline"></ion-icon></button>
            </div>
            
            <form id="scheduleForm">
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-weight:700; color:var(--text-secondary); font-size:0.85rem; text-transform:uppercase; margin-bottom:8px;">Target Class</label>
                    <select id="scheduleClass" required style="width:100%; padding:15px; border-radius:12px; border:2px solid #f1f5f9; font-weight:700;">
                        ${classes.map(c => `<option value="${c.id}">${c.course_code} (${c.section_name})</option>`).join('')}
                    </select>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div>
                        <label style="display:block; font-weight:700; color:var(--text-secondary); font-size:0.85rem; text-transform:uppercase; margin-bottom:8px;">Day of Week</label>
                        <select id="scheduleDay" required style="width:100%; padding:15px; border-radius:12px; border:2px solid #f1f5f9; font-weight:700;">
                            <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-weight:700; color:var(--text-secondary); font-size:0.85rem; text-transform:uppercase; margin-bottom:8px;">Room</label>
                        <input type="text" id="scheduleRoom" placeholder="e.g. Lab 2" style="width:100%; padding:15px; border-radius:12px; border:2px solid #f1f5f9; font-weight:700;">
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:25px;">
                    <div>
                        <label style="display:block; font-weight:700; color:var(--text-secondary); font-size:0.85rem; text-transform:uppercase; margin-bottom:8px;">Start Time</label>
                        <input type="time" id="scheduleStart" required style="width:100%; padding:15px; border-radius:12px; border:2px solid #f1f5f9; font-weight:700;">
                    </div>
                    <div>
                        <label style="display:block; font-weight:700; color:var(--text-secondary); font-size:0.85rem; text-transform:uppercase; margin-bottom:8px;">End Time</label>
                        <input type="time" id="scheduleEnd" required style="width:100%; padding:15px; border-radius:12px; border:2px solid #f1f5f9; font-weight:700;">
                    </div>
                </div>

                <button type="submit" class="btn-primary" style="width:100%; padding:18px; border-radius:12px; font-weight:900; font-size:1.1rem; box-shadow:0 10px 15px -3px rgba(30, 58, 138, 0.3);">
                    CONFIRM SCHEDULE SLOT
                </button>
            </form>
        </div>
    `;

    document.getElementById('scheduleForm').onsubmit = (e) => {
        e.preventDefault();
        saveSchedule();
    };
}

async function saveSchedule() {
    const data = {
        class_id: document.getElementById('scheduleClass').value,
        day_of_week: document.getElementById('scheduleDay').value,
        room: document.getElementById('scheduleRoom').value,
        start_time: document.getElementById('scheduleStart').value,
        end_time: document.getElementById('scheduleEnd').value
    };

    try {
        const res = await fetch('api/teacher.php?action=save_class_schedule', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.status === 'success') {
            closeModal();
            loadTab('schedules');
        }
    } catch (e) {
        alert("Failed to save schedule.");
    }
}

async function deleteSchedule(id) {
    if (!confirm("Remove this time slot?")) return;
    try {
        await fetch('api/teacher.php?action=delete_schedule', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id })
        });
        loadTab('schedules');
    } catch (e) {}
}
