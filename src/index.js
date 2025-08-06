import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import User from './models/User.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: 'http://localhost:8080',
    credentials: true,
  },
});
const PORT = process.env.PORT || 5000;

// CORS middleware
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));

// Middleware
app.use(express.json());

// Attach User model to app.locals
app.locals.User = User;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User routes placeholder
import userRoutes from './routes/user.js';
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

// --- SOCKET.IO WHITEBOARD REALTIME ---
// --- SOCKET.IO WHITEBOARD REALTIME ---
const usersInRoom = {};

io.on('connection', (socket) => {
  // Join whiteboard room (old logic)
  socket.on('join-board', (boardId) => {
    socket.join(boardId);
  });

  // --- Meet room logic ---
  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    if (!usersInRoom[roomId]) usersInRoom[roomId] = [];
    // Avoid duplicate users (by socket id)
    usersInRoom[roomId] = usersInRoom[roomId].filter(u => u.id !== socket.id);
    usersInRoom[roomId].push({
      id: socket.id,
      name: userName,
      joinedAt: new Date().toISOString(),
    });
    // Notify all users in room
    io.to(roomId).emit('room-users-updated', usersInRoom[roomId]);
    socket.to(roomId).emit('user-joined', { name: userName });
    socket.data.roomId = roomId;
    socket.data.userName = userName;
  });

  socket.on('leave-room', ({ roomId, userName }) => {
    socket.leave(roomId);
    if (usersInRoom[roomId]) {
      usersInRoom[roomId] = usersInRoom[roomId].filter(u => u.id !== socket.id);
      io.to(roomId).emit('room-users-updated', usersInRoom[roomId]);
      socket.to(roomId).emit('user-left', { name: userName });
    }
  });

  socket.on('disconnect', () => {
    const { roomId, userName } = socket.data || {};
    if (roomId && usersInRoom[roomId]) {
      usersInRoom[roomId] = usersInRoom[roomId].filter(u => u.id !== socket.id);
      io.to(roomId).emit('room-users-updated', usersInRoom[roomId]);
      socket.to(roomId).emit('user-left', { name: userName });
    }
  });

  socket.on('whiteboard-update', ({ boardId, data }) => {
    socket.to(boardId).emit('whiteboard-update', data);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});