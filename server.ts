import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./src/lib/db.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    try {
      db.prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)")
        .run(id, name, email, hashedPassword, role);
      res.status(201).json({ message: "User registered" });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user: any = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    
    if (user) {
      const resetToken = uuidv4();
      const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour
      db.prepare("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?")
        .run(resetToken, expiry, user.id);
      
      // In a real app, send email. For this demo, we'll return the token
      // so the user can complete the flow.
      console.log(`Password reset for ${email}: ${resetToken}`);
      return res.json({ message: "If an account exists with this email, a reset link has been sent.", debugToken: resetToken });
    }
    
    res.json({ message: "If an account exists with this email, a reset link has been sent." });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    const user: any = db.prepare("SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > ?")
      .get(token, new Date().toISOString());

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?")
      .run(hashedPassword, user.id);

    res.json({ message: "Password reset successful" });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, onboarding_completed: !!user.onboarding_completed } });
  });

  // Middleware for Auth
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- Profile Routes ---
  app.get("/api/profile", authenticate, (req: any, res) => {
    const user: any = db.prepare("SELECT id, name, email, role, level, department, matric_number, staff_id, phone_number, onboarding_completed FROM users WHERE id = ?").get(req.user.id);
    res.json({ ...user, onboarding_completed: !!user.onboarding_completed });
  });

  app.put("/api/profile", authenticate, (req: any, res) => {
    const { name, email, level, department, matric_number, staff_id, phone_number, onboarding_completed } = req.body;
    try {
      const currentUser: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
      
      const finalMatric = matric_number !== undefined ? (matric_number === '' ? null : matric_number) : currentUser.matric_number;
      // If lecturer, staff_id is optional and can be null (we use email as unique ID)
      const finalStaff = staff_id !== undefined ? (staff_id === '' ? null : staff_id) : currentUser.staff_id;

      db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, level = ?, department = ?, matric_number = ?, staff_id = ?, phone_number = ?, onboarding_completed = ? 
        WHERE id = ?
      `).run(
        name || currentUser.name, 
        email || currentUser.email, 
        level || currentUser.level, 
        department || currentUser.department, 
        finalMatric, 
        finalStaff, 
        phone_number || currentUser.phone_number,
        onboarding_completed !== undefined ? (onboarding_completed ? 1 : 0) : currentUser.onboarding_completed, 
        req.user.id
      );
      res.json({ message: "Profile updated" });
    } catch (e: any) {
      console.error("Profile update error:", e);
      let errorMsg = "Email, Matric Number, or Staff ID already exists";
      if (e.message?.includes("UNIQUE constraint failed: users.email")) {
        errorMsg = "This email is already registered to another account.";
      } else if (e.message?.includes("idx_users_matric") || e.message?.includes("users.matric_number")) {
        errorMsg = "This matric number is already registered to another student.";
      } else if (e.message?.includes("idx_users_staff") || e.message?.includes("users.staff_id")) {
        // Only show this if it wasn't null
        errorMsg = "This staff ID is already registered to another lecturer.";
      }
      res.status(400).json({ error: errorMsg });
    }
  });

  // --- Student Course Routes ---
  app.get("/api/courses/available", authenticate, (req: any, res) => {
    const user: any = db.prepare("SELECT level, department FROM users WHERE id = ?").get(req.user.id);
    if (!user.level || !user.department) {
      return res.json([]);
    }

    const courses = db.prepare(`
      SELECT c.*, u.name as lecturer_name 
      FROM courses c 
      JOIN users u ON c.lecturer_id = u.id
      WHERE c.level = ? AND c.department = ?
      AND c.id NOT IN (SELECT course_id FROM course_registrations WHERE student_id = ?)
    `).all(user.level, user.department, req.user.id);
    res.json(courses);
  });

  app.post("/api/courses/register", authenticate, (req: any, res) => {
    const { course_id, semester } = req.body;
    const id = uuidv4();
    try {
      db.prepare("INSERT INTO course_registrations (id, course_id, student_id, semester) VALUES (?, ?, ?, ?)")
        .run(id, course_id, req.user.id, semester);
      res.status(201).json({ message: "Registered successfully" });
    } catch (e) {
      res.status(400).json({ error: "Already registered for this course in this semester" });
    }
  });

  app.post("/api/courses/unregister", authenticate, (req: any, res) => {
    const { course_id } = req.body;
    try {
      db.prepare("DELETE FROM course_registrations WHERE course_id = ? AND student_id = ?")
        .run(course_id, req.user.id);
      res.json({ message: "Unregistered successfully" });
    } catch (e) {
      res.status(400).json({ error: "Failed to unregister" });
    }
  });

  app.post("/api/semesters/register", authenticate, (req: any, res) => {
    const { semester } = req.body;
    const id = uuidv4();
    try {
      db.prepare("INSERT INTO semester_registrations (id, student_id, semester) VALUES (?, ?, ?)")
        .run(id, req.user.id, semester);
      res.status(201).json({ message: "Semester registered successfully" });
    } catch (e) {
      res.status(400).json({ error: "Already registered for this semester" });
    }
  });

  app.get("/api/student/semesters", authenticate, (req: any, res) => {
    const semesters = db.prepare("SELECT * FROM semester_registrations WHERE student_id = ?").all(req.user.id);
    res.json(semesters);
  });

  app.get("/api/student/courses", authenticate, (req: any, res) => {
    const courses = db.prepare(`
      SELECT c.*, u.name as lecturer_name 
      FROM courses c 
      JOIN users u ON c.lecturer_id = u.id
      JOIN course_registrations cr ON c.id = cr.course_id
      WHERE cr.student_id = ?
    `).all(req.user.id);
    res.json(courses);
  });

  app.get("/api/student/attendance", authenticate, (req: any, res) => {
    const stats = db.prepare(`
      SELECT 
        c.id, 
        c.course_code, 
        c.course_title,
        c.expected_classes,
        (SELECT COUNT(*) FROM sessions s WHERE s.course_id = c.id) as total_sessions_held,
        (SELECT COUNT(*) FROM attendance a JOIN sessions s ON a.session_id = s.id WHERE s.course_id = c.id AND a.student_id = ?) as attended_sessions
      FROM courses c
      JOIN course_registrations cr ON c.id = cr.course_id
      WHERE cr.student_id = ?
    `).all(req.user.id, req.user.id);
    res.json(stats);
  });

  app.get("/api/student/attendance/history", authenticate, (req: any, res) => {
    const { date } = req.query; // Expecting YYYY-MM-DD
    const attendance = db.prepare(`
      SELECT 
        c.course_code, 
        c.course_title, 
        a.marked_at,
        s.created_at as session_created_at
      FROM attendance a
      JOIN sessions s ON a.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE a.student_id = ? AND date(a.marked_at) = date(?)
    `).all(req.user.id, date);
    res.json(attendance);
  });

  // --- Course Routes ---
  app.get("/api/courses", authenticate, (req: any, res) => {
    const courses = db.prepare("SELECT * FROM courses WHERE lecturer_id = ?").all(req.user.id);
    res.json(courses);
  });

  app.post("/api/courses", authenticate, (req: any, res) => {
    if (req.user.role !== 'lecturer') return res.status(403).json({ error: "Forbidden" });
    const { course_code, course_title, level, department, required_attendance, expected_classes } = req.body;
    const id = uuidv4();
    db.prepare("INSERT INTO courses (id, course_code, course_title, lecturer_id, level, department, required_attendance, expected_classes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, course_code, course_title, req.user.id, level, department, required_attendance || 70, expected_classes || 10);
    res.status(201).json({ id });
  });

  // --- Session Routes ---
  app.post("/api/sessions", authenticate, (req: any, res) => {
    if (req.user.role !== 'lecturer') return res.status(403).json({ error: "Forbidden" });
    const { course_id, latitude, longitude, radius_meters } = req.body;
    const id = uuidv4();
    const qr_token = uuidv4();
    const expires_at = new Date(Date.now() + 60 * 1000).toISOString();

    db.prepare("UPDATE sessions SET is_active = 0 WHERE course_id = ?").run(course_id);
    db.prepare("INSERT INTO sessions (id, course_id, lecturer_id, qr_token, latitude, longitude, radius_meters, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, course_id, req.user.id, qr_token, latitude, longitude, radius_meters, expires_at);
    
    res.status(201).json({ id, qr_token });
  });

  app.get("/api/sessions/active/:courseId", authenticate, (req: any, res) => {
    const session = db.prepare("SELECT * FROM sessions WHERE course_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1").get(req.params.courseId);
    res.json(session);
  });

  app.post("/api/sessions/rotate/:sessionId", authenticate, (req: any, res) => {
    const qr_token = uuidv4();
    const expires_at = new Date(Date.now() + 60 * 1000).toISOString();
    db.prepare("UPDATE sessions SET qr_token = ?, expires_at = ? WHERE id = ? AND lecturer_id = ?")
      .run(qr_token, expires_at, req.params.sessionId, req.user.id);
    res.json({ qr_token });
  });

  app.post("/api/sessions/end/:sessionId", authenticate, (req: any, res) => {
    db.prepare("UPDATE sessions SET is_active = 0 WHERE id = ? AND lecturer_id = ?")
      .run(req.params.sessionId, req.user.id);
    res.json({ success: true });
  });

  // --- Attendance Routes ---
  app.post("/api/attendance/mark", authenticate, (req: any, res) => {
    const { qr_token, latitude, longitude } = req.body;
    const session: any = db.prepare("SELECT * FROM sessions WHERE qr_token = ? AND is_active = 1").get(qr_token);

    if (!session) return res.status(404).json({ error: "Invalid or expired QR code" });
    if (new Date() > new Date(session.expires_at)) return res.status(400).json({ error: "QR code expired" });

    // Haversine distance check
    const R = 6371e3; // metres
    const φ1 = (session.latitude * Math.PI) / 180;
    const φ2 = (latitude * Math.PI) / 180;
    const Δφ = ((latitude - session.latitude) * Math.PI) / 180;
    const Δλ = ((longitude - session.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance > session.radius_meters) {
      return res.status(400).json({ error: `You are too far from the lecture hall (${Math.round(distance)}m > ${session.radius_meters}m)` });
    }

    try {
      const id = uuidv4();
      db.prepare("INSERT INTO attendance (id, session_id, student_id, latitude, longitude) VALUES (?, ?, ?, ?, ?)")
        .run(id, session.id, req.user.id, latitude, longitude);
      res.status(201).json({ message: "Attendance marked successfully" });
    } catch (e) {
      res.status(400).json({ error: "Attendance already marked for this session" });
    }
  });

  app.get("/api/analytics/course/:courseId", authenticate, (req: any, res) => {
    const course: any = db.prepare("SELECT expected_classes FROM courses WHERE id = ?").get(req.params.courseId);
    const totalSessionsHeld: any = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE course_id = ?").get(req.params.courseId);
    const attendance = db.prepare(`
      SELECT u.id, u.name, u.matric_number, COUNT(a.id) as attended
      FROM users u
      JOIN course_registrations cr ON u.id = cr.student_id
      LEFT JOIN attendance a ON u.id = a.student_id
      LEFT JOIN sessions s ON a.session_id = s.id AND s.course_id = ?
      WHERE cr.course_id = ?
      GROUP BY u.id
    `).all(req.params.courseId, req.params.courseId);
    
    res.json({ 
      expectedClasses: course?.expected_classes || 10, 
      totalSessionsHeld: totalSessionsHeld.count, 
      attendance 
    });
  });

  app.get("/api/lecturer/courses/stats", authenticate, (req: any, res) => {
    if (req.user.role !== 'lecturer') return res.status(403).json({ error: "Forbidden" });
    const stats = db.prepare(`
      SELECT 
        c.id, 
        c.course_code, 
        c.course_title,
        (SELECT COUNT(*) FROM sessions s WHERE s.course_id = c.id) as total_sessions,
        (SELECT COUNT(*) FROM course_registrations cr WHERE cr.course_id = c.id) as total_students,
        (SELECT COUNT(DISTINCT a.student_id) FROM attendance a JOIN sessions s ON a.session_id = s.id WHERE s.course_id = c.id) as students_attended_at_least_once
      FROM courses c
      WHERE c.lecturer_id = ?
    `).all(req.user.id);
    res.json(stats);
  });

  app.get("/api/lecturer/course/:courseId/sessions", authenticate, (req: any, res) => {
    if (req.user.role !== 'lecturer') return res.status(403).json({ error: "Forbidden" });
    const sessions = db.prepare(`
      SELECT s.*, (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id) as attendance_count
      FROM sessions s
      WHERE s.course_id = ?
      ORDER BY s.created_at DESC
    `).all(req.params.courseId);
    res.json(sessions);
  });

  app.get("/api/lecturer/session/:sessionId/attendance", authenticate, (req: any, res) => {
    if (req.user.role !== 'lecturer') return res.status(403).json({ error: "Forbidden" });
    const attendance = db.prepare(`
      SELECT u.name, u.matric_number, a.created_at as signed_in_at
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      WHERE a.session_id = ?
    `).all(req.params.sessionId);
    res.json(attendance);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Seed data
    try {
      const lecturerId = uuidv4();
      const lecturerEmail = "lecturer@test.com";
      const existingLecturer = db.prepare("SELECT id FROM users WHERE email = ?").get(lecturerEmail);
      
      let finalLecturerId = existingLecturer ? (existingLecturer as any).id : lecturerId;
      
      if (!existingLecturer) {
        const hashedPassword = bcrypt.hashSync("password123", 10);
        db.prepare("INSERT INTO users (id, name, email, password_hash, role, onboarding_completed, staff_id, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .run(lecturerId, "Dr. Smith", lecturerEmail, hashedPassword, "lecturer", 1, "STAFF001", "Computer Science");
      }

      const courses = [
        { code: "CSC101", title: "Introduction to Computer Science", level: "100", dept: "Computer Science" },
        { code: "CSC201", title: "Data Structures and Algorithms", level: "200", dept: "Computer Science" },
        { code: "CSC301", title: "Operating Systems", level: "300", dept: "Computer Science" },
        { code: "CSC401", title: "Artificial Intelligence", level: "400", dept: "Computer Science" },
        { code: "ENG101", title: "Introduction to Engineering", level: "100", dept: "Engineering" },
        { code: "ENG201", title: "Thermodynamics", level: "200", dept: "Engineering" },
        { code: "MTH101", title: "Calculus I", level: "100", dept: "Mathematics" },
        { code: "PHY101", title: "General Physics I", level: "100", dept: "Physics" },
      ];

      for (const c of courses) {
        const existing = db.prepare("SELECT id FROM courses WHERE course_code = ?").get(c.code);
        if (!existing) {
          db.prepare("INSERT INTO courses (id, course_code, course_title, lecturer_id, level, department) VALUES (?, ?, ?, ?, ?, ?)")
            .run(uuidv4(), c.code, c.title, finalLecturerId, c.level, c.dept);
        }
      }
      console.log("Seed data initialized");
    } catch (e) {
      console.error("Seeding error:", e);
    }
  });
}

startServer();
