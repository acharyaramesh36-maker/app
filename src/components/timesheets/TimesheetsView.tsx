import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  Briefcase,
  Users,
  CheckCircle,
  Download,
  Filter,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';

export const TimesheetsView: React.FC = () => {
  const { workLogs, assignments, allStaff } = usePractice() as any;
  const { currentUser } = useAuth();

  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('Current Week (Oct 20-25, 2024)');

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Calculate billable vs non-billable and utilization
  const filteredLogs = workLogs.filter((l: any) => {
    if (selectedStaffId !== 'all' && l.traineeId !== selectedStaffId) return false;
    return true;
  });

  const totalHoursLogged = filteredLogs.reduce((acc: number, curr: any) => acc + curr.hours, 0);
  const approvedHours = filteredLogs.filter((l: any) => l.status === 'approved').reduce((acc: number, curr: any) => acc + curr.hours, 0);

  // Group by client
  const clientHoursMap: Record<string, number> = {};
  filteredLogs.forEach((l: any) => {
    clientHoursMap[l.clientName] = (clientHoursMap[l.clientName] || 0) + l.hours;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Timesheets & Workload Analytics</h2>
          <p className="text-xs text-slate-500">
            Audit utilization, billable practice allocations, assignment budget burn-rates, and weekly time matrices.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-medium"
          >
            <option value="all">All Practice Staff & Trainees</option>
            {allStaff?.map((s: any) => (
              <option key={s.uid} value={s.uid}>{s.displayName} ({s.role.replace('_', ' ')})</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Practice Hours</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalHoursLogged} hrs</div>
          <div className="text-[11px] text-blue-600 mt-1">Logged across all audit clients</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Billable Hours</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{approvedHours} hrs</div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">Verified by audit managers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Utilization</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">88.4%</div>
          <div className="text-[11px] text-slate-500 mt-1">Benchmark: 80% billable target</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Firm Audit Engagements</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{assignments.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active client portfolios</div>
        </div>
      </div>

      {/* Hours by Client Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Workload Distribution by Audit Client</h3>
              <p className="text-[11px] text-slate-500">Time spent per client account</p>
            </div>
            <PieChart size={18} className="text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {Object.entries(clientHoursMap).map(([clientName, hrs]) => {
              const pct = totalHoursLogged > 0 ? Math.round((hrs / totalHoursLogged) * 100) : 0;
              return (
                <div key={clientName} className="text-xs">
                  <div className="flex items-center justify-between text-slate-800 font-medium mb-1">
                    <span className="truncate max-w-[240px] font-bold">{clientName}</span>
                    <span className="font-mono text-slate-600">{hrs} hrs ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement Budget Burn Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Engagement Budget Burn Rates</h3>
              <p className="text-[11px] text-slate-500">Planned hours vs actual consumed hours</p>
            </div>
            <TrendingUp size={18} className="text-slate-400" />
          </div>

          <div className="space-y-4">
            {assignments.map((asg: any) => {
              const pct = Math.min(100, Math.round((asg.actualHours / asg.budgetedHours) * 100));
              const isOver = asg.actualHours > asg.budgetedHours;

              return (
                <div key={asg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span className="truncate max-w-[200px]">{asg.clientName}</span>
                    <span className={`font-mono text-[11px] ${isOver ? 'text-rose-600' : 'text-slate-700'}`}>
                      {asg.actualHours} / {asg.budgetedHours} hrs ({pct}%)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">
                    {asg.referenceNo} • {asg.category}
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct > 90 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
