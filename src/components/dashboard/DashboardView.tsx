import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  FileCheck,
  TrendingUp,
  Filter,
  BarChart2,
  ArrowUpRight,
  UserCheck,
  Flame,
  Award,
  BookOpen
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';
import { Assignment, AuditTask } from '../../types';

export const DashboardView: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const { currentUser, allStaff } = useAuth();
  const {
    assignments,
    tasks,
    workLogs,
    attendanceRecords,
    leaveRequests,
    reviewPoints,
    clients,
    selectedFinancialYear
  } = usePractice();

  // Filters
  const [filterPartner, setFilterPartner] = useState<string>('all');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (filterPartner !== 'all' && a.engagementPartnerId !== filterPartner) return false;
      if (filterManager !== 'all' && a.auditManagerId !== filterManager) return false;
      if (filterCategory !== 'all' && a.category !== filterCategory) return false;
      if (filterStatus !== 'all' && a.completionStatus !== filterStatus) return false;
      return true;
    });
  }, [assignments, filterPartner, filterManager, filterCategory, filterStatus]);

  // Calculations
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const activeAssignments = filteredAssignments.filter(a => a.completionStatus !== 'completed' && a.completionStatus !== 'archived');
  const completedAssignments = filteredAssignments.filter(a => a.completionStatus === 'completed');

  // Deadlines: 7, 15, 30 days
  const getDaysDiff = (dateStr: string) => {
    const target = new Date(dateStr);
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const due7Days = activeAssignments.filter(a => {
    const d = getDaysDiff(a.statutoryDeadline || a.targetCompletionDate);
    return d >= 0 && d <= 7;
  });

  const due15Days = activeAssignments.filter(a => {
    const d = getDaysDiff(a.statutoryDeadline || a.targetCompletionDate);
    return d > 7 && d <= 15;
  });

  const due30Days = activeAssignments.filter(a => {
    const d = getDaysDiff(a.statutoryDeadline || a.targetCompletionDate);
    return d > 15 && d <= 30;
  });

  const overdueAssignments = activeAssignments.filter(a => {
    const d = getDaysDiff(a.statutoryDeadline || a.targetCompletionDate);
    return d < 0;
  });

  // People metrics
  const totalEmployees = allStaff.length;
  const activeTrainees = allStaff.filter(s => s.role === 'article_trainee').length;
  const todayPresent = attendanceRecords.filter(a => a.date === today);
  const onLeaveToday = leaveRequests.filter(l => l.status === 'approved' && l.startDate <= today && l.endDate >= today);
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending_manager' || l.status === 'pending_hr_partner');

  // Audit tasks and logs backlog
  const pendingWorkLogs = workLogs.filter(w => w.status === 'submitted' || w.status === 'under_review');
  const returnedWorkLogs = workLogs.filter(w => w.status === 'returned_for_revision');
  const openReviewPoints = reviewPoints.filter(r => r.status === 'open' || r.status === 'addressed_pending_clearance');
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'approved' && t.dueDate < today);

  // Total Hours
  const totalBudgetedHours = filteredAssignments.reduce((acc, curr) => acc + curr.budgetedHours, 0);
  const totalActualHours = filteredAssignments.reduce((acc, curr) => acc + curr.actualHours, 0);
  const hoursVariance = totalBudgetedHours - totalActualHours;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-blue-300 font-semibold uppercase tracking-wider mb-1">
              <span>Acharya R. & Associates</span>
              <span>•</span>
              <span>Executive Practice Cockpit</span>
              <span>•</span>
              <span className="bg-blue-600/60 px-2 py-0.5 rounded text-white">FY {selectedFinancialYear}</span>
            </div>
            <h2 className="text-2xl font-bold font-serif">
              Namaste, {currentUser.displayName}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Integrated Practice & People Management oversight inspired by Zoho Projects and Zoho People. Track audit engagements, ICAN article trainee daily diaries, review clearances, and attendance registers.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('logbook')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <BookOpen size={15} />
              <span>Daily Punch Desk (Attendance + Tasks)</span>
            </button>
            <button
              onClick={() => onNavigate('assignments')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <Briefcase size={15} />
              <span>New Engagement</span>
            </button>
            <button
              onClick={() => onNavigate('worklogs')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center space-x-2 cursor-pointer"
            >
              <FileCheck size={15} />
              <span>Review Logs ({pendingWorkLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Engagement Partner</label>
            <select
              value={filterPartner}
              onChange={(e) => setFilterPartner(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-blue-500"
            >
              <option value="all">All Partners</option>
              {allStaff.filter(s => s.role === 'managing_partner' || s.role === 'engagement_partner').map(p => (
                <option key={p.uid} value={p.uid}>{p.displayName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Audit Manager</label>
            <select
              value={filterManager}
              onChange={(e) => setFilterManager(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-blue-500"
            >
              <option value="all">All Managers</option>
              {allStaff.filter(s => s.role === 'audit_manager').map(m => (
                <option key={m.uid} value={m.uid}>{m.displayName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Assignment Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-blue-500"
            >
              <option value="all">All Audit Categories</option>
              <option value="Statutory Audit">Statutory Audit</option>
              <option value="Internal Audit">Internal Audit</option>
              <option value="Tax Audit & Compliance">Tax Audit & Compliance</option>
              <option value="Agreed-Upon Procedures">Agreed-Upon Procedures</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Assignment Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning Phase</option>
              <option value="fieldwork">Fieldwork Phase</option>
              <option value="manager_review">Manager Review</option>
              <option value="partner_review">Partner Review</option>
              <option value="completed">Completed & Signed Off</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Zoho Projects & Zoho People fusion) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Engagements */}
        <div
          onClick={() => onNavigate('assignments')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Audits</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeAssignments.length}</div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>Completed: <strong className="text-emerald-600">{completedAssignments.length}</strong></span>
            {overdueAssignments.length > 0 && (
              <span className="text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                {overdueAssignments.length} Overdue
              </span>
            )}
          </div>
        </div>

        {/* Staff & Trainees */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Attendance</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {todayPresent.length} <span className="text-xs font-normal text-slate-400">/ {totalEmployees} present</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>{activeTrainees} Active Trainees</span>
            <span className="text-amber-700 font-semibold">
              {onLeaveToday.length} on leave
            </span>
          </div>
        </div>

        {/* Work Logs Awaiting Review */}
        <div
          onClick={() => onNavigate('worklogs')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Trainee Work Logs</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingWorkLogs.length}</div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span className="text-amber-600 font-medium">Pending Review</span>
            {returnedWorkLogs.length > 0 && (
              <span className="text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                {returnedWorkLogs.length} Revision
              </span>
            )}
          </div>
        </div>

        {/* Review Points & Queries */}
        <div
          onClick={() => onNavigate('review_points')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Audit Review Points</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{openReviewPoints.length}</div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>{overdueTasks.length} Overdue Tasks</span>
            <span className="text-rose-600 font-semibold">Open Queries</span>
          </div>
        </div>
      </div>

      {/* Deadline Radar & Hours Variance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statutory & Reporting Deadlines Radar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Audit Deadlines</h3>
              <p className="text-[11px] text-slate-500">Statutory and client reporting milestones</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {due7Days.length + due15Days.length + due30Days.length} Upcoming
            </span>
          </div>

          <div className="space-y-3">
            {/* 7 Days */}
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg">
              <div className="flex items-center justify-between text-xs font-bold text-rose-900 mb-1">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <span>Due within 7 Days (Critical)</span>
                </span>
                <span>{due7Days.length}</span>
              </div>
              {due7Days.length === 0 ? (
                <p className="text-[11px] text-rose-700/80">No critical deadlines in 7 days</p>
              ) : (
                <div className="space-y-1.5 mt-2">
                  {due7Days.map(a => (
                    <div key={a.id} className="text-[11px] flex items-center justify-between bg-white p-2 rounded border border-rose-200/80">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{a.clientName}</span>
                      <span className="text-rose-700 font-mono font-bold">{a.statutoryDeadline}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 15 Days */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Due within 15 Days</span>
                </span>
                <span>{due15Days.length}</span>
              </div>
              {due15Days.length > 0 && (
                <div className="space-y-1 mt-1.5">
                  {due15Days.slice(0, 2).map(a => (
                    <div key={a.id} className="text-[11px] flex items-center justify-between bg-white p-1.5 rounded border border-amber-200/80">
                      <span className="font-medium text-slate-700 truncate max-w-[170px]">{a.clientName}</span>
                      <span className="text-amber-800 font-mono">{a.statutoryDeadline}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 30 Days */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>Due within 30 Days</span>
                </span>
                <span>{due30Days.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Planned vs Actual Assignment Hours (Zoho Projects time budget) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Budgeted vs Actual Hours</h3>
              <p className="text-[11px] text-slate-500">Audit time utilization across active engagements</p>
            </div>
            <BarChart2 size={18} className="text-slate-400" />
          </div>

          <div className="flex items-center justify-around py-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Budgeted</div>
              <div className="text-xl font-bold text-slate-900">{totalBudgetedHours} hrs</div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Logged / Actual</div>
              <div className="text-xl font-bold text-blue-600">{totalActualHours} hrs</div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Remaining</div>
              <div className="text-xl font-bold text-emerald-600">{hoursVariance} hrs</div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filteredAssignments.slice(0, 3).map(asg => {
              const pct = Math.min(100, Math.round((asg.actualHours / asg.budgetedHours) * 100));
              return (
                <div key={asg.id} className="text-xs">
                  <div className="flex items-center justify-between text-slate-800 font-medium mb-1">
                    <span className="truncate max-w-[200px]">{asg.clientName}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{asg.actualHours} / {asg.budgetedHours}h ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct > 90 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Attendance & Today's Client Sites (Zoho People) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Staff Deployment</h3>
              <p className="text-[11px] text-slate-500">Live check-ins, client sites & approved leaves</p>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
            {allStaff.map(staff => {
              const att = attendanceRecords.find(a => a.userId === staff.uid && a.date === today);
              const onLeave = leaveRequests.find(l => l.userId === staff.uid && l.status === 'approved' && l.startDate <= today && l.endDate >= today);

              return (
                <div key={staff.uid} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      {staff.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{staff.displayName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{staff.designation}</div>
                    </div>
                  </div>

                  <div>
                    {onLeave ? (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold">
                        On Leave
                      </span>
                    ) : att ? (
                      <div className="text-right">
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold capitalize">
                          {att.locationType === 'client_site' ? 'Client Site' : 'Office'}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-mono">{att.checkInTime}</div>
                      </div>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                        Not Punched
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Audit Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Audit Engagements Register</h3>
            <p className="text-[11px] text-slate-500">Live progress, audit stage, risk rating, and working paper review status</p>
          </div>
          <button
            onClick={() => onNavigate('assignments')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Engagements</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Engagement Partner</th>
                <th className="py-3 px-4">Audit Manager</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Fieldwork</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activeAssignments.map(asg => (
                <tr key={asg.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-blue-700">{asg.referenceNo}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{asg.clientName}</td>
                  <td className="py-3 px-4">{asg.category}</td>
                  <td className="py-3 px-4 text-slate-600">{asg.engagementPartnerName}</td>
                  <td className="py-3 px-4 text-slate-600">{asg.auditManagerName}</td>
                  <td className="py-3 px-4 font-mono text-slate-800">{asg.statutoryDeadline}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      asg.riskLevel === 'high' || asg.riskLevel === 'significant'
                        ? 'bg-rose-100 text-rose-800'
                        : asg.riskLevel === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {asg.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 capitalize font-medium">{asg.fieldworkStatus.replace('_', ' ')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      asg.reviewStatus === 'review_points_open'
                        ? 'bg-rose-100 text-rose-800'
                        : asg.reviewStatus === 'cleared'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {asg.reviewStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                      {asg.completionStatus.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
