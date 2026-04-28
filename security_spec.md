# Security Specification for LocaScan

## Data Invariants
1. A user can only edit their own profile.
2. Only lecturers can create courses and sessions.
3. Students can only register for courses that belong to their department and level.
4. Attendance can only be marked if the session is active and the QR token matches.
5. Attendance must be within the specified radius of the session.
6. Once marked, attendance records are immutable.
7. Matric numbers and Staff IDs must be unique across the system (enforced by application logic and Firestore indexing if possible, or validation rules).

## The Dirty Dozen Payloads
1. **Identity Theft (Profile)**: Attempting to update another user's profile.
2. **Role Escalation**: Student attempting to change their role to 'lecturer'.
3. **Ghost Session**: Student attempting to create an attendance session.
4. **False Attendance (Remote)**: Attempting to mark attendance with coordinates far from the session.
5. **Session Hijack**: Attempting to end a session created by another lecturer.
6. **QR Token Forge**: Attempting to mark attendance using an invalid/guessed QR token.
7. **Duplicate Attendance**: Attempting to mark attendance twice for the same session.
8. **Inconsistent Department**: Student registering for a course in a different department.
9. **Staff ID Spoof**: Lecturer attempting to steal another lecturer's staff ID (if used).
10. **Expired Mark**: Attempting to mark attendance for an expired session.
11. **Shadow Course**: Attempting to create a course for another lecturer.
12. **PII Leak**: Attempting to read all users' private info (phone numbers, matric numbers).

## Test Runner (Draft)
A `firestore.rules.test.ts` will be created to verify these constraints.
