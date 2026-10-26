import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Lock,
  Clock,
  User,
  Activity,
  FileText,
  Key
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';

export const AuditTrailView: React.FC = () => {
  const { auditEvents } = usePractice();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = auditEvents.filter(evt => {
    return (
      evt.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.details.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Practice Security & Audit Trail</h2>
          <p className="text-xs text-slate-500">
            Immutable system audit logs recording practice operations, partner sign-offs, and leave & work log approvals.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Audit Logging Enforced</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, or entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-blue-600"
          />
        </div>

        <span className="text-slate-500 font-mono font-medium">
          {filteredEvents.length} Audit Events Logged
        </span>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {filteredEvents.map(evt => (
                <tr key={evt.id} className="hover:bg-slate-50/80 transition text-[11px]">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 text-slate-800 font-sans">
                      {evt.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">{evt.userName}</td>
                  <td className="py-3 px-4 font-sans text-slate-600">{evt.entityType}</td>
                  <td className="py-3 px-4 text-blue-700 font-bold">{evt.entityId}</td>
                  <td className="py-3 px-4 font-sans text-slate-700 max-w-md">{evt.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
