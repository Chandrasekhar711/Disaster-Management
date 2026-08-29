import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { incidentService, adminService } from '../services/api.js';
import { Button, Card, Badge, Modal } from '../components/common.jsx';
import { useAuthStore } from '../context/store.js';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const IncidentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sosDeactivateLoading, setSosDeactivateLoading] = useState(false);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isFakeIncident = incident?.verification?.status === 'fake';

  useEffect(() => {
    fetchIncidentDetails();
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [id]);

  const fetchIncidentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await incidentService.getIncidentById(id);
      const incidentData = response.data?.data || response.data;
      setIncident(incidentData);

      // Initialize map after getting incident details
      if (incidentData?.location?.coordinates && mapContainer.current && !mapInstance.current) {
        const [lng, lat] = incidentData.location.coordinates;
        const map = L.map(mapContainer.current).setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        mapInstance.current = map;

        // Create modern marker
        const severityColor = {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
          critical: '#7f1d1d',
        }[incidentData.severity] || '#0ea5e9';

        const typeIcon = {
          fire: '🔥',
          flood: '🌊',
          accident: '🚗',
          earthquake: '🏚️',
          medical: '🏥',
          crime: '🚨',
          hazard: '⚠️',
          other: '📍',
        }[incidentData.type?.toLowerCase()] || '📍';

        const modernMarker = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-container ${incidentData.isSOS ? 'sos-pulse' : incidentData.severity === 'critical' ? 'pulse' : ''}">
              <div class="marker-pin" style="background: ${severityColor}; box-shadow: 0 4px 15px ${severityColor}80;">
                <span class="marker-icon">${typeIcon}</span>
              </div>
              <div class="marker-pulse" style="background: ${severityColor};"></div>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 50],
          popupAnchor: [0, -50],
        });

        // Add marker for incident location
        L.marker([lat, lng], { icon: modernMarker })
          .addTo(map)
          .bindPopup(`
            <div class="p-2 text-center">
              <div class="text-2xl mb-1">${typeIcon}</div>
              <div class="font-bold text-gray-800">${incidentData.title}</div>
              <div class="text-xs text-gray-500 mt-1">${incidentData.location.address || 'Location marked'}</div>
            </div>
          `)
          .openPopup();
      }
    } catch (err) {
      console.error('Failed to fetch incident details:', err);
      setError(err.message || 'Failed to load incident details');
      toast.error('Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncident = async () => {
    try {
      setDeleteLoading(true);
      await adminService.deleteIncident(id);
      toast.success('Incident deleted successfully');
      setShowDeleteModal(false);
      navigate(-1);
    } catch (err) {
      console.error('Failed to delete incident:', err);
      toast.error(err.response?.data?.message || 'Failed to delete incident');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeactivateSOS = async () => {
    try {
      setSosDeactivateLoading(true);
      const response = await incidentService.deactivateSOS(id);
      const updatedIncident = response.data?.data || response.data;
      setIncident(updatedIncident);
      toast.success('SOS alert deactivated successfully');
    } catch (err) {
      console.error('Failed to deactivate SOS:', err);
      toast.error(err.response?.data?.message || 'Failed to deactivate SOS');
    } finally {
      setSosDeactivateLoading(false);
    }
  };

  const statusColors = {
    reported: 'warning',
    verified: 'primary',
    responding: 'warning',
    responded: 'success',
    resolved: 'success',
    cancelled: 'secondary',
  };

  const severityColors = {
    low: 'success',
    medium: 'warning',
    high: 'alert',
    critical: 'alert',
  };

  const getMediaSource = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = (
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
      'http://localhost:5000'
    ).replace(/\/$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const typeIcons = {
    flood: '🌊',
    fire: '🔥',
    accident: '🚗',
    earthquake: '🌍',
    hazard: '⚠️',
    other: '📋',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Incident not found'}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Incident Details</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Status */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{typeIcons[incident.type]}</span>
                    <h2 className="text-3xl font-bold text-gray-900">{incident.title}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={statusColors[incident.status]}>{incident.status}</Badge>
                    <Badge variant={severityColors[incident.severity]}>{incident.severity}</Badge>
                    <Badge variant="secondary">{incident.customType || incident.type}</Badge>
                    {incident.isSOS && <Badge variant="alert">🚨 SOS ALERT</Badge>}
                  </div>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
              </div>
            </Card>

            {/* Location */}
            <Card>
              <h3 className="text-xl font-bold mb-4">📍 Location</h3>
              <p className="text-gray-700 mb-4">{incident.location.address || 'Address not provided'}</p>
              <div
                ref={mapContainer}
                className="w-full h-80 rounded-lg border border-gray-300 overflow-hidden"
              ></div>
              <p className="text-sm text-gray-500 mt-2">
                Coordinates: {incident.location.coordinates[1].toFixed(6)}, {incident.location.coordinates[0].toFixed(6)}
              </p>
            </Card>

            {/* Media Gallery */}
            {incident.media && incident.media.length > 0 && (
              <Card>
                <h3 className="text-xl font-bold mb-4">📷 Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incident.media.map((item, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden shadow-md">
                      {item.type === 'image' ? (
                        <img
                          src={getMediaSource(item.url)}
                          alt={`Incident media ${index + 1}`}
                          className="w-full h-64 object-cover"
                        />
                      ) : (
                        <video src={getMediaSource(item.url)} controls className="w-full h-64 object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Comments */}
            {incident.comments && incident.comments.length > 0 && (
              <Card>
                <h3 className="text-xl font-bold mb-4">💬 Comments ({incident.comments.length})</h3>
                <div className="space-y-4">
                  {incident.comments.map((comment, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {comment.author?.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reporter Information */}
            <Card>
              <h3 className="text-lg font-bold mb-4">👤 Reported By</h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">
                  {incident.reportedBy?.name || 'Anonymous'}
                </p>
                {incident.reportedBy?.email && (
                  <p className="text-gray-600">📧 {incident.reportedBy.email}</p>
                )}
                {incident.reportedBy?.phone && (
                  <p className="text-gray-600">📞 {incident.reportedBy.phone}</p>
                )}
                <p className="text-gray-500">
                  📅 {new Date(incident.createdAt).toLocaleString()}
                </p>
              </div>
            </Card>

            {/* Incident Stats */}
            <Card>
              <h3 className="text-lg font-bold mb-4">📊 Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">View Count</span>
                  <span className="font-semibold">{incident.viewCount || 0}</span>
                </div>
                {incident.affectedPeople > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Affected People</span>
                    <span className="font-semibold">{incident.affectedPeople}</span>
                  </div>
                )}
                {incident.estimatedDamage && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Est. Damage</span>
                    <span className="font-semibold capitalize">{incident.estimatedDamage}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Assigned Responders */}
            {incident.assignedTo && incident.assignedTo.length > 0 && (
              <Card>
                <h3 className="text-lg font-bold mb-4">👮 Assigned Responders</h3>
                <div className="space-y-3">
                  {incident.assignedTo.map((assignment, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {assignment.userId?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">{assignment.department}</p>
                        {assignment.assignedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* SOS Information */}
            {incident.isSOS && (
              <Card className="bg-red-50 border-red-200">
                <h3 className="text-lg font-bold mb-4 text-red-700">🚨 SOS Alert Active</h3>
                <div className="space-y-2 text-sm">
                  {incident.sosTriggeredAt && (
                    <p className="text-gray-700">
                      Triggered: {new Date(incident.sosTriggeredAt).toLocaleString()}
                    </p>
                  )}
                  {incident.sosTriggeredBy && (
                    <p className="text-gray-700">
                      By: {incident.sosTriggeredBy.name || 'Unknown'}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <Button
                    variant="secondary"
                    onClick={handleDeactivateSOS}
                    disabled={sosDeactivateLoading}
                    className="w-full mt-4"
                  >
                    {sosDeactivateLoading ? 'Deactivating...' : '🔕 Deactivate SOS'}
                  </Button>
                )}
              </Card>
            )}

            {/* Resolution Details */}
            {incident.status === 'resolved' && incident.resolutionNotes && (
              <Card className="bg-green-50 border-green-200">
                <h3 className="text-lg font-bold mb-4 text-green-700">✅ Resolution Notes</h3>
                <p className="text-gray-700 text-sm">{incident.resolutionNotes}</p>
                {incident.resolvedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Resolved: {new Date(incident.resolvedAt).toLocaleString()}
                  </p>
                )}
              </Card>
            )}

            {/* Admin Actions */}
            {isAdmin && isFakeIncident && (
              <Card className="bg-red-50 border-red-200">
                <h3 className="text-lg font-bold mb-4 text-red-700">⚠️ Admin Actions</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This incident has been marked as <strong>fake</strong>. You can delete it from the system.
                </p>
                <Button
                  variant="alert"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full"
                >
                  🗑️ Delete Fake Incident
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900">Delete Fake Incident</h3>
          </div>
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete this incident? This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="alert"
              onClick={handleDeleteIncident}
              disabled={deleteLoading}
              className="flex-1"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IncidentDetailsPage;
