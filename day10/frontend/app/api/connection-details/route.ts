import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get player name from query parameter
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('name') || `player_${Math.random().toString(36).substring(7)}`;

    const roomName = `improv_battle_${Math.random().toString(36).substring(7)}`;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit API credentials not configured' },
        { status: 500 }
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: playerName,
      name: playerName,
      // Add player name to metadata so agent can access it
      metadata: JSON.stringify({ player_name: playerName }),
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return NextResponse.json({
      serverUrl: livekitUrl,
      roomName: roomName,
      participantToken: await token.toJwt(),
      participantName: playerName,
    });
  } catch (error) {
    console.error('Error generating connection details:', error);
    return NextResponse.json(
      { error: 'Failed to generate connection details' },
      { status: 500 }
    );
  }
}