// Data Storage
let students = JSON.parse(localStorage.getItem('edu_students')) || [];
// Pre-seed assessments if empty with 30/20/50 rule
let assessments = JSON.parse(localStorage.getItem('edu_assessments')) || [
    {id: 1, title: 'Analysis (30)', maxPoints: 30},
    {id: 2, title: 'Practical (20)', maxPoints: 20},
    {id: 3, title: 'Final Exam (50)', maxPoints: 50},
    {id: 999, title: 'Bonus', maxPoints: 10}
];

// Force Bonus Check on every load
if (!assessments.some(a => a.id === 999)) {
    assessments.push({id: 999, title: 'Bonus', maxPoints: 10});
}

let grades = JSON.parse(localStorage.getItem('edu_grades')) || {}; 
let rawAttendance = JSON.parse(localStorage.getItem('edu_attendance')) || {};
let attendance = {};

// Handle Migration
Object.keys(rawAttendance).forEach(key => {
    if (typeof rawAttendance[key] === 'number') {
        attendance[key] = { absent: rawAttendance[key], present: 0 };
    } else {
        attendance[key] = rawAttendance[key];
    }
});

let announcements = JSON.parse(localStorage.getItem('edu_announcements_list')) || [
    {id: 1, text: "Welcome to EduTrack! Please check the new Grading policy.", date: new Date().toLocaleDateString()}
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    switchTab('overview');
});

// Navigation
const tabs = document.querySelectorAll('.nav-btn');
const pageTitle = document.getElementById('pageTitle');
const contentArea = document.getElementById('contentArea');

tabs.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function switchTab(tabName) {
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    pageTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);

    if (tabName === 'overview') renderOverview();
    if (tabName === 'students') renderStudents();
    if (tabName === 'assessments') renderAssessments();
    if (tabName === 'grades') renderGradebook();
    if (tabName === 'attendance') renderAttendance();
}

