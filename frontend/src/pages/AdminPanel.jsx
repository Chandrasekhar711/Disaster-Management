import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { incidentService, adminService } from '../services/api.js';
import { socketEvents, initializeSocket } from '../services/socket.js';
import IncidentCard from '../components/IncidentCard.jsx';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('unverified');
  const [incidents, setIncidents] = useState([]);
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const authorityFormDefaults = {
    name: '',
    userId: '',
    email: '',
    phone: '',
    password: '',
    department: 'police',
  };
  const [officers, setOfficers] = useState([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [authorityForm, setAuthorityForm] = useState(authorityFormDefaults);
  const [formErrors, setFormErrors] = useState({});
  const [isCreatingOfficer, setIsCreatingOfficer] = useState(false);
  const [verifyingOfficerId, setVerifyingOfficerId] = useState(null);
  const [assignModalIncident, setAssignModalIncident] = useState(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssigningIncident, setIsAssigningIncident] = useState(false);

  useEffect(() => {
    initializeSocket();
    fetchIncidents();
    setupSocketListeners();

    return () => {
      socketEvents.offNewIncident();
      socketEvents.offIncidentUpdate();
    };
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      // Fetch all incidents first for statistics
      const allResponse = await incidentService.getIncidents({ limit: 1000 });
      console.log('API Response:', allResponse);
      console.log('Response data:', allResponse.data);
      console.log('Response data.data:', allResponse.data?.data);
      
      // Extract incidents array from response
      const allIncidentList = Array.isArray(allResponse.data?.data) 
        ? allResponse.data.data 
        : (Array.isArray(allResponse.data) ? allResponse.data : []);
      
      console.log('Extracted incidents:', allIncidentList);
      console.log('Number of incidents:', allIncidentList.length);
      
      setAllIncidents(allIncidentList);

      // Filter for display based on active tab
      let filteredList = allIncidentList;
      switch (activeTab) {
        case 'unverified':
          filteredList = allIncidentList.filter(i => i.status === 'reported');
          break;
        case 'fake':
          filteredList = allIncidentList.filter(i => i.status === 'cancelled' || i.isFake === true);
          break;
        case 'responding':
          filteredList = allIncidentList.filter(i => i.status === 'responding');
          break;
        case 'responded':
          filteredList = allIncidentList.filter(i => i.status === 'responded');
          break;
        case 'all':
          filteredList = allIncidentList;
          break;
        default:
          filteredList = allIncidentList;
      }
      
      console.log('Filtered incidents for tab', activeTab, ':', filteredList.length);
      setIncidents(filteredList);
    } catch (error) {
      console.error('Fetch incidents error:', error);
      toast.error(`Failed to fetch incidents: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    setOfficersLoading(true);
    try {
      const response = await adminService.getAuthorityOfficers({ limit: 100 });
      const officerList = Array.isArray(response.data?.data) ? response.data.data : [];
      setOfficers(officerList);
    } catch (error) {
      toast.error('Failed to load authority officers');
    } finally {
      setOfficersLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketEvents.joinIncidentUpdates();
    socketEvents.onNewIncident((incident) => {
      setAllIncidents((prev) => [incident, ...prev]);
      toast.info(`New incident: ${incident.title}`);
    });
    socketEvents.onIncidentUpdate((incident) => {
      setAllIncidents((prev) =>
        prev.map((inc) => (inc._id === incident._id ? incident : inc))
      );
      setIncidents((prev) =>
        prev.map((inc) => (inc._id === incident._id ? incident : inc))
      );
    });
  };

  const departmentOptions = [
    { value: 'police', label: 'Police' },
    { value: 'fire', label: 'Fire & Rescue' },
    { value: 'medical', label: 'Medical' },
    { value: 'rescue', label: 'Disaster Response' },
    { value: 'civil_defense', label: 'Civil Defense' },
  ];

  const getInputClasses = (field) =>
    `w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      formErrors[field] ? 'border-red-500 ring-red-200' : 'border-gray-200'
    }`;

  const handleAuthorityInputChange = (event) => {
    const { name, value } = event.target;
    setAuthorityForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateAuthorityForm = () => {
    const errors = {};

    if (!authorityForm.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!authorityForm.userId.trim()) {
      errors.userId = 'User ID is required';
    } else if (authorityForm.userId.trim().length < 4) {
      errors.userId = 'User ID must be at least 4 characters';
    }

    if (!authorityForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/i.test(authorityForm.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!authorityForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/i.test(authorityForm.phone.trim())) {
      errors.phone = 'Phone must be 10 digits';
    }

    if (!authorityForm.password) {
      errors.password = 'Password is required';
    } else if (authorityForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!authorityForm.department) {
      errors.department = 'Department is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetAuthorityForm = () => {
    setAuthorityForm(authorityFormDefaults);
    setFormErrors({});
  };

  const handleCreateAuthority = async (event) => {
    event.preventDefault();
    if (!validateAuthorityForm()) {
      return;
    }
    setIsCreatingOfficer(true);
    try {
      await adminService.createAuthorityOfficer({
        ...authorityForm,
        name: authorityForm.name.trim(),
        userId: authorityForm.userId.trim(),
        email: authorityForm.email.trim().toLowerCase(),
        phone: authorityForm.phone.trim(),
      });
      toast.success('Authority officer created');
      resetAuthorityForm();
      fetchOfficers();
    } catch (error) {
      const message = error?.message || error?.data?.message || 'Failed to create authority officer';
      toast.error(message);
    } finally {
      setIsCreatingOfficer(false);
    }
  };

  const handleVerifyOfficer = async (officerId) => {
    setVerifyingOfficerId(officerId);
    try {
      await adminService.verifyAuthorityOfficer(officerId);
      toast.success('Officer verified successfully');
      fetchOfficers();
    } catch (error) {
      const message = error?.message || error?.data?.message || 'Failed to verify officer';
      toast.error(message);
    } finally {
      setVerifyingOfficerId(null);
    }
  };

  const openAssignModal = (incident) => {
    setAssignModalIncident(incident);
    setSelectedOfficerId('');
    setAssignNotes('');
  };

  const closeAssignModal = () => {
    setAssignModalIncident(null);
    setSelectedOfficerId('');
    setAssignNotes('');
    setIsAssigningIncident(false);
  };

  const handleSendIncidentToAuthority = async () => {
    if (!assignModalIncident) {
      return;
    }
    if (!selectedOfficerId) {
      toast.error('Select an authority officer');
      return;
    }

    setIsAssigningIncident(true);
    const officer = verifiedOfficers.find((item) => item._id === selectedOfficerId);

    try {
      await adminService.reviewIncident(assignModalIncident._id, { notes: assignNotes });
      await adminService.assignIncidentToOfficer({
        incidentId: assignModalIncident._id,
        officerId: selectedOfficerId,
        department: officer?.department,
      });
      toast.success('Incident sent to authority for verification');
      closeAssignModal();
      fetchIncidents();
    } catch (error) {
      const message = error?.message || error?.data?.message || 'Failed to assign incident';
      toast.error(message);
      setIsAssigningIncident(false);
    }
  };

  const tabs = [
    { id: 'unverified', label: '🔴 Unverified Incidents (Inbox)', icon: '📥' },
    { id: 'fake', label: '⚠️ Fake Incidents', icon: '🚫' },
    { id: 'responding', label: '🟠 Responding Incidents', icon: '🚑' },
    { id: 'responded', label: '✅ Responded Incidents', icon: '📝' },
    { id: 'all', label: '📊 All Incidents', icon: '📁' },
  ];
  const pendingOfficers = officers.filter((officer) => !officer.isVerified);
  const verifiedOfficers = officers.filter((officer) => officer.isVerified);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow mb-8">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold text-gray-900">🛡️ Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage incidents and coordinate emergency response</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-8">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 font-semibold border-b-2 transition text-sm md:text-base ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-xl transition" onClick={() => setActiveTab('fake')}>
              <p className="text-gray-600 text-sm">Fake Incidents</p>
              <p className="text-3xl font-bold text-red-600">
                {allIncidents.filter((i) => i.status === 'cancelled' || i.isFake).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-xl transition" onClick={() => setActiveTab('responding')}>
              <p className="text-gray-600 text-sm">Responding</p>
              <p className="text-3xl font-bold text-orange-600">
                {allIncidents.filter((i) => i.status === 'responding').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-xl transition" onClick={() => setActiveTab('responded')}>
              <p className="text-gray-600 text-sm">Responded</p>
              <p className="text-3xl font-bold text-green-600">
                {allIncidents.filter((i) => i.status === 'responded').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-xl transition" onClick={() => setActiveTab('all')}>
              <p className="text-gray-600 text-sm">All Incidents</p>
              <p className="text-3xl font-bold text-gray-900">{allIncidents.length}</p>
            </div>
          </div>

          {/* Incidents Grid */}
          {loading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="animate-spin text-4xl">⏳</div>
            </div>
          ) : incidents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-2xl text-gray-600 mb-2">📭</p>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Incidents</h3>
              <p className="text-gray-600">
                No incidents in the {tabs.find((t) => t.id === activeTab)?.label} category
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {incidents.map((incident) => (
                  <div key={incident._id} className="transform hover:scale-105 transition">
                    <IncidentCard
                      incident={incident}
                      onClick={() => navigate(`/incidents/${incident._id}`)}
                    />
                    {activeTab === 'unverified' && (
                      <button
                        onClick={() => openAssignModal(incident)}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                      >
                        Send to Authority for Verification
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-12 flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/report')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
            >
              Report Incident
            </button>
            <button
              onClick={() => navigate('/map')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
            >
              🗺️ View Live Map
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
            >
              📊 View Analytics
            </button>
          </div>

          {/* Authority Management */}
          <div className="mt-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">👮 Authority Management</h2>
                <p className="text-gray-600 text-sm">
                  Invite new authority responders and verify pending accounts
                </p>
              </div>
              <div className="bg-white shadow rounded-lg px-4 py-2 text-sm text-gray-600">
                Pending approvals: <span className="font-semibold text-gray-900">{pendingOfficers.length}</span>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Create Authority Form */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Add Authority Officer</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Provide official contact details to create a secure authority login.
                </p>
                <form onSubmit={handleCreateAuthority} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={authorityForm.name}
                      onChange={handleAuthorityInputChange}
                      className={getInputClasses('name')}
                      placeholder="e.g. Inspector Jane Doe"
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">User ID</label>
                      <input
                        type="text"
                        name="userId"
                        value={authorityForm.userId}
                        onChange={handleAuthorityInputChange}
                        className={getInputClasses('userId')}
                        placeholder="fire_chief01"
                      />
                      {formErrors.userId && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.userId}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Official Email</label>
                      <input
                        type="email"
                        name="email"
                        value={authorityForm.email}
                        onChange={handleAuthorityInputChange}
                        className={getInputClasses('email')}
                        placeholder="officer@agency.gov"
                      />
                      {formErrors.email && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={authorityForm.phone}
                        onChange={handleAuthorityInputChange}
                        className={getInputClasses('phone')}
                        placeholder="10-digit number"
                      />
                      {formErrors.phone && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Temporary Password</label>
                      <input
                        type="password"
                        name="password"
                        value={authorityForm.password}
                        onChange={handleAuthorityInputChange}
                        className={getInputClasses('password')}
                        placeholder="At least 6 characters"
                      />
                      {formErrors.password && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                    <select
                      name="department"
                      value={authorityForm.department}
                      onChange={handleAuthorityInputChange}
                      className={getInputClasses('department')}
                    >
                      {departmentOptions.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.department && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.department}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isCreatingOfficer}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-6 py-2 rounded-lg transition"
                    >
                      {isCreatingOfficer ? 'Creating...' : 'Create Authority'}
                    </button>
                    <button
                      type="button"
                      onClick={resetAuthorityForm}
                      className="text-gray-600 hover:text-gray-900 font-semibold"
                    >
                      Clear Form
                    </button>
                  </div>
                </form>
              </div>

              {/* Pending Verification List */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Pending Verification</h3>
                    <p className="text-gray-500 text-sm">Approve officers before they gain access.</p>
                  </div>
                  <span className="text-sm text-gray-500">{pendingOfficers.length} awaiting</span>
                </div>

                {officersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  </div>
                ) : pendingOfficers.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500">
                    No pending officers at the moment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingOfficers.map((officer) => (
                      <div key={officer._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{officer.name}</p>
                            <p className="text-sm text-gray-500">{officer.email}</p>
                            <p className="text-xs text-gray-400 uppercase mt-1">{officer.department}</p>
                          </div>
                          <button
                            onClick={() => handleVerifyOfficer(officer._id)}
                            disabled={verifyingOfficerId === officer._id}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                          >
                            {verifyingOfficerId === officer._id ? 'Verifying...' : 'Verify Officer'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Active Officers ({verifiedOfficers.length})
                  </h4>
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                    {verifiedOfficers.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4">No verified officers yet.</p>
                    ) : (
                      verifiedOfficers.slice(0, 6).map((officer) => (
                        <div key={officer._id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{officer.name}</p>
                            <p className="text-xs text-gray-500">{officer.department}</p>
                          </div>
                          <span className="text-xs font-semibold text-green-600">Verified</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {assignModalIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Send to Authority</h3>
                <p className="text-sm text-gray-500">{assignModalIncident.title}</p>
              </div>
              <button
                onClick={closeAssignModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-semibold"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-900">{assignModalIncident.description}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Select authority officer
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose officer...</option>
                  {verifiedOfficers.map((officer) => (
                    <option key={officer._id} value={officer._id}>
                      {officer.name} • {officer.department}
                    </option>
                  ))}
                </select>
                {verifiedOfficers.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">No verified officers available yet.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notes for authority (optional)
                </label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  rows="3"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share context, evidence, or urgency"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSendIncidentToAuthority}
                disabled={isAssigningIncident || verifiedOfficers.length === 0}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold"
              >
                {isAssigningIncident ? 'Sending...' : 'Send to Authority'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanel;
