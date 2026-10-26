import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Building2,
  Briefcase,
  CheckSquare,
  BookOpen,
  Clock,
  CalendarCheck,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';

export const ReportsView: React.FC = () => {
  const { exportToCSV, clients, assignments, tasks, workLogs, attendanceRecords, leaveRequests, reviewPoints } = usePractice();

  const reportCards = [
    {
      id: 'worklogs' as const,
      title: 'ICAN Article Trainee Daily Diary Register',
      description: 'Official ICAN training format with client name, audit area, procedures performed, WP references, hours, findings, and supervisor approvals.',
      icon: BookOpen,
      count: `${workLogs.length} Records`,
      badge: 'Critical ICAN Format',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'assignments' as const,
      title: 'Audit Engagements & Variance Register',
      description: 'Full portfolio register with reference numbers, statutory deadlines, risk levels, budgeted vs actual hours, and completion stages.',
      icon: Briefcase,
      count: `${assignments.length} Engagements`,
      badge: 'Partner Level',
      badgeColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: 'clients' as const,
      title: 'Client Master & Tax Identification Register',
      description: 'Complete client roster with Nepal PAN numbers, registered addresses, reporting frameworks (NFRS/SME), and contact persons.',
      icon: Building2,
      count: `${clients.length} Clients`,
      badge: 'Confidential',
      badgeColor: 'bg-slate-100 text-slate-800'
    },
    {
      id: 'attendance' as const,
      title: 'Staff & Trainee Attendance Register',
      description: 'Daily check-in/out timestamps, office vs client-site tags, late arrival indicators, and working minutes.',
      icon: Clock,
      count: `${attendanceRecords.length} Logs`,
      badge: 'HR & Payroll',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'leaves' as const,
      title: 'Leave Applications & Entitlement Ledger',
      description: 'Full leave history categorized by casual, sick, and ICAN CA Exam Study Leaves with supervisor approval audit remarks.',
      icon: CalendarCheck,
      count: `${leaveRequests.length} Applications`,
      badge: 'HR / ICAN',
      badgeColor: 'bg-amber-100 text-amber-900'
    },
    {
      id: 'review_points' as const,
      title: 'Audit Review Points & Query Clearance Register',
      description: 'Review queries raised during file review, auditor responses, evidence references, and clearance sign-offs.',
      icon: AlertCircle,
      count: `${reviewPoints.length} Queries`,
      badge: 'Quality Assurance',
      badgeColor: 'bg-rose-100 text-rose-800'
    },
    {
      id: 'tasks' as const,
      title: 'Audit Program & Tasks Schedule',
      description: 'Substantive testing tasks, assigned team members, estimated vs actual hours, and WP cross-references.',
      icon: CheckSquare,
      count: `${tasks.length} Tasks`,
      badge: 'Fieldwork',
      badgeColor: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-serif">Practice Reports & Exportable Registers</h2>
        <p className="text-xs text-slate-500">
          Downloadable audit registers, ICAN article trainee training logs, attendance ledgers, and management reporting files.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map(report => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${report.badgeColor}`}>
                    {report.badge}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{report.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{report.description}</p>

                <div className="mt-3 text-xs font-semibold text-slate-700">
                  Current Dataset: <span className="font-mono text-blue-600">{report.count}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => exportToCSV(report.id)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
