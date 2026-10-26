export type UserRole =
  | 'managing_partner'
  | 'engagement_partner'
  | 'audit_manager'
  | 'audit_senior'
  | 'article_trainee'
  | 'hr_admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  employeeCode: string;
  designation: string;
  phone?: string;
  department: string;
  joiningDate?: string;
  registrationNumber?: string; // ICAN Membership or Student Registration No.
  avatar?: string;
  status: 'active' | 'on_leave' | 'resigned' | 'completed_articleship';
  assignedSupervisorId?: string;
  assignedSupervisorName?: string;
}

export type EntityType =
  | 'Commercial Bank / FI'
  | 'Public Limited Company'
  | 'Private Limited Company'
  | 'Hydropower Project'
  | 'NGO / INGO'
  | 'Partnership Firm'
  | 'Proprietorship'
  | 'Government / Statutory Body';

export type FinancialReportingFramework =
  | 'NFRS (Nepal Financial Reporting Standards)'
  | 'NFRS for SMEs'
  | 'NAS for MEs (Micro Entities)'
  | 'Nepal GAAP / IFRS';

export interface Client {
  id: string;
  clientCode: string;
  name: string;
  entityType: EntityType;
  industry: string;
  panNumber: string; // 9-digit PAN in Nepal
  registrationNumber?: string;
  registeredAddress: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  financialYear: string; // e.g. "2080/81 (2023/24)"
  reportingFramework: FinancialReportingFramework;
  leadPartnerId: string;
  leadPartnerName: string;
  leadManagerId?: string;
  leadManagerName?: string;
  status: 'active' | 'inactive' | 'prospect';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AssignmentCategory =
  | 'Statutory Audit'
  | 'Internal Audit'
  | 'Tax Audit & Compliance'
  | 'Agreed-Upon Procedures'
  | 'Due Diligence'
  | 'Transfer Pricing Study'
  | 'Financial Advisory';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical' | 'urgent';

export type AssignmentStatus =
  | 'draft'
  | 'planning'
  | 'fieldwork'
  | 'manager_review'
  | 'partner_review'
  | 'completed'
  | 'archived';

export interface Assignment {
  id: string;
  referenceNo: string; // e.g., "ARA/2081/STAT-001"
  clientId: string;
  clientName: string;
  category: AssignmentCategory;
  financialYear: string;
  engagementPartnerId: string;
  engagementPartnerName: string;
  auditManagerId: string;
  auditManagerName: string;
  teamMemberIds: string[];
  teamMembers?: { id: string; name: string; role: UserRole }[];
  startDate: string;
  targetCompletionDate: string;
  statutoryDeadline: string;
  budgetedHours: number;
  actualHours: number;
  priority: PriorityLevel;
  riskLevel: 'low' | 'medium' | 'high' | 'significant';
  planningStatus: 'not_started' | 'in_progress' | 'completed' | 'approved';
  fieldworkStatus: 'not_started' | 'in_progress' | 'submitted' | 'approved';
  reviewStatus: 'not_started' | 'pending_partner_review' | 'review_points_open' | 'cleared';
  completionStatus: AssignmentStatus;
  partnerSignoffDate?: string;
  partnerSignoffNotes?: string;
  partnerSignoffById?: string;
  partnerSignoffByName?: string;
  pendingClientDocumentsCount?: number;
  openReviewPointsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted_for_review'
  | 'returned_for_revision'
  | 'approved'
  | 'completed';

export interface AuditTask {
  id: string;
  assignmentId: string;
  assignmentRef: string;
  clientName: string;
  title: string;
  description: string;
  auditArea: string;
  milestone?: string;
  assignedToId: string;
  assignedToName: string;
  reviewerId: string;
  reviewerName: string;
  priority: PriorityLevel;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  status: TaskStatus;
  workingPaperRef?: string; // e.g., "WP-BANK-01"
  reviewComments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WorkLogStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'returned_for_revision'
  | 'approved';

export interface WorkLog {
  id: string;
  traineeId: string;
  traineeName: string;
  workDate: string;
  assignmentId: string;
  assignmentRef: string;
  clientId: string;
  clientName: string;
  auditArea: string;
  taskId?: string;
  taskTitle?: string;
  supervisorId: string;
  supervisorName: string;
  workDescription: string;
  auditProcedures: string; // Specific vouching, recalculation, confirmation
  workingPaperRef: string;
  hours: number;
  findings: string; // Discrepancies, internal control weaknesses
  pendingItems: string;
  status: WorkLogStatus;
  reviewerComments?: string;
  approvedAt?: string;
  approvedBy?: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AttendanceLocation = 'office' | 'client_site' | 'remote';
export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent' | 'corrected';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string; // HH:mm:ss
  totalWorkingMinutes?: number;
  locationType: AttendanceLocation;
  clientId?: string;
  clientName?: string;
  status: AttendanceStatus;
  notes?: string;
  hasCorrectionRequest?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceCorrection {
  id: string;
  attendanceRecordId?: string;
  userId: string;
  userName: string;
  date: string;
  originalCheckIn?: string;
  originalCheckOut?: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approverName?: string;
  approverNotes?: string;
  actionedAt?: string;
  createdAt?: string;
}

export type LeaveCategory =
  | 'casual_leave'
  | 'sick_leave'
  | 'ca_exam_study'
  | 'annual_leave'
  | 'maternity_paternity'
  | 'unpaid_leave';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  category: LeaveCategory;
  startDate: string;
  endDate: string;
  daysCount: number;
  isHalfDay: boolean;
  halfDaySession?: 'morning' | 'afternoon' | 'full';
  reason: string;
  status: 'submitted' | 'pending_manager' | 'pending_hr_partner' | 'approved' | 'rejected' | 'cancelled';
  approverId?: string;
  approverName?: string;
  approverRemarks?: string;
  actionedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  category: LeaveCategory;
  title: string;
  entitled: number;
  used: number;
  remaining: number;
}

export type ReviewPointStatus = 'open' | 'addressed_pending_clearance' | 'cleared' | 'waived';

export interface ReviewPoint {
  id: string;
  referenceNo: string; // e.g. "RP-01"
  assignmentId: string;
  assignmentRef: string;
  clientName: string;
  workingPaperRef: string;
  issueDescription: string;
  raisedById: string;
  raisedByName: string;
  assignedToId: string;
  assignedToName: string;
  priority: PriorityLevel;
  dateRaised: string;
  targetClearanceDate: string;
  traineeResponse?: string;
  evidenceRef?: string;
  status: ReviewPointStatus;
  clearedById?: string;
  clearedByName?: string;
  clearanceDate?: string;
  clearanceRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'work_log' | 'leave' | 'attendance' | 'review_point' | 'assignment' | 'system';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}
