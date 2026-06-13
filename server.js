// server.js

import connectDB from './config/db.js';
import experimentRoutes from './routes/experimentRoutes.js';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// =========================
// EXPRESS
// =========================

const app = express();


app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174'
  ],

  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE'
  ],

  credentials: true
}));

app.use(express.json());


connectDB();


app.use(
  '/api/experiments',
  experimentRoutes
);


// =========================
// SERVER
// =========================

const server =
  http.createServer(app);

// =========================
// SOCKET IO
// =========================

const io = new Server(
  server,
  {
    cors: {
      origin:
      [
        'http://localhost:5173',
        'http://localhost:5173'
      ],

      methods: [
        'GET',
        'POST',
        'PUT',
        'DELETE'
      ]
    }
  }
);

// =========================
// ROOM PARTICIPANTS
// =========================

const roomParticipants = {};


const rooms = new Map();

function getRoom(roomID) {
  if (!rooms.has(roomID)) {
    rooms.set(roomID, {
      users: new Set(),
      envState: { gravity: 0.6, wind: 0 },
      annotations: [],
        physicsState: {}  // add this

    });
  }
  return rooms.get(roomID);
}

// =========================
// SOCKET CONNECTION
// =========================

io.on(
  'connection',
  (socket) => {

    let currentRoom = null;

socket.on(
  'join_room',
  ({ roomID, username }) => {

    console.log(
  'JOIN:',
  username,
  'ROOM:',
  roomID
);


    currentRoom = roomID;

    socket.join(roomID);

    socket.roomID = roomID;
    socket.username = username;

   const room = getRoom(roomID);

room.users.add(socket.id);

socket.emit('room_state', {
  envState: room.envState,
  annotations: room.annotations
});

if (!roomParticipants[roomID]) {
  roomParticipants[roomID] = [];
}

const alreadyExists =
  roomParticipants[roomID].some(
    user => user.id === socket.id
  );

if (!alreadyExists) {

  roomParticipants[roomID].push({
    id: socket.id,
    username
  });

}

    // send updated list
    io.to(roomID).emit(
      'participants_update',
      roomParticipants[roomID]
    );

  }
);


    console.log(
      'User connected:',
      socket.id
    );

    // =========================
    // OBJECT MOVEMENT
    // =========================

   socket.on('object_moved', (data) => {
  if (!currentRoom) return;
  socket.to(currentRoom).emit('update_object', data);
});

// =========================
// PHYSICS SYNC
// =========================

socket.on('physics_sync', (data) => {
  if (!currentRoom) return;

  const room = getRoom(currentRoom);
  const now = Date.now();

  // Conflict resolution — latest timestamp wins per body
  data.bodies.forEach(body => {
    const existing = room.physicsState?.[body.label];
    if (!existing || now > existing.lastUpdate) {
      if (!room.physicsState) room.physicsState = {};
      room.physicsState[body.label] = {
        ...body,
        lastUpdate: now
      };
    }
  });

  // Broadcast merged state to peers
  socket.to(currentRoom).emit('physics_sync', {
    bodies: Object.values(room.physicsState)
  });
});

    // =========================
    // ENVIRONMENT SETTINGS
    // =========================

    socket.on('env_change', (data) => {
  if (!currentRoom) return;
  const room = getRoom(currentRoom);
  room.envState = { ...room.envState, ...data };
  io.to(currentRoom).emit('env_update', data);
});

    // =========================
    // ANNOTATIONS
    // =========================

   socket.on('add_annotation', (note) => {
  if (!currentRoom) return;
  const room = getRoom(currentRoom);
  room.annotations.push(note);
  socket.to(currentRoom).emit('new_annotation', note);
});

    // =========================
    // CURSOR MOVEMENT
    // =========================

   socket.on('mouse_move', (data) => {
  if (!currentRoom) return;
  socket.to(currentRoom).emit('mouse_update', { id: socket.id, x: data.x, y: data.y });
});

    // =========================
    // DISCONNECT
    // =========================

   socket.on('disconnect', () => {

  if (currentRoom) {

    const room = getRoom(currentRoom);

    room.users.delete(socket.id);

    if (room.users.size === 0) {
  rooms.delete(currentRoom);
}

    io.to(currentRoom).emit(
      'user_left',
      socket.id
    );

  }

  const roomID = socket.roomID;

  if (roomID && roomParticipants[roomID]) {

    roomParticipants[roomID] =
      roomParticipants[roomID].filter(
        user => user.id !== socket.id
      );

    io.to(roomID).emit(
      'participants_update',
      roomParticipants[roomID]
    );

    if (roomParticipants[roomID].length === 0) {
  delete roomParticipants[roomID];
}

  }

  console.log(
    'User disconnected:',
    socket.id
  );

});


  }
);

// =========================
// START SERVER
// =========================

server.listen(
  3001,
  () => {

    console.log(
      'Server running on port 3001'
    );

  }
);