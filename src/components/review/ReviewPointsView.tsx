import React, { useState } from 'react';
import {
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  User,
  FileText,
  X,
  MessageSquare,
  ShieldCheck,
  Award,
  Download,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';
import { ReviewPoint, PriorityLevel } from '../../types';

export const ReviewPointsView: React.FC = () => {
  const { reviewPoints, assignments, addReviewPoint, respondToReviewPoint, clearReviewPoint, exportToCSV } = usePractice();
  const { currentUser, allStaff, isSenior, isTrainee } = useAuth();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Response Drawer / Modal
  const [respondingRp, setRespondingRp] = useState<ReviewPoint | null>(null);
  const [traineeResponse, setTraineeResponse] = useState('');
  const [evidenceRef, setEvidenceRef] = useState('');

  // Clearance Drawer / Modal
  const [clearingRp, setClearingRp] = useState<ReviewPoint | null>(null);
  const [clearanceRemarks, setClearanceRemarks] = useState('');

  // New Review Point Form
  const [formData, setFormData] = useState({
    assignmentId: assignments[0]?.id || '',
    workingPaperRef: 'WP-',
    issueDescription: '',
    assignedToId: 'staff-article-trainee',
    priority: 'high' as PriorityLevel,
    targetClearanceDate: '2024-11-05'
  });

  const filteredPoints = reviewPoints.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchPriority = filterPriority === 'all' || r.priority === filterPriority;
    return matchStatus && matchPriority;
  });

  const handleCreateRp = async (e: React.FormEvent) => {
    e.preventDefault();
    const asg = assignments.find(a => a.id === formData.assignmentId);
    const assignedUser = allStaff.find(s => s.uid === formData.assignedToId);

    const refNo = `RP-${asg?.referenceNo.split('/')[2] || 'ASG'}-${String(reviewPoints.length + 1).padStart(2, '0')}`;

    await addReviewPoint({
      referenceNo: refNo,
      assignmentId: formData.assignmentId,
      assignmentRef: asg?.referenceNo || 'ARA/ASG',
      clientName: asg?.clientName || 'Client',
      workingPaperRef: formData.workingPaperRef,
      issueDescription: formData.issueDescription,
      raisedById: currentUser.uid,
      raisedByName: currentUser.displayName,
      assignedToId: formData.assignedToId,
      assignedToName: assignedUser?.displayName || 'Auditor',
      priority: formData.priority,
      dateRaised: new Date().toISOString().split('T')[0],
      targetClearanceDate: formData.targetClearanceDate
    });

    setIsModalOpen(false);
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingRp) return;

    await respondToReviewPoint(respondingRp.id, traineeResponse, evidenceRef);
    setRespondingRp(null);
    setTraineeResponse('');
    setEvidenceRef('');
  };

  const handleClear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearingRp) return;

    try {
      await clearReviewPoint(clearingRp.id, clearanceRemarks || 'Reviewed & Cleared');
      setClearingRp(null);
      setClearanceRemarks('');
    } catch (err: any) {
      alert(err?.message || 'Clearance error.');
    }
  };

  const [isBatchClearing, setIsBatchClearing] = useState(false);
  const addressedPoints = reviewPoints.filter(r => r.status === 'addressed_pending_clearance');

  const handleBatchClear = async () => {
    if (!addressedPoints.length) return;
    setIsBatchClearing(true);
    try {
      for (const rp of addressedPoints) {
        await clearReviewPoint(rp.id, 'Verified and cleared by engagement review team.');
      }
    } catch (err: any) {
      alert(err?.message || 'Batch clearance encountered an error.');
    } finally {
      setIsBatchClearing(false);
    }
  };

  const openCount = reviewPoints.filter(r => r.status === 'open').length;
  const addressedCount = reviewPoints.filter(r => r.status === 'addressed_pending_clearance').length;
  const clearedCount = reviewPoints.filter(r => r.status === 'cleared').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Audit Review Points & Clearance Register</h2>
          <p className="text-xs text-slate-500">
            Audit queries raised during manager & partner review, trainee resolution evidence, and final partner clearance.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isSenior() && addressedPoints.length > 0 && (
            <button
              onClick={handleBatchClear}
              disabled={isBatchClearing}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Batch clear all addressed review points"
            >
              <ShieldCheck size={14} />
              <span>{isBatchClearing ? 'Clearing...' : `Batch Clear (${addressedPoints.length})`}</span>
            </button>
          )}

          <button
            onClick={() => exportToCSV('review_points')}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Export Register (CSV)
          </button>

          {isSenior() && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition cursor-pointer"
            >
              <Plus size={16} />
              <span>Raise Review Query</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Open Review Points</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{openCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Requires substantive explanation or additional evidence</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Addressed / Pending Clearance</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{addressedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Trainee response submitted; waiting reviewer sign-off</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Cleared & Verified</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{clearedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Signed off for audit opinion issuance</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Clearance Statuses</option>
            <option value="open">Open (Unresolved)</option>
            <option value="addressed_pending_clearance">Addressed (Pending Clearance)</option>
            <option value="cleared">Cleared</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Review Points List */}
      <div className="space-y-4">
        {filteredPoints.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No audit review points in this view.
          </div>
        ) : (
          filteredPoints.map(rp => {
            const isOpen = rp.status === 'open';
            const isAddressed = rp.status === 'addressed_pending_clearance';
            const isCleared = rp.status === 'cleared';

            return (
              <div
                key={rp.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition ${
                  isOpen
                    ? 'border-rose-200 bg-rose-50/10'
                    : isAddressed
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {rp.referenceNo}
                    </span>
                    <span className="font-bold text-slate-900">{rp.clientName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-blue-700 font-bold">{rp.workingPaperRef}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rp.priority === 'critical'
                        ? 'bg-rose-600 text-white'
                        : rp.priority === 'high'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {rp.priority}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isCleared
                        ? 'bg-emerald-100 text-emerald-800'
                        : isAddressed
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {rp.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Audit Query Details */}
                <div className="mt-3 text-xs space-y-2">
                  <div>
                    <span className="font-semibold text-slate-900">Issue / Audit Query:</span>
                    <p className="mt-0.5 text-slate-700 leading-relaxed">{rp.issueDescription}</p>
                  </div>

                  <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1">
                    <span>Raised by: <strong className="text-slate-800">{rp.raisedByName}</strong> ({rp.dateRaised})</span>
                    <span>Responsible: <strong className="text-slate-800">{rp.assignedToName}</strong></span>
                    <span>Target Date: <strong className="font-mono text-slate-800">{rp.targetClearanceDate}</strong></span>
                  </div>

                  {/* Trainee Response if submitted */}
                  {rp.traineeResponse && (
                    <div className="mt-2.5 p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs">
                      <div className="font-bold text-blue-900 mb-0.5">Auditor Response & Resolution:</div>
                      <p className="text-slate-700 leading-relaxed">{rp.traineeResponse}</p>
                      {rp.evidenceRef && (
                        <div className="mt-1 font-mono text-[11px] text-blue-700">
                          Evidence Reference: <strong>{rp.evidenceRef}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reviewer Clearance info if cleared */}
                  {isCleared && rp.clearedByName && (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start space-x-2">
                      <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Cleared by {rp.clearedByName}</span> on {rp.clearanceDate}.
                        <p className="text-[11px] text-emerald-800 mt-0.5 italic">"{rp.clearanceRemarks}"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Assignment: {rp.assignmentRef}</span>

                  <div className="flex items-center space-x-2">
                    {/* Trainee can respond if open or addressed */}
                    {!isCleared && (
                      <button
                        onClick={() => {
                          setRespondingRp(rp);
                          setTraineeResponse(rp.traineeResponse || '');
                          setEvidenceRef(rp.evidenceRef || '');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <MessageSquare size={13} />
                        <span>{rp.traineeResponse ? 'Edit Response' : 'Respond to Query'}</span>
                      </button>
                    )}

                    {/* Only Senior / Manager / Partner can CLEAR review points (Acceptance requirement!) */}
                    {isSenior() && !isCleared && (
                      <button
                        onClick={() => {
                          setClearingRp(rp);
                          setClearanceRemarks('');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        <span>Clear Review Point</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Respond to Review Point Modal */}
      {respondingRp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Respond to Review Query</h3>
                <p className="text-xs text-slate-500">{respondingRp.referenceNo} • {respondingRp.workingPaperRef}</p>
              </div>
              <button
                onClick={() => setRespondingRp(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs">
              <strong className="text-slate-700">Issue:</strong> {respondingRp.issueDescription}
            </div>

            <form onSubmit={handleRespond} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resolution Explanation & Audit Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={traineeResponse}
                  onChange={(e) => setTraineeResponse(e.target.value)}
                  placeholder="Explain audit procedures carried out to address the reviewer's query, documentation obtained, or management's justification..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supporting Evidence / Document Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank confirmation letter dated Asar 31 / SWIFT copy TR-9021"
                  value={evidenceRef}
                  onChange={(e) => setEvidenceRef(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRespondingRp(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Submit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Review Point Modal */}
      {clearingRp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Clear Audit Review Point</h3>
                <p className="text-xs text-slate-500">Authorized Reviewer Verification</p>
              </div>
              <button
                onClick={() => setClearingRp(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div><strong className="text-slate-700">Ref:</strong> {clearingRp.referenceNo}</div>
              <div><strong className="text-slate-700">Issue:</strong> {clearingRp.issueDescription}</div>
              {clearingRp.traineeResponse && (
                <div className="mt-2 text-blue-900 bg-blue-50 p-2 rounded">
                  <strong>Trainee Response:</strong> {clearingRp.traineeResponse}
                </div>
              )}
            </div>

            <form onSubmit={handleClear} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Clearance Remarks / Quality Sign-Off Note
                </label>
                <input
                  type="text"
                  required
                  value={clearanceRemarks}
                  onChange={(e) => setClearanceRemarks(e.target.value)}
                  placeholder="e.g. Verified with client bank confirmation letter. Satisfactory."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setClearingRp(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm Clearance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise New Review Point Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Raise Audit Review Point</h3>
                <p className="text-xs text-slate-500">Manager / Partner Quality Review Query</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRp} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Engagement</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Working Paper Ref (WP)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WP-BNK-02"
                    value={formData.workingPaperRef}
                    onChange={(e) => setFormData({ ...formData, workingPaperRef: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Responsible Auditor / Article Trainee
                </label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                >
                  {allStaff.map(s => (
                    <option key={s.uid} value={s.uid}>{s.displayName} ({s.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Clearance Date</label>
                <input
                  type="date"
                  required
                  value={formData.targetClearanceDate}
                  onChange={(e) => setFormData({ ...formData, targetClearanceDate: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Issue Description & Query Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.issueDescription}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                  placeholder="e.g. Verify whether loan loss provisioning complies with NRB Directive No. 2..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Raise Review Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
