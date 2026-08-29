import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, Badge } from './common.jsx';

const IncidentCard = ({ incident, onClick }) => {
  const navigate = useNavigate();

  const statusColors = {
    reported: 'warning',
    verified: 'primary',
    responding: 'warning',
    resolved: 'success',
    cancelled: 'secondary',
  };

  const severityIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
    critical: '🔴',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/incidents/${incident._id}`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className="cursor-pointer"
    >
      <Card className="h-full">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex-1">{incident.title}</h3>
          <span className="text-2xl">{severityIcons[incident.severity]}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{incident.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={statusColors[incident.status]}>{incident.status}</Badge>
          <Badge variant="secondary">{incident.customType || incident.type}</Badge>
          {incident.isSOS && <Badge variant="alert">🚨 SOS</Badge>}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>📍 {incident.location.address}</p>
          <p>👤 Reported by {incident.reportedBy?.name || 'Anonymous'}</p>
          <p>📅 {new Date(incident.createdAt).toLocaleDateString()}</p>
        </div>
      </Card>
    </motion.div>
  );
};

export default IncidentCard;
