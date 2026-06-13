import React, { useState } from 'react';

const RoomLobby = ({ onJoin }) => {
  const [username, setUsername] = useState('');
  const [roomID, setRoomID] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (!roomID.trim()) {
      setError('Please enter a room name.');
      return;
    }
    setError('');
    onJoin({
      roomID: roomID.trim(),
      username: username.trim() || 'Anonymous'
    });
  };

  return (
    <div className="min-h-screen bg-[#0a192f] flex items-center justify-center text-white font-mono">
      <div className="bg-black/50 border border-blue-900 rounded-2xl p-10 w-96 flex flex-col gap-5">
        <h1 className="text-3xl font-bold text-blue-400">Virtual Lab</h1>
        <p className="text-sm text-gray-400">Collaborative 2D Physics Sandbox</p>

        <input
          type="text"
          placeholder="Your name (optional)"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm outline-none"
        />

        <input
          type="text"
          placeholder="Room name (e.g. physics-101)"
          value={roomID}
          onChange={e => setRoomID(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm outline-none"
        />

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          onClick={handleJoin}
          className="bg-blue-600 hover:bg-blue-500 rounded-lg py-2 font-bold transition-colors"
        >
          Enter Lab →
        </button>
      </div>
    </div>
  );
};

export default RoomLobby;