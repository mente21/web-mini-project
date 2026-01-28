const contentArea = document.getElementById('contentArea');
const modalOverlay = document.getElementById('modalOverlay');

const DEPARTMENTS = ['CS', 'Software Eng', 'IT', 'Electrical', 'Mechanical', 'Civil', 'Water Eng'];

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <ion-icon name="${type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}"></ion-icon>
        </div>
        <div class="toast-content">${message}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    loadTab('overview');
    
    // Event Delegation for dynamic content
    contentArea.addEventListener('click', (e) => {
        if (e.target.matches('.btn-edit-course') || e.target.closest('.btn-edit-course')) {
            const btn = e.target.matches('.btn-edit-course') ? e.target : e.target.closest('.btn-edit-course');
            showEditCourseModal(
                btn.dataset.id, 
                btn.dataset.code, 
                btn.dataset.title, 
                btn.dataset.credits,
                btn.dataset.year,
                btn.dataset.dept
            );
        }
    });
});

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
    contentArea.innerHTML = '<div style="text-align:center; padding:2rem;">Loading Data...</div>';
    
    try {
        const res = await fetch(`api/admin.php?action=${tabName}`);
        const data = await res.json();
        
        switch(tabName) {
            case 'overview': renderOverview(data); break;
            case 'courses': renderCourses(data); break;
            case 'teachers': renderTeachers(data); break;
            case 'students': renderStudents(data); break;
            case 'classes': renderClasses(data); break;
            case 'rollover': renderRollover(); break;
            case 'grade_scale': renderGradeScale(data); break;
        }
    } catch (err) {
        contentArea.innerHTML = '<div style="text-align:center; color:red; padding:2rem;">Error fetching data. Check server logs.</div>';
    }
}

// --- RENDER FUNCTIONS ---

