import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Client,
  Assignment,
  AuditTask,
  WorkLog,
  AttendanceRecord,
  AttendanceCorrection,
  LeaveRequest,
  LeaveBalance,
  ReviewPoint,
  AppNotification,
  AuditEvent,
  TaskStatus,
  WorkLogStatus,
  PriorityLevel,
  AttendanceLocation
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_TASKS,
  INITIAL_WORK_LOGS,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_REVIEW_POINTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_EVENTS
} from '../data/seedData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface PracticeContextType {
  clients: Client[];
  assignments: Assignment[];
  tasks: AuditTask[];
  workLogs: WorkLog[];
  attendanceRecords: AttendanceRecord[];
  attendanceCorrections: AttendanceCorrection[];
  leaveRequests: LeaveRequest[];
  reviewPoints: ReviewPoint[];
  notifications: AppNotification[];
  auditEvents: AuditEvent[];
  leaveBalances: LeaveBalance[];
  loading: boolean;
  selectedFinancialYear: string;
  setSelectedFinancialYear: (fy: string) => void;

  // Actions
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  
  addAssignment: (asgData: Omit<Assignment, 'id' | 'actualHours' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  signoffAssignment: (id: string, notes: string) => Promise<void>;

  addTask: (taskData: Omit<AuditTask, 'id' | 'actualHours' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<AuditTask>) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus, comments?: string) => Promise<void>;

  submitWorkLog: (logData: Omit<WorkLog, 'id' | 'version' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  resubmitWorkLog: (id: string, updates: Partial<WorkLog>) => Promise<void>;
  reviewWorkLog: (id: string, status: 'approved' | 'returned_for_revision', comments: string) => Promise<void>;

  recordCheckIn: (locationType: AttendanceLocation, clientId?: string, clientName?: string, notes?: string) => Promise<void>;
  recordCheckOut: () => Promise<void>;
  requestAttendanceCorrection: (date: string, reqIn: string, reqOut: string, reason: string) => Promise<void>;
  actionAttendanceCorrection: (id: string, action: 'approved' | 'rejected', notes: string) => Promise<void>;

  submitLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'userRole' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  actionLeaveRequest: (id: string, action: 'approved' | 'rejected', remarks: string) => Promise<void>;

  addReviewPoint: (data: Omit<ReviewPoint, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  respondToReviewPoint: (id: string, response: string, evidenceRef?: string) => Promise<void>;
  clearReviewPoint: (id: string, remarks: string) => Promise<void>;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  exportToCSV: (type: 'clients' | 'assignments' | 'tasks' | 'worklogs' | 'attendance' | 'leaves' | 'review_points') => void;
  resetToDefaultData: () => Promise<void>;
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

export const PracticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isPartner } = useAuth();
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('2080/81');
  const [loading, setLoading] = useState<boolean>(true);

  // States
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('ara_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('ara_assignments');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [tasks, setTasks] = useState<AuditTask[]>(() => {
    const saved = localStorage.getItem('ara_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [workLogs, setWorkLogs] = useState<WorkLog[]>(() => {
    const saved = localStorage.getItem('ara_work_logs');
    return saved ? JSON.parse(saved) : INITIAL_WORK_LOGS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('ara_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [attendanceCorrections, setAttendanceCorrections] = useState<AttendanceCorrection[]>(() => {
    const saved = localStorage.getItem('ara_corrections');
    return saved ? JSON.parse(saved) : [];
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('ara_leave_requests');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [reviewPoints, setReviewPoints] = useState<ReviewPoint[]>(() => {
    const saved = localStorage.getItem('ara_review_points');
    return saved ? JSON.parse(saved) : INITIAL_REVIEW_POINTS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('ara_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem('ara_audit_events');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_EVENTS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ara_clients', JSON.stringify(clients));
  }, [clients]);
  useEffect(() => {
    localStorage.setItem('ara_assignments', JSON.stringify(assignments));
  }, [assignments]);
  useEffect(() => {
    localStorage.setItem('ara_tasks', JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem('ara_work_logs', JSON.stringify(workLogs));
  }, [workLogs]);
  useEffect(() => {
    localStorage.setItem('ara_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);
  useEffect(() => {
    localStorage.setItem('ara_corrections', JSON.stringify(attendanceCorrections));
  }, [attendanceCorrections]);
  useEffect(() => {
    localStorage.setItem('ara_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);
  useEffect(() => {
    localStorage.setItem('ara_review_points', JSON.stringify(reviewPoints));
  }, [reviewPoints]);
  useEffect(() => {
    localStorage.setItem('ara_notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('ara_audit_events', JSON.stringify(auditEvents));
  }, [auditEvents]);

  // Initial load from Firestore (or fallback gracefully to local seed)
  useEffect(() => {
    const loadFromFirestore = async () => {
      try {
        setLoading(true);
        const cliSnap = await getDocs(collection(db, 'clients'));
        if (!cliSnap.empty) {
          const loadedClients: Client[] = [];
          cliSnap.forEach(d => loadedClients.push({ id: d.id, ...d.data() } as Client));
          setClients(loadedClients);
        } else {
          // Seed Firestore with initial clients
          for (const cli of INITIAL_CLIENTS) {
            await setDoc(doc(db, 'clients', cli.id), cli);
          }
        }
      } catch (err) {
        console.info('Firestore initial sync note (offline or permission sandbox): using local seed data', err);
      } finally {
        setLoading(false);
      }
    };

    loadFromFirestore();
  }, []);

  // Helper to append audit event
  const logAudit = async (action: string, entityType: string, entityId: string, details: string) => {
    const evt: AuditEvent = {
      id: `evt-${Date.now()}`,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditEvents(prev => [evt, ...prev]);
    try {
      await setDoc(doc(db, 'audit_events', evt.id), evt);
    } catch (e) {
      // safe fallback
    }
  };

  // Helper to send notification
  const sendNotification = async (targetUserId: string, title: string, message: string, type: AppNotification['type'], relatedId?: string) => {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: targetUserId,
      title,
      message,
      type,
      relatedId,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [notif, ...prev]);
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (e) {
      // safe fallback
    }
  };

  // 1. Client Master
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!/^\d{9}$/.test(clientData.panNumber.trim())) {
      throw new Error('Permanent Account Number (PAN) in Nepal must be exactly 9 numerical digits.');
    }

    const id = `cli-${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setClients(prev => [newClient, ...prev]);
    await logAudit('CREATE_CLIENT', 'Client', id, `Created client ${newClient.name} (Code: ${newClient.clientCode}, PAN: ${newClient.panNumber})`);
    try {
      await setDoc(doc(db, 'clients', id), newClient);
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
    return id;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (updates.panNumber && !/^\d{9}$/.test(updates.panNumber.trim())) {
      throw new Error('Permanent Account Number (PAN) in Nepal must be exactly 9 numerical digits.');
    }

    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
    await logAudit('UPDATE_CLIENT', 'Client', id, `Updated client properties`);
    try {
      await updateDoc(doc(db, 'clients', id), { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  // 2. Assignment Register
  const addAssignment = async (asgData: Omit<Assignment, 'id' | 'actualHours' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `asg-${Date.now()}`;
    const newAsg: Assignment = {
      ...asgData,
      id,
      actualHours: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setAssignments(prev => [newAsg, ...prev]);
    await logAudit('CREATE_ASSIGNMENT', 'Assignment', id, `Created engagement ${newAsg.referenceNo} for ${newAsg.clientName}`);
    try {
      await setDoc(doc(db, 'assignments', id), newAsg);
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
    return id;
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
    await logAudit('UPDATE_ASSIGNMENT', 'Assignment', id, `Updated assignment details`);
    try {
      await updateDoc(doc(db, 'assignments', id), { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  const signoffAssignment = async (id: string, notes: string) => {
    if (!isPartner()) {
      throw new Error('Only an Engagement Partner or Managing Partner can perform final audit sign-off.');
    }
    const signoffDate = new Date().toISOString().split('T')[0];
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          completionStatus: 'completed',
          reviewStatus: 'cleared',
          fieldworkStatus: 'approved',
          partnerSignoffDate: signoffDate,
          partnerSignoffNotes: notes,
          partnerSignoffById: currentUser.uid,
          partnerSignoffByName: currentUser.displayName,
          updatedAt: new Date().toISOString()
        };
      }
      return a;
    }));
    await logAudit('PARTNER_SIGNOFF', 'Assignment', id, `Partner ${currentUser.displayName} signed off engagement. Notes: ${notes}`);
    try {
      await updateDoc(doc(db, 'assignments', id), {
        completionStatus: 'completed',
        reviewStatus: 'cleared',
        partnerSignoffDate: signoffDate,
        partnerSignoffNotes: notes,
        partnerSignoffById: currentUser.uid,
        partnerSignoffByName: currentUser.displayName
      });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  // 3. Task Management
  const addTask = async (taskData: Omit<AuditTask, 'id' | 'actualHours' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `tsk-${Date.now()}`;
    const newTask: AuditTask = {
      ...taskData,
      id,
      actualHours: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
    await logAudit('CREATE_TASK', 'Task', id, `Created task "${newTask.title}" for ${newTask.clientName}`);
    await sendNotification(newTask.assignedToId, 'New Task Assigned', `You have been assigned "${newTask.title}" under ${newTask.assignmentRef}.`, 'task', id);
    try {
      await setDoc(doc(db, 'tasks', id), newTask);
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
    return id;
  };

  const updateTask = async (id: string, updates: Partial<AuditTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    await logAudit('UPDATE_TASK', 'Task', id, `Updated task properties`);
    try {
      await updateDoc(doc(db, 'tasks', id), { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus, comments?: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status,
          reviewComments: comments || t.reviewComments,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    await logAudit('TASK_STATUS_CHANGE', 'Task', id, `Status changed to ${status}`);

    if (status === 'submitted_for_review') {
      await sendNotification(task.reviewerId, 'Task Submitted for Review', `Task "${task.title}" was submitted by ${task.assignedToName}.`, 'task', id);
    } else if (status === 'returned_for_revision') {
      await sendNotification(task.assignedToId, 'Task Returned for Revision', `Task "${task.title}" was returned. Comments: ${comments || 'Please revise.'}`, 'task', id);
    } else if (status === 'approved' || status === 'completed') {
      await sendNotification(task.assignedToId, 'Task Approved', `Task "${task.title}" was approved by ${currentUser.displayName}.`, 'task', id);
    }

    try {
      await updateDoc(doc(db, 'tasks', id), {
        status,
        reviewComments: comments || task.reviewComments,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  // 4. Daily Article Trainee Work Diary
  const submitWorkLog = async (logData: Omit<WorkLog, 'id' | 'version' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `log-${Date.now()}`;
    const newLog: WorkLog = {
      ...logData,
      id,
      version: 1,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setWorkLogs(prev => [newLog, ...prev]);
    await logAudit('SUBMIT_WORK_LOG', 'WorkLog', id, `Trainee ${newLog.traineeName} logged ${newLog.hours} hrs on ${newLog.auditArea}`);
    await sendNotification(newLog.supervisorId, 'Work Log Submitted', `${newLog.traineeName} submitted daily diary for ${newLog.clientName} (${newLog.hours} hrs).`, 'work_log', id);
    try {
      await setDoc(doc(db, 'work_logs', id), newLog);
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
    return id;
  };

  const resubmitWorkLog = async (id: string, updates: Partial<WorkLog>) => {
    const existing = workLogs.find(l => l.id === id);
    if (!existing) return;

    const newVersion = (existing.version || 1) + 1;
    setWorkLogs(prev => prev.map(l => {
      if (l.id === id) {
        return {
          ...l,
          ...updates,
          version: newVersion,
          status: 'submitted',
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    }));

    await logAudit('RESUBMIT_WORK_LOG', 'WorkLog', id, `Revised work log (v${newVersion}) submitted by ${existing.traineeName}`);
    await sendNotification(existing.supervisorId, 'Work Log Resubmitted', `${existing.traineeName} resubmitted revised log (v${newVersion}).`, 'work_log', id);
    try {
      await updateDoc(doc(db, 'work_logs', id), {
        ...updates,
        version: newVersion,
        status: 'submitted',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  const reviewWorkLog = async (id: string, status: 'approved' | 'returned_for_revision', comments: string) => {
    const log = workLogs.find(l => l.id === id);
    if (!log) return;

    if (log.traineeId === currentUser.uid && currentUser.role === 'article_trainee') {
      throw new Error('Security policy prohibits trainees from approving their own daily diary work logs.');
    }

    const now = new Date().toISOString();
    setWorkLogs(prev => prev.map(l => {
      if (l.id === id) {
        return {
          ...l,
          status,
          reviewerComments: comments,
          approvedAt: status === 'approved' ? now : undefined,
          approvedBy: status === 'approved' ? currentUser.displayName : undefined,
          updatedAt: now
        };
      }
      return l;
    }));

    if (status === 'approved') {
      // Accumulate actual hours onto the task and assignment WITHOUT double counting
      if (log.taskId) {
        setTasks(prev => prev.map(t => {
          if (t.id === log.taskId) {
            return { ...t, actualHours: Number((t.actualHours + log.hours).toFixed(1)) };
          }
          return t;
        }));
      }

      setAssignments(prev => prev.map(a => {
        if (a.id === log.assignmentId) {
          return { ...a, actualHours: Number((a.actualHours + log.hours).toFixed(1)) };
        }
        return a;
      }));

      await logAudit('APPROVE_WORK_LOG', 'WorkLog', id, `Approved work log of ${log.traineeName} for ${log.hours} hrs`);
      await sendNotification(log.traineeId, 'Work Log Approved', `Your work log for ${log.clientName} (${log.hours} hrs) has been approved.`, 'work_log', id);
    } else {
      await logAudit('RETURN_WORK_LOG', 'WorkLog', id, `Returned work log of ${log.traineeName}. Comments: ${comments}`);
      await sendNotification(log.traineeId, 'Work Log Returned for Revision', `Your work log for ${log.clientName} was returned: ${comments}`, 'work_log', id);
    }

    try {
      await updateDoc(doc(db, 'work_logs', id), {
        status,
        reviewerComments: comments,
        approvedAt: status === 'approved' ? now : null,
        approvedBy: status === 'approved' ? currentUser.displayName : null,
        updatedAt: now
      });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  // 5. Attendance Management
  const recordCheckIn = async (locationType: AttendanceLocation, clientId?: string, clientName?: string, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });

    // Check if already checked in today
    const existing = attendanceRecords.find(a => a.userId === currentUser.uid && a.date === today);
    if (existing) {
      throw new Error('You have already punched in for today.');
    }

    // Determine status (grace period: 10:15 AM)
    const [hours, mins] = timeStr.split(':').map(Number);
    const isLate = hours > 10 || (hours === 10 && mins > 15);

    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      date: today,
      checkInTime: timeStr,
      locationType,
      clientId,
      clientName,
      status: isLate ? 'late' : 'present',
      notes,
      createdAt: new Date().toISOString()
    };

    setAttendanceRecords(prev => [record, ...prev]);
    await logAudit('ATTENDANCE_CHECK_IN', 'Attendance', record.id, `${currentUser.displayName} checked in at ${timeStr} (${locationType})`);
    try {
      await setDoc(doc(db, 'attendance', record.id), record);
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  const recordCheckOut = async () => {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const existing = attendanceRecords.find(a => a.userId === currentUser.uid && a.date === today && !a.checkOutTime);

    if (!existing) {
      throw new Error('No active check-in record found for today.');
    }

    // Calculate working minutes
    const [inH, inM] = existing.checkInTime.split(':').map(Number);
    const [outH, outM] = timeStr.split(':').map(Number);
    const totalMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));

    setAttendanceRecords(prev => prev.map(a => {
      if (a.id === existing.id) {
        return {
          ...a,
          checkOutTime: timeStr,
          totalWorkingMinutes: totalMinutes,
          updatedAt: new Date().toISOString()
        };
      }
      return a;
    }));

    await logAudit('ATTENDANCE_CHECK_OUT', 'Attendance', existing.id, `${currentUser.displayName} checked out at ${timeStr} (Total: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m)`);
    try {
      await updateDoc(doc(db, 'attendance', existing.id), {
        checkOutTime: timeStr,
        totalWorkingMinutes: totalMinutes,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  const requestAttendanceCorrection = async (date: string, reqIn: string, reqOut: string, reason: string) => {
    const todayRecord = attendanceRecords.find(a => a.userId === currentUser.uid && a.date === date);
    const corr: AttendanceCorrection = {
      id: `corr-${Date.now()}`,
      attendanceRecordId: todayRecord?.id,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      date,
      originalCheckIn: todayRecord?.checkInTime,
      originalCheckOut: todayRecord?.checkOutTime,
      requestedCheckIn: reqIn,
      requestedCheckOut: reqOut,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setAttendanceCorrections(prev => [corr, ...prev]);
    await logAudit('ATTENDANCE_CORRECTION_REQ', 'AttendanceCorrection', corr.id, `Correction requested for ${date} by ${currentUser.displayName}`);
    try {
      await setDoc(doc(db, 'attendance_corrections', corr.id), corr);
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  const actionAttendanceCorrection = async (id: string, action: 'approved' | 'rejected', notes: string) => {
    const corr = attendanceCorrections.find(c => c.id === id);
    if (!corr) return;

    setAttendanceCorrections(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: action,
          approverId: currentUser.uid,
          approverName: currentUser.displayName,
          approverNotes: notes,
          actionedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    if (action === 'approved') {
      // Retain audit trail while updating the official record
      setAttendanceRecords(prev => {
        const found = prev.find(a => a.userId === corr.userId && a.date === corr.date);
        if (found) {
          return prev.map(a => a.id === found.id ? {
            ...a,
            checkInTime: corr.requestedCheckIn,
            checkOutTime: corr.requestedCheckOut,
            status: 'corrected',
            hasCorrectionRequest: false,
            notes: `Corrected by ${currentUser.displayName}: ${notes}`
          } : a);
        } else {
          // create retrospective attendance entry
          const newAtt: AttendanceRecord = {
            id: `att-ret-${Date.now()}`,
            userId: corr.userId,
            userName: corr.userName,
            date: corr.date,
            checkInTime: corr.requestedCheckIn,
            checkOutTime: corr.requestedCheckOut,
            locationType: 'office',
            status: 'corrected',
            notes: `Approved correction by ${currentUser.displayName}: ${notes}`,
            createdAt: new Date().toISOString()
          };
          return [newAtt, ...prev];
        }
      });
    }

    await logAudit('ACTION_ATTENDANCE_CORRECTION', 'AttendanceCorrection', id, `${action.toUpperCase()} correction request of ${corr.userName}`);
    await sendNotification(corr.userId, `Attendance Correction ${action.toUpperCase()}`, `Your attendance correction for ${corr.date} was ${action}. Remarks: ${notes}`, 'attendance', id);
  };

  // 6. Leave Management
  const submitLeaveRequest = async (data: Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'userRole' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    // Validate remaining leave balance
    const currentBalance = leaveBalances.find(b => b.category === data.category);
    if (currentBalance && data.daysCount > currentBalance.remaining) {
      throw new Error(`Insufficient leave balance: You have ${currentBalance.remaining} days remaining for ${currentBalance.title}, but applied for ${data.daysCount} days.`);
    }

    // Validate overlapping leave
    const hasOverlap = leaveRequests.some(l => {
      if (l.userId !== currentUser.uid || l.status === 'rejected' || l.status === 'cancelled') return false;
      return (data.startDate <= l.endDate && data.endDate >= l.startDate);
    });

    if (hasOverlap) {
      throw new Error('You already have an existing leave application covering these dates.');
    }

    const id = `lev-${Date.now()}`;
    const newLeave: LeaveRequest = {
      ...data,
      id,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userRole: currentUser.role,
      status: 'pending_manager',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLeaveRequests(prev => [newLeave, ...prev]);
    await logAudit('SUBMIT_LEAVE', 'LeaveRequest', id, `${currentUser.displayName} applied for ${data.daysCount} days of ${data.category}`);
    try {
      await setDoc(doc(db, 'leave_requests', id), newLeave);
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
    return id;
  };

  const actionLeaveRequest = async (id: string, action: 'approved' | 'rejected', remarks: string) => {
    const leave = leaveRequests.find(l => l.id === id);
    if (!leave) return;

    // Prevent unauthorized self-approval
    if (leave.userId === currentUser.uid && currentUser.role !== 'managing_partner') {
      throw new Error('Security policy prohibits self-approval of leave requests.');
    }

    setLeaveRequests(prev => prev.map(l => {
      if (l.id === id) {
        return {
          ...l,
          status: action,
          approverId: currentUser.uid,
          approverName: currentUser.displayName,
          approverRemarks: remarks,
          actionedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    }));

    await logAudit('ACTION_LEAVE', 'LeaveRequest', id, `${action.toUpperCase()} leave request of ${leave.userName} (${leave.daysCount} days)`);
    await sendNotification(leave.userId, `Leave Application ${action.toUpperCase()}`, `Your leave application (${leave.category.replace('_', ' ')}) was ${action} by ${currentUser.displayName}.`, 'leave', id);
    try {
      await updateDoc(doc(db, 'leave_requests', id), {
        status: action,
        approverId: currentUser.uid,
        approverName: currentUser.displayName,
        approverRemarks: remarks,
        actionedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  // Leave balances calculation for current user
  const leaveBalances: LeaveBalance[] = [
    {
      category: 'ca_exam_study',
      title: 'CA Exam Study Leave (ICAN)',
      entitled: currentUser.role === 'article_trainee' ? 60 : 0,
      used: leaveRequests
        .filter(l => l.userId === currentUser.uid && l.category === 'ca_exam_study' && l.status === 'approved')
        .reduce((acc, curr) => acc + curr.daysCount, 0),
      remaining: (currentUser.role === 'article_trainee' ? 60 : 0) - leaveRequests
        .filter(l => l.userId === currentUser.uid && l.category === 'ca_exam_study' && l.status === 'approved')
        .reduce((acc, curr) => acc + curr.daysCount, 0)
    },
    {
      category: 'casual_leave',
      title: 'Casual Leave',
      entitled: 12,
      used: leaveRequests
        .filter(l => l.userId === currentUser.uid && l.category === 'casual_leave' && l.status === 'approved')
        .reduce((acc, curr) => acc + curr.daysCount, 0),
      remaining: 12 - leaveRequests
        .filter(l => l.userId === currentUser.uid && l.category === 'casual_leave' && l.status === 'approved')
        .reduce((acc, curr) => acc + curr.daysCount, 0)
    },
    {
      category: 'sick_leave',
      title: 'Sick Leave',
      entitled: 12,
      used: leaveRequests
        .filter(l => l.userId === currentUser.uid && l.category === 'sick_leave' && l.status === 'approved')
        .reduce((acc, curr) => acc + curr.daysCount, 0),
      remaining: 12 - leaveRequests
        .filter(l => l.userId === currentUser.uid && l.category === 'sick_leave' && l.status === 'approved')
        .reduce((acc, curr) => acc + curr.daysCount, 0)
    },
    {
      category: 'annual_leave',
      title: 'Earned / Annual Leave',
      entitled: 18,
      used: leaveRequests
        .filter(l => l.userId === currentUser.uid && l.category === 'annual_leave' && l.status === 'approved')
        .reduce((acc, curr) => acc + curr.daysCount, 0),
      remaining: 18 - leaveRequests
        .filter(l => l.userId === currentUser.uid && l.category === 'annual_leave' && l.status === 'approved')
        .reduce((acc, curr) => acc + curr.daysCount, 0)
    }
  ];

  // 7. Audit Review Points Register
  const addReviewPoint = async (data: Omit<ReviewPoint, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `rp-${Date.now()}`;
    const newRp: ReviewPoint = {
      ...data,
      id,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setReviewPoints(prev => [newRp, ...prev]);
    await logAudit('CREATE_REVIEW_POINT', 'ReviewPoint', id, `Raised review point ${newRp.referenceNo} for ${newRp.clientName}`);
    await sendNotification(newRp.assignedToId, 'New Review Point Raised', `Review point ${newRp.referenceNo} on ${newRp.workingPaperRef} raised by ${newRp.raisedByName}.`, 'review_point', id);
    try {
      await setDoc(doc(db, 'review_points', id), newRp);
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
    return id;
  };

  const respondToReviewPoint = async (id: string, response: string, evidenceRef?: string) => {
    const rp = reviewPoints.find(r => r.id === id);
    if (!rp) return;

    setReviewPoints(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          traineeResponse: response,
          evidenceRef: evidenceRef || r.evidenceRef,
          status: 'addressed_pending_clearance',
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));

    await logAudit('RESPOND_REVIEW_POINT', 'ReviewPoint', id, `${currentUser.displayName} responded to review point ${rp.referenceNo}`);
    await sendNotification(rp.raisedById, 'Review Point Addressed', `${currentUser.displayName} addressed ${rp.referenceNo} (Awaiting Clearance).`, 'review_point', id);
    try {
      await updateDoc(doc(db, 'review_points', id), {
        traineeResponse: response,
        evidenceRef: evidenceRef || rp.evidenceRef,
        status: 'addressed_pending_clearance',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  const clearReviewPoint = async (id: string, remarks: string) => {
    const rp = reviewPoints.find(r => r.id === id);
    if (!rp) return;

    // Prevent trainees from clearing their own review points
    if (currentUser.role === 'article_trainee') {
      throw new Error('Article trainees cannot clear their own review points. Clearance must be verified by a Supervisor, Manager or Partner.');
    }

    const clearanceDate = new Date().toISOString().split('T')[0];
    setReviewPoints(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'cleared',
          clearedById: currentUser.uid,
          clearedByName: currentUser.displayName,
          clearanceDate,
          clearanceRemarks: remarks,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));

    await logAudit('CLEAR_REVIEW_POINT', 'ReviewPoint', id, `${currentUser.displayName} cleared review point ${rp.referenceNo}`);
    await sendNotification(rp.assignedToId, 'Review Point Cleared', `Review point ${rp.referenceNo} was cleared by ${currentUser.displayName}.`, 'review_point', id);
    try {
      await updateDoc(doc(db, 'review_points', id), {
        status: 'cleared',
        clearedById: currentUser.uid,
        clearedByName: currentUser.displayName,
        clearanceDate,
        clearanceRemarks: remarks,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  // 8. Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // 9. Reporting and Downloadable Registers (CSV Export)
  const exportToCSV = (type: 'clients' | 'assignments' | 'tasks' | 'worklogs' | 'attendance' | 'leaves' | 'review_points') => {
    let filename = `Acharya_Associates_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'clients') {
      headers = ['Client Code', 'Name', 'Entity Type', 'Industry', 'PAN Number', 'Registration No', 'Address', 'Contact Person', 'Email', 'Financial Year', 'Framework', 'Status'];
      rows = clients.map(c => [
        c.clientCode,
        `"${c.name}"`,
        c.entityType,
        c.industry,
        c.panNumber,
        c.registrationNumber || '',
        `"${c.registeredAddress}"`,
        `"${c.contactPerson}"`,
        c.contactEmail,
        c.financialYear,
        `"${c.reportingFramework}"`,
        c.status
      ]);
    } else if (type === 'assignments') {
      headers = ['Reference No', 'Client Name', 'Category', 'FY', 'Engagement Partner', 'Audit Manager', 'Start Date', 'Target Completion', 'Statutory Deadline', 'Budgeted Hours', 'Actual Hours', 'Priority', 'Risk Level', 'Completion Status'];
      rows = assignments.map(a => [
        a.referenceNo,
        `"${a.clientName}"`,
        a.category,
        a.financialYear,
        `"${a.engagementPartnerName}"`,
        `"${a.auditManagerName}"`,
        a.startDate,
        a.targetCompletionDate,
        a.statutoryDeadline,
        a.budgetedHours.toString(),
        a.actualHours.toString(),
        a.priority,
        a.riskLevel,
        a.completionStatus
      ]);
    } else if (type === 'worklogs') {
      headers = ['Trainee Name', 'Work Date', 'Assignment Ref', 'Client Name', 'Audit Area', 'Task Ref', 'Supervisor', 'Hours', 'Working Paper Ref', 'Audit Procedures Carried Out', 'Findings & Exceptions', 'Status', 'Reviewer Comments'];
      rows = workLogs.map(l => [
        `"${l.traineeName}"`,
        l.workDate,
        l.assignmentRef,
        `"${l.clientName}"`,
        `"${l.auditArea}"`,
        `"${l.taskTitle || ''}"`,
        `"${l.supervisorName}"`,
        l.hours.toString(),
        l.workingPaperRef,
        `"${(l.auditProcedures || '').replace(/"/g, '""')}"`,
        `"${(l.findings || '').replace(/"/g, '""')}"`,
        l.status,
        `"${(l.reviewerComments || '').replace(/"/g, '""')}"`
      ]);
    } else if (type === 'attendance') {
      headers = ['Staff Name', 'Date', 'Check In Time', 'Check Out Time', 'Total Minutes', 'Location', 'Client Site', 'Status', 'Notes'];
      rows = attendanceRecords.map(att => [
        `"${att.userName}"`,
        att.date,
        att.checkInTime,
        att.checkOutTime || 'Pending Check-out',
        (att.totalWorkingMinutes || 0).toString(),
        att.locationType,
        `"${att.clientName || 'Head Office'}"`,
        att.status,
        `"${att.notes || ''}"`
      ]);
    } else if (type === 'tasks') {
      headers = ['Task Title', 'Assignment Ref', 'Client', 'Audit Area', 'Assigned To', 'Reviewer', 'Start Date', 'Due Date', 'Est Hours', 'Actual Hours', 'Status', 'Working Paper Ref'];
      rows = tasks.map(t => [
        `"${t.title}"`,
        t.assignmentRef,
        `"${t.clientName}"`,
        t.auditArea,
        `"${t.assignedToName}"`,
        `"${t.reviewerName}"`,
        t.startDate,
        t.dueDate,
        t.estimatedHours.toString(),
        t.actualHours.toString(),
        t.status,
        t.workingPaperRef || ''
      ]);
    } else if (type === 'leaves') {
      headers = ['Staff Name', 'Role', 'Category', 'Start Date', 'End Date', 'Days Count', 'Half Day', 'Reason', 'Status', 'Approver Remarks'];
      rows = leaveRequests.map(lv => [
        `"${lv.userName}"`,
        lv.userRole,
        lv.category,
        lv.startDate,
        lv.endDate,
        lv.daysCount.toString(),
        lv.isHalfDay ? 'Yes' : 'No',
        `"${lv.reason.replace(/"/g, '""')}"`,
        lv.status,
        `"${lv.approverRemarks || ''}"`
      ]);
    } else if (type === 'review_points') {
      headers = ['Reference No', 'Assignment Ref', 'Client', 'Working Paper Ref', 'Issue Description', 'Raised By', 'Assigned To', 'Priority', 'Date Raised', 'Target Date', 'Status', 'Trainee Response', 'Cleared By', 'Clearance Date'];
      rows = reviewPoints.map(r => [
        r.referenceNo,
        r.assignmentRef,
        `"${r.clientName}"`,
        r.workingPaperRef,
        `"${r.issueDescription.replace(/"/g, '""')}"`,
        `"${r.raisedByName}"`,
        `"${r.assignedToName}"`,
        r.priority,
        r.dateRaised,
        r.targetClearanceDate,
        r.status,
        `"${(r.traineeResponse || '').replace(/"/g, '""')}"`,
        `"${r.clearedByName || ''}"`,
        r.clearanceDate || ''
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetToDefaultData = async () => {
    setClients(INITIAL_CLIENTS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setTasks(INITIAL_TASKS);
    setWorkLogs(INITIAL_WORK_LOGS);
    setAttendanceRecords(INITIAL_ATTENDANCE);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setReviewPoints(INITIAL_REVIEW_POINTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditEvents(INITIAL_AUDIT_EVENTS);

    localStorage.removeItem('ara_clients');
    localStorage.removeItem('ara_assignments');
    localStorage.removeItem('ara_tasks');
    localStorage.removeItem('ara_work_logs');
    localStorage.removeItem('ara_attendance');
    localStorage.removeItem('ara_leave_requests');
    localStorage.removeItem('ara_review_points');
    localStorage.removeItem('ara_notifications');
    localStorage.removeItem('ara_audit_events');

    await logAudit('RESET_DATABASE', 'System', 'ALL', 'Reset database to standard CA firm seed dataset.');
  };

  return (
    <PracticeContext.Provider
      value={{
        clients,
        assignments,
        tasks,
        workLogs,
        attendanceRecords,
        attendanceCorrections,
        leaveRequests,
        reviewPoints,
        notifications,
        auditEvents,
        leaveBalances,
        loading,
        selectedFinancialYear,
        setSelectedFinancialYear,
        addClient,
        updateClient,
        addAssignment,
        updateAssignment,
        signoffAssignment,
        addTask,
        updateTask,
        updateTaskStatus,
        submitWorkLog,
        resubmitWorkLog,
        reviewWorkLog,
        recordCheckIn,
        recordCheckOut,
        requestAttendanceCorrection,
        actionAttendanceCorrection,
        submitLeaveRequest,
        actionLeaveRequest,
        addReviewPoint,
        respondToReviewPoint,
        clearReviewPoint,
        markNotificationRead,
        markAllNotificationsRead,
        exportToCSV,
        resetToDefaultData
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
};

export const usePractice = () => {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePractice must be used within a PracticeProvider');
  }
  return context;
};
