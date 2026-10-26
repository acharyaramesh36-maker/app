import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PracticeProvider } from './context/PracticeContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { CheckInModal } from './components/attendance/CheckInModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { ClientsView } from './components/clients/ClientsView';
import { AssignmentsView } from './components/assignments/AssignmentsView';
import { TasksWorkflowView } from './components/tasks/TasksWorkflowView';
import { ArticleTraineeDiaryView } from './components/worklogs/ArticleTraineeDiaryView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { LeaveManagementView } from './components/leave/LeaveManagementView';
import { ReviewPointsView } from './components/review/ReviewPointsView';
import { TimesheetsView } from './components/timesheets/TimesheetsView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { ArchitectureModal } from './components/modals/ArchitectureModal';
import { TraineeLogbookView } from './components/logbook/TraineeLogbookView';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [selectedAssignmentForTasks, setSelectedAssignmentForTasks] = useState<string | undefined>(undefined);

  const navigateToTasks = (asgId: string) => {
    setSelectedAssignmentForTasks(asgId);
    setActiveTab('tasks');
  };

  const navigateToAssignment = (clientId: string) => {
    setActiveTab('assignments');
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          onOpenCheckInModal={() => setIsCheckInModalOpen(true)}
          onNavigateToLogbook={() => setActiveTab('logbook')}
        />

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView onNavigate={(tab) => setActiveTab(tab)} />
            )}

            {activeTab === 'clients' && (
              <ClientsView onNavigateToAssignment={navigateToAssignment} />
            )}

            {activeTab === 'assignments' && (
              <AssignmentsView onNavigateToTasks={navigateToTasks} />
            )}

            {activeTab === 'tasks' && (
              <TasksWorkflowView initialAssignmentId={selectedAssignmentForTasks} />
            )}

            {activeTab === 'logbook' && (
              <TraineeLogbookView />
            )}

            {activeTab === 'worklogs' && (
              <ArticleTraineeDiaryView />
            )}

            {activeTab === 'attendance' && (
              <AttendanceView onOpenCheckIn={() => setIsCheckInModalOpen(true)} />
            )}

            {activeTab === 'leave' && (
              <LeaveManagementView />
            )}

            {activeTab === 'review_points' && (
              <ReviewPointsView />
            )}

            {activeTab === 'timesheets' && (
              <TimesheetsView />
            )}

            {activeTab === 'reports' && (
              <ReportsView />
            )}

            {activeTab === 'audit' && (
              <AuditTrailView />
            )}

            {activeTab === 'architecture' && (
              <div className="space-y-4">
                <DashboardView onNavigate={(tab) => setActiveTab(tab)} />
                <ArchitectureModal onClose={() => setActiveTab('dashboard')} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
      />

      {activeTab === 'architecture' && (
        <ArchitectureModal onClose={() => setActiveTab('dashboard')} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PracticeProvider>
        <MainAppContent />
      </PracticeProvider>
    </AuthProvider>
  );
}
