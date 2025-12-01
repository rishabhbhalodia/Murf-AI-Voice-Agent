'use client';

import { useVoiceAssistant, useRoomContext } from '@livekit/components-react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Phone, MessageSquare, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { RoomEvent } from 'livekit-client';

interface ImprovSessionProps {
  onDisconnect: () => void;
  playerName: string;
}

interface TranscriptMessage {
  id: string;
  speaker: 'agent' | 'user';
  text: string;
  timestamp: Date;
}

export function ImprovSession({ onDisconnect, playerName }: ImprovSessionProps) {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const room = useRoomContext();
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const isConnected = state !== 'disconnected' && state !== 'idle';
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';

  // Listen for agent transcriptions (what the agent says)
  useEffect(() => {
    if (!agentTranscriptions || agentTranscriptions.length === 0) return;

    const latestTranscription = agentTranscriptions[agentTranscriptions.length - 1];
    if (latestTranscription && latestTranscription.final) {
      const text = latestTranscription.text.trim();
      if (text) {
        setTranscript(prev => {
          // Avoid duplicates
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.text === text && lastMessage?.speaker === 'agent') {
            return prev;
          }

          return [
            ...prev,
            {
              id: `agent-${Date.now()}-${Math.random()}`,
              speaker: 'agent',
              text,
              timestamp: new Date(),
            }
          ];
        });
      }
    }
  }, [agentTranscriptions]);

  // Listen for user transcriptions (what the user says)
  useEffect(() => {
    if (!room) return;

    const handleTranscriptionReceived = (
      segments: any[],
      participant: any,
      publication: any
    ) => {
      // Only capture user's own transcriptions
      if (participant && !participant.isAgent) {
        segments.forEach((segment) => {
          if (segment.final && segment.text.trim()) {
            setTranscript(prev => {
              // Avoid duplicates
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.text === segment.text.trim() && lastMessage?.speaker === 'user') {
                return prev;
              }

              return [
                ...prev,
                {
                  id: `user-${Date.now()}-${Math.random()}`,
                  speaker: 'user',
                  text: segment.text.trim(),
                  timestamp: new Date(),
                }
              ];
            });
          }
        });
      }
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscriptionReceived);

    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscriptionReceived);
    };
  }, [room]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (showTranscript) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, showTranscript]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Subtle Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_70%)]" />

      <div className="relative h-full flex flex-col items-center justify-center p-6">
        {/* Player Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-6"
        >
          {/* <div className="bg-white/5 backdrop-blur-sm border border-purple-400/30 rounded-xl px-5 py-2.5"> */}
          <p className="text-xs text-slate-400">Player name:
            <span className="text-lg font-semibold text-purple-300 ml-1">{playerName}</span>
          </p>
          {/* </div> */}
        </motion.div>

        {/* Transcript Toggle Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTranscript(!showTranscript)}
          className="absolute top-6 right-6 bg-white/5 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/60 rounded-xl px-4 py-2.5 transition-all duration-200 flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-purple-300" />
          <span className="text-purple-300 text-sm font-medium">Transcript</span>
          {transcript.length > 0 && (
            <span className="bg-purple-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {transcript.length}
            </span>
          )}
        </motion.button>

        {/* Transcript Panel */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-slate-900/95 backdrop-blur-xl border-l border-purple-400/30 flex flex-col z-50"
            >
              {/* Transcript Header */}
              <div className="flex items-center justify-between p-6 border-b border-purple-400/20">
                <div>
                  <h3 className="text-xl font-semibold text-white">Conversation</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Session transcript</p>
                </div>
                <button
                  onClick={() => setShowTranscript(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400 hover:text-white" />
                </button>
              </div>

              {/* Transcript Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {transcript.length === 0 ? (
                  <div className="text-center text-slate-500 mt-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Start the conversation</p>
                  </div>
                ) : (
                  transcript.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-2.5 ${message.speaker === 'agent'
                          ? 'bg-purple-500/15 border border-purple-400/25'
                          : 'bg-white/10 border border-white/20'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-semibold ${message.speaker === 'agent' ? 'text-purple-300' : 'text-slate-300'
                              }`}
                          >
                            {message.speaker === 'agent' ? 'Host' : playerName}
                          </span>
                          <span className="text-xs text-slate-500">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{message.text}</p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Transcript Footer */}
              <div className="p-4 border-t border-purple-400/20 bg-slate-900/50">
                <p className="text-xs text-slate-500 text-center">
                  Transcript saved for this session only
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 blur-xl opacity-40"
              animate={{
                backgroundColor: isSpeaking
                  ? 'rgba(168, 85, 247, 0.5)'
                  : isListening
                    ? 'rgba(139, 92, 246, 0.5)'
                    : 'rgba(100, 100, 100, 0.2)',
              }}
            />
            <div className="relative bg-purple-500/10 backdrop-blur-sm p-10 rounded-full border border-purple-400/30">
              <motion.div
                animate={{
                  scale: isSpeaking ? [1, 1.08, 1] : isListening ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Mic className={`w-20 h-20 ${isSpeaking ? 'text-purple-400' :
                  isListening ? 'text-purple-300' :
                    'text-slate-500'
                  }`} strokeWidth={1.5} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Status Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold mb-1.5 text-white">
            {isSpeaking ? 'Host Speaking' :
              isListening ? 'Your Turn' :
                isConnected ? 'Ready' : 'Connecting...'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isSpeaking ? 'Listen to the host' :
              isListening ? 'Perform your improv' :
                isConnected ? 'Waiting for next cue' :
                  'Connecting to session'}
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md bg-white/5 backdrop-blur-sm border border-purple-400/25 rounded-xl p-5 mb-6"
        >
          <h3 className="text-purple-300 font-semibold mb-3 text-sm">How to Play</h3>
          <ul className="text-slate-300 space-y-1.5 text-xs leading-relaxed">
            <li>• Listen to your scenario from the host</li>
            <li>• Perform your improv in character</li>
            <li>• Say <span className="text-purple-300 font-semibold">"end scene"</span> when done</li>
            <li>• Receive feedback and move to next round</li>
          </ul>
        </motion.div>

        {/* End Call Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDisconnect}
          className="bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 hover:border-red-400/50 text-red-300 font-medium px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
        >
          <Phone className="w-4 h-4" />
          End Session
        </motion.button>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-6"
        >
          <p className="text-slate-500 text-xs">
            Powered by <span className="text-purple-400">Murf Falcon TTS</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}