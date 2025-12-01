'use client';

import { Button } from '@/components/livekit/button';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, Sparkles } from 'lucide-react';

interface ImprovWelcomeProps {
  onStartGame: (playerName: string) => void;
}

export const ImprovWelcome = ({ onStartGame }: ImprovWelcomeProps) => {
  const [playerName, setPlayerName] = useState('');
  const [particles, setParticles] = useState<Array<{ x: number, y: number, targetX: number, targetY: number, duration: number }>>([]);

  useEffect(() => {
    const newParticles = [...Array(15)].map(() => ({
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
      targetX: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
      targetY: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
      duration: 25 + Math.random() * 35,
    }));
    setParticles(newParticles);
  }, []);

  const handleStart = () => {
    if (playerName.trim()) {
      onStartGame(playerName.trim());
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Subtle Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_70%)]" />

      {/* Minimal Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x: particle.x,
              y: particle.y,
            }}
            animate={{
              y: [null, particle.targetY],
              x: [null, particle.targetX],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <div className="w-1 h-1 bg-purple-300 rounded-full" />
          </motion.div>
        ))}
      </div>

      <section className="relative flex flex-col items-center justify-center text-center px-6 h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2, type: "spring" }}
            className="mb-8 inline-block"
          >
            <div className="bg-purple-500/20 p-5 rounded-2xl border border-purple-400/30 backdrop-blur-sm">
              <Mic className="w-12 h-12 text-purple-300" strokeWidth={2} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-5xl font-bold mb-3 text-white">
              Improv Battle
            </h1>
            <p className="text-purple-300 text-lg mb-2">
              Voice Improv Game Show
            </p>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Perform improv scenarios and get real-time AI reactions
            </p>
          </motion.div>

          {/* Name Input */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6 space-y-3"
          >
            <label className="block text-purple-200 text-sm font-medium">
              Your Stage Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleStart()}
              placeholder="Enter name"
              className="w-full px-5 py-3 bg-white/5 border border-purple-400/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400/60 focus:bg-white/10 transition-all"
            />
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
              disabled={!playerName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Start Game
            </Button>
          </motion.div>

          {/* Game Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex flex-wrap gap-2 justify-center text-xs"
          >
            {['3 Rounds', 'Unique Scenarios', 'Live Reactions'].map((item, i) => (
              <span
                key={item}
                className="px-3 py-1.5 bg-white/5 border border-purple-400/20 rounded-full text-purple-200"
              >
                {item}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6"
        >
          <p className="text-slate-500 text-xs">
            Powered by <span className="text-purple-400">Murf Falcon TTS</span>
          </p>
        </motion.div>
      </section>
    </div>
  );
};