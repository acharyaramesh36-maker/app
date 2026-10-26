import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  UserCheck,
  LogOut,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Building,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePractice } from '../../context/PracticeContext';
import { AttendanceLocation } from '../../types';

interface TopNavbarProps {
  onOpenCheckInModal: () => void;
  onNavigateToLogbook?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenCheckInModal, onNavigateToLogbook }) => {
  const { currentUser, allStaff, switchPersona, signInWithGoogle, signOut, isManagingPartner } = useAuth();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    attendanceRecords,
    recordCheckOut,
    selectedFinancialYear,
    setSelectedFinancialYear,
    resetToDefaultData
  } = usePractice();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [nepalTime, setNepalTime] = useState<string>('');

  // Live Nepal Time (UTC+5:45)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Nepal is UTC+5:45
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const nepalDate = new Date(utc + (3600000 * 5.75));
      setNepalTime(nepalDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const myTodayAttendance = attendanceRecords.find(a => a.userId === currentUser.uid && a.date === today);
  const isPunchedIn = Boolean(myTodayAttendance && !myTodayAttendance.checkOutTime);
  const unreadNotifs = notifications.filter(n => !n.isRead);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10 shadow-xs">
      {/* Left: Time & FY indicator */}
      <div className="flex items-center space-x-4">
        {/* Nepal Standard Time */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
          <Clock size={15} className="text-blue-600" />
          <span>NPT:</span>
          <span className="font-mono font-semibold text-slate-900">{nepalTime || '09:45:00 AM'}</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">UTC+5:45</span>
        </div>

        {/* Nepal Financial Year Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs">
          <Calendar size={14} className="text-slate-500" />
          <span className="text-slate-500 font-medium">Fiscal Year:</span>
          <select
            value={selectedFinancialYear}
            onChange={(e) => setSelectedFinancialYear(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="2080/81">FY 2080/81 (2023/24)</option>
            <option value="2081/82">FY 2081/82 (2024/25)</option>
            <option value="2082/83">FY 2082/83 (2025/26)</option>
          </select>
        </div>
      </div>

      {/* Right: Quick Punch, Notifications, Role Switcher & Profile */}
      <div className="flex items-center space-x-4">
        {/* Quick Attendance Punch */}
        {isPunchedIn ? (
          <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>In at {myTodayAttendance?.checkInTime} ({myTodayAttendance?.locationType})</span>
            <button
              onClick={recordCheckOut}
              className="ml-2 px-2.5 py-1 bg-emerald-700 text-white hover:bg-emerald-800 rounded font-bold text-[11px] transition shadow-xs cursor-pointer"
            >
              Punch Out
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenCheckInModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <UserCheck size={15} />
            <span>Punch In (Attendance)</span>
          </button>
        )}

        {/* Quick Task Logbook Punch Button */}
        {onNavigateToLogbook && (
          <button
            onClick={onNavigateToLogbook}
            className="hidden sm:flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            title="Open Trainee Daily Punch Desk to punch today's attendance and audit tasks"
          >
            <BookOpen size={14} className="text-indigo-600" />
            <span>Daily Punch Desk (Attendance + Tasks)</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between font-semibold text-slate-800">
                <span>Practice Notifications</span>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-blue-600 hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 cursor-pointer hover:bg-slate-50 transition ${
                        !n.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{n.title}</span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                      </div>
                      <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Persona Switcher (For Acceptance Testing) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition cursor-pointer"
            title="Switch practice role to test workflows"
          >
            <span className="font-semibold">{currentUser.displayName.split(' ')[0]}</span>
            <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono uppercase">
              {currentUser.role.replace('_', ' ')}
            </span>
            <ChevronDown size={14} className="text-slate-500" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Test Practice Role (Zoho RBAC)
                </div>
                <div className="text-[10px] text-slate-400">
                  Switch instantly to verify permissions & workflows
                </div>
              </div>
              <div className="py-1">
                {allStaff.map(staff => (
                  <button
                    key={staff.uid}
                    onClick={() => {
                      switchPersona(staff.uid);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-start space-x-2.5 hover:bg-slate-50 transition cursor-pointer ${
                      staff.uid === currentUser.uid ? 'bg-blue-50/70 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {staff.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{staff.displayName}</div>
                      <div className="text-[11px] text-slate-500 capitalize">{staff.role.replace('_', ' ')} • {staff.designation}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-1 mt-1 px-2">
                <button
                  onClick={signInWithGoogle}
                  className="w-full text-left px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded font-medium flex items-center space-x-2 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Connect Google Account</span>
                </button>
                {isManagingPartner() && (
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      setShowResetConfirm(true);
                    }}
                    className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded font-medium flex items-center space-x-2 cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Reset to Seed Data</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Reset System Database?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This will restore all clients, audit assignments, ICAN article trainee daily logs, review points, and attendance records to the standard Acharya R. & Associates benchmark dataset.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await resetToDefaultData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
