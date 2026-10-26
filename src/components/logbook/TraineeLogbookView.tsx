import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  Sparkles,
  Send,
  RotateCcw,
  UserCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  ArrowRight,
  Lock,
  Layers,
  FileCheck,
  Search,
  PenTool,
  X,
  HelpCircle,
  FolderOpen,
  MapPin,
  Building,
  Globe,
  Trash2,
  Edit
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';
import { WorkLog, AttendanceLocation } from '../../types';

export const TraineeLogbookView: React.FC = () => {
  const {
    workLogs,
    assignments,
    tasks,
    clients,
    attendanceRecords,
    recordCheckIn,
    recordCheckOut,
    submitWorkLog,
    resubmitWorkLog,
    reviewWorkLog,
    exportToCSV
  } = usePractice();

  const { currentUser, allStaff, isTrainee, isSenior } = useAuth();

  // Selected date for logbook (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Selected trainee (if supervisor, can view any trainee's logbook; if trainee, views their own)
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>(currentUser.uid);

  // Attendance quick punch state inside logbook
  const [attLocation, setAttLocation] = useState<AttendanceLocation>('client_site');
  const [attClientId, setAttClientId] = useState<string>(clients[0]?.id || '');
  const [attNotes, setAttNotes] = useState<string>('');
  const [isPunchingAtt, setIsPunchingAtt] = useState<boolean>(false);

  // Task Punch Desk Form state (Pure manual input)
  const [punchClientId, setPunchClientId] = useState<string>(assignments[0]?.clientId || '');
  const [punchAssignmentId, setPunchAssignmentId] = useState<string>(assignments[0]?.id || '');
  const [punchAuditArea, setPunchAuditArea] = useState<string>('Cash & Bank Balances');
  const [isCustomArea, setIsCustomArea] = useState<boolean>(false);
  const [customAreaText, setCustomAreaText] = useState<string>('');

  const [punchTaskId, setPunchTaskId] = useState<string>('');
  const [punchHours, setPunchHours] = useState<number>(3.0);
  const [punchWpRef, setPunchWpRef] = useState<string>('WP-01');
  const [punchDescription, setPunchDescription] = useState<string>('');
  const [punchProcedures, setPunchProcedures] = useState<string>('');
  const [punchFindings, setPunchFindings] = useState<string>('');
  const [punchPending, setPunchPending] = useState<string>('');
  const [punchSupervisorId, setPunchSupervisorId] = useState<string>('staff-audit-senior');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>('');

  const standardAuditAreas = [
    'Cash & Bank Balances',
    'Loans & Advances / Impairment',
    'Property, Plant and Equipment',
    'Revenue from Contracts',
    'Inventory & Store Controls',
    'Trade Payables & Accrued Expenses',
    'Taxation & Statutory Compliances',
    'Payroll & Staff Welfare',
    'Internal Controls & Governance',
    'Financial Statement Disclosures',
    'Other / Custom Audit Area...'
  ];

  // Reset form fields for fresh manual input
  const handleResetForm = () => {
    setPunchDescription('');
    setPunchProcedures('');
    setPunchFindings('');
    setPunchPending('');
    setPunchWpRef('WP-01');
    setPunchHours(2.5);
    setIsCustomArea(false);
    setPunchAuditArea('Cash & Bank Balances');
    setCustomAreaText('');
  };

  // Handle Audit Area Change
  const handleAuditAreaChange = (val: string) => {
    if (val === 'Other / Custom Audit Area...') {
      setIsCustomArea(true);
      setPunchAuditArea('Other / Custom Audit Area...');
    } else {
      setIsCustomArea(false);
      setPunchAuditArea(val);
    }
  };

  // Attendance status for selected date
  const myDateAttendance = useMemo(() => {
    const targetUserId = isTrainee() ? currentUser.uid : selectedTraineeId;
    return attendanceRecords.find(a => a.userId === targetUserId && a.date === selectedDate);
  }, [attendanceRecords, isTrainee, currentUser.uid, selectedTraineeId, selectedDate]);

  const isCheckedInForDate = Boolean(myDateAttendance && !myDateAttendance.checkOutTime);

  // Trainee's punched tasks for the selected date
  const traineeDateLogs = useMemo(() => {
    const targetUserId = isTrainee() ? currentUser.uid : selectedTraineeId;
    return workLogs.filter(w => w.traineeId === targetUserId && w.workDate === selectedDate);
  }, [workLogs, isTrainee, currentUser.uid, selectedTraineeId, selectedDate]);

  // Total hours punched for the selected day
  const totalHoursPunchedToday = traineeDateLogs.reduce((sum, l) => sum + l.hours, 0);
  const targetDailyHours = 7.5; // Standard CA article trainee hours in Nepal
  const hoursRemaining = Math.max(0, targetDailyHours - totalHoursPunchedToday);

  // Attendance Punch In from within Logbook
  const handleLogbookAttendancePunchIn = async () => {
    setIsPunchingAtt(true);
    try {
      let clientName = undefined;
      if (attLocation === 'client_site' && attClientId) {
        const found = clients.find(c => c.id === attClientId);
        clientName = found ? found.name : undefined;
      }
      await recordCheckIn(attLocation, attClientId || undefined, clientName, attNotes || 'Punched via Daily Desk');
      setSuccessToast('Attendance check-in recorded successfully for today!');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      alert(err?.message || 'Attendance punch failed');
    } finally {
      setIsPunchingAtt(false);
    }
  };

  // Attendance Punch Out
  const handleLogbookAttendancePunchOut = async () => {
    try {
      await recordCheckOut();
      setSuccessToast('Attendance check-out recorded! Great work today.');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      alert(err?.message || 'Punch out failed');
    }
  };

  // Submit new task punch to logbook
  const handlePunchTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchDescription.trim()) {
      alert('Please enter a task title / procedure summary in the manual box.');
      return;
    }

    setIsSubmitting(true);
    const asg = assignments.find(a => a.id === punchAssignmentId) || assignments[0];
    const task = tasks.find(t => t.id === punchTaskId);
    const supervisor = allStaff.find(s => s.uid === punchSupervisorId);

    const finalAuditArea = isCustomArea && customAreaText.trim()
      ? customAreaText.trim()
      : punchAuditArea;

    try {
      await submitWorkLog({
        traineeId: currentUser.uid,
        traineeName: currentUser.displayName,
        workDate: selectedDate,
        assignmentId: asg.id,
        assignmentRef: asg.referenceNo,
        clientId: asg.clientId,
        clientName: asg.clientName,
        auditArea: finalAuditArea,
        taskId: punchTaskId || undefined,
        taskTitle: task?.title || undefined,
        supervisorId: punchSupervisorId,
        supervisorName: supervisor?.displayName || 'Supervisor',
        workDescription: punchDescription,
        auditProcedures: punchProcedures || 'Substantive testing, vouching, and documentation verification.',
        workingPaperRef: punchWpRef || 'WP-GEN-01',
        hours: Number(punchHours),
        findings: punchFindings,
        pendingItems: punchPending
      });

      setSuccessToast(`Punched ${punchHours} hrs for ${asg.clientName} on ${finalAuditArea}!`);
      setTimeout(() => setSuccessToast(''), 4000);

      // Reset specific fields for next punch
      setPunchDescription('');
      setPunchProcedures('');
      setPunchFindings('');
      setPunchPending('');
      setPunchHours(2.0);
    } catch (err: any) {
      alert(err?.message || 'Error punching task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date navigation helpers
  const changeDateBy = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Trainee profile for display
  const activeTrainee = allStaff.find(s => s.uid === (isTrainee() ? currentUser.uid : selectedTraineeId)) || currentUser;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-blue-500/40 flex items-center space-x-3 text-xs animate-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
            <Check size={14} />
          </div>
          <div>
            <div className="font-bold">Desk Notification</div>
            <div className="text-slate-300">{successToast}</div>
          </div>
        </div>
      )}

      {/* Top Banner / Logbook Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-blue-300 font-bold uppercase tracking-wider mb-1">
              <span>Acharya R. & Associates</span>
              <span>•</span>
              <span>Unified Trainee Work Desk</span>
              <span>•</span>
              <span className="bg-blue-600/60 px-2 py-0.5 rounded text-white">Attendance & Task Logbook</span>
            </div>
            <h2 className="text-2xl font-bold font-serif flex items-center space-x-3">
              <span>Daily Punch Desk (Attendance + Task Logbook)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Punch in your daily attendance and log all audit tasks performed that day in one integrated place. Enter your audit procedures, working paper references, and actual hours directly in the manual form below.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* If supervisor, allow selecting which trainee to view */}
            {!isTrainee() && (
              <select
                value={selectedTraineeId}
                onChange={(e) => setSelectedTraineeId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-medium focus:outline-blue-500"
              >
                {allStaff.filter(s => s.role === 'article_trainee' || s.role === 'audit_senior').map(s => (
                  <option key={s.uid} value={s.uid}>
                    Trainee: {s.displayName} ({s.employeeCode})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => exportToCSV('worklogs')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <FileCheck size={14} />
              <span>Export ICAN Logbook</span>
            </button>
          </div>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => changeDateBy(-1)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <Calendar size={14} className="text-blue-400" />
              <span className="text-slate-400 font-medium">Logbook Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              />
              {selectedDate === todayStr && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  TODAY
                </span>
              )}
            </div>

            <button
              onClick={() => changeDateBy(1)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Daily Progress Gauge */}
          <div className="flex items-center space-x-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/80 text-xs">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Tasks Logged on {selectedDate}:</div>
              <div className="text-base font-bold text-white font-mono">
                {totalHoursPunchedToday.toFixed(1)} <span className="text-xs text-slate-400">/ {targetDailyHours} hrs target</span>
              </div>
            </div>

            <div className="w-24 bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalHoursPunchedToday >= targetDailyHours ? 'bg-emerald-400' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, (totalHoursPunchedToday / targetDailyHours) * 100)}%` }}
              ></div>
            </div>

            <div>
              {totalHoursPunchedToday >= targetDailyHours ? (
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center space-x-1">
                  <CheckCircle2 size={12} />
                  <span>Target Met</span>
                </span>
              ) : (
                <span className="text-[10px] text-amber-300 font-mono font-medium">
                  {hoursRemaining.toFixed(1)}h remaining
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: INTEGRATED ATTENDANCE PUNCH STATION (Right on the same page!) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span>Step 1: Daily Attendance Punch</span>
                {selectedDate === todayStr && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                    TODAY
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">Record your presence, check-in time, and location deployment</p>
            </div>
          </div>

          <div>
            {isCheckedInForDate ? (
              <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Punch: IN at {myDateAttendance?.checkInTime}</span>
              </span>
            ) : myDateAttendance?.checkOutTime ? (
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold">
                Day Completed (Out: {myDateAttendance.checkOutTime})
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold">
                Not Punched for this date
              </span>
            )}
          </div>
        </div>

        {/* If Already Checked In: Show live status & Punch Out button */}
        {isCheckedInForDate ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl gap-3">
            <div className="text-xs text-emerald-950 space-y-0.5">
              <div className="font-bold text-sm">You are currently Punched IN</div>
              <div>
                Punched in at: <strong className="font-mono">{myDateAttendance?.checkInTime}</strong> • Location:{' '}
                <strong className="capitalize">{myDateAttendance?.locationType.replace('_', ' ')}</strong>
                {myDateAttendance?.clientName && ` (${myDateAttendance.clientName})`}
              </div>
              <div className="text-[11px] text-emerald-800">
                You can now punch all audit tasks performed below throughout the day.
              </div>
            </div>

            <button
              onClick={handleLogbookAttendancePunchOut}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Clock size={15} />
              <span>Punch Out Attendance</span>
            </button>
          </div>
        ) : myDateAttendance?.checkOutTime ? (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
            <div>
              Attendance completed for {selectedDate}: In at <strong className="font-mono">{myDateAttendance.checkInTime}</strong>, Out at{' '}
              <strong className="font-mono">{myDateAttendance.checkOutTime}</strong> (
              {myDateAttendance.totalWorkingMinutes ? `${Math.floor(myDateAttendance.totalWorkingMinutes / 60)}h ${myDateAttendance.totalWorkingMinutes % 60}m` : '8 hrs'}).
            </div>
            <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
              PUNCH CLOSED
            </span>
          </div>
        ) : (
          /* Not checked in yet: Show inline punch in controls */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Location Category</label>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={() => setAttLocation('client_site')}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-medium transition cursor-pointer ${
                    attLocation === 'client_site'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Client Site
                </button>
                <button
                  type="button"
                  onClick={() => setAttLocation('office')}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-medium transition cursor-pointer ${
                    attLocation === 'office'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Office
                </button>
                <button
                  type="button"
                  onClick={() => setAttLocation('remote')}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-medium transition cursor-pointer ${
                    attLocation === 'remote'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Remote
                </button>
              </div>
            </div>

            {attLocation === 'client_site' && (
              <div className="md:col-span-4">
                <label className="block font-semibold text-slate-700 mb-1">Deployed Audit Client</label>
                <select
                  value={attClientId}
                  onChange={(e) => setAttClientId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.clientCode} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={attLocation === 'client_site' ? 'md:col-span-3' : 'md:col-span-7'}>
              <label className="block font-semibold text-slate-700 mb-1">Notes / Fieldwork Plan</label>
              <input
                type="text"
                value={attNotes}
                onChange={(e) => setAttNotes(e.target.value)}
                placeholder="e.g. Fieldwork at bank head office for BRS & loan files"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                disabled={isPunchingAtt}
                onClick={handleLogbookAttendancePunchIn}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <UserCheck size={14} />
                <span>{isPunchingAtt ? 'Punching...' : 'Punch In Now'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: TASK PUNCH DESK & LOGBOOK SHEET (With Prominent Manual Input Boxes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Task Punch-In Terminal (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Terminal Header & Mode Selector */}
            <div className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <PenTool size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Step 2: Punch Audit Task to Logbook</h3>
                    <p className="text-[11px] text-slate-500">Record procedures executed for {selectedDate}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-slate-600 hover:text-blue-700 font-semibold flex items-center space-x-1.5 px-2.5 py-1 rounded-md border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition cursor-pointer"
                  title="Clear all fields to start fresh"
                >
                  <RotateCcw size={13} />
                  <span>Reset / Clear Form</span>
                </button>
              </div>
            </div>

            {/* Manual Entry Guidance Banner */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                <PenTool size={13} />
              </div>
              <div className="text-slate-700">
                <strong className="text-slate-900 font-semibold">Direct Manual Task Entry:</strong> Enter the engagement, specific audit procedures carried out, working paper reference, and time spent today.
              </div>
            </div>

            {/* THE FORM WITH PROMINENT MANUAL INPUT BOXES */}
            <form onSubmit={handlePunchTask} className="mt-4 space-y-3.5 text-xs">
              {/* Box 1: Client & Assignment */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  1. Select Client & Audit Assignment <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={punchAssignmentId}
                  onChange={(e) => {
                    const asgId = e.target.value;
                    setPunchAssignmentId(asgId);
                    const found = assignments.find(a => a.id === asgId);
                    if (found) setPunchClientId(found.clientId);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.referenceNo} — {a.clientName} ({a.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Box 2 & 3: Audit Area & Working Paper Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    2. Audit Area <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={punchAuditArea}
                    onChange={(e) => handleAuditAreaChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {standardAuditAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    3. Working Paper Ref (WP) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WP-BNK-01 or WP-REV-02"
                    value={punchWpRef}
                    onChange={(e) => setPunchWpRef(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Box if Custom Audit Area is chosen */}
              {isCustomArea && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Type Custom Audit Area / Specialty Assignment <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Special Due Diligence, Forensic Review, Transfer Pricing..."
                    value={customAreaText}
                    onChange={(e) => setCustomAreaText(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
              )}

              {/* Box 4: Task Title (Prominent Manual Box) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 flex items-center">
                    <span>4. Task Title / Summary of Work Performed</span>
                    <span className="text-rose-500 ml-0.5 mr-2">*</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                      Manual Input Box
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-normal">Type any task description</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Type task title manually here (e.g., Physical stock count at factory, or BRS verification)"
                  value={punchDescription}
                  onChange={(e) => setPunchDescription(e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                />
              </div>

              {/* Box 5: Detailed Audit Procedures (Large Textarea Box) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 flex items-center">
                    <span>5. Detailed Audit Procedures Carried Out</span>
                    <span className="text-rose-500 ml-0.5 mr-2">*</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                      Manual Input Box
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-normal">Type procedures performed</span>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Type exact audit procedures performed manually here (e.g. sample tested 35 invoices above NPR 50,000, 3-way match against GRN and PO, verified 1.5% TDS deduction under Sec 89 of Income Tax Act 2058...)"
                  value={punchProcedures}
                  onChange={(e) => setPunchProcedures(e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-lg p-3 text-slate-800 leading-relaxed font-normal focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                />
              </div>

              {/* Box 6: Hours Spent */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">6. Hours Spent on this Task:</label>
                  <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {punchHours} hrs
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={punchHours}
                    onChange={(e) => setPunchHours(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
                <div className="flex space-x-1.5 mt-1.5">
                  {[1.0, 2.0, 3.5, 4.0, 7.5].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setPunchHours(h)}
                      className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold transition cursor-pointer ${
                        punchHours === h ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Box 7 & 8: Findings & Pending */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">7. Findings / Exceptions (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Unreconciled debit of NPR 4,200"
                    value={punchFindings}
                    onChange={(e) => setPunchFindings(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">8. Pending Client Documents</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank confirmation letter pending"
                    value={punchPending}
                    onChange={(e) => setPunchPending(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              </div>

              {/* Box 9: Supervisor */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">9. Supervisor for Quality Review</label>
                <select
                  value={punchSupervisorId}
                  onChange={(e) => setPunchSupervisorId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                >
                  {allStaff.filter(s => s.role !== 'article_trainee').map(s => (
                    <option key={s.uid} value={s.uid}>{s.displayName} ({s.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Punching to Logbook...' : 'Punch Task to Daily Logbook'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Today's Logbook Page / Punch Cards (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header of the Logbook Page */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <span>Today's Punched Sheet ({selectedDate})</span>
                  <span className="text-xs font-mono font-semibold text-blue-600">
                    ({traineeDateLogs.length} {traineeDateLogs.length === 1 ? 'Task' : 'Tasks'} Punched)
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Trainee: <strong className="text-slate-800">{activeTrainee.displayName}</strong> • {activeTrainee.employeeCode}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Total: {totalHoursPunchedToday.toFixed(1)} hrs
                </span>
              </div>
            </div>

            {/* Attendance Snapshot for this date */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Clock size={15} className="text-slate-500" />
                <span>
                  Attendance:{' '}
                  {myDateAttendance ? (
                    <strong className="text-slate-900">
                      In at {myDateAttendance.checkInTime} {myDateAttendance.checkOutTime && `| Out at ${myDateAttendance.checkOutTime}`} (
                      {myDateAttendance.locationType.replace('_', ' ')})
                    </strong>
                  ) : (
                    <span className="text-slate-400">Not recorded for this date</span>
                  )}
                </span>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                myDateAttendance?.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {myDateAttendance?.status || 'Missing'}
              </span>
            </div>

            {/* List of punched tasks for this day */}
            <div className="mt-4 space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
              {traineeDateLogs.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <BookOpen size={24} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No tasks punched for {selectedDate}</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Type your task details in the manual boxes on the left, then click "Punch Task to Daily Logbook".
                  </p>
                </div>
              ) : (
                traineeDateLogs.map((log, idx) => {
                  const isApproved = log.status === 'approved';
                  const isReturned = log.status === 'returned_for_revision';

                  return (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border shadow-xs transition ${
                        isApproved
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : isReturned
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-slate-200 bg-slate-50/40'
                      }`}
                    >
                      {/* Top Bar of Punch Card */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900">{log.clientName}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                            {log.workingPaperRef}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                            {log.hours} hrs
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isReturned
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                        <div className="font-bold text-slate-900">{log.workDescription}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Area: <span className="text-slate-800 font-semibold">{log.auditArea}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                          <strong>Procedures:</strong> {log.auditProcedures}
                        </div>

                        {log.findings && (
                          <div className="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-lg border border-rose-100">
                            <strong>Findings / Discrepancy:</strong> {log.findings}
                          </div>
                        )}

                        {log.reviewerComments && (
                          <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            <strong>Supervisor Feedback:</strong> {log.reviewerComments}
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <div>Supervisor: <strong className="text-slate-600">{log.supervisorName}</strong></div>
                        {isApproved && (
                          <div className="text-emerald-700 font-semibold flex items-center space-x-1">
                            <CheckCircle2 size={13} />
                            <span>Signed off by {log.approvedBy}</span>
                          </div>
                        )}
                        {!isApproved && isSenior() && (
                          <button
                            onClick={() => reviewWorkLog(log.id, 'approved', 'Verified and signed off by Audit Supervisor.')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            Sign & Approve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Summary / ICAN Compliance Seal */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-2">
              <Award size={16} className="text-blue-600" />
              <span>Certified under Institute of Chartered Accountants of Nepal (ICAN) Regulations</span>
            </div>

            <div className="font-mono text-slate-700 font-semibold">
              Today's Punched: {totalHoursPunchedToday.toFixed(1)} / {targetDailyHours} hrs
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
