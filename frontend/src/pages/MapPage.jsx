import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentService } from '../services/api.js';
import { initializeSocket, socketEvents } from '../services/socket.js';
import Navbar from '../components/Navbar.jsx';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapPage = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [userLocation, setUserLocation] = useState([20.5937, 78.9629]); // India center
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    initializeSocket();
    fetchIncidents();
    getCurrentLocation();
    setupSocketListeners();

    return () => {
      socketEvents.offNewIncident();
      socketEvents.offIncidentUpdate();
    };
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      });
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await incidentService.getIncidents({ limit: 100 });
      setIncidents(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch incidents');
    }
  };

  const setupSocketListeners = () => {
    socketEvents.joinLiveMap();
    socketEvents.onNewIncident((incident) => {
      setIncidents((prev) => [incident, ...prev]);
    });
    socketEvents.onIncidentUpdate((incident) => {
      setIncidents((prev) =>
        prev.map((inc) => (inc._id === incident._id ? incident : inc))
      );
    });
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

  const getStatusIcon = (status) => {
    const icons = {
      reported: '🔴',
      verified: '🟡',
      responding: '🟠',
      resolved: '🟢',
      cancelled: '⚫',
    };
    return icons[status] || '🔵';
  };

  const getTypeIcon = (type) => {
    const icons = {
      fire: '🔥',
      flood: '🌊',
      accident: '🚗',
      earthquake: '🏚️',
      medical: '🏥',
      crime: '🚨',
      hazard: '⚠️',
      other: '📍',
    };
    return icons[type?.toLowerCase()] || '📍';
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: '#ef4444',
      verified: '#f59e0b',
      responding: '#3b82f6',
      responded: '#22c55e',
      resolved: '#10b981',
      cancelled: '#6b7280',
    };
    return colors[status] || '#0ea5e9';
  };

  // Modern custom marker with pulse animation
  const createModernMarker = (severity, type, isSOS = false) => {
    const color = getSeverityColor(severity);
    const typeIcon = getTypeIcon(type);
    
    const pulseClass = isSOS ? 'sos-pulse' : (severity === 'critical' || severity === 'high') ? 'pulse' : '';
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-container ${pulseClass}">
          <div class="marker-pin" style="background: ${color}; box-shadow: 0 4px 15px ${color}80;">
            <span class="marker-icon">${typeIcon}</span>
          </div>
          <div class="marker-pulse" style="background: ${color};"></div>
        </div>
      `,
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50],
    });
  };

  // User location marker
  const createUserLocationMarker = () => {
    return L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="user-marker-container">
          <div class="user-marker-ring"></div>
          <div class="user-marker-dot"></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-100 min-h-screen">
        {/* Title Section */}
        <div className="bg-white shadow p-6 border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800">🗺️ Live Operational Map</h1>
            <p className="text-gray-600 mt-2">View real-time incident locations and responder assignments</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">🔴 Reported</p>
                <p className="text-2xl font-bold text-red-600">
                  {incidents.filter(i => i.status === 'reported').length}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">🟡 Verified</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {incidents.filter(i => i.status === 'verified').length}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">🟠 Responding</p>
                <p className="text-2xl font-bold text-blue-600">
                  {incidents.filter(i => i.status === 'responding').length}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">🟢 Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {incidents.filter(i => i.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="w-full p-6">
          <div className="w-full rounded-lg shadow-lg overflow-hidden bg-white relative" style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}>
            <MapContainer
              center={userLocation}
              zoom={5}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {/* User Location */}
              <Marker position={userLocation} icon={createUserLocationMarker()}>
                <Popup>
                  <div className="text-center p-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">📍</span>
                    </div>
                    <p className="font-bold text-gray-800">Your Location</p>
                    <p className="text-xs text-gray-500 mt-1">Current position</p>
                  </div>
                </Popup>
              </Marker>

              {/* Search Radius */}
              <Circle
                center={userLocation}
                radius={5000}
                color="#0ea5e9"
                fill={true}
                fillOpacity={0.1}
              />

              {/* Incidents */}
              {incidents.map((incident) => {
                if (!incident.location?.coordinates) return null;
                return (
                  <Marker
                    key={incident._id}
                    position={[
                      incident.location.coordinates[1],
                      incident.location.coordinates[0],
                    ]}
                    icon={createModernMarker(incident.severity, incident.type, incident.isSOS)}
                    eventHandlers={{
                      click: () => setSelectedIncident(incident),
                    }}
                  >
                    <Popup>
                      <div className="w-80 p-1">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ backgroundColor: getSeverityColor(incident.severity) + '20' }}
                          >
                            {getTypeIcon(incident.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{incident.title}</h3>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: getStatusColor(incident.status) }}
                              >
                                {incident.status?.toUpperCase()}
                              </span>
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: getSeverityColor(incident.severity) }}
                              >
                                {incident.severity?.toUpperCase()}
                              </span>
                              {incident.isSOS && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                                  🚨 SOS
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{incident.description}</p>
                        
                        {/* Details Grid */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">📁</span>
                              <span className="text-gray-700">{incident.type?.toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">📅</span>
                              <span className="text-gray-700">{formatDate(incident.createdAt)}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                              <span className="text-gray-400">📍</span>
                              <span className="text-gray-700 truncate">{incident.location.address || 'Location not specified'}</span>
                            </div>
                            {incident.reportedBy?.name && (
                              <div className="col-span-2 flex items-center gap-2">
                                <span className="text-gray-400">👤</span>
                                <span className="text-gray-700">{incident.reportedBy.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <button
                          onClick={() => navigate(`/incidents/${incident._id}`)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <span>👁️</span> View Full Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Info Panel */}
            {selectedIncident && (
              <div className="absolute bottom-4 left-4 w-80 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto z-50">
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="float-right text-gray-600 hover:text-gray-900"
                >
                  ✕
                </button>
                <h3 className="text-lg font-bold mb-2">{selectedIncident.title}</h3>
                <p className="text-gray-600 mb-4">{selectedIncident.description}</p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Type:</strong> {selectedIncident.type}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedIncident.status}
                  </p>
                  <p>
                    <strong>Severity:</strong> {selectedIncident.severity}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedIncident.location.address}
                  </p>
                  <p>
                    <strong>Reported by:</strong> {selectedIncident.reportedBy?.name || 'Anonymous'}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/incidents/${selectedIncident._id}`)}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                >
                  View Full Details
                </button>
              </div>
            )}

            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 w-48">
              <h4 className="font-bold mb-3 text-gray-800">Map Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                  <span>Low Severity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>Medium Severity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                  <span>High Severity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#7f1d1d' }}></div>
                  <span>Critical</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Click on any marker to view incident details
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MapPage;
