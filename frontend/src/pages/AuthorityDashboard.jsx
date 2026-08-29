import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { incidentService } from '../services/api.js';
import { toast } from 'react-toastify';

const AuthorityDashboard = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationNote, setVerificationNote] = useState('');
  const [verificationNotes, setVerificationNotes] = useState({});
  const [verifyingIncidentId, setVerifyingIncidentId] = useState(null);
  const [isUserVerified, setIsUserVerified] = useState(true);
  const [verificationError, setVerificationError] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [respondingIncidentId, setRespondingIncidentId] = useState(null);

  useEffect(() => {
    fetchAssignedIncidents();
  }, []);

  const fetchAssignedIncidents = async () => {
    try {
      setLoading(true);
      const response = await incidentService.getAssignedIncidents();
      setIncidents(response.data.data || response.data);
      setIsUserVerified(true);
      setVerificationError('');
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      
      // Check if it's a verification error (403)
      if (error.response?.status === 403) {
        const errorMsg = error.response?.data?.message || 'Your account is not verified yet';
        setIsUserVerified(false);
        setVerificationError(errorMsg);
        toast.warning(errorMsg, { autoClose: 5000 });
      } else {
        toast.error('Failed to load assigned incidents');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (incidentId, isReal, noteOverride = null) => {
    try {
      setLoading(true);
      setVerifyingIncidentId(incidentId);
      const note = noteOverride !== null ? noteOverride : verificationNote;
      await incidentService.verifyIncident(incidentId, isReal, note);
      
      const message = isReal 
        ? '✅ Incident marked as REAL - Admin notified' 
        : '❌ Incident marked as FAKE - Admin notified';
      
      toast.success(message, { autoClose: 4000 });
      setSelectedIncident(null);
      setVerificationNote('');
      setVerificationNotes((prev) => ({ ...prev, [incidentId]: '' }));
      fetchAssignedIncidents();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || 'Failed to verify incident';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setVerifyingIncidentId(null);
    }
  };

  const handleMarkAsResponded = async (incidentId) => {
    try {
      setRespondingIncidentId(incidentId);
      await incidentService.updateIncidentStatus(incidentId, { status: 'responded' });
      toast.success('✅ Incident marked as Responded');
      fetchAssignedIncidents();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || 'Failed to update incident status';
      toast.error(errorMsg);
    } finally {
      setRespondingIncidentId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: '#ef4444',
      admin_review: '#f97316',
      authority_review: '#8b5cf6',
      verified: '#f59e0b',
      responding: '#3b82f6',
      responded: '#22c55e',
      resolved: '#10b981',
      cancelled: '#6b7280',
    };
    return colors[status] || '#0ea5e9';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#7f1d1d',
    };
    return colors[severity] || '#0ea5e9';
  };

  const getVerificationBadge = (verification) => {
    if (!verification || verification.status === 'pending') {
      return <span className="text-gray-500">Pending</span>;
    }
    
    if (verification.status === 'real') {
      return <span className="text-green-600 font-bold">✅ Real</span>;
    } else if (verification.status === 'fake') {
      return <span className="text-red-600 font-bold">❌ Fake</span>;
    }
    return <span className="text-yellow-600">Pending Verification</span>;
  };

  const pendingIncidents = incidents.filter(
    (incident) => !incident.verification || incident.verification.status === 'pending'
  );

  const verifiedIncidents = incidents.filter(
    (incident) => incident.verification && incident.verification.status !== 'pending'
  );

  const realIncidents = incidents.filter(
    (incident) => incident.verification?.status === 'real'
  );

  const fakeIncidents = incidents.filter(
    (incident) => incident.verification?.status === 'fake'
  );

  const respondingIncidents = incidents.filter(
    (incident) => incident.status === 'responding'
  );

  const recentDecisions = verifiedIncidents.slice(0, 5);
  
  const filteredIncidents = filterStatus === 'pending' 
    ? pendingIncidents 
    : filterStatus === 'real' 
    ? realIncidents 
    : filterStatus === 'fake'
    ? fakeIncidents
    : filterStatus === 'responding'
    ? respondingIncidents
    : incidents;

  const getNoteValue = (incidentId) => verificationNotes[incidentId] || '';

  const handleQueueNoteChange = (incidentId, value) => {
    setVerificationNotes((prev) => ({ ...prev, [incidentId]: value }));
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🚔 Authority Officer Dashboard
            </h1>
            <p className="text-gray-600">Verify incidents assigned to you - Mark them as Real or Fake</p>
            
            {/* Verification Warning Banner */}
            {!isUserVerified && (
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Account Pending Verification</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        ⏳ {verificationError || 'Your account is pending admin approval. You will be able to verify incidents once an administrator verifies your account.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Statistics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Total Assigned</p>
                <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg shadow p-4 border-2 border-yellow-200">
                <p className="text-sm text-gray-600">⏳ Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingIncidents.length}</p>
              </div>
              <div className="bg-blue-50 rounded-lg shadow p-4 border-2 border-blue-200">
                <p className="text-sm text-gray-600">🚑 Responding</p>
                <p className="text-2xl font-bold text-blue-600">{respondingIncidents.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg shadow p-4 border-2 border-green-200">
                <p className="text-sm text-gray-600">✅ Real</p>
                <p className="text-2xl font-bold text-green-600">{realIncidents.length}</p>
              </div>
              <div className="bg-red-50 rounded-lg shadow p-4 border-2 border-red-200">
                <p className="text-sm text-gray-600">❌ Fake</p>
                <p className="text-2xl font-bold text-red-600">{fakeIncidents.length}</p>
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ⏳ Pending ({pendingIncidents.length})
              </button>
              <button
                onClick={() => setFilterStatus('responding')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'responding'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🚑 Responding ({respondingIncidents.length})
              </button>
              <button
                onClick={() => setFilterStatus('real')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'real'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ✅ Marked Real ({realIncidents.length})
              </button>
              <button
                onClick={() => setFilterStatus('fake')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'fake'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ❌ Marked Fake ({fakeIncidents.length})
              </button>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'all'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📋 All ({incidents.length})
              </button>
            </div>
          </div>

          {loading && !selectedIncident && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {filteredIncidents.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600 text-lg">
                {filterStatus === 'pending' && 'No pending incidents to verify'}
                {filterStatus === 'responding' && 'No incidents currently being responded to'}
                {filterStatus === 'real' && 'No incidents marked as real yet'}
                {filterStatus === 'fake' && 'No incidents marked as fake yet'}
                {filterStatus === 'all' && 'No incidents assigned to you yet'}
              </p>
            </div>
          )}

          {filteredIncidents.length > 0 && !loading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredIncidents.map((incident) => (
              <div
                key={incident._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/incidents/${incident._id}`)}
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: getSeverityColor(incident.severity) }}
                ></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {incident.title}
                    </h3>
                    <span
                      className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                      style={{ backgroundColor: getStatusColor(incident.status) }}
                    >
                      {incident.status?.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3">{incident.description}</p>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold">{incident.type?.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Severity:</span>
                      <span
                        className="font-semibold"
                        style={{ color: getSeverityColor(incident.severity) }}
                      >
                        {incident.severity?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verification:</span>
                      {getVerificationBadge(incident.verification)}
                    </div>
                  </div>

                  {incident.verification?.status === 'pending' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncident(incident);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition animate-pulse"
                    >
                      🔍 Verify Now (Real/Fake)
                    </button>
                  ) : incident.status === 'responding' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsResponded(incident._id);
                      }}
                      disabled={respondingIncidentId === incident._id}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      {respondingIncidentId === incident._id ? 'Updating...' : '✅ Mark as Responded'}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/incidents/${incident._id}`);
                      }}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      👁️ View Details
                    </button>
                  )}
                </div>
              </div>
            ))}
            </div>
          )}

          {/* Authority Verification Panel */}
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Verification Queue</h2>
                  <p className="text-gray-600 text-sm">
                    Notify admin whether a report is real or fake.
                  </p>
                </div>
                <span className="text-sm text-gray-500">{pendingIncidents.length} pending</span>
              </div>

              {pendingIncidents.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500">
                  No incidents waiting for verification.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingIncidents.map((incident) => (
                    <div key={incident._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{incident.title}</p>
                          <p className="text-sm text-gray-600">{incident.description}</p>
                          <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-3">
                            <span>Type: {incident.type}</span>
                            <span>Severity: {incident.severity}</span>
                            <span>Status: {incident.status}</span>
                          </div>
                        </div>
                        <button
                          className="text-blue-600 text-xs font-semibold"
                          onClick={() => setSelectedIncident(incident)}
                        >
                          View
                        </button>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Notes to admin (optional)
                        </label>
                        <textarea
                          value={getNoteValue(incident._id)}
                          onChange={(e) => handleQueueNoteChange(incident._id, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          placeholder="Add details or reasoning"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleVerify(incident._id, true, getNoteValue(incident._id))}
                          disabled={verifyingIncidentId === incident._id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg"
                        >
                          {verifyingIncidentId === incident._id ? 'Submitting...' : 'Mark Real'}
                        </button>
                        <button
                          onClick={() => handleVerify(incident._id, false, getNoteValue(incident._id))}
                          disabled={verifyingIncidentId === incident._id}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg"
                        >
                          {verifyingIncidentId === incident._id ? 'Submitting...' : 'Mark Fake'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recent Decisions</h2>
              <p className="text-gray-600 text-sm mb-4">
                Overview of incidents you already reviewed.
              </p>
              {recentDecisions.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500">
                  No verification updates sent yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentDecisions.map((incident) => (
                    <div key={incident._id} className="py-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">{incident.title}</p>
                        <span
                          className={`text-sm font-semibold ${
                            incident.verification.status === 'real'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {incident.verification.status === 'real' ? 'Real' : 'Fake'}
                        </span>
                      </div>
                      {incident.verification.verificationNotes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Note: {incident.verification.verificationNotes}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(incident.verification.verifiedAt || incident.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail & Verification Modal */}
          {selectedIncident && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedIncident.title}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedIncident(null);
                      setVerificationNote('');
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Incident Details */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600 text-sm">Description</p>
                      <p className="text-gray-900">{selectedIncident.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Type</p>
                        <p className="text-gray-900 font-semibold">
                          {selectedIncident.type?.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Severity</p>
                        <p className="font-semibold" style={{ color: getSeverityColor(selectedIncident.severity) }}>
                          {selectedIncident.severity?.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Status</p>
                        <p
                          className="text-white font-semibold px-3 py-1 rounded text-center"
                          style={{ backgroundColor: getStatusColor(selectedIncident.status) }}
                        >
                          {selectedIncident.status?.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Location</p>
                        <p className="text-gray-900">
                          {selectedIncident.location?.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Section */}
                  {!selectedIncident.verification ||
                  selectedIncident.verification.status === 'pending' ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 font-semibold mb-4">
                        ⚠️ This incident is pending verification
                      </p>

                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Verification Notes (Optional)
                        </label>
                        <textarea
                          value={verificationNote}
                          onChange={(e) => setVerificationNote(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add notes about your verification..."
                          rows="3"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            handleVerify(selectedIncident._id, true)
                          }
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                        >
                          ✅ Mark as Real
                        </button>
                        <button
                          onClick={() =>
                            handleVerify(selectedIncident._id, false)
                          }
                          disabled={loading}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                        >
                          ❌ Mark as Fake
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`border rounded-lg p-4 ${
                        selectedIncident.verification.status === 'real'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <p
                        className={`font-semibold mb-2 ${
                          selectedIncident.verification.status === 'real'
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}
                      >
                        {selectedIncident.verification.status === 'real'
                          ? '✅ Verified as Real'
                          : '❌ Verified as Fake'}
                      </p>
                      {selectedIncident.verification.verificationNotes && (
                        <p className="text-gray-600 text-sm">
                          <strong>Notes:</strong> {selectedIncident.verification.verificationNotes}
                        </p>
                      )}
                      <p className="text-gray-600 text-sm mt-2">
                        Verified by: {selectedIncident.verification.verifiedBy?.name || 'Unknown'}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedIncident(null);
                      setVerificationNote('');
                    }}
                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthorityDashboard;
