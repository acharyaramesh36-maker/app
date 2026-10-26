import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  Building,
  MapPin,
  Globe,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  X
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';

export const AttendanceView: React.FC<{ onOpenCheckIn: () => void }> = ({ onOpenCheckIn }) => {
  const {
    attendanceRecords,
    attendanceCorrections,
    recordCheckOut,
    requestAttendanceCorrection,
    actionAttendanceCorrection,
    exportToCSV
  } = usePractice();

  const { currentUser, isHr, isManager } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const myTodayAtt = attendanceRecords.find(a => a.userId === currentUser.uid && a.date === today);
  const isCheckedIn = Boolean(myTodayAtt && !myTodayAtt.checkOutTime);

  const [activeTab, setActiveTab] = useState<'daily' | 'corrections'>('daily');
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [corrDate, setCorrDate] = useState(today);
  const [reqIn, setReqIn] = useState('09:30:00');
  const [reqOut, setReqOut] = useState('17:30:00');
  const [reason, setReason] = useState('');
  const [corrError, setCorrError] = useState('');

  const [reviewCorr, setReviewCorr] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCorrError('');
    if (!reason.trim()) {
      setCorrError('Please provide a legitimate reason for the attendance correction.');
      return;
    }

    try {
      await requestAttendanceCorrection(corrDate, reqIn, reqOut, reason);
      setIsCorrectionModalOpen(false);
      setReason('');
    } catch (err: any) {
      setCorrError(err?.message || 'Error submitting request.');
    }
  };

  const pendingCorrections = attendanceCorrections.filter(c => c.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Attendance & Fieldwork Tracking (Zoho People)</h2>
          <p className="text-xs text-slate-500">
            Real-time check-in, client-site location punches, working hours register, and retrospective correction workflows.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportToCSV('attendance')}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Download size={14} />
            <span>Export Register (CSV)</span>
          </button>

          <button
            onClick={() => setIsCorrectionModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Request Correction</span>
          </button>

          {!isCheckedIn ? (
            <button
              onClick={onOpenCheckIn}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition cursor-pointer"
            >
              <UserCheck size={16} />
              <span>Punch In Now</span>
            </button>
          ) : (
            <button
              onClick={recordCheckOut}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition cursor-pointer"
            >
              <Clock size={16} />
              <span>Punch Out ({myTodayAtt?.checkInTime})</span>
            </button>
          )}
        </div>
      </div>

      {/* Today's Punch Widget Card */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-1">
            Today's Attendance Status • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h3 className="text-xl font-bold font-serif">
            {currentUser.displayName} ({currentUser.employeeCode})
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Standard Firm Working Hours: 09:30 AM – 05:30 PM (Sunday – Friday) • Grace Period: 10:15 AM
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
          <div>
            <div className="text-[11px] text-blue-200">Punch Status:</div>
            <div className="text-base font-bold">
              {isCheckedIn ? 'Currently Punched IN' : myTodayAtt?.checkOutTime ? 'Completed for Today' : 'Not Punched Today'}
            </div>
            {myTodayAtt && (
              <div className="text-[11px] text-slate-300 mt-0.5">
                In: {myTodayAtt.checkInTime} {myTodayAtt.checkOutTime && `| Out: ${myTodayAtt.checkOutTime}`} ({myTodayAtt.locationType})
              </div>
            )}
          </div>

          <div>
            {!isCheckedIn ? (
              <button
                onClick={onOpenCheckIn}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Punch In
              </button>
            ) : (
              <button
                onClick={recordCheckOut}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Punch Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('daily')}
          className={`py-2.5 px-5 border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'daily'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock size={15} />
          <span>Attendance Register ({attendanceRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('corrections')}
          className={`py-2.5 px-5 border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'corrections'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw size={15} />
          <span>Correction Requests ({pendingCorrections.length} Pending)</span>
        </button>
      </div>

      {/* Daily Attendance Table */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Hours Logged</th>
                  <th className="py-3 px-4">Location Type</th>
                  <th className="py-3 px-4">Client Site</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendanceRecords.map(att => {
                  const hoursStr = att.totalWorkingMinutes
                    ? `${Math.floor(att.totalWorkingMinutes / 60)}h ${att.totalWorkingMinutes % 60}m`
                    : att.checkOutTime ? '8h 00m' : 'In Progress';

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{att.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{att.userName}</td>
                      <td className="py-3 px-4 font-mono text-slate-800">{att.checkInTime}</td>
                      <td className="py-3 px-4 font-mono text-slate-800">{att.checkOutTime || '—'}</td>
                      <td className="py-3 px-4 font-mono font-medium">{hoursStr}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center space-x-1 capitalize font-medium">
                          {att.locationType === 'client_site' ? (
                            <MapPin size={13} className="text-blue-600" />
                          ) : att.locationType === 'remote' ? (
                            <Globe size={13} className="text-purple-600" />
                          ) : (
                            <Building size={13} className="text-slate-500" />
                          )}
                          <span>{att.locationType.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {att.clientName || 'Head Office (Baluwatar)'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          att.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : att.status === 'late'
                            ? 'bg-amber-100 text-amber-900'
                            : att.status === 'corrected'
                            ? 'bg-purple-100 text-purple-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{att.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Corrections Queue */}
      {activeTab === 'corrections' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {attendanceCorrections.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No attendance correction requests submitted.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Original Punch</th>
                    <th className="py-3 px-4">Requested Punch</th>
                    <th className="py-3 px-4">Reason / Justification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendanceCorrections.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{c.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{c.userName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {c.originalCheckIn || 'Missing'} – {c.originalCheckOut || 'Missing'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {c.requestedCheckIn} – {c.requestedCheckOut}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-sm">{c.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.status === 'pending' && (isHr() || isManager()) && (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setReviewCorr(c);
                                setActionNotes('');
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Review
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Request Correction Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Attendance Correction Request</h3>
                <p className="text-xs text-slate-500">Retrospective adjustment with audit history</p>
              </div>
              <button
                onClick={() => setIsCorrectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {corrError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {corrError}
              </div>
            )}

            <form onSubmit={handleCorrectionSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attendance Date</label>
                <input
                  type="date"
                  required
                  value={corrDate}
                  onChange={(e) => setCorrDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Requested Check-In</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={reqIn}
                    onChange={(e) => setReqIn(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Requested Check-Out</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={reqOut}
                    onChange={(e) => setReqOut(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Missing / Inaccurate Punch <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Early morning client site physical stock verification at factory before cellular connectivity was available."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Correction Action Modal */}
      {reviewCorr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Review Correction Request</h3>
                <p className="text-xs text-slate-500">{reviewCorr.userName} • {reviewCorr.date}</p>
              </div>
              <button
                onClick={() => setReviewCorr(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
              <div><strong className="text-slate-700">Requested Timing:</strong> {reviewCorr.requestedCheckIn} – {reviewCorr.requestedCheckOut}</div>
              <div><strong className="text-slate-700">Reason:</strong> {reviewCorr.reason}</div>
            </div>

            <div className="mt-4 text-xs">
              <label className="block font-semibold text-slate-700 mb-1">Approver Remarks</label>
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Verified with Senior In-charge"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>

            <div className="mt-6 flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={async () => {
                  await actionAttendanceCorrection(reviewCorr.id, 'rejected', actionNotes || 'Rejected by HR/Supervisor');
                  setReviewCorr(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <XCircle size={14} />
                <span>Reject</span>
              </button>

              <button
                onClick={async () => {
                  await actionAttendanceCorrection(reviewCorr.id, 'approved', actionNotes || 'Approved by HR/Supervisor');
                  setReviewCorr(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <CheckCircle2 size={14} />
                <span>Approve & Update</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