// Render Functions
function renderOverview() {
    const studentCount = students.length;
    
    // Calculate engaging students
    const studentScores = students.map(s => {
        let total = 0;
        assessments.forEach(a => {
            const score = parseInt(grades[`${s.id}_${a.id}`] || 0);
            total += score;
        });
        return { ...s, total };
    }).sort((a,b) => b.total - a.total).slice(0, 5);

    contentArea.innerHTML = `
        <div class="stats-grid">
            <div class="card stat-card">
                <h3>Total Students</h3>
                <div class="value">${studentCount}</div>
            </div>
            <div class="card stat-card">
                <h3>Avg Class Score</h3>
                <div class="value">
                    ${studentScores.length ? Math.round(studentScores.reduce((a,b)=>a+b.total,0)/studentScores.length) : 0}
                </div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <!-- Engaging Students -->
            <div class="card">
                <h3>🌟 Engaging Students (Top Performers)</h3>
                <table style="margin-top:1rem;">
                    <tbody>
                        ${studentScores.map((s, i) => `
                            <tr>
                                <td style="width:30px">#${i+1}</td>
                                <td><strong>${s.name}</strong></td>
                                <td style="text-align:right; font-weight:bold; color:var(--primary)">${s.total} pts</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Announcements -->
            <div class="card">
                <h3>📢 Announcements</h3>
                <div style="margin-top:1rem; display:flex; gap:10px;">
                    <input type="text" id="announceInput" placeholder="Post an update..." style="flex:1; border:1px solid #ddd; padding:8px; border-radius:6px;">
                    <button class="btn-primary" onclick="postAnnouncement()">Post</button>
                </div>
                <div class="announcement-list" style="margin-top:1rem; max-height:200px; overflow-y:auto;">
                    ${announcements.map(a => `
                        <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:start;">
                            <div>
                                <p style="margin:0; font-size:0.95rem;">${a.text}</p>
                                <small style="color:grey;">${a.date}</small>
                            </div>
                            <div style="display:flex; gap:5px;">
                                <button class="btn-text" onclick="editAnnouncementItem(${a.id})" style="color:var(--primary); padding:2px;"><ion-icon name="pencil-outline"></ion-icon></button>
                                <button class="btn-text" onclick="deleteAnnouncementItem(${a.id})" style="color:var(--danger); padding:2px;"><ion-icon name="trash-outline"></ion-icon></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderStudents() {
    contentArea.innerHTML = `
        <div class="action-header">
            <p>${students.length} Students enrolled</p>
            <button class="btn-primary" onclick="openModal('student')">
                <ion-icon name="add-outline"></ion-icon> Add Student
            </button>
        </div>
        <table>
            <thead>
                <tr>
                    <th>School ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(s => `
                    <tr>
                        <td><span class="badge" style="background:#eef2ff; color:#4338ca;">${s.id}</span></td>
                        <td><strong>${s.name}</strong></td>
                        <td>${s.email || '-'}</td>
                        <td>
                            <button class="btn-text" onclick="deleteStudent('${s.id}')" style="color: var(--danger)">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderAttendance() {
    contentArea.innerHTML = `
        <div class="action-header">
            <p>Today's Status</p>
            <button class="btn-primary" onclick="markAllPresent()">
                <ion-icon name="checkmark-done-outline"></ion-icon> Mark All Present
            </button>
        </div>
        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Summary</th>
                        <th style="min-width: 250px;">Today's Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => {
                        const rec = attendance[s.id] || { absent: 0, present: 0 };
                        const isRisk = rec.absent > 3;
                        return `
                            <tr>
                                <td>${s.name} <br> <small style="color:grey">${s.id}</small></td>
                                <td>
                                    <div style="display:flex; gap:5px; align-items:center;">
                                        <span class="badge badge-good">Pres: ${rec.present}</span>
                                        <button class="btn-text" onclick="updateAttendance('${s.id}', 'present', -1)" title="Undo Present" style="padding:0;font-size:1.2rem;line-height:1;">
                                            <ion-icon name="remove-circle-outline"></ion-icon>
                                        </button>
                                    </div>
                                    <div style="display:flex; gap:5px; align-items:center; margin-top:5px;">
                                        <span class="badge ${isRisk ? 'badge-bad' : 'badge-avg'}">Abs: ${rec.absent}</span>
                                        <button class="btn-text" onclick="updateAttendance('${s.id}', 'absent', -1)" title="Undo Absent" style="padding:0;font-size:1.2rem;line-height:1;">
                                            <ion-icon name="remove-circle-outline"></ion-icon>
                                        </button>
                                        ${isRisk ? `
                                            <button class="btn-primary" style="background-color:var(--danger); font-size:0.75rem; padding:4px 8px; margin-left:5px;" 
                                                    onclick="location.href='mailto:${s.email}?subject=Attendance Warning&body=Dear ${s.name}, you have missed ${rec.absent} classes.'">
                                                Send Alert
                                            </button>
                                        ` : ''}
                                    </div>
                                </td>
                                <td>
                                    <button class="btn-text" onclick="updateAttendance('${s.id}', 'present', 1)" style="color:var(--success); font-weight:bold; background: #ecfdf5; padding:8px 12px; border-radius:6px; margin-right:5px;">
                                        Present
                                    </button>
                                    <button class="btn-text" onclick="updateAttendance('${s.id}', 'absent', 1)" style="color:var(--danger); background: #fef2f2; padding:8px 12px; border-radius:6px;">
                                        Absent
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderAssessments() {
    contentArea.innerHTML = `
        <div class="action-header">
            <p>Grading Components</p>
            <button class="btn-primary" onclick="openModal('assessment')">
                <ion-icon name="add-outline"></ion-icon> New Component
            </button>
        </div>
        <div class="stats-grid">
            ${assessments.map(a => `
                <div class="card" style="${a.id === 999 ? 'border: 2px solid #fbbf24;' : ''}">
                    <div style="display:flex; justify-content:space-between; align-items:start">
                        <div>
                            <h3 style="font-size:1.1rem; color:var(--text-main); margin-bottom:5px;">
                                ${a.id === 999 ? '⭐️ ' : ''}${a.title}
                            </h3>
                            <p style="font-size:0.9rem; color:var(--text-secondary)">Max: ${a.maxPoints}</p>
                        </div>
                        <div>
                            <button class="btn-text" onclick="openModal('assessment', ${a.id})" style="color:var(--primary)">Edit</button>
                            ${a.id !== 999 ? `
                                <button class="btn-text" onclick="deleteAssessment(${a.id})" style="color:var(--danger)">
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderGradebook() {
    contentArea.innerHTML = `
        <div class="card" style="overflow-x:auto">
            <table>
                <thead>
                    <tr>
                        <th style="width:200px">Student</th>
                        ${assessments.map(a => `<th style="${a.id === 999 ? 'background:#fffbeb;' : ''}">${a.title} (${a.maxPoints})</th>`).join('')}
                        <th>Total</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => {
                        let totalEarned = 0;
                        
                        const gradesCells = assessments.map(a => {
                            const gradeKey = `${s.id}_${a.id}`;
                            const score = grades[gradeKey] || '';
                            if (score !== '') {
                                totalEarned += parseInt(score);
                            }

                            return `
                                <td style="${a.id === 999 ? 'background:#fffbeb;' : ''}">
                                    <input type="number" 
                                           class="grade-input" 
                                           value="${score}" 
                                           onchange="updateGrade('${s.id}', ${a.id}, this.value)"
                                           min="0" max="${a.maxPoints}">
                                </td>
                            `;
                        }).join('');

                        let badgeClass = totalEarned >= 85 ? 'badge-good' : (totalEarned >= 50 ? 'badge-avg' : 'badge-bad');
                        const letter = getLetterGrade(totalEarned);

                        return `
                            <tr>
                                <td><strong>${s.name}</strong><br><small>${s.id}</small></td>
                                ${gradesCells}
                                <td><span class="badge ${badgeClass}">${totalEarned}</span></td>
                                <td><strong>${letter}</strong></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getLetterGrade(score) {
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 40) return 'D';
    return 'F';
}

// Logic Functions
window.postAnnouncement = () => {
    const input = document.getElementById('announceInput');
    const text = input.value.trim();
    if(text) {
        announcements.unshift({ id: Date.now(), text, date: new Date().toLocaleDateString() });
        localStorage.setItem('edu_announcements_list', JSON.stringify(announcements));
        renderOverview();
    }
};

window.deleteAnnouncementItem = (id) => {
    if(!confirm("Delete this announcement?")) return;
    announcements = announcements.filter(a => a.id !== id);
    localStorage.setItem('edu_announcements_list', JSON.stringify(announcements));
    renderOverview();
};

window.editAnnouncementItem = (id) => {
    openModal('announcement', id);
};

window.updateGrade = (sid, aid, value) => {
    const key = `${sid}_${aid}`;
    grades[key] = value;
    localStorage.setItem('edu_grades', JSON.stringify(grades));
    renderGradebook();
};

// Updated to handle decrement
window.updateAttendance = (sid, status, amount) => {
    if (!attendance[sid]) attendance[sid] = { present: 0, absent: 0 };
    
    attendance[sid][status] += amount;
    
    // Prevent negative
    if (attendance[sid][status] < 0) attendance[sid][status] = 0;

    localStorage.setItem('edu_attendance', JSON.stringify(attendance));
    renderAttendance();
};

window.markAllPresent = () => {
    students.forEach(s => {
        if (!attendance[s.id]) attendance[s.id] = { present: 0, absent: 0 };
        attendance[s.id].present++;
    });
    localStorage.setItem('edu_attendance', JSON.stringify(attendance));
    renderAttendance();
    alert("Marked all students present for today!");
};

window.deleteStudent = (id) => {
    if(!confirm("Delete student?")) return;
    students = students.filter(s => s.id !== id);
    localStorage.setItem('edu_students', JSON.stringify(students));
    renderStudents();
};

window.deleteAssessment = (id) => {
    if(!confirm("Delete assessment?")) return;
    assessments = assessments.filter(a => a.id !== id);
    localStorage.setItem('edu_assessments', JSON.stringify(assessments));
    renderAssessments();
}

// Modal Handling
const modal = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');
const closeModal = document.getElementById('closeModal');

closeModal.addEventListener('click', () => modal.classList.add('hidden'));

window.openModal = (type, editId = null) => {
    modal.classList.remove('hidden');
    modalForm.innerHTML = '';
    
    if (type === 'student') {
        modalTitle.textContent = "Add Student";
        modalForm.innerHTML = `
            <div class="form-group">
                <label>School ID (Manual)</label>
                <input type="text" name="id" placeholder="e.g. 2023-A-001" required>
            </div>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" required>
            </div>
            <input type="hidden" name="type" value="student">
        `;
    } else if (type === 'assessment') {
        const existing = editId ? assessments.find(a => a.id === editId) : null;
        modalTitle.textContent = existing ? "Edit Assessment" : "New Assessment";
        modalForm.innerHTML = `
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="title" value="${existing ? existing.title : ''}" required>
            </div>
            <div class="form-group">
                <label>Max Points</label>
                <input type="number" name="maxPoints" value="${existing ? existing.maxPoints : ''}" required>
            </div>
            <input type="hidden" name="type" value="assessment">
            <input type="hidden" name="editId" value="${editId || ''}">
        `;
    } else if (type === 'announcement') {
        const existing = announcements.find(a => a.id === editId);
        modalTitle.textContent = "Edit Announcement";
        modalForm.innerHTML = `
            <div class="form-group">
                <label>Message</label>
                <textarea name="text" rows="4" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd;" required>${existing ? existing.text : ''}</textarea>
            </div>
            <input type="hidden" name="type" value="announcement">
            <input type="hidden" name="editId" value="${editId || ''}">
        `;
    }
};

modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(modalForm);
    const type = formData.get('type');
    const editId = formData.get('editId');

    if (type === 'student') {
        const student = {
            id: formData.get('id'), 
            name: formData.get('name'),
            email: formData.get('email')
        };
        if(students.some(s => s.id === student.id)) {
            alert("ID already exists!");
            return;
        }
        students.push(student);
        localStorage.setItem('edu_students', JSON.stringify(students));
        switchTab('students');

    } else if (type === 'assessment') {
        if (editId) {
            const idx = assessments.findIndex(a => a.id == editId);
            if (idx !== -1) {
                assessments[idx].title = formData.get('title');
                assessments[idx].maxPoints = formData.get('maxPoints');
            }
        } else {
            const assessment = {
                id: Date.now(),
                title: formData.get('title'),
                maxPoints: formData.get('maxPoints')
            };
            assessments.push(assessment);
        }
        localStorage.setItem('edu_assessments', JSON.stringify(assessments));
        switchTab('assessments');
    } else if (type === 'announcement') {
        const idx = announcements.findIndex(a => a.id == editId);
        if (idx !== -1) {
            announcements[idx].text = formData.get('text');
            announcements[idx].date = new Date().toLocaleDateString() + " (Edited)";
            localStorage.setItem('edu_announcements_list', JSON.stringify(announcements));
            renderOverview();
        }
    }

    modal.classList.add('hidden');
});

// Utils
function updateDate() {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').textContent = new Date().toLocaleDateString(undefined, opts);
}

// Responsive Sidebar Logic
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('aside');
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

if(menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    });
}
