import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  Users,
  Calendar,
  X,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';
import { Assignment, AssignmentCategory, PriorityLevel, AssignmentStatus } from '../../types';
import { STANDARD_AUDIT_TEMPLATES } from '../../data/seedData';

export const AssignmentsView: React.FC<{ onNavigateToTasks: (asgId: string) => void }> = ({ onNavigateToTasks }) => {
  const { assignments, clients, addAssignment, updateAssignment, signoffAssignment, tasks } = usePractice();
  const { currentUser, allStaff, isPartner, isManager } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignoffModalOpen, setIsSignoffModalOpen] = useState(false);
  const [signoffTarget, setSignoffTarget] = useState<Assignment | null>(null);
  const [signoffNotes, setSignoffNotes] = useState('');
  const [signoffError, setSignoffError] = useState('');

  // New Engagement Form
  const [formData, setFormData] = useState({
    referenceNo: `ARA/2080-81/STAT-00${assignments.length + 1}`,
    clientId: clients[0]?.id || '',
    category: 'Statutory Audit' as AssignmentCategory,
    financialYear: '2080/81',
    engagementPartnerId: 'staff-managing-partner',
    auditManagerId: 'staff-audit-manager',
    teamMemberIds: ['staff-audit-senior', 'staff-article-trainee'],
    startDate: new Date().toISOString().split('T')[0],
    targetCompletionDate: '2024-11-30',
    statutoryDeadline: '2024-12-15',
    budgetedHours: 200,
    priority: 'high' as PriorityLevel,
    riskLevel: 'medium' as 'low' | 'medium' | 'high' | 'significant',
    templateId: 'tpl-statutory-audit'
  });

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchSearch =
        a.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategory === 'all' || a.category === filterCategory;
      const matchStat = filterStatus === 'all' || a.completionStatus === filterStatus;
      return matchSearch && matchCat && matchStat;
    });
  }, [assignments, searchTerm, filterCategory, filterStatus]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === formData.clientId);
    const partner = allStaff.find(s => s.uid === formData.engagementPartnerId);
    const manager = allStaff.find(s => s.uid === formData.auditManagerId);

    const asgId = await addAssignment({
      referenceNo: formData.referenceNo,
      clientId: formData.clientId,
      clientName: client?.name || 'Selected Client',
      category: formData.category,
      financialYear: formData.financialYear,
      engagementPartnerId: formData.engagementPartnerId,
      engagementPartnerName: partner?.displayName || 'Lead Partner',
      auditManagerId: formData.auditManagerId,
      auditManagerName: manager?.displayName || 'Audit Manager',
      teamMemberIds: formData.teamMemberIds,
      startDate: formData.startDate,
      targetCompletionDate: formData.targetCompletionDate,
      statutoryDeadline: formData.statutoryDeadline,
      budgetedHours: Number(formData.budgetedHours),
      priority: formData.priority,
      riskLevel: formData.riskLevel,
      planningStatus: 'in_progress',
      fieldworkStatus: 'not_started',
      reviewStatus: 'not_started',
      completionStatus: 'planning',
      pendingClientDocumentsCount: 3,
      openReviewPointsCount: 0
    });

    setIsModalOpen(false);
  };

  const handleExecuteSignoff = async () => {
    if (!signoffTarget) return;
    setSignoffError('');

    try {
      await signoffAssignment(signoffTarget.id, signoffNotes || 'Independent Auditor’s Report approved and certified. UDIN verified.');
      setIsSignoffModalOpen(false);
      setSignoffTarget(null);
    } catch (err: any) {
      setSignoffError(err?.message || 'Sign-off failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Audit Engagements Register</h2>
          <p className="text-xs text-slate-500">
            Practice assignments, risk assessment, team allocation, budgeted hours, and partner completion sign-offs.
          </p>
        </div>

        {isManager() && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Launch Audit Engagement</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by engagement ref or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-blue-600"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto text-xs">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Audit Categories</option>
            <option value="Statutory Audit">Statutory Audit</option>
            <option value="Internal Audit">Internal Audit</option>
            <option value="Tax Audit & Compliance">Tax Audit & Compliance</option>
            <option value="Agreed-Upon Procedures">Agreed-Upon Procedures</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Stages</option>
            <option value="planning">Planning</option>
            <option value="fieldwork">Fieldwork</option>
            <option value="manager_review">Manager Review</option>
            <option value="partner_review">Partner Review</option>
            <option value="completed">Completed & Signed Off</option>
          </select>
        </div>
      </div>

      {/* Assignments Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.map(asg => {
          const asgTasks = tasks.filter(t => t.assignmentId === asg.id);
          const completedTasks = asgTasks.filter(t => t.status === 'completed' || t.status === 'approved');
          const taskProgressPct = asgTasks.length > 0 ? Math.round((completedTasks.length / asgTasks.length) * 100) : 0;
          const hoursPct = Math.min(100, Math.round((asg.actualHours / asg.budgetedHours) * 100));
          const isOverdue = new Date(asg.statutoryDeadline) < new Date() && asg.completionStatus !== 'completed';

          return (
            <div
              key={asg.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition p-5 flex flex-col justify-between"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      {asg.referenceNo}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{asg.clientName}</h3>
                    <div className="text-xs text-slate-500">{asg.category} • FY {asg.financialYear}</div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      asg.completionStatus === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : asg.completionStatus === 'partner_review'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {asg.completionStatus.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      asg.riskLevel === 'high' || asg.riskLevel === 'significant'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      Risk: {asg.riskLevel}
                    </span>
                  </div>
                </div>

                {/* Team & Dates */}
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium">Engagement Partner:</span>
                    <p className="font-semibold text-slate-800 truncate">{asg.engagementPartnerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Audit Manager:</span>
                    <p className="font-semibold text-slate-800 truncate">{asg.auditManagerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Reporting Deadline:</span>
                    <p className={`font-mono font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                      {asg.statutoryDeadline} {isOverdue && '(Overdue)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Assigned Team:</span>
                    <p className="font-semibold text-slate-800">{asg.teamMemberIds?.length || 2} Auditors</p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="mt-4 space-y-2 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-slate-700 mb-1">
                      <span>Tasks Completion ({completedTasks.length}/{asgTasks.length})</span>
                      <span className="font-bold">{taskProgressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${taskProgressPct}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-700 mb-1">
                      <div className="flex items-center space-x-2">
                        <span>Budgeted vs Actual Hours</span>
                        {asg.actualHours > asg.budgetedHours ? (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded border border-rose-300">
                            Budget Overrun (+{(asg.actualHours - asg.budgetedHours).toFixed(1)}h)
                          </span>
                        ) : hoursPct > 85 ? (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                            Approaching Budget
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300">
                            On Budget
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-700 font-bold">{asg.actualHours} / {asg.budgetedHours} hrs</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          asg.actualHours > asg.budgetedHours ? 'bg-rose-600' : hoursPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, hoursPct)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Karbon/TaxDome Audit Pipeline Stages */}
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Audit Lifecycle Pipeline:</div>
                    <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-bold">
                      {['planning', 'fieldwork', 'manager_review', 'partner_review', 'completed'].map((stage, idx) => {
                        const stageOrder = ['draft', 'planning', 'fieldwork', 'manager_review', 'partner_review', 'completed'];
                        const currentIdx = stageOrder.indexOf(asg.completionStatus);
                        const thisIdx = stageOrder.indexOf(stage);
                        const isDone = currentIdx >= thisIdx;
                        const isCurrent = asg.completionStatus === stage;
                        const labels = ['Planning', 'Fieldwork', 'Manager', 'Partner', 'Sign-Off'];

                        return (
                          <div
                            key={stage}
                            className={`py-1 rounded border transition ${
                              isCurrent
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                            title={`Stage: ${labels[idx]}`}
                          >
                            {labels[idx]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Partner Sign-off info if completed */}
                {asg.completionStatus === 'completed' && asg.partnerSignoffDate && (
                  <div className="mt-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start space-x-2">
                    <Award size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Signed off by {asg.partnerSignoffByName}</span> on {asg.partnerSignoffDate}.
                      <p className="text-[11px] text-emerald-800 mt-0.5 italic">"{asg.partnerSignoffNotes}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onNavigateToTasks(asg.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition"
                >
                  <FileCheck size={14} />
                  <span>Audit Tasks ({asgTasks.length})</span>
                </button>

                {asg.completionStatus !== 'completed' && isPartner() && (
                  <button
                    onClick={() => {
                      setSignoffTarget(asg);
                      setSignoffNotes('');
                      setSignoffError('');
                      setIsSignoffModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition"
                  >
                    <ShieldCheck size={14} />
                    <span>Partner Final Sign-off</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Partner Signoff Modal */}
      {isSignoffModalOpen && signoffTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Partner Audit Sign-Off</h3>
                  <p className="text-xs text-slate-500">Formal Quality Review & Certification</p>
                </div>
              </div>
              <button
                onClick={() => setIsSignoffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {signoffError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {signoffError}
              </div>
            )}

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div><strong className="text-slate-700">Engagement:</strong> {signoffTarget.referenceNo}</div>
              <div><strong className="text-slate-700">Client:</strong> {signoffTarget.clientName}</div>
              <div><strong className="text-slate-700">Category:</strong> {signoffTarget.category}</div>
              <div><strong className="text-slate-700">Total Actual Hours:</strong> {signoffTarget.actualHours} hrs</div>
            </div>

            <div className="mt-4 text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Partner Audit Opinion & Sign-Off Memorandum <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={signoffNotes}
                onChange={(e) => setSignoffNotes(e.target.value)}
                placeholder="e.g. Independent Auditor’s Report issued with Unmodified Opinion under NSA 700. Working papers fully reviewed and found compliant with ICAN standards."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800"
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsSignoffModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSignoff}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-2"
              >
                <CheckCircle size={15} />
                <span>Approve & Sign Off Engagement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Engagement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Launch New Audit Engagement</h3>
                <p className="text-xs text-slate-500">Acharya R. & Associates Engagement Register</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assignment Reference No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Audit Template</label>
                  <select
                    value={formData.templateId}
                    onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    {STANDARD_AUDIT_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Audit Client <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.clientCode} — {c.name} ({c.industry})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assignment Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AssignmentCategory })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="Statutory Audit">Statutory Audit</option>
                    <option value="Internal Audit">Internal Audit</option>
                    <option value="Tax Audit & Compliance">Tax Audit & Compliance</option>
                    <option value="Agreed-Upon Procedures">Agreed-Upon Procedures</option>
                    <option value="Due Diligence">Due Diligence</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Financial Year</label>
                  <input
                    type="text"
                    value={formData.financialYear}
                    onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Engagement Partner</label>
                  <select
                    value={formData.engagementPartnerId}
                    onChange={(e) => setFormData({ ...formData, engagementPartnerId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    {allStaff.filter(s => s.role === 'managing_partner' || s.role === 'engagement_partner').map(p => (
                      <option key={p.uid} value={p.uid}>{p.displayName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Audit Manager</label>
                  <select
                    value={formData.auditManagerId}
                    onChange={(e) => setFormData({ ...formData, auditManagerId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    {allStaff.filter(s => s.role === 'audit_manager').map(m => (
                      <option key={m.uid} value={m.uid}>{m.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Completion</label>
                  <input
                    type="date"
                    required
                    value={formData.targetCompletionDate}
                    onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statutory Deadline</label>
                  <input
                    type="date"
                    required
                    value={formData.statutoryDeadline}
                    onChange={(e) => setFormData({ ...formData, statutoryDeadline: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Budgeted Hours</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={formData.budgetedHours}
                    onChange={(e) => setFormData({ ...formData, budgetedHours: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Risk Level</label>
                  <select
                    value={formData.riskLevel}
                    onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="significant">Significant</option>
                  </select>
                </div>
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Create Engagement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
