import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentService } from '../services/api.js';
import { useAuthStore } from '../context/store.js';
import { Modal } from '../components/common.jsx';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PublicMapPage = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const isAuthenticated = !!token;
  
  const [incidents, setIncidents] = useState([]);
  const [userLocation, setUserLocation] = useState([20.5937, 78.9629]); // India center
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [radius, setRadius] = useState(10); // 10 km default
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('responding');
  const [searchCity, setSearchCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const incidentTypes = ['Fire', 'Flood', 'Medical', 'Accident', 'Crime'];
  const statusOptions = ['reported', 'verified', 'responding', 'resolved'];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [userLocation, radius, selectedType, selectedStatus]);

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setLoading(false);
        },
        () => {
          toast.warning('Could not detect location. Using default location.');
          setLoading(false);
        }
      );
    }
  };

  const fetchIncidents = async () => {
    try {
      let response;
      
      if (searchCity) {
        // Search by city - you may need to add this endpoint
        response = await incidentService.getIncidents({
          limit: 100,
          city: searchCity,
          type: selectedType || undefined,
          status: selectedStatus || undefined,
        });
      } else {
        // Fetch nearby incidents
        response = await incidentService.getNearbyIncidents({
          latitude: userLocation[0],
          longitude: userLocation[1],
          radius: radius * 1000, // Convert km to meters
          type: selectedType || undefined,
          status: selectedStatus || undefined,
        });
      }
      
      // Get incidents array from response
      let incidentList = response.data.data || response.data;
      
      // Filter to only show responding incidents (client-side enforcement)
      incidentList = incidentList.filter(incident => incident.status === 'responding');
      
      setIncidents(incidentList);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      toast.error('Failed to fetch incidents');
    }
  };

  const handleSearch = () => {
    if (!searchCity.trim()) {
      toast.warning('Please enter a city name or pincode');
      return;
    }
    fetchIncidents();
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

  const getStatusColor = (status) => {
    const colors = {
      reported: '#ef4444',
      verified: '#f59e0b',
      responding: '#3b82f6',
      resolved: '#10b981',
      cancelled: '#6b7280',
    };
    return colors[status] || '#0ea5e9';
  };

  const getMarkerColor = (severity) => {
    return getSeverityColor(severity);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const handleReportIncidentClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    } else {
      navigate('/report');
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header with Filters */}
      <div className="bg-white shadow-md px-6 py-4 z-40">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Live Incident Map</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <span className="w-2 h-2 mr-1.5 bg-red-500 rounded-full animate-pulse"></span>
                Live
              </span>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    toast.success('Logged out successfully');
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition shadow-sm hover:shadow"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition shadow-sm hover:shadow"
                >
                  Login
                </button>
              )}
              <button
                onClick={handleReportIncidentClick}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition shadow-sm hover:shadow"
              >
                Report Incident
              </button>
            </div>
          </div>

          {/* Filter Panel - Always Visible */}
          <div className="mt-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
              {/* Radius */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Search Radius: <span className="text-blue-600 font-bold">{radius} km</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Incident Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Incident Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {incidentTypes.map((type) => (
                    <option key={type} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status - Fixed to Responding */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Status
                </label>
                <div className="w-full px-3 py-2 text-sm bg-blue-100 border border-blue-300 rounded-lg text-blue-800 font-semibold text-center">
                  Responding Only
                </div>
              </div>

              {/* Search by City */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  City / Pincode
                </label>
                <input
                  type="text"
                  placeholder="Enter city or pincode"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Search Button */}
              <div className="flex items-end self-end">
                <button
                  onClick={handleSearch}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition shadow-sm hover:shadow text-sm"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Detecting your location...</p>
            </div>
          </div>
        )}

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
            radius={radius * 1000} // Convert km to meters
            color="#0ea5e9"
            fill={true}
            fillOpacity={0.1}
            weight={2}
            dashArray="5, 5"
          />

          {/* Incidents */}
          {incidents.map((incident) => (
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
          ))}
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-4 min-w-56" style={{ zIndex: 1000 }}>
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            Map Legend
          </h4>
          
          {/* Severity Legend */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Severity</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                <span className="text-sm text-gray-700">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                <span className="text-sm text-gray-700">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-sm text-gray-700">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#7f1d1d' }}></div>
                <span className="text-sm text-gray-700">Critical</span>
              </div>
            </div>
          </div>

          {/* Incident Types Legend */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Incident Types</p>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🔥</span>
                <span className="text-xs text-gray-700">Fire</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🌊</span>
                <span className="text-xs text-gray-700">Flood</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🚗</span>
                <span className="text-xs text-gray-700">Accident</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🏚️</span>
                <span className="text-xs text-gray-700">Earthquake</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🏥</span>
                <span className="text-xs text-gray-700">Medical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">⚠️</span>
                <span className="text-xs text-gray-700">Hazard</span>
              </div>
            </div>
          </div>

          {/* Status Legend */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#ef4444' }}>Reported</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#3b82f6' }}>Responding</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#10b981' }}>Resolved</span>
            </div>
          </div>

          {/* Special Markers */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <div className="user-marker-container w-5 h-5 relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                <div className="absolute inset-1 bg-blue-600 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-xs text-gray-700">Your Location</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {selectedIncident && (
        <div className="absolute bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl p-5 max-h-96 overflow-y-auto border-l-4 border-blue-600">
          <button
            onClick={() => setSelectedIncident(null)}
            className="float-right text-gray-600 hover:text-gray-900 text-xl font-bold"
          >
            ✕
          </button>
          <h3 className="text-lg font-bold mb-2 pr-6">{selectedIncident.title}</h3>
          <span
            className="inline-block px-3 py-1 rounded-full text-white text-xs font-semibold mb-4"
            style={{ backgroundColor: getStatusColor(selectedIncident.status) }}
          >
            {selectedIncident.status?.toUpperCase()}
          </span>
          <p className="text-gray-600 mb-4">{selectedIncident.description}</p>
          <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
            <p>
              <strong>Type:</strong>{' '}
              <span className="text-gray-700">{selectedIncident.type?.toUpperCase()}</span>
            </p>
            <p>
              <strong>Severity:</strong>{' '}
              <span
                className="font-semibold"
                style={{ color: getSeverityColor(selectedIncident.severity) }}
              >
                {selectedIncident.severity?.toUpperCase()}
              </span>
            </p>
            <p>
              <strong>Location:</strong>{' '}
              <span className="text-gray-700">{selectedIncident.location.address}</span>
            </p>
            <p>
              <strong>Reported:</strong>{' '}
              <span className="text-gray-700">{formatDate(selectedIncident.createdAt)}</span>
            </p>
            {selectedIncident.reportedBy?.name && (
              <p>
                <strong>Reported by:</strong>{' '}
                <span className="text-gray-700">{selectedIncident.reportedBy.name}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Login to Report Incident
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-40 max-w-xs">
        <h3 className="font-bold text-gray-800 mb-3">Legend</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Medium Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Low Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Search Radius</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {incidents.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-lg text-gray-600">No incidents found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or search area</p>
          </div>
        </div>
      )}

      {/* Incident Count */}
      <div className="absolute top-24 right-4 bg-white rounded-lg shadow-md p-3 z-40">
        <p className="text-sm font-semibold text-gray-700">
          Incidents Found: <span className="text-blue-600 text-lg">{incidents.length}</span>
        </p>
      </div>

      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Login Required">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-gray-700 mb-6">
            You must login to report an incident.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Go to Login
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PublicMapPage;
