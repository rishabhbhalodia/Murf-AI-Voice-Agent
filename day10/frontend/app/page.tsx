'use client';

import { useState } from 'react';
import { ImprovWelcome } from '@/components/app/improv-welcome';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { ImprovSession } from '@/components/app/improv-session';

export default function HomePage() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    roomName: string;
    participantToken: string;
  } | null>(null);

  const handleStartGame = async (name: string) => {
    setPlayerName(name);
    
    // Get connection details from API
    try {
      const response = await fetch('/api/connection-details?name=' + encodeURIComponent(name));
      const details = await response.json();
      setConnectionDetails(details);
    } catch (error) {
      console.error('Failed to get connection details:', error);
    }
  };

  const handleDisconnect = () => {
    setPlayerName(null);
    setConnectionDetails(null);
  };

  if (!playerName || !connectionDetails) {
    return <ImprovWelcome onStartGame={handleStartGame} />;
  }

  return (
    <LiveKitRoom
      serverUrl={connectionDetails.serverUrl}
      token={connectionDetails.participantToken}
      connect={true}
      audio={true}
      video={false}
    >
      <ImprovSession
        onDisconnect={handleDisconnect}
        playerName={playerName}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
