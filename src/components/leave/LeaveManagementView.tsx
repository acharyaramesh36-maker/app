import React, { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  X,
  FileText,
  ShieldCheck,
  Award
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';
import { LeaveCategory, LeaveRequest } from '../../types';

export const LeaveManagementView: React.FC = () => {
  const { leaveRequests, leaveBalances, submitLeaveRequest, actionLeaveRequest, exportToCSV } = usePractice();
  const { currentUser, isManager, isPartner, isHr, canApproveLeave } = useAuth();

  const [activeTab, setActiveTab] = useState<'my_leaves' | 'approvals'>('my_leaves');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [approverRemarks, setApproverRemarks] = useState('');
  const [formError, setFormError] = useState('');

  // Form State
  const [category, setCategory] = useState<LeaveCategory>('casual_leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<'morning' | 'afternoon'>('morning');
  const [reason, setReason] = useState('');

  const calculateDays = () => {
    if (isHalfDay) return 0.5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (new Date(endDate) < new Date(startDate)) {
      setFormError('End date cannot precede start date.');
      return;
    }

    const days = calculateDays();

    try {
      await submitLeaveRequest({
        category,
        startDate,
        endDate,
        daysCount: days,
        isHalfDay,
        halfDaySession: isHalfDay ? halfDaySession : undefined,
        reason
      });
      setIsApplyModalOpen(false);
      setReason('');
    } catch (err: any) {
      setFormError(err?.message || 'Error submitting leave application.');
    }
  };

  const handleAction = async (decision: 'approved' | 'rejected') => {
    if (!reviewingLeave) return;

    try {
      await actionLeaveRequest(reviewingLeave.id, decision, approverRemarks || `${decision.toUpperCase()} by Manager/Partner`);
      setReviewingLeave(null);
      setApproverRemarks('');
    } catch (err: any) {
      alert(err?.message || 'Action failed');
    }
  };

  const myLeaves = leaveRequests.filter(l => l.userId === currentUser.uid);
  const pendingApprovals = leaveRequests.filter(l => l.status === 'pending_manager' || l.status === 'pending_hr_partner');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Leave Management (Zoho People)</h2>
          <p className="text-xs text-slate-500">
            Leave entitlements, ICAN article trainee CA exam study leaves, applications, and multi-tier approvals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportToCSV('leaves')}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Export Register (CSV)
          </button>
          <button
            onClick={() => {
              setFormError('');
              setIsApplyModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Leave Entitlement Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {leaveBalances.map(bal => (
          <div key={bal.category} className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 truncate">{bal.title}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {bal.remaining} <span className="text-xs font-normal text-slate-400">/ {bal.entitled} left</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Used: <strong className="text-slate-700">{bal.used} days</strong></span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                bal.remaining > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {bal.remaining} Remaining
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('my_leaves')}
          className={`py-2.5 px-5 border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'my_leaves'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck size={15} />
          <span>My Leave Applications ({myLeaves.length})</span>
        </button>

        {canApproveLeave() && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-2.5 px-5 border-b-2 transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'approvals'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Pending Approvals ({pendingApprovals.length})</span>
          </button>
        )}
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Leave Category</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Total Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Approver Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(activeTab === 'my_leaves' ? myLeaves : pendingApprovals).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No leave applications found in this view.
                  </td>
                </tr>
              ) : (
                (activeTab === 'my_leaves' ? myLeaves : pendingApprovals).map(leave => (
                  <tr key={leave.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {leave.userName}
                      <div className="text-[10px] text-slate-400 font-normal capitalize">
                        {leave.userRole.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 capitalize">
                        {leave.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {leave.startDate} {leave.startDate !== leave.endDate && `→ ${leave.endDate}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {leave.daysCount} {leave.daysCount === 1 ? 'day' : 'days'}
                      {leave.isHalfDay && <span className="text-[10px] text-purple-600 ml-1">(Half-day)</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">{leave.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        leave.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : leave.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {leave.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs">
                      {leave.approverRemarks || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canApproveLeave() && (leave.status === 'pending_manager' || leave.status === 'pending_hr_partner') && (
                        <button
                          onClick={() => {
                            setReviewingLeave(leave);
                            setApproverRemarks('');
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold cursor-pointer"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Leave Modal */}
      {reviewingLeave && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Review Leave Request</h3>
                <p className="text-xs text-slate-500">{reviewingLeave.userName} • {reviewingLeave.category.replace(/_/g, ' ')}</p>
              </div>
              <button
                onClick={() => setReviewingLeave(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
              <div><strong className="text-slate-700">Dates:</strong> {reviewingLeave.startDate} to {reviewingLeave.endDate} ({reviewingLeave.daysCount} days)</div>
              <div><strong className="text-slate-700">Reason:</strong> {reviewingLeave.reason}</div>
            </div>

            <div className="mt-4 text-xs">
              <label className="block font-semibold text-slate-700 mb-1">Approver Remarks</label>
              <input
                type="text"
                value={approverRemarks}
                onChange={(e) => setApproverRemarks(e.target.value)}
                placeholder="e.g. Approved. Fieldwork handed over to co-trainee."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>

            <div className="mt-6 flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => handleAction('rejected')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <XCircle size={14} />
                <span>Reject</span>
              </button>

              <button
                onClick={() => handleAction('approved')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <CheckCircle2 size={14} />
                <span>Approve Leave</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Apply for Leave</h3>
                <p className="text-xs text-slate-500">Acharya R. & Associates Leave Portal</p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleApply} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LeaveCategory)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="casual_leave">Casual Leave</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="ca_exam_study">CA Exam Study Leave (ICAN Articleship)</option>
                  <option value="annual_leave">Earned / Annual Leave</option>
                  <option value="maternity_paternity">Maternity / Paternity</option>
                  <option value="unpaid_leave">Leave Without Pay (LWP)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="halfDay"
                  checked={isHalfDay}
                  onChange={(e) => setIsHalfDay(e.target.checked)}
                  className="rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="halfDay" className="text-slate-700 font-medium cursor-pointer">
                  Half Day Leave (0.5 day)
                </label>
              </div>

              {isHalfDay && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Half-Day Session</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={halfDaySession === 'morning'}
                        onChange={() => setHalfDaySession('morning')}
                        name="session"
                      />
                      <span>Morning (First Half)</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={halfDaySession === 'afternoon'}
                        onChange={() => setHalfDaySession('afternoon')}
                        name="session"
                      />
                      <span>Afternoon (Second Half)</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Specify examination schedule, medical illness, or personal emergency..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Submit Application ({calculateDays()} {calculateDays() === 1 ? 'day' : 'days'})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
