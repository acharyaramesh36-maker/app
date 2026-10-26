import React, { useState } from 'react';
import { X, MapPin, Building, Globe, Clock, CheckCircle } from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';
import { AttendanceLocation } from '../../types';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose }) => {
  const { clients, recordCheckIn } = usePractice();
  const { currentUser } = useAuth();

  const [locationType, setLocationType] = useState<AttendanceLocation>('office');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let clientName = undefined;
      if (locationType === 'client_site' && selectedClientId) {
        const found = clients.find(c => c.id === selectedClientId);
        clientName = found ? found.name : undefined;
      }

      await recordCheckIn(locationType, selectedClientId || undefined, clientName, notes);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record check-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Daily Attendance Punch-In</h3>
            <p className="text-xs text-slate-500">Acharya R. & Associates Practice & Fieldwork Registry</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Member</label>
            <input
              type="text"
              readOnly
              value={`${currentUser.displayName} (${currentUser.employeeCode})`}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Work Location</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLocationType('office')}
                className={`p-3 rounded-lg border text-center transition flex flex-col items-center space-y-1.5 cursor-pointer ${
                  locationType === 'office'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <Building size={18} className={locationType === 'office' ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-xs">Head Office</span>
              </button>

              <button
                type="button"
                onClick={() => setLocationType('client_site')}
                className={`p-3 rounded-lg border text-center transition flex flex-col items-center space-y-1.5 cursor-pointer ${
                  locationType === 'client_site'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <MapPin size={18} className={locationType === 'client_site' ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-xs">Client Site</span>
              </button>

              <button
                type="button"
                onClick={() => setLocationType('remote')}
                className={`p-3 rounded-lg border text-center transition flex flex-col items-center space-y-1.5 cursor-pointer ${
                  locationType === 'remote'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <Globe size={18} className={locationType === 'remote' ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-xs">Authorized Remote</span>
              </button>
            </div>
          </div>

          {locationType === 'client_site' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Audit Client <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-blue-600"
              >
                <option value="">-- Choose Audit Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.clientCode} — {c.name} ({c.industry})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Plan for Today</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fieldwork at bank head office for Nostro reconciliation and loan sampling."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-blue-600"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              <CheckCircle size={15} />
              <span>{loading ? 'Recording...' : 'Punch In Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
