import { Server } from 'socket.io';

export const initializeSocket = (httpServer) => {
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, '');
        if (
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(normalizedOrigin) ||
          normalizedOrigin.endsWith('.vercel.app') ||
          normalizedOrigin.includes('localhost') ||
          normalizedOrigin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  const rooms = {
    globalNotifications: 'global:notifications',
    incidentUpdates: 'incident:updates',
    sosAlerts: 'sos:alerts',
    liveMap: 'map:live',
  };

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room for incident updates
    socket.on('join-incident-updates', () => {
      socket.join(rooms.incidentUpdates);
      console.log(`${socket.id} joined incident updates room`);
    });

    // Join room for SOS alerts
    socket.on('join-sos-alerts', () => {
      socket.join(rooms.sosAlerts);
      console.log(`${socket.id} joined SOS alerts room`);
    });

    // Join room for live map
    socket.on('join-live-map', () => {
      socket.join(rooms.liveMap);
      console.log(`${socket.id} joined live map room`);
    });

    // Join global notifications
    socket.on('join-global-notifications', () => {
      socket.join(rooms.globalNotifications);
      console.log(`${socket.id} joined global notifications room`);
    });

    // Notification broadcast
    socket.on('send-notification', (data) => {
      io.to(rooms.globalNotifications).emit('notification', data);
    });

    // Subscribe to user-specific room
    socket.on('subscribe-user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`${socket.id} subscribed to user ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return { io, rooms };
};

export default initializeSocket;
