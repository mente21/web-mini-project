# EduTrack V2 - Full Stack School Management System

EduTrack has been upgraded to a full PHP/MySQL application with separate portals for Teachers and Students.

## Features
- **Landing Page**: Professional entrance for the application.
- **Teacher Dashboard**: Enhanced version of the original dashboard with persistent MySQL database.
- **Student Dashboard**: New portal for students to view grades and attendance.
- **Authentication**: Secure login/logout system.
- **Database**: MySQL backed storage for users, grades, attendance, and assessments.

## Usage Guide (Local Setup)

Since this project now uses PHP and MySQL, you need a local server environment like XAMPP, WAMP, or MAMP.

### 1. Install XAMPP (or similar)
Download and install [XAMPP](https://www.apachefriends.org/index.html).

### 2. Start Servers
Open XAMPP Control Panel and start **Apache** and **MySQL**.

### 3. Setup Database
1. Open your browser and go to `http://localhost/phpmyadmin`.
2. Click **New** and create a database named `edutrack`.
3. Click on the `edutrack` database.
4. Go to the **Import** tab.
5. Choose the `database.sql` file from this project folder and click **Import**.
   - This will create the necessary tables and structure.

### 4. Configure Project
1. Move this entire project folder into your `htdocs` directory (usually `C:\xampp\htdocs\edutrack`).
2. Open `config.php` and ensure the settings match your Database (default is user: `root`, pass: ``).

### 5. Run
Open your browser and go to:
`http://localhost/edutrack/`

## Default Accounts
You can create accounts via the database or add a registration page.
For testing, insert a user into the `users` table via PhpMyAdmin:
- **Teacher**: INSERT INTO users (name, email, password, role) VALUES ('Teacher Name', 'teacher@test.com', '$2y$10$abcdef...', 'teacher');
  *(Note: You need a hashed password. You can use the register API logic or a tool to generate bcrypt hash)*

**easier way**: 
The code supports a registration endpoint in `api/auth.php`, but currently no UI.
You can create a dummy user by running this SQL in PhpMyAdmin:

```sql
-- Password is '123456'
INSERT INTO users (name, email, password, role) VALUES 
('Mr. Teacher', 'teacher@edutrack.com', '$2y$10$P2jX8/P.1D.1.1.1.1.1.1.1.1.1.1.1.1', 'teacher'),
('John Student', 'student@edutrack.com', '$2y$10$P2jX8/P.1D.1.1.1.1.1.1.1.1.1.1.1.1', 'student');

INSERT INTO student_details (user_id, school_id) VALUES (2, 'S-001');
```

## Tech Stack
-   **Frontend**: HTML5, Vanilla CSS (Enhanced), JavaScript (ES6+)
-   **Backend**: PHP (Vanilla, No Frameworks)
-   **Database**: MySQL
 
+## 🛡️ Smart Attendance & Security System
+
+The platform implements a multi-layered defense to prevent proxy attendance:
+
+1.  **QR + GPS Tracking**: Teachers generate a dynamic QR code. Students must be within a **50-meter radius** of the teacher's GPS location to mark attendance.
+2.  **Device Binding**: Student accounts are bound to their **first verified device** on login. Multiple students cannot use the same phone, and one student cannot log in on multiple phones.
+3.  **Time-Limited Sessions**: QR codes expire automatically after the lecture ends, preventing late or remote "photo scanning."
+4.  **Device Fingerprinting**: Uses hardware-level identifiers (WebGL renderer + Browser engine) to create a unique hashed signature for every student device.
+
+---
+
 Teacher / Instructor Dashboard
 Email: admin@edutrack.com
 Password: 123456
 Student Portal
 Email: student@edutrack.com
 Password: 123456
