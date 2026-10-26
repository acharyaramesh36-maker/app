# Acharya R. & Associates — Practice & People Management System
## System Architecture, Schema & Specifications

### 1. Architecture Diagram
```
                     +---------------------------------------+
                     |         Browser / React 19 Client     |
                     |  (Tailwind CSS, Lucide, Motion, Vite) |
                     +-------------------+-------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
          +-----------------------+              +-------------------+
          |  Firebase Auth (RBAC) |              |  Local / IndexedDB|
          |  (Google & CA Profile |              |  Fallback Cache   |
          |   Simulation Modes)   |              +-------------------+
          +-----------+-----------+
                      |
                      v
          +-----------------------------------------------+
          |          Cloud Firestore Database             |
          |   (Enterprise / Instance-Scoped Multi-Tenant) |
          +---+-------------+-------------+---------------+
              |             |             |
              v             v             v
       [Practice Core]  [People Core]  [Audit Logs]
       - Clients        - Attendance   - Audit Events
       - Assignments    - Leave Req.   - Review Pts
       - Tasks          - Work Logs    - Notifs
```

### 2. Database Schema (Firestore Collections)
1. `users` (UserProfile): uid, email, displayName, role (`managing_partner` | `engagement_partner` | `audit_manager` | `audit_senior` | `article_trainee` | `hr_admin`), employeeCode, designation, phone, department, registrationNumber (ICAN / Reg), status, createdAt.
2. `clients` (Client Master): id, clientCode, name, entityType, industry, panNumber (Nepal 9-digit PAN), registrationNumber, registeredAddress, contactPerson, contactEmail, contactPhone, financialYear, reportingFramework (NFRS, NFRS for SMEs, NAS for MEs), leadPartnerId, leadPartnerName, status.
3. `assignments` (Engagement Register): id, referenceNo (e.g. `ARA/2081/STAT-001`), clientId, clientName, category (Statutory Audit, Internal Audit, Tax Audit, etc.), financialYear, engagementPartnerId, auditManagerId, teamMemberIds, startDate, targetCompletionDate, statutoryDeadline, budgetedHours, actualHours, priority, riskLevel, planningStatus, fieldworkStatus, reviewStatus, completionStatus, partnerSignoffDate, partnerSignoffNotes.
4. `tasks` (Audit Tasks & Milestones): id, assignmentId, assignmentRef, clientName, title, description, auditArea, milestone, assignedToId, assignedToName, reviewerId, priority, startDate, dueDate, estimatedHours, actualHours, status (`not_started`, `in_progress`, `submitted_for_review`, `returned_for_revision`, `approved`, `completed`), workingPaperRef, reviewComments.
5. `work_logs` (Article Trainee Daily Logs): id, traineeId, traineeName, workDate, assignmentId, assignmentRef, clientId, clientName, auditArea, taskId, taskTitle, supervisorId, supervisorName, workDescription, auditProcedures, workingPaperRef, hours, findings, pendingItems, status (`draft`, `submitted`, `under_review`, `returned_for_revision`, `approved`), reviewerComments, approvedAt, approvedBy, version.
6. `attendance` (Daily Attendance): id, userId, userName, date, checkInTime, checkOutTime, totalWorkingMinutes, locationType (`office`, `client_site`, `remote`), clientId, clientName, status (`present`, `late`, `half_day`, `absent`, `corrected`), notes, hasCorrectionRequest.
7. `attendance_corrections`: id, attendanceRecordId, userId, userName, date, originalCheckIn, originalCheckOut, requestedCheckIn, requestedCheckOut, reason, status (`pending`, `approved`, `rejected`), approverId, approverName, approverNotes.
8. `leave_requests`: id, userId, userName, userRole, category (`casual_leave`, `sick_leave`, `ca_exam_study`, `annual_leave`, `unpaid_leave`), startDate, endDate, daysCount, isHalfDay, halfDaySession, reason, status (`submitted`, `pending_manager`, `pending_hr_partner`, `approved`, `rejected`, `cancelled`), approverId, approverRemarks.
9. `review_points`: id, referenceNo, assignmentId, assignmentRef, clientName, workingPaperRef, issueDescription, raisedById, raisedByName, assignedToId, assignedToName, priority, dateRaised, targetClearanceDate, traineeResponse, evidenceRef, status (`open`, `addressed_pending_clearance`, `cleared`, `waived`), clearedById, clearedByName, clearanceDate.
10. `notifications`: id, userId, title, message, type, relatedId, isRead, createdAt.
11. `audit_events`: id, userId, userName, action, entityType, entityId, details, timestamp.

