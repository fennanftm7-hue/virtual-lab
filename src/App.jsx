import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import RoomLobby from './RoomLobby';
import PhysicsCanvas from './PhysicsCanvas';

const socket = io('http://localhost:3001');

const App = () => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check if URL has a room in the path e.g. /room/physics-101
    const path = window.location.pathname;
    const match = path.match(/\/room\/(.+)/);
    if (match) {
      const roomID = match[1];
      socket.emit('join_room', { roomID, username: 'Guest' });
      setSession({ roomID, username: 'Guest' });
    }
  }, []);

  const handleJoin = ({ roomID, username }) => {
    socket.emit('join_room', { roomID, username });
    setSession({ roomID, username });
  };

  if (!session) {
    return <RoomLobby onJoin={handleJoin} />;
  }

  return (
    <PhysicsCanvas
      socket={socket}
      roomID={session.roomID}
      username={session.username}
    />
  );
};

export default App;