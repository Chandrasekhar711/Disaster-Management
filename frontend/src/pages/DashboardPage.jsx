import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useIncidentStore } from '../context/store.js';
import { incidentService } from '../services/api.js';
import { socketEvents, initializeSocket } from '../services/socket.js';
import IncidentCard from '../components/IncidentCard.jsx';
import { LoadingSkeleton, EmptyState } from '../components/common.jsx';
import { toast } from 'react-toastify';
import 'leaflet/dist/leaflet.css';

const DashboardPage = () => {
  const { incidents, isLoading, setIncidents, setLoading, addIncident, updateIncident } =
    useIncidentStore();
  const [userLocation, setUserLocation] = useState([20.5937, 78.9629]); // India center
  const [filters, setFilters] = useState({
    type: '',
    status: 'responding',
    severity: '',
  });

  useEffect(() => {
    initializeSocket();
    fetchIncidents();
    getCurrentLocation();
    setupSocketListeners();

    return () => {
      socketEvents.offNewIncident();
      socketEvents.offIncidentUpdate();
    };
  }, [filters]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      });
    }
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await incidentService.getIncidents(filters);
      setIncidents(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketEvents.joinIncidentUpdates();
    socketEvents.onNewIncident((incident) => {
      addIncident(incident);
      toast.info(`New incident: ${incident.title}`);
    });
    socketEvents.onIncidentUpdate((incident) => {
      updateIncident(incident._id, incident);
      toast.info(`Incident updated: ${incident.title}`);
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow mb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">Emergency Incidents Dashboard</h1>
          <p className="text-gray-600">
            Real-time monitoring and active incidents on live map
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Live Map Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Live Map - Active Incidents</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden h-96">
            <MapContainer
              center={userLocation}
              zoom={5}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {incidents.map((incident) => {
                if (!incident.location?.coordinates) return null;
                const [lng, lat] = incident.location.coordinates;
                return (
                  <Marker key={incident._id} position={[lat, lng]}>
                    <Popup>
                      <div className="text-sm">
                        <strong>{incident.title}</strong>
                        <br />
                        Type: {incident.type}
                        <br />
                        Status: {incident.status}
                        <br />
                        Severity: {incident.severity}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Active Incidents - Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">All Types</option>
              <option value="flood">Flood</option>
              <option value="fire">Fire</option>
              <option value="accident">Accident</option>
              <option value="earthquake">Earthquake</option>
              <option value="hazard">Hazard</option>
              <option value="other">Other</option>
            </select>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">All Status</option>
              <option value="reported">Reported</option>
              <option value="verified">Verified</option>
              <option value="responding">Responding</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Active Incidents Grid */}
        <h2 className="text-2xl font-bold mb-4">All Active Incidents</h2>
        {isLoading ? (
          <LoadingSkeleton count={6} />
        ) : incidents.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No Active Incidents"
            description="No incidents match your current filters. Check back later for new reports."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incidents.map((incident) => (
              <IncidentCard
                key={incident._id}
                incident={incident}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
