import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle,
  RotateCcw,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Calendar,
  X,
  Send,
  MessageSquare,
  Lock,
  Download,
  Filter,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';
import { WorkLog, WorkLogStatus } from '../../types';

export const ArticleTraineeDiaryView: React.FC = () => {
  const { workLogs, assignments, tasks, submitWorkLog, resubmitWorkLog, reviewWorkLog, exportToCSV } = usePractice();
  const { currentUser, allStaff, isTrainee, isSenior } = useAuth();

  const [activeTab, setActiveTab] = useState<'my_diary' | 'supervisor_review'>(
    isTrainee() ? 'my_diary' : 'supervisor_review'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);

  // Review Drawer / Modal
  const [reviewingLog, setReviewingLog] = useState<WorkLog | null>(null);
  const [reviewerComments, setReviewerComments] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Daily Diary Form State
  const [formData, setFormData] = useState({
    workDate: new Date().toISOString().split('T')[0],
    assignmentId: assignments[0]?.id || '',
    auditArea: 'Cash & Bank Balances',
    taskId: '',
    supervisorId: 'staff-audit-senior',
    workDescription: '',
    auditProcedures: '',
    workingPaperRef: 'WP-',
    hours: 7.5,
    findings: '',
    pendingItems: ''
  });

  const auditAreas = [
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
    'Other Professional Assignments'
  ];

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return workLogs.filter(log => {
      // If in "my_diary" view, show current user's logs
      if (activeTab === 'my_diary' && log.traineeId !== currentUser.uid && isTrainee()) {
        return false;
      }
      const matchSearch =
        log.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.traineeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.workingPaperRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.auditArea.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || log.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [workLogs, activeTab, currentUser, isTrainee, searchTerm, filterStatus]);

  // Trainee KPI Metrics
  const myLogs = workLogs.filter(w => w.traineeId === currentUser.uid);
  const myTotalApprovedHours = myLogs.filter(w => w.status === 'approved').reduce((acc, c) => acc + c.hours, 0);
  const myReturnedLogs = myLogs.filter(w => w.status === 'returned_for_revision');
  const myPendingLogs = myLogs.filter(w => w.status === 'submitted' || w.status === 'under_review');

  // Supervisor KPI Metrics
  const logsToReview = workLogs.filter(w => w.status === 'submitted' || w.status === 'under_review');

  const handleOpenSubmit = (logToEdit?: WorkLog) => {
    if (logToEdit) {
      setEditingLog(logToEdit);
      setFormData({
        workDate: logToEdit.workDate,
        assignmentId: logToEdit.assignmentId,
        auditArea: logToEdit.auditArea,
        taskId: logToEdit.taskId || '',
        supervisorId: logToEdit.supervisorId,
        workDescription: logToEdit.workDescription,
        auditProcedures: logToEdit.auditProcedures,
        workingPaperRef: logToEdit.workingPaperRef,
        hours: logToEdit.hours,
        findings: logToEdit.findings,
        pendingItems: logToEdit.pendingItems
      });
    } else {
      setEditingLog(null);
      setFormData({
        workDate: new Date().toISOString().split('T')[0],
        assignmentId: assignments[0]?.id || '',
        auditArea: 'Cash & Bank Balances',
        taskId: '',
        supervisorId: 'staff-audit-senior',
        workDescription: '',
        auditProcedures: '',
        workingPaperRef: 'WP-',
        hours: 7.5,
        findings: '',
        pendingItems: ''
      });
    }
    setIsSubmitModalOpen(true);
  };

  const handleSaveDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    const asg = assignments.find(a => a.id === formData.assignmentId);
    const supervisor = allStaff.find(s => s.uid === formData.supervisorId);
    const task = tasks.find(t => t.id === formData.taskId);

    if (editingLog) {
      // Revision submission
      await resubmitWorkLog(editingLog.id, {
        workDate: formData.workDate,
        assignmentId: formData.assignmentId,
        assignmentRef: asg?.referenceNo || editingLog.assignmentRef,
        clientId: asg?.clientId || editingLog.clientId,
        clientName: asg?.clientName || editingLog.clientName,
        auditArea: formData.auditArea,
        taskId: formData.taskId || undefined,
        taskTitle: task?.title || undefined,
        supervisorId: formData.supervisorId,
        supervisorName: supervisor?.displayName || editingLog.supervisorName,
        workDescription: formData.workDescription,
        auditProcedures: formData.auditProcedures,
        workingPaperRef: formData.workingPaperRef,
        hours: Number(formData.hours),
        findings: formData.findings,
        pendingItems: formData.pendingItems
      });
    } else {
      // New diary entry
      await submitWorkLog({
        traineeId: currentUser.uid,
        traineeName: currentUser.displayName,
        workDate: formData.workDate,
        assignmentId: formData.assignmentId,
        assignmentRef: asg?.referenceNo || 'ARA/STAT',
        clientId: asg?.clientId || 'cli-001',
        clientName: asg?.clientName || 'Client Name',
        auditArea: formData.auditArea,
        taskId: formData.taskId || undefined,
        taskTitle: task?.title || undefined,
        supervisorId: formData.supervisorId,
        supervisorName: supervisor?.displayName || 'Supervisor',
        workDescription: formData.workDescription,
        auditProcedures: formData.auditProcedures,
        workingPaperRef: formData.workingPaperRef,
        hours: Number(formData.hours),
        findings: formData.findings,
        pendingItems: formData.pendingItems
      });
    }

    setIsSubmitModalOpen(false);
  };

  const handleReviewAction = async (decision: 'approved' | 'returned_for_revision') => {
    if (!reviewingLog) return;
    setReviewError('');

    if (decision === 'returned_for_revision' && !reviewerComments.trim()) {
      setReviewError('Please provide feedback comments explaining what needs correction or addition.');
      return;
    }

    try {
      await reviewWorkLog(reviewingLog.id, decision, reviewerComments || 'Approved by Supervisor.');
      setReviewingLog(null);
      setReviewerComments('');
    } catch (err: any) {
      setReviewError(err?.message || 'Action failed.');
    }
  };

  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const handleBatchApprove = async () => {
    if (!logsToReview.length) return;
    setIsBatchApproving(true);
    try {
      for (const log of logsToReview) {
        if (log.traineeId !== currentUser.uid) {
          await reviewWorkLog(log.id, 'approved', 'Batch quality reviewed and verified by supervisor.');
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Batch approval completed with warnings.');
    } finally {
      setIsBatchApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
            <span>ICAN Practical Training Compliance</span>
            <span>•</span>
            <span>Daily Article Diary</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Daily Article Trainee Work Tracker</h2>
          <p className="text-xs text-slate-500">
            Log audit procedures, working paper references, exceptions found, and obtain supervisor approval.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isSenior() && activeTab === 'supervisor_review' && logsToReview.length > 0 && (
            <button
              onClick={handleBatchApprove}
              disabled={isBatchApproving}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Batch approve all pending trainee entries"
            >
              <CheckCircle2 size={14} />
              <span>{isBatchApproving ? 'Approving...' : `Batch Approve All (${logsToReview.length})`}</span>
            </button>
          )}

          <button
            onClick={() => exportToCSV('worklogs')}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            title="Download ICAN compliant article training diary"
          >
            <Download size={14} />
            <span>Export ICAN Diary</span>
          </button>

          <button
            onClick={() => handleOpenSubmit()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Log Daily Work</span>
          </button>
        </div>
      </div>

      {/* Trainee / Supervisor KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Training Hours</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{myTotalApprovedHours} hrs</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center space-x-1">
            <CheckCircle size={13} />
            <span>Counted towards ICAN Articleship</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {isTrainee() ? myPendingLogs.length : logsToReview.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isTrainee() ? 'Submitted diaries in queue' : 'Logs pending supervisor sign-off'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Returned for Revision</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {myReturnedLogs.length}
          </div>
          <div className="text-[11px] text-rose-600 mt-1">
            {myReturnedLogs.length > 0 ? 'Requires revision & resubmission' : 'All clear'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Entries Logged</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{workLogs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Firm-wide audit procedures</div>
        </div>
      </div>

      {/* View Switcher: My Diary vs Supervisor Portal */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('my_diary')}
          className={`py-2.5 px-5 border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'my_diary'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen size={15} />
          <span>My Daily Work Diary ({myLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supervisor_review')}
          className={`py-2.5 px-5 border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'supervisor_review'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Supervisor Review Portal ({logsToReview.length} Pending)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, procedure, or WP ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-blue-600"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="returned_for_revision">Returned for Revision</option>
            <option value="approved">Approved & Locked</option>
          </select>
        </div>
      </div>

      {/* Work Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No work log entries found matching your criteria.
          </div>
        ) : (
          filteredLogs.map(log => {
            const isApproved = log.status === 'approved';
            const isReturned = log.status === 'returned_for_revision';

            return (
              <div
                key={log.id}
                className={`bg-white rounded-xl border shadow-xs p-5 transition ${
                  isReturned
                    ? 'border-amber-300 bg-amber-50/20'
                    : isApproved
                    ? 'border-slate-200'
                    : 'border-blue-200 bg-blue-50/10'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {log.workDate}
                    </span>
                    <span className="font-bold text-slate-900">{log.clientName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-blue-700 font-medium">{log.auditArea}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                      {log.workingPaperRef}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {log.hours} hrs
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : isReturned
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.status.replace(/_/g, ' ')} {log.version > 1 && `(v${log.version})`}
                    </span>
                  </div>
                </div>

                {/* Trainee & Supervisor Meta */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center space-x-4">
                    <span>Trainee: <strong className="text-slate-700">{log.traineeName}</strong></span>
                    <span>Supervisor: <strong className="text-slate-700">{log.supervisorName}</strong></span>
                  </div>
                  {log.approvedAt && (
                    <span className="text-emerald-700 font-medium">
                      Signed off on {new Date(log.approvedAt).toLocaleDateString()} by {log.approvedBy}
                    </span>
                  )}
                </div>

                {/* Audit Content */}
                <div className="mt-3 space-y-2 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-800">Description of Work:</span>
                    <p className="mt-0.5 leading-relaxed text-slate-600">{log.workDescription}</p>
                  </div>

                  {log.auditProcedures && (
                    <div>
                      <span className="font-semibold text-slate-800">Audit Procedures Executed:</span>
                      <p className="mt-0.5 leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {log.auditProcedures}
                      </p>
                    </div>
                  )}

                  {log.findings && (
                    <div>
                      <span className="font-semibold text-slate-800">Findings & Exceptions:</span>
                      <p className="mt-0.5 leading-relaxed text-rose-700 font-medium">{log.findings}</p>
                    </div>
                  )}

                  {/* Reviewer Comments & Feedback */}
                  {log.reviewerComments && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mt-2">
                      <div className="flex items-center space-x-1.5 font-bold mb-0.5">
                        <MessageSquare size={14} className="text-amber-700" />
                        <span>Supervisor Review Feedback:</span>
                      </div>
                      <p className="leading-relaxed">{log.reviewerComments}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    {isApproved ? (
                      <span className="text-slate-400 flex items-center space-x-1 text-[11px]">
                        <Lock size={12} />
                        <span>Locked (Approved by firm partner/supervisor)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Ref: {log.assignmentRef}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Trainee edit action if returned or draft */}
                    {isReturned && (log.traineeId === currentUser.uid || isTrainee()) && (
                      <button
                        onClick={() => handleOpenSubmit(log)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>Revise & Resubmit</span>
                      </button>
                    )}

                    {/* Supervisor Review Action */}
                    {!isApproved && isSenior() && (
                      <button
                        onClick={() => {
                          setReviewingLog(log);
                          setReviewerComments(log.reviewerComments || '');
                          setReviewError('');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        <span>Review & Sign Off</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Supervisor Review Modal */}
      {reviewingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Review Article Trainee Work Log</h3>
                <p className="text-xs text-slate-500">ICAN Articleship Training Standards Review</p>
              </div>
              <button
                onClick={() => setReviewingLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {reviewError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {reviewError}
              </div>
            )}

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div><strong className="text-slate-700">Trainee:</strong> {reviewingLog.traineeName}</div>
              <div><strong className="text-slate-700">Client:</strong> {reviewingLog.clientName}</div>
              <div><strong className="text-slate-700">Audit Area:</strong> {reviewingLog.auditArea}</div>
              <div><strong className="text-slate-700">Hours Logged:</strong> {reviewingLog.hours} hrs</div>
              <div><strong className="text-slate-700">Working Paper:</strong> {reviewingLog.workingPaperRef}</div>
              <div className="mt-2 text-slate-600 leading-relaxed border-t border-slate-200 pt-2">
                <strong>Work Summary:</strong> {reviewingLog.workDescription}
              </div>
            </div>

            <div className="mt-4 text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Supervisor Feedback / Return Comments
              </label>
              <textarea
                rows={3}
                value={reviewerComments}
                onChange={(e) => setReviewerComments(e.target.value)}
                placeholder="Required if returning for revision. E.g. Add voucher numbers, attach physical cash verification sheet..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800"
              />
            </div>

            <div className="mt-6 flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => handleReviewAction('returned_for_revision')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Return for Revision</span>
              </button>

              <button
                onClick={() => handleReviewAction('approved')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Approve & Lock Hours</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit / Edit Work Log Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingLog ? 'Revise Article Trainee Work Log' : 'Daily Work Log (ICAN Training Diary)'}
                </h3>
                <p className="text-xs text-slate-500">Acharya R. & Associates Practice Diary</p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDiary} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Date</label>
                  <input
                    type="date"
                    required
                    value={formData.workDate}
                    onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hours Spent</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="14"
                    required
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Engagement / Client</label>
                <select
                  value={formData.assignmentId}
                  onChange={(e) => setFormData({ ...formData, assignmentId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                >
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>{a.referenceNo} — {a.clientName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Audit Area</label>
                  <select
                    value={formData.auditArea}
                    onChange={(e) => setFormData({ ...formData, auditArea: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    {auditAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Working Paper Ref (WP)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WP-BNK-01"
                    value={formData.workingPaperRef}
                    onChange={(e) => setFormData({ ...formData, workingPaperRef: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supervisor for Review</label>
                <select
                  value={formData.supervisorId}
                  onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                >
                  {allStaff.filter(s => s.role !== 'article_trainee').map(s => (
                    <option key={s.uid} value={s.uid}>{s.displayName} ({s.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description of Work Performed <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.workDescription}
                  onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                  placeholder="Summary of audit task executed during the day..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Detailed Audit Procedures Carried Out <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.auditProcedures}
                  onChange={(e) => setFormData({ ...formData, auditProcedures: e.target.value })}
                  placeholder="e.g. Vouching sample invoices above NPR 50,000; verified 3-way matching of GRN, PO, and invoice; tested TDS calculation under Sec 88 of Income Tax Act 2058."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Findings & Exceptions Noted</label>
                  <input
                    type="text"
                    value={formData.findings}
                    onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                    placeholder="Discrepancies, unrecorded items..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pending Items / Next Steps</label>
                  <input
                    type="text"
                    value={formData.pendingItems}
                    onChange={(e) => setFormData({ ...formData, pendingItems: e.target.value })}
                    placeholder="Pending client documents..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Send size={14} />
                  <span>{editingLog ? 'Resubmit for Review' : 'Submit Daily Diary'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
