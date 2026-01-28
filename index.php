<?php
include 'config.php';
if (isset($_SESSION['user_id'])) {
    if ($_SESSION['role'] === 'admin') {
        header("Location: admin_dashboard.php");
    } elseif ($_SESSION['role'] === 'teacher') {
        header("Location: teacher_dashboard.php");
    } else {
        header("Location: student_dashboard.php");
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arba Minch University | Official Portal</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Styles -->
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/landing.css">
    <!-- Icons -->
    <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
</head>
<body>

    <!-- Header / Navbar -->
    <nav class="navbar" id="navbar">
        <a href="index.php" class="logo-container">
            <img src="assets/img/amu-logo.png" alt="AMU Logo" class="logo-img">
            <span>ARBA MINCH UNIVERSITY</span>
        </a>
        <ul class="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#academics">Academics</a></li>
            <li><a href="#news">News</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#" class="login-btn" onclick="openLogin()">Student Portal</a></li>
        </ul>
        <div class="mobile-menu-btn" style="display:none; color:white; font-size:2rem; cursor:pointer;">
            <ion-icon name="menu-outline"></ion-icon>
        </div>
    </nav>

    <!-- Hero Carousel -->
    <div class="hero-carousel" id="home">
        <!-- Slide 1 -->
        <div class="slide active">
            <div class="slide-bg" style="background-image: url('assets/img/hero-bg-1.png')"></div>
            <div class="slide-content">
                <h1>Education for Development</h1>
                <p>Welcome to Arba Minch University, a center of excellence in Water Technology, Engineering, and Health Sciences. Shaping the future of Ethiopia since 1986.</p>
                <div class="cta-group" style="display:flex; gap:1.5rem; justify-content:center;">
                    <a href="#academics" class="btn btn-primary" style="background:var(--amu-gold); color:var(--amu-blue);">Explore Programs</a>
                    <a href="#about" class="btn btn-outline">Read More</a>
                </div>
            </div>
        </div>
        <!-- Slide 2 -->
        <div class="slide">
            <div class="slide-bg" style="background-image: url('assets/img/hero-bg-2.png')"></div>
            <div class="slide-content">
                <h1>Academic Excellence</h1>
                <p>Equipping students with modern resources, state-of-the-art libraries, and a vibrant campus culture conducive to learning and research.</p>
                <div class="cta-group" style="display:flex; gap:1.5rem; justify-content:center;">
                    <a href="#" onclick="openLogin()" class="btn btn-primary" style="background:var(--amu-gold); color:var(--amu-blue);">Apply Now</a>
                    <a href="#" class="btn btn-outline">Virtual Tour</a>
                </div>
            </div>
        </div>
        <!-- Slide 3 -->
        <div class="slide">
            <div class="slide-bg" style="background-image: url('assets/img/hero-bg-3.png')"></div>
            <div class="slide-content">
                <h1>Research & Innovation</h1>
                <p>Leading the way in water resource management and technological innovation. Our laboratories are the heartbeat of discovery.</p>
                <div class="cta-group" style="display:flex; gap:1.5rem; justify-content:center;">
                    <a href="#" class="btn btn-primary" style="background:var(--amu-gold); color:var(--amu-blue);">Our Research</a>
                    <a href="#contact" class="btn btn-outline">Collaborate</a>
                </div>
            </div>
        </div>

        <!-- Carousel Navigation -->
        <button class="carousel-btn prev-btn"><ion-icon name="chevron-back-outline"></ion-icon></button>
        <button class="carousel-btn next-btn"><ion-icon name="chevron-forward-outline"></ion-icon></button>
    </div>

    <!-- Stats Banner -->
    <section class="stats-banner">
        <div class="stat-box">
            <h2 id="count1">0</h2>
            <p>Undergraduate Programs</p>
        </div>
        <div class="stat-box">
            <h2 id="count2">0</h2>
            <p>Graduate Programs</p>
        </div>
        <div class="stat-box">
            <h2 id="count3">0</h2>
            <p>PhD Programs</p>
        </div>
        <div class="stat-box">
            <h2 id="count4">0</h2>
            <p>Colleges & Institutes</p>
        </div>
    </section>

    <!-- President's Message -->
    <section class="section president-section" id="about">
        <div class="president-img">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="AMU President">
        </div>
        <div class="president-text">
            <h3>Message from the President</h3>
            <blockquote>
                "Our mission is to produce competent graduates, conduct problem-solving research, and provide community service that addresses the needs of our nation. Arba Minch University is not just a place of learning, but a catalyst for change."
            </blockquote>
            <p>Since its inception as the Arba Minch Water Technology Institute (AWTI) in 1986, AMU has grown to become one of the most prestigious comprehensive universities in Ethiopia. We take pride in our specialized focus on water and engineering while expanding into medicine, agriculture, and business.</p>
            <br>
            <a href="#" class="btn btn-primary">Our History & Vision</a>
        </div>
    </section>

    <!-- Colleges / Academics -->
    <section class="section" id="academics">
        <div class="section-title">
            <h2>Our Academics</h2>
            <div class="underline"></div>
            <p style="margin-top:1.5rem; color:var(--text-muted); max-width:600px; margin-inline:auto;">Discover our specialized colleges and institutes dedicated to fostering innovation and expertise.</p>
        </div>
        <div class="grid-3">
            <div class="college-card">
                <div class="news-img" style="background-image: url('assets/img/college-tech.png'); height: 200px;"></div>
                <div style="padding: 2rem;">
                    <div class="college-icon"><ion-icon name="construct"></ion-icon></div>
                    <h3>Institute of Technology</h3>
                    <p style="font-size:0.9rem; color:var(--text-muted);">A pioneer in engineering education, offering diverse programs from Civil to Computer Engineering.</p>
                </div>
            </div>
            <div class="college-card">
                <div class="news-img" style="background-image: url('assets/img/college-water.png'); height: 200px;"></div>
                <div style="padding: 2rem;">
                    <div class="college-icon"><ion-icon name="water"></ion-icon></div>
                    <h3>Water Institute</h3>
                    <p style="font-size:0.9rem; color:var(--text-muted);">Ethiopia's premier institute for water resource management, irrigation, and hydraulic engineering.</p>
                </div>
            </div>
            <div class="college-card">
                <div class="news-img" style="background-image: url('assets/img/college-health.png'); height: 200px;"></div>
                <div style="padding: 2rem;">
                    <div class="college-icon"><ion-icon name="pulse"></ion-icon></div>
                    <h3>Medicine & Health</h3>
                    <p style="font-size:0.9rem; color:var(--text-muted);">Preparing the next generation of doctors and health professionals at the Arba Minch Health Science campus.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- News Section -->
    <section class="section" id="news" style="background:#f8f9fa;">
        <div class="section-title">
            <h2>Latest News & Events</h2>
            <div class="underline"></div>
        </div>
        <div class="grid-3">
            <div class="news-card">
                <div class="news-img" style="background-image: url('https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')"></div>
                <div class="news-body">
                    <span class="news-date">January 15, 2026</span>
                    <h4>AMU Hosts International Water Symposium</h4>
                    <p style="font-size:0.9rem; color:var(--text-muted);">Scientists from around the globe gathered at AMU to discuss sustainable water management strategies.</p>
                    <a href="#" style="color:var(--amu-blue); font-weight:700; text-decoration:none; display:block; margin-top:1rem;">Read More &rarr;</a>
                </div>
            </div>
            <div class="news-card">
                <div class="news-img" style="background-image: url('https://images.unsplash.com/photo-1523050335191-2dc6d67e2a4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')"></div>
                <div class="news-body">
                    <span class="news-date">January 12, 2026</span>
                    <h4>Graduation Ceremony 2026 Schedule</h4>
                    <p style="font-size:0.9rem; color:var(--text-muted);">Information regarding the upcoming graduation ceremony for the class of 2026 is now available.</p>
                    <a href="#" style="color:var(--amu-blue); font-weight:700; text-decoration:none; display:block; margin-top:1rem;">Read More &rarr;</a>
                </div>
            </div>
            <div class="news-card">
                <div class="news-img" style="background-image: url('https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"></div>
                <div class="news-body">
                    <span class="news-date">January 10, 2026</span>
                    <h4>New Research Grant for Bio-Tech Lab</h4>
                    <p style="font-size:0.9rem; color:var(--text-muted);">The Ministry of Science has awarded AMU a major grant to expand bioinformatics research facilities.</p>
                    <a href="#" style="color:var(--amu-blue); font-weight:700; text-decoration:none; display:block; margin-top:1rem;">Read More &rarr;</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="main-footer" id="contact">
        <div class="footer-top">
            <div class="footer-col footer-logo-box">
                <img src="assets/img/amu-logo.png" alt="AMU Logo">
                <p style="color:#a0aec0; margin-top:1rem; font-size:0.9rem;">Education for Development. Shaping minds, building the nation.</p>
            </div>
            <div class="footer-col">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="#">Academic Calendar</a></li>
                    <li><a href="#">E-Learning (LMS)</a></li>
                    <li><a href="#">Digital Library</a></li>
                    <li><a href="#">Student Union</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>University Info</h4>
                <ul>
                    <li><a href="#">Announcements</a></li>
                    <li><a href="#">Vacancies</a></li>
                    <li><a href="#">Research Policy</a></li>
                    <li><a href="#">Community Service</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Contact Details</h4>
                <ul style="color:#a0aec0; font-size:0.9rem;">
                    <li style="display:flex; gap:10px; margin-bottom:1rem;"><ion-icon name="pin" style="color:var(--amu-gold)"></ion-icon> Arba Minch, Ethiopia</li>
                    <li style="display:flex; gap:10px; margin-bottom:1rem;"><ion-icon name="mail" style="color:var(--amu-gold)"></ion-icon> info@amu.edu.et</li>
                    <li style="display:flex; gap:10px; margin-bottom:1rem;"><ion-icon name="call" style="color:var(--amu-gold)"></ion-icon> +251 46 881 1414</li>
                </ul>
                <div style="display:flex; gap:15px; font-size:1.5rem; margin-top:1.5rem;">
                    <a href="#" style="color:white"><ion-icon name="logo-facebook"></ion-icon></a>
                    <a href="#" style="color:white"><ion-icon name="logo-twitter"></ion-icon></a>
                    <a href="#" style="color:white"><ion-icon name="logo-linkedin"></ion-icon></a>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 Arba Minch University. All Rights Reserved. | Site by EduTrack Team.</p>
        </div>
    </footer>

    <!-- Login Modal -->
    <div id="loginOverlay" class="modal-overlay hidden" style="background: rgba(0,26,51,0.9); backdrop-filter: blur(10px);">
        <div class="modal login-modal" style="border-radius:24px; padding:3rem; border: 1px solid rgba(255,255,255,0.1); width:450px;">
            <div style="text-align:center; margin-bottom:2.5rem;">
                <img src="assets/img/amu-logo.png" style="height:70px; margin-bottom:1rem;">
                <h2 style="color:var(--amu-blue); font-size:1.8rem;">University Portal</h2>
                <p style="color:var(--text-muted); font-size:0.9rem;">Please enter your credentials to login</p>
            </div>
            
            <!-- Login Form -->
            <form id="loginForm">
                <div class="form-group" style="margin-bottom:1.5rem;">
                    <label style="color:var(--amu-blue); font-weight:700;">University Email or ID</label>
                    <input type="text" name="email" required placeholder="User ID (NSR/...) or Email" style="padding:15px; border-radius:12px; border:2px solid #eee; width:100%; transition:all 0.3s;" onfocus="this.style.borderColor='var(--amu-blue)'" onblur="this.style.borderColor='#eee'">
                </div>
                <div class="form-group" style="margin-bottom:2rem;">
                    <label style="color:var(--amu-blue); font-weight:700;">Password</label>
                    <input type="password" name="password" required placeholder="••••••••" style="padding:15px; border-radius:12px; border:2px solid #eee; width:100%; transition:all 0.3s;" onfocus="this.style.borderColor='var(--amu-blue)'" onblur="this.style.borderColor='#eee'">
                </div>
                <button type="submit" class="btn-primary" style="width:100%; border-radius:12px; padding:15px; justify-content:center; background:var(--amu-blue); color:white; font-size:1.1rem; font-weight:700;">Sign In to Dashboard</button>
            </form>

            <div style="text-align:center; margin-top:2rem;">
                <div style="height:1px; background:#eee; margin:1.5rem 0;"></div>
                
                <?php
                // Check if registration is open
                $activeSem = $pdo->query("SELECT * FROM semesters WHERE is_active = 1")->fetch();
                $regOpen = false;
                $deadlineChoice = '';
                if ($activeSem && isset($activeSem['registration_deadline']) && $activeSem['registration_deadline'] && strtotime($activeSem['registration_deadline']) > time()) {
                    $regOpen = true;
                    $deadlineChoice = date('M d, Y', strtotime($activeSem['registration_deadline']));
                }
                ?>

                <?php if ($regOpen): ?>
                    <div style="margin-top:10px;">
                        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">New to AMU?</p>
                        <button onclick="openRegModal()" class="btn-primary" style="width:100%; border-radius:12px; padding:14px; background:var(--amu-gold); color:var(--amu-blue); font-size:1rem; font-weight:800; border:none; box-shadow: 0 4px 15px rgba(255,215,0,0.2);">
                            <ion-icon name="person-add-outline" style="margin-right:8px;"></ion-icon>
                            Create Student Account
                        </button>
                        <p style="font-size:0.75rem; color:var(--amu-gold); font-weight:600; margin-top:10px;">
                            Registration finishes <?php echo $deadlineChoice; ?>
                        </p>
                    </div>
                <?php endif; ?>

                <button class="btn-text" onclick="closeLogin()" style="color:var(--text-muted); font-weight:600;">Cancel & Close</button>
            </div>
        </div>
    </div>

    <!-- Registration Modal -->
    <div id="regOverlay" class="modal-overlay hidden" style="background: rgba(0,26,51,0.95); backdrop-filter: blur(10px); z-index: 2000;">
        <div class="modal" style="border-radius:24px; padding:2rem; border: 1px solid rgba(255,255,255,0.1); width:600px; max-height: 90vh; overflow-y: auto;">
            <div style="text-align:center; margin-bottom:2rem;">
                <h2 style="color:var(--amu-blue);">New Student Registration</h2>
                <p style="color:grey;">Complete this form to generate your unique Student ID.</p>
            </div>
            <form id="regForm">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                    <input type="text" name="first_name" placeholder="First Name" required style="padding:12px; border-radius:8px; border:1px solid #ddd;">
                    <input type="text" name="last_name" placeholder="Last Name" required style="padding:12px; border-radius:8px; border:1px solid #ddd;">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                    <select name="gender" required style="padding:12px; border-radius:8px; border:1px solid #ddd; width:100%;">
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                    <input type="date" name="dob" required style="padding:12px; border-radius:8px; border:1px solid #ddd; width:100%;">
                </div>
                <input type="tel" name="phone" placeholder="Phone Number" required style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd; margin-bottom:15px;">
                <input type="text" name="address" placeholder="Residential Address / Region" required style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd; margin-bottom:15px;">
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                    <select name="grade_level" required style="padding:12px; border-radius:8px; border:1px solid #ddd; width:100%;">
                        <option value="">Select Academic Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year+</option>
                    </select>
                    <select name="department" required style="padding:12px; border-radius:8px; border:1px solid #ddd; width:100%;">
                        <option value="">Select Department</option>
                        <option value="CS">Computer Science (CS)</option>
                        <option value="Software Eng">Software Engineering</option>
                        <option value="IT">Information Technology (IT)</option>
                        <option value="Electrical">Electrical Eng</option>
                        <option value="Mechanical">Mechanical Eng</option>
                        <option value="Civil">Civil Eng</option>
                        <option value="Water Eng">Water Resources Eng</option>
                    </select>
                </div>
                
                <hr style="margin:20px 0; border:0; border-top:1px solid #eee;">
                
                <label style="display:block; margin-bottom:5px; font-weight:600; color:var(--amu-blue);">Create Access Password</label>
                <input type="password" name="password" placeholder="Create a strong password" required style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd; margin-bottom:20px;">
                
                <div style="display:flex; justify-content:flex-end; gap:15px;">
                    <button type="button" class="btn-text" onclick="document.getElementById('regOverlay').classList.add('hidden')" style="color:grey;">Cancel</button>
                    <button type="submit" class="btn-primary" style="background:var(--amu-gold); color:var(--amu-blue); font-weight:bold; padding:12px 25px; border-radius:8px;">Submit Registration</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Scripts -->
    <script>
        // Navbar Scroll effect
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            if(window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Carousel Logic
        const slides = document.querySelectorAll('.slide');
        const nextBtn = document.querySelector('.next-btn');
        const prevBtn = document.querySelector('.prev-btn');
        let currentSlide = 0;

        function showSlide(index) {
            slides.forEach(s => s.classList.remove('active'));
            slides[index].classList.add('active');
        }

        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        });

        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        });

        // Auto-scroll Carousel
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }, 8000);

        // Counter Animation
        function animateCounter(id, target) {
            let count = 0;
            const duration = 2000;
            const stepTime = Math.abs(Math.floor(duration / target));
            const timer = setInterval(() => {
                count += 1;
                document.getElementById(id).innerText = count;
                if (count == target) clearInterval(timer);
            }, stepTime);
        }

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    animateCounter('count1', 74);
                    animateCounter('count2', 115);
                    animateCounter('count3', 27);
                    animateCounter('count4', 9);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, {threshold: 0.5});
        statsObserver.observe(document.querySelector('.stats-banner'));

        // Modal Logic
        function openLogin() {
            document.getElementById('loginOverlay').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
        function closeLogin() {
            document.getElementById('loginOverlay').classList.add('hidden');
            document.body.style.overflow = 'auto';
        }

        function openRegModal() {
            document.getElementById('loginOverlay').classList.add('hidden'); // Close login
            document.getElementById('regOverlay').classList.remove('hidden');
        }

        // Registration Submit
        document.getElementById('regForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Creating Profile...';
            btn.disabled = true;

            const data = Object.fromEntries(new FormData(e.target));
            
            try {
                const res = await fetch('api/auth.php?action=student_register', {
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                
                if (result.status === 'success') {
                    // Success!
                    document.getElementById('regOverlay').classList.add('hidden');
                    alert(`✅ REGISTRATION SUCCESSFUL!\n\nYour Student ID is: ${result.school_id}\n\nPlease WRITE THIS DOWN immediately. You will need it to login.`);
                    
                    // Re-open login with ID pre-filled
                    openLogin();
                    document.querySelector('input[name="email"]').value = result.school_id; // Auto-fill ID
                } else {
                    alert('Registration Failed: ' + result.message);
                }
            } catch (err) {
                console.error(err);
                alert("Connection failed. Please check server.");
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });

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

        // Login Submit
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Verifying Device...';
            btn.disabled = true;

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.device_token = await getDeviceFingerprint();

            try {
                const res = await fetch('api/auth.php?action=login&t=' + Date.now(), {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                
                const responseText = await res.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (e) {
                    console.error("Server returned non-JSON:", responseText);
                    throw new Error("The server returned an invalid response. This usually means there is a PHP error. Check your database connection.");
                }

                if (result.status === 'success') {
                    window.location.href = result.redirect;
                } else {
                    alert(result.message || 'Login failed');
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                alert('Connection Error: ' + err.message + '\n\nPlease ensure update_db.php has been run and WAMP/MySQL is active.');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
        // Smooth Scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if(target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    </script>
</body>
</html>