### 3. Role-Permission Matrix
| Capability / Module | Managing Partner | Engagement Partner | Audit Manager | Audit Senior | Article Trainee | HR / Admin |
|---|---|---|---|---|---|---|
| Executive Dashboard & Reports | Full Firm-wide | Assigned Engagements | Assigned Engagements | Team Workload | Personal Trainee View | HR & Attendance View |
| Client Master (Create/Edit) | Full | Assigned/View | Assigned/View | Read-only | Restricted Read | Read/Info |
| Assignment Creation & Planning | Full | Create/Approve | Plan & Team Alloc | View Assigned | View Assigned | View |
| Partner Final Sign-off | Yes | Yes (Assigned) | No | No | No | No |
| Task Allocation & Re-assignment | Full | Yes | Yes | Yes (Trainees) | No | No |
| Task Execution & WP Reference | Full | Full | Full | Full | Yes (Assigned) | No |
| Daily Work Log Submission | N/A | N/A | N/A | Review | Create/Edit/Revise | View |
| Work Log Review & Approval | Yes | Yes | Yes | Yes | No | No |
| Attendance Check-in / Out | Yes | Yes | Yes | Yes | Yes | Yes |
| Attendance Correction Approval | Yes | Yes | Yes | Yes | No | Yes |
| Leave Application | Yes | Yes | Yes | Yes | Yes | Yes |
| Leave Approval | Final Approval | Yes | First Level | First Level | No | Yes |
| Review Point Clearance | Final | Yes | Yes | Yes | Respond only | No |
| User & System Admin | Full | No | No | No | No | Staff Records |

### 4. Main Screen Map
- **1. Executive Dashboard**: KPIs, Active Audits, Deadlines (7/15/30d), Attendance today, Pending approvals, Review queue, Workload bars.
- **2. Clients & Engagements**: Client directory, PAN & Tax details, Engagement register, New Engagement Wizard, Templates.
- **3. Audit Tasks & Workflow**: Kanban board, List table, Milestone timeline, Working paper tracking, Review status.
- **4. Article Trainee Diary (Daily Logs)**: ICAN Compliant Daily Work Tracker, Procedure logs, Findings, Supervisor Review Portal, Revision workflow.
- **5. Attendance Management**: Daily Check-in/out (Office / Client-site with client link), Correction requests & approvals, Monthly registers.
- **6. Leave Management**: Leave balance ledger, CA Exam Study Leave tracker, Applications, Multi-tier approvals, Team calendar.
- **7. Review Points & Clearance**: Audit query register, Trainee resolution proof, Reviewer clearance, Partner sign-off checklist.
- **8. Timesheets & Workload**: Weekly time matrix, billable/non-billable hours, team utilization.
- **9. Reports & ICAN Export**: Downloadable CSV registers for ICAN trainees, Audit progress, Client register, Attendance.
- **10. Firm & User Management**: Role switcher for rapid verification of all 6 roles, staff profiles, system audit log.

### 5. Implementation Sequence
- Stage 1: Design system, Firebase integration, RBAC, Role switcher, Auth Provider, Seed data.
- Stage 2: Client Master, Assignment Register, Nepal Tax PAN verification, Assignment templates.
- Stage 3: Audit Tasks, Milestones, Kanban, Working Paper references, Progress metrics.
- Stage 4: Attendance punch (office/client-site), Retrospective correction workflow, Leave management.
- Stage 5: Article Trainee Daily Work Tracker, Audit areas, Supervisor review, Revisions, Actual hours rollup.
- Stage 6: Review Points Register, Partner sign-off checklist, Timesheets, Notifications, Excel/CSV Exports.
- Stage 7: Comprehensive verification, test suite for 20 acceptance tests, responsive audit firm UX.

### 6. External Configuration Checklist
- [x] Firebase Project Provisioned (`decisive-quarter-wcb1c`)
- [x] Firestore Database created (`ai-studio-acharyarassociat-2fb9c95b-8a47-4f84-aefa-fdb21293a347`)
- [x] Security Rules deployed
- [x] Google Auth configured; seamless role-simulation available for testing all 6 practice roles without requiring 6 distinct Google accounts.
