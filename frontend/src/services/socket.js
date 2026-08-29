import io from 'socket.io-client';

let socket = null;

export const initializeSocket = () => {
  const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  
  socket = io(socketURL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

// Socket event methods
export const socketEvents = {
  // Listeners
  onNewIncident: (callback) => {
    const s = getSocket();
    s.on('new-incident', callback);
    s.on('incident-created', callback);
  },
  onIncidentUpdate: (callback) => getSocket().on('incident-update', callback),
  onIncidentDeleted: (callback) => getSocket().on('incident:deleted', callback),
  onSOSAlert: (callback) => getSocket().on('sos-alert', callback),
  onNotification: (callback) => getSocket().on('notification', callback),

  // Emitters
  joinIncidentUpdates: () => getSocket().emit('join-incident-updates'),
  joinSOSAlerts: () => getSocket().emit('join-sos-alerts'),
  joinLiveMap: () => getSocket().emit('join-live-map'),
  joinGlobalNotifications: () => getSocket().emit('join-global-notifications'),
  subscribeUser: (userId) => getSocket().emit('subscribe-user', userId),
  sendNotification: (data) => getSocket().emit('send-notification', data),

  // Cleanup
  offNewIncident: () => {
    const s = getSocket();
    s.off('new-incident');
    s.off('incident-created');
  },
  offIncidentUpdate: () => getSocket().off('incident-update'),
  offIncidentDeleted: () => getSocket().off('incident:deleted'),
  offSOSAlert: () => getSocket().off('sos-alert'),
  offNotification: () => getSocket().off('notification'),
};

export default { initializeSocket, getSocket, socketEvents };
