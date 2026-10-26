import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  CheckSquare,
  BookOpen,
  Clock,
  CalendarCheck,
  AlertCircle,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Award,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePractice } from '../../context/PracticeContext';

export type NavTab =
  | 'dashboard'
  | 'clients'
  | 'assignments'
  | 'tasks'
  | 'logbook'
  | 'worklogs'
  | 'attendance'
  | 'leave'
  | 'review_points'
  | 'timesheets'
  | 'reports'
  | 'audit'
  | 'architecture';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed
}) => {
  const { currentUser, isTrainee } = useAuth();
  const { workLogs, leaveRequests, reviewPoints, assignments } = usePractice();

  // Badges for pending items
  const pendingLogsCount = workLogs.filter(w => w.status === 'submitted' || w.status === 'under_review').length;
  const pendingLeavesCount = leaveRequests.filter(l => l.status === 'pending_manager' || l.status === 'pending_hr_partner').length;
  const openReviewPointsCount = reviewPoints.filter(r => r.status === 'open' || r.status === 'addressed_pending_clearance').length;
  const returnedLogsCount = workLogs.filter(w => w.traineeId === currentUser.uid && w.status === 'returned_for_revision').length;

  const roleLabelMap: Record<string, { label: string; color: string }> = {
    managing_partner: { label: 'Managing Partner', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    engagement_partner: { label: 'Engagement Partner', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
    audit_manager: { label: 'Audit Manager', color: 'bg-blue-100 text-blue-900 border-blue-300' },
    audit_senior: { label: 'Audit Senior', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    article_trainee: { label: 'Article Trainee', color: 'bg-purple-100 text-purple-900 border-purple-300' },
    hr_admin: { label: 'HR & Admin', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  };

  const currentRoleInfo = roleLabelMap[currentUser.role] || { label: currentUser.role, color: 'bg-slate-100 text-slate-800 border-slate-300' };

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'clients' as NavTab,
      label: 'Client Master',
      icon: Building2,
      badge: null
    },
    {
      id: 'assignments' as NavTab,
      label: 'Audit Engagements',
      icon: Briefcase,
      badge: assignments.filter(a => a.completionStatus !== 'completed').length
    },
    {
      id: 'tasks' as NavTab,
      label: 'Tasks & Workflow',
      icon: CheckSquare,
      badge: null
    },
    {
      id: 'logbook' as NavTab,
      label: 'Daily Punch Desk (Attendance + Tasks)',
      icon: BookOpen,
      badge: 'All-in-One',
      badgeColor: 'bg-emerald-600'
    },
    {
      id: 'worklogs' as NavTab,
      label: 'ICAN Diary Register',
      icon: Layers,
      badge: isTrainee() ? (returnedLogsCount > 0 ? `${returnedLogsCount} returned` : null) : (pendingLogsCount > 0 ? pendingLogsCount : null),
      badgeColor: isTrainee() && returnedLogsCount > 0 ? 'bg-amber-500' : 'bg-blue-600'
    },
    {
      id: 'attendance' as NavTab,
      label: 'Attendance & Punch',
      icon: Clock,
      badge: null
    },
    {
      id: 'leave' as NavTab,
      label: 'Leave Management',
      icon: CalendarCheck,
      badge: !isTrainee() && pendingLeavesCount > 0 ? pendingLeavesCount : null
    },
    {
      id: 'review_points' as NavTab,
      label: 'Review Points & Sign-off',
      icon: AlertCircle,
      badge: openReviewPointsCount > 0 ? openReviewPointsCount : null,
      badgeColor: 'bg-rose-600'
    },
    {
      id: 'timesheets' as NavTab,
      label: 'Timesheets & Workload',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'reports' as NavTab,
      label: 'Registers & ICAN Exports',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      id: 'audit' as NavTab,
      label: 'Audit Trail & Security',
      icon: ShieldCheck,
      badge: null
    }
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between shrink-0 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 flex items-center justify-center text-white font-serif font-black shadow-md border border-blue-400/30 shrink-0">
              AR
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white tracking-tight truncate leading-tight font-serif">
                  Acharya R. & Associates
                </h1>
                <p className="text-[11px] text-blue-300/80 font-medium tracking-wide truncate">
                  Chartered Accountants
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 text-xs transition"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Current Active Persona Card */}
        {!collapsed ? (
          <div className="m-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-medium">Active Session:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${currentRoleInfo.color}`}>
                {currentRoleInfo.label}
              </span>
            </div>
            <div className="font-semibold text-white truncate">{currentUser.displayName}</div>
            <div className="text-[11px] text-slate-400 truncate">{currentUser.employeeCode} • {currentUser.designation}</div>
          </div>
        ) : (
          <div className="p-3 flex justify-center">
            <div
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400"
              title={`${currentUser.displayName} (${currentRoleInfo.label})`}
            >
              {currentUser.displayName.charAt(0)}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${
                      item.badgeColor || 'bg-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge !== null && item.badge !== undefined && (
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom specs button */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium border transition ${
            activeTab === 'architecture'
              ? 'bg-slate-800 text-blue-400 border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-700/60'
          }`}
          title="Architecture, Schema & Verification"
        >
          <Layers size={16} />
          {!collapsed && <span>System Architecture</span>}
        </button>
        {!collapsed && (
          <div className="mt-2 text-center text-[10px] text-slate-500">
            Kathmandu, Nepal • ICAN Reg.
          </div>
        )}
      </div>
    </aside>
  );
};