function renderStudents(students) {
    contentArea.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2 style="font-size:1.8rem; font-weight:800; background:linear-gradient(45deg, var(--admin-primary), var(--admin-accent)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Student Directory</h2>
                <p style="color:var(--text-secondary); font-size:0.9rem;">Manage student profiles and device security</p>
            </div>
            <button class="btn-primary" onclick="showAddStudentModal()" style="background:var(--admin-accent); padding:12px 24px; border-radius:12px; font-weight:600; box-shadow:0 4px 12px rgba(59, 130, 246, 0.2);">
                <ion-icon name="school-outline" style="font-size:1.2rem;"></ion-icon>
                Register Student
            </button>
        </div>
        <div class="card" style="padding:0; overflow:hidden; border-radius:16px; border:1px solid #eef2f6;">
            <table style="border:none;">
                <thead>
                    <tr style="background:#f8fafc;">
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">NAME</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">ID / YEAR / DEPT</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">DEVICE STATUS</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9; text-align:right;">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => `
                        <tr style="transition:all 0.2s;">
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div class="avatar" style="width:32px; height:32px; font-size:0.8rem; background:var(--admin-accent)">${s.name ? s.name.charAt(0) : 'S'}</div>
                                    <strong>${s.name}</strong>
                                </div>
                            </td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-weight:600; color:var(--admin-primary)">${s.school_id || 'N/A'}</span>
                                    <span class="badge" style="background:#fef3c7; color:#92400e; font-size:0.65rem;">Year ${s.grade_level}</span>
                                    <span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:0.65rem;">${s.department || 'CS'}</span>
                                </div>
                                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">${s.email}</div>
                            </td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                ${s.device_token ? 
                                    '<span class="badge" style="background:#dcfce7; color:#15803d; border-radius:6px; padding:4px 8px;">Bound</span>' : 
                                    '<span class="badge" style="background:#f1f5f9; color:#64748b; border-radius:6px; padding:4px 8px;">Not Bound</span>'}
                            </td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; gap:8px; justify-content:flex-end;">
                                    <button class="btn-edit-modern" onclick="showEditStudentModal(${s.id}, '${s.name}', '${s.email}', '${s.school_id || ''}', ${s.grade_level}, '${s.department || 'CS'}')">
                                        <ion-icon name="create-outline"></ion-icon>
                                        Edit
                                    </button>
                                    <button class="btn-text" onclick="resetDevice(${s.id})" style="color:var(--admin-accent); font-size:0.85rem;">Reset Device</button>
                                    <button class="btn-delete-modern" onclick="deleteStudent(${s.id}, '${s.name}')">
                                        <ion-icon name="trash-outline"></ion-icon>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showAddStudentModal() {
    modalOverlay.innerHTML = `
        <div class="modal-modern">
            <div class="modal-header">
                <h2>Register Student</h2>
                <p>Onboard a new student to the university system.</p>
            </div>
            <form id="addStudentForm">
                <div class="input-wrapper">
                    <ion-icon name="person-outline"></ion-icon>
                    <input type="text" name="name" placeholder="Full Name" required class="input-modern">
                </div>
                <div class="input-wrapper">
                    <ion-icon name="mail-outline"></ion-icon>
                    <input type="email" name="email" placeholder="University Email" required class="input-modern">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div class="input-wrapper">
                         <ion-icon name="calendar-outline"></ion-icon>
                        <select name="grade_level" required class="input-modern" style="padding-left:40px;">
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                            <option value="5">5th Year+</option>
                        </select>
                    </div>
                    <div class="input-wrapper">
                         <ion-icon name="business-outline"></ion-icon>
                        <select name="department" required class="input-modern" style="padding-left:40px;">
                            ${DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="input-wrapper">
                    <ion-icon name="id-card-outline"></ion-icon>
                    <input type="text" name="school_id" placeholder="Student ID" required class="input-modern">
                </div>
                <div class="input-wrapper">
                    <ion-icon name="lock-closed-outline"></ion-icon>
                    <input type="password" name="password" placeholder="Initial Password" required class="input-modern">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modern secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-modern primary" id="saveStudentBtn">
                        <ion-icon name="person-add-outline"></ion-icon>
                        Create Profile
                    </button>
                </div>
            </form>
        </div>
    `;
    modalOverlay.classList.remove('hidden');
    modalOverlay.style.display = 'flex';
    
    document.getElementById('addStudentForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveStudentBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Creating...';

        const data = Object.fromEntries(new FormData(e.target));
        const res = await fetch('api/admin.php?action=add_student', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast('Student registered successfully');
            closeModal();
            loadTab('students');
        } else {
            showToast('Failed to register student', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Create Profile';
        }
    };
}

async function resetDevice(studentId) {
    if(!confirm("Reset device binding for this student? They will be able to log in from Any device again.")) return;
    
    const res = await fetch('api/admin.php?action=reset_device', {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId })
    });
    const result = await res.json();
    if(result.status === 'success') {
        alert(result.message);
        loadTab('students');
    }
}

function renderOverview(stats) {
    // Hidden automatic migration call to ensure DB is updated
    if (!localStorage.getItem('db_migrated_v3')) {
        fetch('api/admin.php?action=run_migration', {method:'POST'})
            .then(() => localStorage.setItem('db_migrated_v3', 'true'));
    }

    contentArea.innerHTML = `
        <div class="stats-grid">
            <div class="card stat-card"><h3>📚 Total Courses</h3><div class="value">${stats.courses}</div></div>
            <div class="card stat-card"><h3>👨‍🏫 Active Teachers</h3><div class="value">${stats.teachers}</div></div>
            <div class="card stat-card"><h3>🎓 Total Students</h3><div class="value">${stats.students}</div></div>
            <div class="card stat-card"><h3>📅 Active Term</h3><div class="value" style="color:var(--admin-accent)">${stats.active_semester}</div></div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:2rem; margin-top:2rem;">
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3 style="display:flex; align-items:center; gap:10px;">
                        <ion-icon name="calendar-outline" style="color:var(--admin-accent)"></ion-icon>
                        Term Registration Window
                    </h3>
                    <span class="badge" style="background:${stats.reg_deadline ? '#dcfce7' : '#f1f5f9'}; color:${stats.reg_deadline ? '#15803d' : '#64748b'}">
                        ${stats.reg_deadline ? 'Window Defined' : 'Not Set'}
                    </span>
                </div>
                
                <form id="semesterDatesForm" style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                    <div class="form-group">
                        <label style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:8px; display:block;">Registration Starts</label>
                        <input type="date" name="reg_start" value="${stats.reg_start || ''}" class="input-modern" style="padding-left:12px; background:#fff; border:1px solid #e2e8f0;">
                    </div>
                    <div class="form-group">
                        <label style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:8px; display:block;">Deadline / Last Day</label>
                        <input type="date" name="reg_deadline" value="${stats.reg_deadline || ''}" class="input-modern" style="padding-left:12px; background:#fff; border:1px solid #e2e8f0;">
                    </div>
                    <div style="grid-column: span 2;">
                        <button type="submit" class="btn-modern primary" style="width:auto; padding:12px 24px; border-radius:12px;">
                            <ion-icon name="save-outline"></ion-icon>
                            Update Registration Dates
                        </button>
                    </div>
                </form>
                
                <p style="margin-top:1.5rem; font-size:0.85rem; color:var(--text-secondary); display:flex; align-items:center; gap:8px;">
                    <ion-icon name="information-circle-outline" style="font-size:1.1rem; color:var(--admin-accent)"></ion-icon>
                    These dates will determine when student self-registration opens and automatically closes.
                </p>
            </div>

            <div class="card" style="background: linear-gradient(135deg, var(--admin-primary), #0f172a); color: white; border: none;">
                <h3 style="color:white; margin-bottom:1rem;">System Health</h3>
                <div style="padding:1rem; background:rgba(255,255,255,0.05); border-radius:12px; margin-bottom:1rem;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size:0.85rem; opacity:0.7;">Database Status</span>
                        <span style="font-size:0.85rem; color:#10B981; font-weight:700;">Online</span>
                    </div>
                    <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                        <div style="width:100%; height:100%; background:#10B981;"></div>
                    </div>
                </div>
                <p style="font-size:0.85rem; opacity:0.7; line-height:1.6;">
                    EduTracker Antigravity Core is active. All automated subsystems (Rollovers, Attendance Tracking, GPA calculation) are functioning within nominal parameters.
                </p>
            </div>
        </div>
    `;

    document.getElementById('semesterDatesForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Saving...';

        try {
            const data = Object.fromEntries(new FormData(e.target));
            const res = await fetch('api/admin.php?action=update_semester_dates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.status === 'success') {
                showToast('Registration window updated.');
                loadTab('overview');
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        } catch (err) {
            showToast('Connection error', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = original;
        }
    };
}

function renderCourses(courses) {
    contentArea.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2 style="font-size:1.8rem; font-weight:800; background:linear-gradient(45deg, var(--admin-primary), var(--admin-accent)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Department Courses</h2>
                <p style="color:var(--text-secondary); font-size:0.9rem;">Manage and update curriculum details</p>
            </div>
            <button class="btn-primary" onclick="showAddCourseModal()" style="background:var(--admin-accent); padding:12px 24px; border-radius:12px; font-weight:600; box-shadow:0 4px 12px rgba(59, 130, 246, 0.2);">
                <ion-icon name="add-outline" style="font-size:1.2rem;"></ion-icon>
                Add New Course
            </button>
        </div>
        <div class="card" style="padding:0; overflow:hidden; border-radius:16px; border:1px solid #eef2f6;">
            <table style="border:none;">
                <thead>
                    <tr style="background:#f8fafc;">
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">CODE</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">COURSE TITLE</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">YEAR / DEPT</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">CREDITS</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9; text-align:right;">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    ${courses.map(c => `
                        <tr style="transition:all 0.2s;">
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <span style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.8rem;">${c.code}</span>
                            </td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9; font-weight:600; color:var(--admin-primary);">${c.title}</td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <span class="badge" style="background:#f1f5f9; color:var(--admin-primary); border:1px solid #e2e8f0; width:fit-content;">Year ${c.year_level}</span>
                                    <span class="badge" style="background:#f0fdf4; color:#15803d; font-size:0.65rem; width:fit-content;">${c.department || 'CS'}</span>
                                </div>
                            </td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; align-items:center; gap:6px; color:var(--text-secondary);">
                                    <ion-icon name="time-outline"></ion-icon>
                                    ${c.credit_hours} Hours
                                </div>
                            </td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; gap:8px; justify-content:flex-end;">
                                    <button class="btn-edit-modern btn-edit-course" 
                                        data-id="${c.id}" 
                                        data-code="${c.code}" 
                                        data-title="${c.title}" 
                                        data-credits="${c.credit_hours}"
                                        data-year="${c.year_level}"
                                        data-dept="${c.department || 'CS'}">
                                        <ion-icon name="create-outline"></ion-icon>
                                        Edit
                                    </button>
                                    <button class="btn-delete-modern" onclick="deleteCourse(${c.id}, '${c.code}')">
                                        <ion-icon name="trash-outline"></ion-icon>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}


function showEditCourseModal(id, code, title, credits, year, dept) {
    modalOverlay.innerHTML = `
        <div class="modal-modern">
            <div class="modal-header">
                <h2>Edit Course</h2>
                <p>Modify course identification and curriculum weight.</p>
            </div>
            <form id="editCourseForm">
                <input type="hidden" name="id" value="${id}">
                
                <div class="input-wrapper">
                    <ion-icon name="finger-print-outline"></ion-icon>
                    <input type="text" name="code" value="${code}" placeholder="Course Code" required class="input-modern">
                </div>

                <div class="input-wrapper">
                    <ion-icon name="book-outline"></ion-icon>
                    <input type="text" name="title" value="${title}" placeholder="Course Title" required class="input-modern">
                </div>

                <div class="input-wrapper">
                    <ion-icon name="business-outline"></ion-icon>
                    <select name="department" required class="input-modern" style="padding-left:40px;">
                        ${DEPARTMENTS.map(d => `<option value="${d}" ${dept == d ? 'selected' : ''}>${d}</option>`).join('')}
                    </select>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div class="input-wrapper">
                        <ion-icon name="timer-outline"></ion-icon>
                        <input type="number" name="credit_hours" value="${credits}" placeholder="Credits" required class="input-modern">
                    </div>
                    <div class="input-wrapper">
                        <ion-icon name="calendar-outline"></ion-icon>
                        <select name="year_level" required class="input-modern" style="padding-left:40px;">
                            <option value="1" ${year == 1 ? 'selected' : ''}>Year 1</option>
                            <option value="2" ${year == 2 ? 'selected' : ''}>Year 2</option>
                            <option value="3" ${year == 3 ? 'selected' : ''}>Year 3</option>
                            <option value="4" ${year == 4 ? 'selected' : ''}>Year 4</option>
                            <option value="5" ${year == 5 ? 'selected' : ''}>Year 5+</option>
                        </select>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-modern secondary" onclick="closeModal()">
                        Dismiss
                    </button>
                    <button type="submit" class="btn-modern primary" id="updateCourseBtn">
                        <ion-icon name="save-outline"></ion-icon>
                        Update Changes
                    </button>
                </div>
            </form>
        </div>
    `;
    modalOverlay.classList.remove('hidden');
    modalOverlay.style.display = 'flex'; // Ensure flex for centering
    
    document.getElementById('editCourseForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('updateCourseBtn');
        const originalContent = btn.innerHTML;
        
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Updating...';

        try {
            const data = Object.fromEntries(new FormData(e.target));
            const res = await fetch('api/admin.php?action=edit_course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.status === 'success') {
                showToast('Course updated successfully!');
                closeModal();
                loadTab('courses');
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        } catch (err) {
            showToast('Connection error', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    };
}

function renderTeachers(teachers) {
    contentArea.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2 style="font-size:1.8rem; font-weight:800; background:linear-gradient(45deg, var(--admin-primary), var(--admin-accent)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Faculty Management</h2>
                <p style="color:var(--text-secondary); font-size:0.9rem;">Manage academic staff and permissions</p>
            </div>
            <button class="btn-primary" onclick="showAddTeacherModal()" style="background:var(--admin-accent); padding:12px 24px; border-radius:12px; font-weight:600; box-shadow:0 4px 12px rgba(59, 130, 246, 0.2);">
                <ion-icon name="person-add-outline" style="font-size:1.2rem;"></ion-icon>
                Register Teacher
            </button>
        </div>
        <div class="card" style="padding:0; overflow:hidden; border-radius:16px; border:1px solid #eef2f6;">
            <table style="border:none;">
                <thead>
                    <tr style="background:#f8fafc;">
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">NAME</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">EMAIL</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9; text-align:right;">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    ${teachers.map(t => `
                        <tr style="transition:all 0.2s;">
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div class="avatar" style="width:32px; height:32px; font-size:0.8rem; background:var(--admin-accent)">${t.name.charAt(0)}</div>
                                    <strong>${t.name}</strong>
                                </div>
                            </td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">${t.email}</td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; gap:8px; justify-content:flex-end;">
                                    <button class="btn-edit-modern" onclick="showEditTeacherModal(${t.id}, '${t.name}', '${t.email}')">
                                        <ion-icon name="create-outline"></ion-icon>
                                        Edit
                                    </button>
                                    <button class="btn-text" onclick="resetPassword(${t.id})" style="color:var(--admin-accent); font-size:0.85rem;">Reset Pass</button>
                                    <button class="btn-delete-modern" onclick="deleteTeacher(${t.id}, '${t.name}')">
                                        <ion-icon name="trash-outline"></ion-icon>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function resetPassword(userId) {
    if(!confirm("Reset this user's password to '123456'?")) return;
    
    const res = await fetch('api/admin.php?action=reset_password', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
    });
    const result = await res.json();
    if(result.status === 'success') {
        alert(result.message);
    }
}

function renderClasses(classes) {
    contentArea.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2 style="font-size:1.8rem; font-weight:800; background:linear-gradient(45deg, var(--admin-primary), var(--admin-accent)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Class Assignment</h2>
                <p style="color:var(--text-secondary); font-size:0.9rem;">Manage course sections and teacher assignments</p>
            </div>
            <button class="btn-primary" onclick="showAddClassModal()" style="background:var(--admin-accent); padding:12px 24px; border-radius:12px; font-weight:600; box-shadow:0 4px 12px rgba(59, 130, 246, 0.2);">
                <ion-icon name="add-outline" style="font-size:1.2rem;"></ion-icon>
                Assign Class
            </button>
        </div>
        <div class="card" style="padding:0; overflow:hidden; border-radius:16px; border:1px solid #eef2f6;">
            <table style="border:none;">
                <thead>
                    <tr style="background:#f8fafc;">
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">COURSE</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">TEACHER</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">SECTION</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">CAPACITY</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9;">SCHEDULE</th>
                        <th style="padding:20px; border-bottom:1px solid #f1f5f9; text-align:right;">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    ${classes.map(c => `
                        <tr style="transition:all 0.2s;">
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <span style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.8rem; width:fit-content;">${c.course_code}</span>
                                    <div style="display:flex; gap:4px;">
                                        <span class="badge" style="background:#f1f5f9; color:var(--admin-primary); font-size:0.6rem;">Yr ${c.year_level || '1'}</span>
                                        <span class="badge" style="background:#f0fdf4; color:#15803d; font-size:0.6rem;">${c.department || 'CS'}</span>
                                    </div>
                                </div>
                            </td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9; font-weight:600; color:var(--admin-primary);">${c.teacher_name}</td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">${c.section_name}</td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <span style="background:${c.enrolled_count >= c.max_students ? '#fef2f2' : '#f0fdf4'}; color:${c.enrolled_count >= c.max_students ? '#ef4444' : '#15803d'}; padding:4px 8px; border-radius:6px; font-size:0.85rem; font-weight:600;">
                                    ${c.enrolled_count} / ${c.max_students} seats
                                </span>
                            </td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; align-items:center; gap:6px; color:var(--text-secondary);">
                                    <ion-icon name="time-outline"></ion-icon>
                                    ${c.schedule_time || 'TBD'}
                                </div>
                            </td>
                            <td style="padding:20px; border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex; gap:8px; justify-content:flex-end;">
                                    <button class="btn-edit-modern" onclick="editClass(${c.id}, ${c.course_id}, ${c.teacher_id}, '${c.section_name}', ${c.max_students}, '${c.schedule_time || ''}')">
                                        <ion-icon name="create-outline"></ion-icon>
                                        Edit
                                    </button>
                                    <button class="btn-delete-modern" onclick="deleteClass(${c.id}, '${c.course_code} - ${c.section_name}')">
                                        <ion-icon name="trash-outline"></ion-icon>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderRollover() {
    contentArea.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 0 auto; text-align: center; padding: 3rem;">
            <ion-icon name="refresh-circle-outline" style="font-size: 5rem; color: var(--admin-accent);"></ion-icon>
            <h2 style="margin: 1.5rem 0;">University Rollover Workflow</h2>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">Triggering a rollover will finalize the current semester and prepare for the next.</p>
            
            <div id="rolloverSteps">
                <button class="btn-primary" onclick="startRolloverPhase1()" style="width:100%; margin-bottom:1rem; background: var(--admin-primary)">1. Phase 1: Lockdown Grades</button>
                <button class="btn-primary disabled" id="phase2Btn" onclick="showRolloverPhase2()" style="width:100%; margin-bottom:1rem; opacity:0.5; pointer-events:none;">2. Phase 2: Setup New Term</button>
                <button class="btn-primary disabled" id="phase3Btn" onclick="finishRollover()" style="width:100%; opacity:0.5; pointer-events:none;">3. Phase 3: Finalize & Promote</button>
            </div>
        </div>
    `;
}

// --- MODAL ACTIONS ---

function showAddCourseModal() {
    modalOverlay.innerHTML = `
        <div class="modal-modern" style="width: 500px;">
            <div class="modal-header">
                <h2>Add New Course</h2>
                <p>Define a new academic course for the department curriculum.</p>
            </div>
            <form id="addCourseForm">
                <div class="input-wrapper">
                    <ion-icon name="finger-print-outline"></ion-icon>
                    <input type="text" name="code" placeholder="Course Code (e.g. CS101)" required class="input-modern">
                </div>

                <div class="input-wrapper">
                    <ion-icon name="book-outline"></ion-icon>
                    <input type="text" name="title" placeholder="Course Title" required class="input-modern">
                </div>

                <div class="input-wrapper">
                    <ion-icon name="business-outline"></ion-icon>
                    <select name="department" required class="input-modern" style="padding-left:40px;">
                        ${DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join('')}
                    </select>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div class="input-wrapper">
                        <ion-icon name="timer-outline"></ion-icon>
                        <input type="number" name="credit_hours" value="3" placeholder="Credits" required class="input-modern">
                    </div>
                    <div class="input-wrapper">
                        <ion-icon name="calendar-outline"></ion-icon>
                        <select name="year_level" required class="input-modern" style="padding-left:40px;">
                            <option value="1">Year 1</option>
                            <option value="2">Year 2</option>
                            <option value="3">Year 3</option>
                            <option value="4">Year 4</option>
                            <option value="5">Year 5+</option>
                        </select>
                    </div>
                </div>

                <div class="input-wrapper">
                    <ion-icon name="chatbox-ellipses-outline" style="top: 25px; transform: none;"></ion-icon>
                    <textarea name="description" placeholder="Course description..." class="input-modern" style="height:100px; padding-top: 12px; resize: none;"></textarea>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-modern secondary" onclick="closeModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn-modern primary" id="saveCourseBtn">
                        <ion-icon name="cloud-upload-outline"></ion-icon>
                        Save Course
                    </button>
                </div>
            </form>
        </div>
    `;
    modalOverlay.classList.remove('hidden');
    modalOverlay.style.display = 'flex';
    
    document.getElementById('addCourseForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveCourseBtn');
        const originalContent = btn.innerHTML;
        
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Saving...';

        try {
            const data = Object.fromEntries(new FormData(e.target));
            const res = await fetch('api/admin.php?action=add_course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.status === 'success') {
                showToast('New course added successfully!');
                closeModal();
                loadTab('courses');
            } else {
                showToast(result.message || 'Saving failed', 'error');
            }
        } catch (err) {
            showToast('Connection error', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    };
}

function showAddTeacherModal() {
    modalOverlay.innerHTML = `
        <div class="modal-modern">
            <div class="modal-header">
                <h2>Register Teacher</h2>
                <p>Create a new faculty profile with secure credentials.</p>
            </div>
            <form id="addTeacherForm">
                <div class="input-wrapper">
                    <ion-icon name="person-outline"></ion-icon>
                    <input type="text" name="name" placeholder="Full Name" required class="input-modern">
                </div>
                <div class="input-wrapper">
                    <ion-icon name="mail-outline"></ion-icon>
                    <input type="email" name="email" placeholder="University Email" required class="input-modern">
                </div>
                <div class="input-wrapper">
                    <ion-icon name="lock-closed-outline"></ion-icon>
                    <input type="password" name="password" placeholder="Initial Password" required class="input-modern">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modern secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-modern primary" id="saveTeacherBtn">
                        <ion-icon name="person-add-outline"></ion-icon>
                        Create Profile
                    </button>
                </div>
            </form>
        </div>
    `;
    modalOverlay.classList.remove('hidden');
    modalOverlay.style.display = 'flex';
    
    document.getElementById('addTeacherForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveTeacherBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Creating...';

        const data = Object.fromEntries(new FormData(e.target));
        const res = await fetch('api/admin.php?action=add_teacher', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast('Teacher registered successfully');
            closeModal();
            loadTab('teachers');
        } else {
            showToast('Failed to register teacher', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Create Profile';
        }
    };
}

async function showAddClassModal() {
    const coursesRes = await fetch('api/admin.php?action=courses');
    const courses = await coursesRes.json();
    const teachersRes = await fetch('api/admin.php?action=teachers');
    const teachers = await teachersRes.json();

    modalOverlay.innerHTML = `
        <div class="modal-modern" style="width: 500px;">
            <div class="modal-header">
                <h2>Assign New Class</h2>
                <p>Link a course to a teacher and set the schedule.</p>
            </div>
            <form id="addClassForm">
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="font-size:0.8rem; color:var(--text-secondary)">Select Course</label>
                    <select name="course_id" required class="input-modern" style="padding-left:12px;">
                        ${courses.map(c => `<option value="${c.id}">${c.code} - ${c.title}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="font-size:0.8rem; color:var(--text-secondary)">Assign Teacher</label>
                    <select name="teacher_id" required class="input-modern" style="padding-left:12px;">
                        ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                    <div>
                        <label style="font-size:0.8rem; color:var(--text-secondary)">Section</label>
                        <input type="text" name="section_name" placeholder="Sec (A/B)" required class="input-modern" style="padding-left:12px;">
                    </div>
                    <div>
                        <label style="font-size:0.8rem; color:var(--text-secondary)">Room / Hall</label>
                        <input type="text" name="room" placeholder="e.g. B-102" required class="input-modern" style="padding-left:12px;">
                    </div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                    <div>
                        <label style="font-size:0.8rem; color:var(--text-secondary)">Max Seats</label>
                        <input type="number" name="max_students" placeholder="Max Seats" value="40" required class="input-modern" style="padding-left:12px;">
                    </div>
                    <div>
                        <label style="font-size:0.8rem; color:var(--text-secondary)">Schedule Time</label>
                        <input type="time" name="schedule_time" value="09:00" class="input-modern" style="padding-left:12px;">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modern secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-modern primary" id="launchBtn">
                        <ion-icon name="rocket-outline"></ion-icon>
                        Launch Class
                    </button>
                </div>
            </form>
        </div>
    `;
    modalOverlay.classList.remove('hidden');
    modalOverlay.style.display = 'flex';

    document.getElementById('addClassForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('launchBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Launching...';

        const data = Object.fromEntries(new FormData(e.target));
        
        try {
            const res = await fetch('api/admin.php?action=add_class', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.status === 'success') {
                showToast('Class assigned successfully');
                closeModal();
                loadTab('classes');
            } else {
                showToast(result.message || 'Failed to assign class', 'error');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } catch (err) {
            showToast('Connection error', 'error');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };
}

// --- ROLLOVER LOGIC ---
let rolloverNewSemId = null;

async function startRolloverPhase1() {
    if(!confirm("Are you sure? This will lock all grading for the current term!")) return;
    const res = await fetch('api/admin.php?action=rollover_phase1', {method:'POST'});
    if(await res.json()) {
        alert("Grades locked. Phase 1 complete.");
        document.getElementById('phase2Btn').classList.remove('disabled');
        document.getElementById('phase2Btn').style.opacity = '1';
        document.getElementById('phase2Btn').style.pointerEvents = 'auto';
    }
}

function showRolloverPhase2() {
    modalOverlay.innerHTML = `
        <div class="modal">
            <h2>Phase 2: Term Setup</h2>
            <form id="phase2Form" style="margin-top:1.5rem;">
                <input type="text" name="new_semester_name" placeholder="New Semester Name (e.g. Fall 2026)" required style="width:100%; margin-bottom:15px; padding:12px; border:1px solid #ddd; border-radius:8px;">
                <div style="margin-bottom:15px;">
                    <input type="checkbox" name="clone_classes" id="cloneCheck" checked>
                    <label for="cloneCheck">Clone classes & schedule from current term?</label>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn-primary" style="background:var(--admin-accent)">Create Term</button>
                </div>
            </form>
        </div>
    `;
    modalOverlay.classList.remove('hidden');

    document.getElementById('phase2Form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.clone_classes = e.target.clone_classes.checked;
        const res = await fetch('api/admin.php?action=rollover_phase2', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await res.json();
        rolloverNewSemId = result.new_id;
        closeModal();
        alert("New term created and classes cloned. Proceed to Promotion.");
        document.getElementById('phase3Btn').classList.remove('disabled');
        document.getElementById('phase3Btn').style.opacity = '1';
        document.getElementById('phase3Btn').style.pointerEvents = 'auto';
    };
}

async function finishRollover() {
    if(!confirm("Final Step: Promote students and flip the switch to live?")) return;
    const res = await fetch('api/admin.php?action=rollover_phase3_4', {
        method: 'POST',
        body: JSON.stringify({ new_sem_id: rolloverNewSemId })
    });
    if(await res.json()) {
        alert("Done! The system is now running on the New Term.");
        location.reload();
    }
}

function closeModal() { modalOverlay.classList.add('hidden'); }

// --- CRUD HELPER FUNCTIONS ---

async function deleteCourse(id, code) {
    if(!confirm(`Are you sure you want to delete course ${code}?`)) return;
    try {
        const res = await fetch('api/admin.php?action=delete_course', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        if(result.status === 'success') {
            showToast('Course deleted successfully');
            loadTab('courses');
        } else {
            showToast(result.message || 'Error deleting course', 'error');
        }
    } catch (err) {
        showToast('Connection error', 'error');
    }
}

async function deleteTeacher(id, name) {
    if(!confirm(`Are you sure you want to delete teacher ${name}?`)) return;
    try {
        const res = await fetch('api/admin.php?action=delete_teacher', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        if(result.status === 'success') {
            showToast('Teacher profile deleted');
            loadTab('teachers');
        } else {
            showToast(result.message || 'Error deleting teacher', 'error');
        }
    } catch (err) {
        showToast('Connection error', 'error');
    }
}

async function deleteStudent(id, name) {
    if(!confirm(`Are you sure you want to delete student ${name}?`)) return;
    try {
        const res = await fetch('api/admin.php?action=delete_student', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        if(result.status === 'success') {
            showToast('Student profile deleted');
            loadTab('students');
        } else {
            showToast(result.message || 'Error deleting student', 'error');
        }
    } catch (err) {
        showToast('Connection error', 'error');
    }
}

async function deleteClass(id, label) {
    if(!confirm(`Are you sure you want to delete class ${label}?`)) return;
    try {
        const res = await fetch('api/admin.php?action=delete_class', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        if(result.status === 'success') {
            showToast('Class assignment removed');
            loadTab('classes');
        } else {
            showToast(result.message || 'Error removing class', 'error');
        }
    } catch (err) {
        showToast('Connection error', 'error');
    }
}

function showEditTeacherModal(id, name, email) {
    modalOverlay.innerHTML = `
        <div class="modal-modern">
            <div class="modal-header">
                <h2>Edit Teacher</h2>
                <p>Update faculty member information.</p>
            </div>
            <form id="editTeacherForm">
                <input type="hidden" name="id" value="${id}">
                <div class="input-wrapper">
                    <ion-icon name="person-outline"></ion-icon>
                    <input type="text" name="name" value="${name}" placeholder="Full Name" required class="input-modern">
                </div>
                <div class="input-wrapper">
                    <ion-icon name="mail-outline"></ion-icon>
                    <input type="email" name="email" value="${email}" placeholder="Email Address" required class="input-modern">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modern secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-modern primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    modalOverlay.classList.remove('hidden');
    modalOverlay.style.display = 'flex';

    document.getElementById('editTeacherForm').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const res = await fetch('api/admin.php?action=edit_teacher', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if(result.status === 'success') {
            showToast('Teacher profile updated');
            closeModal();
            loadTab('teachers');
        }
    };
}

function showEditStudentModal(id, name, email, schoolId, gradeLevel, department) {
    modalOverlay.innerHTML = `
        <div class="modal-modern">
            <div class="modal-header">
                <h2>Edit Student Profile</h2>
                <p>Update student credentials and identification.</p>
            </div>
            <form id="editStudentForm">
                <input type="hidden" name="id" value="${id}">
                <div class="input-wrapper">
                    <ion-icon name="person-outline"></ion-icon>
                    <input type="text" name="name" value="${name}" placeholder="Full Name" required class="input-modern">
                </div>
                <div class="input-wrapper">
                    <ion-icon name="mail-outline"></ion-icon>
                    <input type="email" name="email" value="${email}" placeholder="Email Address" required class="input-modern">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                     <div class="input-wrapper">
                        <ion-icon name="calendar-outline"></ion-icon>
                        <select name="grade_level" required class="input-modern" style="padding-left:40px;">
                            <option value="1" ${gradeLevel == 1 ? 'selected' : ''}>Year 1</option>
                            <option value="2" ${gradeLevel == 2 ? 'selected' : ''}>Year 2</option>
                            <option value="3" ${gradeLevel == 3 ? 'selected' : ''}>Year 3</option>
                            <option value="4" ${gradeLevel == 4 ? 'selected' : ''}>Year 4</option>
                            <option value="5" ${gradeLevel == 5 ? 'selected' : ''}>Year 5+</option>
                        </select>
                    </div>
                    <div class="input-wrapper">
                         <ion-icon name="business-outline"></ion-icon>
                        <select name="department" required class="input-modern" style="padding-left:40px;">
                            ${DEPARTMENTS.map(d => `<option value="${d}" ${department == d ? 'selected' : ''}>${d}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="input-wrapper">
                    <ion-icon name="id-card-outline"></ion-icon>
                    <input type="text" name="school_id" value="${schoolId}" placeholder="Student ID" required class="input-modern">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modern secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-modern primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    modalOverlay.classList.remove('hidden');
    modalOverlay.style.display = 'flex';

    document.getElementById('editStudentForm').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const res = await fetch('api/admin.php?action=edit_student', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if(result.status === 'success') {
            showToast('Student profile updated');
            closeModal();
            loadTab('students');
        }
    };
}

async function editClass(id, courseId, teacherId, section, maxStudents, schedule) {
    const coursesRes = await fetch('api/admin.php?action=courses');
    const courses = await coursesRes.json();
    const teachersRes = await fetch('api/admin.php?action=teachers');
    const teachers = await teachersRes.json();

    modalOverlay.innerHTML = `
        <div class="modal-modern" style="width: 500px;">
            <div class="modal-header">
                <h2>Edit Class Assignment</h2>
                <p>Adjust section details and scheduling.</p>
            </div>
            <form id="editClassForm">
                <input type="hidden" name="id" value="${id}">
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="font-size:0.8rem; color:var(--text-secondary)">Course</label>
                    <select name="course_id" required class="input-modern" style="padding-left:12px;">
                        ${courses.map(c => `<option value="${c.id}" ${c.id == courseId ? 'selected' : ''}>${c.code} - ${c.title}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="font-size:0.8rem; color:var(--text-secondary)">Teacher</label>
                    <select name="teacher_id" required class="input-modern" style="padding-left:12px;">
                        ${teachers.map(t => `<option value="${t.id}" ${t.id == teacherId ? 'selected' : ''}>${t.name}</option>`).join('')}
                    </select>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                    <div>
                        <label style="font-size:0.8rem; color:var(--text-secondary)">Section</label>
                        <input type="text" name="section_name" value="${section}" required class="input-modern" style="padding-left:12px;">
                    </div>
                    <div>
                        <label style="font-size:0.8rem; color:var(--text-secondary)">Seats</label>
                        <input type="number" name="max_students" value="${maxStudents}" required class="input-modern" style="padding-left:12px;">
                    </div>
                </div>
                <div class="form-group">
                    <label style="font-size:0.8rem; color:var(--text-secondary)">Schedule Time</label>
                    <input type="time" name="schedule_time" value="${schedule}" class="input-modern" style="padding-left:12px;">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modern secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-modern primary">Update Assignment</button>
                </div>
            </form>
        </div>
    `;
    modalOverlay.classList.remove('hidden');
    modalOverlay.style.display = 'flex';

    document.getElementById('editClassForm').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const res = await fetch('api/admin.php?action=edit_class', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if(result.status === 'success') {
            showToast('Class assignment updated');
            closeModal();
            loadTab('classes');
        }
    };
}
function renderGradeScale(scale) {
    contentArea.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2 style="font-size:1.8rem; font-weight:800; background:linear-gradient(45deg, var(--admin-primary), var(--admin-accent)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">University Grade Policy</h2>
                <p style="color:var(--text-secondary); font-size:0.9rem;">Define how scores map to letter grades and GPA points</p>
            </div>
            <button class="btn-primary" onclick="addGradeScaleRow()" style="background:var(--admin-accent); padding:12px 24px; border-radius:12px; font-weight:600;">
                <ion-icon name="add-outline" style="font-size:1.2rem;"></ion-icon>
                Add Range
            </button>
        </div>

        <div class="card" style="padding:2rem;">
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:2px solid #f1f5f9;">
                            <th style="padding:15px; text-align:center; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Min Score (%)</th>
                            <th style="padding:15px; text-align:center; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Max Score (%)</th>
                            <th style="padding:15px; text-align:center; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Letter Grade</th>
                            <th style="padding:15px; text-align:center; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Grade Points</th>
                            <th style="padding:15px; text-align:center;">ACTION</th>
                        </tr>
                    </thead>
                    <tbody id="gradeScaleBody">
                        ${scale.length > 0 ? scale.map(row => createGradeRowHTML(row)).join('') : '<tr id="emptyScale"><td colspan="5" style="padding:40px; text-align:center; color:#94a3b8;">No grade ranges defined. Click "Add Range" to start.</td></tr>'}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top:2rem; display:flex; justify-content:flex-end; border-top:1px solid #f1f5f9; padding-top:20px;">
                <button class="btn-primary" onclick="saveGradeScale()" style="background:var(--admin-primary); padding:15px 40px; font-weight:800; box-shadow:0 10px 15px -3px rgba(30, 41, 59, 0.2);">
                    <ion-icon name="cloud-upload-outline"></ion-icon> PUBLISH ACADEMIC POLICY
                </button>
            </div>
        </div>
    `;
}

function createGradeRowHTML(row = {min_score: '', max_score: '', grade: '', grade_point: ''}) {
    const inputStyle = `
        width:120px; 
        padding:12px; 
        font-size:1.1rem; 
        font-weight:700; 
        text-align:center; 
        color:var(--admin-primary); 
        border:2px solid #f1f5f9; 
        border-radius:12px;
        outline:none;
    `;
    const gradeStyle = inputStyle + ' font-weight:900; width:100px; color:var(--admin-accent);';

    return `
        <tr class="grade-row" style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:15px; text-align:center;">
                <input type="number" class="scale-min" value="${row.min_score}" step="0.01" style="${inputStyle}">
            </td>
            <td style="padding:15px; text-align:center;">
                <input type="number" class="scale-max" value="${row.max_score}" step="0.01" style="${inputStyle}">
            </td>
            <td style="padding:15px; text-align:center;">
                <input type="text" class="scale-grade" value="${row.grade}" placeholder="A+" style="${gradeStyle}">
            </td>
            <td style="padding:15px; text-align:center;">
                <input type="number" class="scale-point" value="${row.grade_point}" step="0.01" style="${inputStyle}">
            </td>
            <td style="padding:15px; text-align:center;">
                <button class="btn-text" onclick="this.closest('tr').remove()" style="color:#ef4444; font-size:1.5rem; display:flex; align-items:center; justify-content:center; width:100%; border:none; background:none; cursor:pointer;">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </td>
        </tr>
    `;
}

function addGradeScaleRow() {
    const body = document.getElementById('gradeScaleBody');
    const emptyRow = document.getElementById('emptyScale');
    if (emptyRow) emptyRow.remove();
    
    const tr = document.createElement('tr');
    tr.innerHTML = createGradeRowHTML();
    body.appendChild(tr.firstElementChild || tr);
}

async function saveGradeScale() {
    const rows = document.querySelectorAll('.grade-row');
    const scale = Array.from(rows).map(r => ({
        min_score: r.querySelector('.scale-min').value,
        max_score: r.querySelector('.scale-max').value,
        grade: r.querySelector('.scale-grade').value,
        grade_point: r.querySelector('.scale-point').value
    }));

    if (scale.some(s => !s.min_score || !s.max_score || !s.grade || s.grade_point === "")) {
        return showToast("Please fill all fields for all ranges.", "error");
    }

    try {
        const res = await fetch('api/admin.php?action=save_grade_scale', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ scale })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast("Academic Grade Policy published successfully!");
            loadTab('grade_scale');
        }
    } catch (err) {
        showToast("Failed to save scale.", "error");
    }
}
