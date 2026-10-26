import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  X,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';
import { useAuth } from '../../context/AuthContext';
import { Client, EntityType, FinancialReportingFramework } from '../../types';

export const ClientsView: React.FC<{ onNavigateToAssignment: (clientId: string) => void }> = ({ onNavigateToAssignment }) => {
  const { clients, addClient, updateClient, assignments } = usePractice();
  const { currentUser, isManager, isSenior } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    clientCode: string;
    name: string;
    entityType: EntityType;
    industry: string;
    panNumber: string;
    registrationNumber: string;
    registeredAddress: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
    financialYear: string;
    reportingFramework: FinancialReportingFramework;
    leadPartnerId: string;
    leadPartnerName: string;
    notes: string;
  }>({
    clientCode: '',
    name: '',
    entityType: 'Private Limited Company',
    industry: 'Commercial & Trading',
    panNumber: '',
    registrationNumber: '',
    registeredAddress: 'Kathmandu, Nepal',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '+977-',
    financialYear: '2080/81 (FY 2023/24)',
    reportingFramework: 'NFRS (Nepal Financial Reporting Standards)',
    leadPartnerId: 'staff-managing-partner',
    leadPartnerName: 'CA. Ramesh Acharya, FCA',
    notes: ''
  });

  const [formError, setFormError] = useState('');

  // Filtering
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.panNumber.includes(searchTerm) ||
        c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
      const matchIndustry = selectedIndustry === 'all' || c.industry === selectedIndustry;
      const matchFramework = selectedFramework === 'all' || c.reportingFramework === selectedFramework;
      return matchSearch && matchIndustry && matchFramework;
    });
  }, [clients, searchTerm, selectedIndustry, selectedFramework]);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      clientCode: `CLI-ARA-${String(clients.length + 1).padStart(2, '0')}`,
      name: '',
      entityType: 'Private Limited Company',
      industry: 'Manufacturing & Industrial',
      panNumber: '',
      registrationNumber: '',
      registeredAddress: 'Kathmandu, Nepal',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '+977-',
      financialYear: '2080/81 (FY 2023/24)',
      reportingFramework: 'NFRS (Nepal Financial Reporting Standards)',
      leadPartnerId: 'staff-managing-partner',
      leadPartnerName: 'CA. Ramesh Acharya, FCA',
      notes: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setFormData({
      clientCode: c.clientCode,
      name: c.name,
      entityType: c.entityType,
      industry: c.industry,
      panNumber: c.panNumber,
      registrationNumber: c.registrationNumber || '',
      registeredAddress: c.registeredAddress,
      contactPerson: c.contactPerson,
      contactEmail: c.contactEmail,
      contactPhone: c.contactPhone,
      financialYear: c.financialYear,
      reportingFramework: c.reportingFramework,
      leadPartnerId: c.leadPartnerId,
      leadPartnerName: c.leadPartnerName,
      notes: c.notes || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Nepal PAN validation (standard 9 digits)
    if (!/^\d{9}$/.test(formData.panNumber.trim())) {
      setFormError('Permanent Account Number (PAN) in Nepal must be exactly 9 numerical digits.');
      return;
    }

    try {
      if (editingClient) {
        await updateClient(editingClient.id, {
          ...formData,
          status: editingClient.status
        });
      } else {
        await addClient({
          ...formData,
          status: 'active'
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Error saving client profile.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Client Master Register</h2>
          <p className="text-xs text-slate-500">
            Registered audit clients, entity structures, Nepal tax PAN identification, and accounting frameworks.
          </p>
        </div>

        {isManager() && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Onboard New Client</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, code, PAN, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-blue-600"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto text-xs">
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Industries</option>
            <option value="Banking & Financial Services">Banking & Financial Services</option>
            <option value="Energy & Infrastructure">Energy & Infrastructure</option>
            <option value="Manufacturing & Export">Manufacturing & Export</option>
            <option value="Tourism & Hospitality">Tourism & Hospitality</option>
            <option value="Non-Profit & Social Development">Non-Profit & Social Development</option>
          </select>

          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Frameworks</option>
            <option value="NFRS (Nepal Financial Reporting Standards)">NFRS</option>
            <option value="NFRS for SMEs">NFRS for SMEs</option>
            <option value="NAS for MEs (Micro Entities)">NAS for MEs</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">PAN Number</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Reporting Framework</th>
                <th className="py-3 px-4">Lead Partner</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No clients match the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => {
                  const clientAssignments = assignments.filter(a => a.clientId === client.id);
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                        {client.clientCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{client.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <MapPin size={11} />
                          <span className="truncate max-w-[180px]">{client.registeredAddress}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{client.entityType}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 bg-slate-50/50">
                        {client.panNumber}
                      </td>
                      <td className="py-3 px-4">{client.industry}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800">
                          {client.reportingFramework.split('(')[0]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{client.leadPartnerName}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{client.contactPerson}</div>
                        <div className="text-[11px] text-slate-400">{client.contactPhone}</div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setViewingClient(client)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="View Client Audit Dossier"
                        >
                          <Eye size={15} />
                        </button>
                        {isManager() && (
                          <button
                            onClick={() => openEditModal(client)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title="Edit Client Master"
                          >
                            <Edit size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Dossier View Modal */}
      {viewingClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  {viewingClient.clientCode}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{viewingClient.name}</h3>
                <p className="text-xs text-slate-500">{viewingClient.entityType} • {viewingClient.industry}</p>
              </div>
              <button
                onClick={() => setViewingClient(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Nepal Tax PAN:</span>
                <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">{viewingClient.panNumber}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Company Reg No:</span>
                <p className="text-sm font-mono font-semibold text-slate-900 mt-0.5">{viewingClient.registrationNumber || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Reporting Framework:</span>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">{viewingClient.reportingFramework}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Lead Engagement Partner:</span>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">{viewingClient.leadPartnerName}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs">
              <div className="font-semibold text-blue-950 mb-1">Contact Information:</div>
              <div className="text-slate-700">{viewingClient.contactPerson}</div>
              <div className="text-slate-600 mt-0.5">{viewingClient.contactEmail} • {viewingClient.contactPhone}</div>
              <div className="text-slate-600 mt-0.5">{viewingClient.registeredAddress}</div>
            </div>

            {viewingClient.notes && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs">
                <strong>Audit Notes:</strong> {viewingClient.notes}
              </div>
            )}

            {/* Related Audit Engagements */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Active & Past Audit Engagements
              </h4>
              <div className="space-y-2">
                {assignments.filter(a => a.clientId === viewingClient.id).length === 0 ? (
                  <p className="text-xs text-slate-400">No engagements recorded yet for this client.</p>
                ) : (
                  assignments.filter(a => a.clientId === viewingClient.id).map(a => (
                    <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{a.referenceNo} — {a.category}</div>
                        <div className="text-[11px] text-slate-500">FY: {a.financialYear} • Deadline: {a.statutoryDeadline}</div>
                      </div>
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                        {a.completionStatus.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingClient(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingClient ? 'Edit Client Details' : 'Onboard New Audit Client'}
                </h3>
                <p className="text-xs text-slate-500">Acharya R. & Associates Practice Master</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Client Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientCode}
                    onChange={(e) => setFormData({ ...formData, clientCode: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Permanent Account Number (PAN) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    placeholder="9 numerical digits (e.g. 300189245)"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Legal Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kathmandu Commercial Bank Limited"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entity Type</label>
                  <select
                    value={formData.entityType}
                    onChange={(e) => setFormData({ ...formData, entityType: e.target.value as EntityType })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="Commercial Bank / FI">Commercial Bank / FI</option>
                    <option value="Public Limited Company">Public Limited Company</option>
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="Hydropower Project">Hydropower Project</option>
                    <option value="NGO / INGO">NGO / INGO</option>
                    <option value="Partnership Firm">Partnership Firm</option>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Government / Statutory Body">Government / Statutory Body</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Banking, Hydropower, Manufacturing"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Financial Reporting Framework</label>
                <select
                  value={formData.reportingFramework}
                  onChange={(e) => setFormData({ ...formData, reportingFramework: e.target.value as FinancialReportingFramework })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="NFRS (Nepal Financial Reporting Standards)">NFRS (Nepal Financial Reporting Standards)</option>
                  <option value="NFRS for SMEs">NFRS for SMEs</option>
                  <option value="NAS for MEs (Micro Entities)">NAS for MEs (Micro Entities)</option>
                  <option value="Nepal GAAP / IFRS">Nepal GAAP / IFRS</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registered Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Durbar Marg, Kathmandu, Ward No. 1"
                  value={formData.registeredAddress}
                  onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanjeev Manandhar"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@client.com.np"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
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
                  {editingClient ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
