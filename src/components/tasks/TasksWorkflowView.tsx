import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Search,
  Plus,
  Filter,
  Columns,
  List,
  Clock,
  User,
  AlertCircle,
  FileText,
  X,
  MessageSquare,
  CheckCircle2,
  Send,
  RotateCcw
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';
import { AuditTask, TaskStatus, PriorityLevel } from '../../types';

export const TasksWorkflowView: React.FC<{ initialAssignmentId?: string }> = ({ initialAssignmentId }) => {
  const { tasks, assignments, addTask, updateTaskStatus, updateTask } = usePractice();
  const { currentUser, allStaff, isSenior, isTrainee } = useAuth();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsgId, setSelectedAsgId] = useState<string>(initialAssignmentId || 'all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Review Drawer state
  const [activeTaskReview, setActiveTaskReview] = useState<AuditTask | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    assignmentId: assignments[0]?.id || '',
    title: '',
    description: '',
    auditArea: 'Cash & Bank Balances',
    milestone: 'Substantive Audit Procedures',
    assignedToId: 'staff-article-trainee',
    reviewerId: 'staff-audit-senior',
    priority: 'medium' as PriorityLevel,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '2024-10-31',
    estimatedHours: 20,
    workingPaperRef: 'WP-'
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.workingPaperRef && t.workingPaperRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.assignedToName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAsg = selectedAsgId === 'all' || t.assignmentId === selectedAsgId;
      const matchArea = selectedArea === 'all' || t.auditArea === selectedArea;
      return matchSearch && matchAsg && matchArea;
    });
  }, [tasks, searchTerm, selectedAsgId, selectedArea]);

  const auditAreas = [
    'Cash & Bank Balances',
    'Loans & Advances / Impairment',
    'Property, Plant and Equipment',
    'Revenue from Contracts',
    'Inventory & Store Controls',
    'Trade Payables & Accrued Expenses',
    'Taxation & Statutory Compliances',
    'Internal Controls & Governance',
    'Financial Statement Disclosures'
  ];

  const kanbanColumns: { status: TaskStatus; label: string; color: string; border: string }[] = [
    { status: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
    { status: 'in_progress', label: 'In Progress (Fieldwork)', color: 'bg-blue-100 text-blue-800', border: 'border-blue-300' },
    { status: 'submitted_for_review', label: 'Submitted for Review', color: 'bg-purple-100 text-purple-800', border: 'border-purple-300' },
    { status: 'returned_for_revision', label: 'Returned for Revision', color: 'bg-amber-100 text-amber-800', border: 'border-amber-300' },
    { status: 'approved', label: 'Approved & Signed Off', color: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-300' }
  ];

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const asg = assignments.find(a => a.id === formData.assignmentId);
    const assignee = allStaff.find(s => s.uid === formData.assignedToId);
    const reviewer = allStaff.find(s => s.uid === formData.reviewerId);

    await addTask({
      assignmentId: formData.assignmentId,
      assignmentRef: asg?.referenceNo || 'ARA/ASG',
      clientName: asg?.clientName || 'Client',
      title: formData.title,
      description: formData.description,
      auditArea: formData.auditArea,
      milestone: formData.milestone,
      assignedToId: formData.assignedToId,
      assignedToName: assignee?.displayName || 'Auditor',
      reviewerId: formData.reviewerId,
      reviewerName: reviewer?.displayName || 'Supervisor',
      priority: formData.priority,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      estimatedHours: Number(formData.estimatedHours),
      status: 'not_started',
      workingPaperRef: formData.workingPaperRef
    });

    setIsModalOpen(false);
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus, comments?: string) => {
    await updateTaskStatus(taskId, newStatus, comments);
    if (activeTaskReview) {
      setActiveTaskReview(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Audit Tasks & Workflow (Zoho Projects)</h2>
          <p className="text-xs text-slate-500">
            Audit programs, working paper references (WP), reviewer sign-offs, and substantive testing workflows.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md font-semibold flex items-center space-x-1 transition cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns size={14} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md font-semibold flex items-center space-x-1 transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={14} />
              <span>Table</span>
            </button>
          </div>

          {isSenior() && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Audit Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by task title, WP ref, or assignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-blue-600"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedAsgId}
            onChange={(e) => setSelectedAsgId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Engagements</option>
            {assignments.map(a => (
              <option key={a.id} value={a.id}>{a.referenceNo} — {a.clientName}</option>
            ))}
          </select>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Audit Areas</option>
            {auditAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.status);
            return (
              <div key={col.status} className="bg-slate-100/70 rounded-xl p-3 border border-slate-200 min-w-[260px] flex flex-col h-[750px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${col.color}`}>
                      {col.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                      No tasks in this stage
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'approved' && task.status !== 'completed';
                      return (
                        <div
                          key={task.id}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition text-xs flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {task.workingPaperRef || 'WP-GEN'}
                              </span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                task.priority === 'urgent' || task.priority === 'high'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 leading-snug line-clamp-2">
                              {task.title}
                            </h4>

                            <div className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                              {task.clientName}
                            </div>

                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {task.auditArea}
                            </div>

                            {task.reviewComments && (
                              <div className="mt-2 p-2 bg-amber-50/80 border border-amber-200 rounded text-[10px] text-amber-900">
                                <strong>Review Note:</strong> {task.reviewComments}
                              </div>
                            )}
                          </div>

                          {/* Card Footer */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <div className="flex items-center space-x-1">
                              <User size={13} className="text-slate-400" />
                              <span className="truncate max-w-[90px] font-medium text-slate-700">
                                {task.assignedToName}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 font-mono">
                              <Clock size={12} className={isOverdue ? 'text-rose-500' : 'text-slate-400'} />
                              <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                                {task.actualHours}/{task.estimatedHours}h
                              </span>
                            </div>
                          </div>

                          {/* Quick Workflow Action Button */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end space-x-1.5">
                            {task.status === 'not_started' && (
                              <button
                                onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Start Work
                              </button>
                            )}

                            {task.status === 'in_progress' && (
                              <button
                                onClick={() => handleUpdateStatus(task.id, 'submitted_for_review')}
                                className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                              >
                                <Send size={11} />
                                <span>Submit for Review</span>
                              </button>
                            )}

                            {(task.status === 'submitted_for_review' || task.status === 'returned_for_revision') && isSenior() && (
                              <button
                                onClick={() => {
                                  setActiveTaskReview(task);
                                  setReviewNote(task.reviewComments || '');
                                }}
                                className="px-2 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                              >
                                <MessageSquare size={11} />
                                <span>Review & Sign</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">WP Ref</th>
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Audit Area</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{task.workingPaperRef}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs">{task.title}</td>
                    <td className="py-3 px-4 text-slate-600">{task.clientName}</td>
                    <td className="py-3 px-4">{task.auditArea}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{task.assignedToName}</td>
                    <td className="py-3 px-4 text-slate-500">{task.reviewerName}</td>
                    <td className="py-3 px-4 font-mono text-slate-800">{task.dueDate}</td>
                    <td className="py-3 px-4 font-mono">{task.actualHours} / {task.estimatedHours}h</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                        task.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'submitted_for_review'
                          ? 'bg-purple-100 text-purple-800'
                          : task.status === 'returned_for_revision'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {task.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isSenior() && (
                        <button
                          onClick={() => {
                            setActiveTaskReview(task);
                            setReviewNote(task.reviewComments || '');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review & Feedback Modal */}
      {activeTaskReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {activeTaskReview.workingPaperRef}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{activeTaskReview.title}</h3>
                <p className="text-xs text-slate-500">{activeTaskReview.clientName} • {activeTaskReview.auditArea}</p>
              </div>
              <button
                onClick={() => setActiveTaskReview(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div><strong className="text-slate-700">Assigned Auditor:</strong> {activeTaskReview.assignedToName}</div>
              <div><strong className="text-slate-700">Estimated vs Actual Hours:</strong> {activeTaskReview.actualHours} / {activeTaskReview.estimatedHours} hrs</div>
              <div className="mt-2 text-slate-600 leading-relaxed">{activeTaskReview.description}</div>
            </div>

            <div className="mt-4 text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Supervisor / Reviewer Comments & Guidance
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Working paper satisfactory, substantive tests match bank statements. Or: Please obtain second party confirmation for items > NPR 1 Lakh."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800"
              />
            </div>

            <div className="mt-6 flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => handleUpdateStatus(activeTaskReview.id, 'returned_for_revision', reviewNote)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Return for Revision</span>
              </button>

              <button
                onClick={() => handleUpdateStatus(activeTaskReview.id, 'approved', reviewNote || 'Approved by Supervisor')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Approve Task & Sign Off</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Audit Program Task</h3>
                <p className="text-xs text-slate-500">Allocate audit testing to team members</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Task Title & Audit Procedure <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank reconciliation testing & balance confirmation verification"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Auditor / Trainee</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Reviewer</label>
                  <select
                    value={formData.reviewerId}
                    onChange={(e) => setFormData({ ...formData, reviewerId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    {allStaff.filter(s => s.role !== 'article_trainee').map(s => (
                      <option key={s.uid} value={s.uid}>{s.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scope & Instructions</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed instructions for sampling, testing threshold, and documentation requirements..."
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
