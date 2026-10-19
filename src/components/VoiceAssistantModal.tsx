import React, { useState, useEffect, useRef } from 'react';
import {
  LiveAudioClient,
  LiveConnectionStatus,
} from '../audio/liveAudioClient';
import { PlayerStats, Mission, WeatherType } from '../types';
import {
  Mic,
  MicOff,
  Radio,
  X,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Wifi,
  WifiOff,
  Zap,
  Shield,
  DollarSign,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  weather: WeatherType;
  activeMission: Mission | null;
  zoneName: string;
  isInVehicle: boolean;
  vehicleName?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bazuu';
  text: string;
  timestamp: string;
}

export const VoiceAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  stats,
  weather,
  activeMission,
  zoneName,
  isInVehicle,
  vehicleName,
}) => {
  const [status, setStatus] = useState<LiveConnectionStatus>('DISCONNECTED');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'bazuu',
      text: 'Niaje bazuu! Hapa ni Radio Mtaa 102.5 FM Live Connect. Uko na Ksh 200 kwa bedsitter... uko rada? Niambie vile form inasimama!',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [userVol, setUserVol] = useState<number>(0);
  const [modelVol, setModelVol] = useState<number>(0);
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientRef = useRef<LiveAudioClient | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat transcripts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize LiveAudioClient when modal is open
  useEffect(() => {
    if (!isOpen) {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      return;
    }

    const client = new LiveAudioClient({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onTranscription: (speaker, text) => {
        setMessages((prev) => {
          // If the last message is from the same speaker and was within 3 seconds, append
          const last = prev[prev.length - 1];
          if (last && last.sender === (speaker === 'user' ? 'user' : 'bazuu') && last.text.length < 150) {
            return [
              ...prev.slice(0, -1),
              { ...last, text: `${last.text} ${text}`.trim() },
            ];
          }
          return [
            ...prev,
            {
              id: Math.random().toString(),
              sender: speaker === 'user' ? 'user' : 'bazuu',
              text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        });
      },
      onVolumeChange: (uLevel, mLevel) => {
        setUserVol(uLevel);
        setModelVol(mLevel);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
    });

    clientRef.current = client;

    // Connect automatically
    client.connect().then(() => {
      // Send current live game context
      client.sendGameContext({
        money: stats.money,
        streetCred: stats.streetCred,
        policeHeat: stats.policeHeat,
        zone: zoneName,
        activeMission: activeMission ? activeMission.title : 'None',
        weather,
        isInVehicle,
        vehicleName,
      });
    }).catch(() => {
      // Handled in onError
    });

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [isOpen, zoneName, weather, isInVehicle, vehicleName]);

  // Sync game context updates when player stats change
  useEffect(() => {
    if (clientRef.current && status !== 'DISCONNECTED' && status !== 'ERROR') {
      clientRef.current.sendGameContext({
        money: stats.money,
        streetCred: stats.streetCred,
        policeHeat: stats.policeHeat,
        zone: zoneName,
        activeMission: activeMission ? activeMission.title : 'None',
        weather,
        isInVehicle,
        vehicleName,
      });
    }
  }, [stats.money, stats.streetCred, stats.policeHeat, zoneName, weather, isInVehicle, vehicleName, status, activeMission]);

  // Toggle Live Microphone Recording
  const handleToggleMic = async () => {
    const client = clientRef.current;
    if (!client) return;

    soundEngine.playUiClick();
    setErrorMessage(null);

    if (status === 'LISTENING') {
      client.stopRecording();
    } else {
      try {
        if (status === 'DISCONNECTED' || status === 'ERROR') {
          await client.connect();
        }
        await client.startRecording();
      } catch (e: any) {
        setErrorMessage(e.message || 'Could not access microphone');
      }
    }
  };

  // Send Text Message (Live or REST fallback)
  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    soundEngine.playUiClick();

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    const client = clientRef.current;
    if (client && (status === 'CONNECTED' || status === 'LISTENING' || status === 'SPEAKING')) {
      client.sendText(textToSend);
    } else {
      // REST API fallback
      try {
        const res = await fetch('/api/voice-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            gameContext: {
              money: stats.money,
              streetCred: stats.streetCred,
              policeHeat: stats.policeHeat,
              zone: zoneName,
              activeMission: activeMission?.title,
              weather,
              isInVehicle,
              vehicleName,
            },
          }),
        });
        const data = await res.json();
        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: 'bazuu',
              text: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch (err: any) {
        setErrorMessage('Failed to connect to assistant: ' + err.message);
      }
    }
  };

  const quickPrompts = [
    'Nipe street tip ya Kayole 🏠',
    'Kanjo wako rada hapa? 👮',
    'Nipate wapi madondo ya Achieng? 🍲',
    'Hii mvua inasaidia aje biashara? 🌧️',
    'Mwas Electronics anauza nini? 📱',
    'Nifike aje CBD salama? 🚐',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div
        className={`bg-neutral-950 border border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 w-full ${
          isCompact ? 'max-w-md h-[460px]' : 'max-w-2xl h-[640px]'
        }`}
      >
        {/* Top Header: Radio Mtaa Branding & Telemetry */}
        <div className="px-5 py-3.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Radio className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm tracking-wide">
                  RADIO MTAA 102.5 FM — LIVE ASSISTANT
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Voice Screen Copilot • Real-Time Sheng Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCompact(!isCompact)}
              title={isCompact ? 'Expand Screen' : 'Compact View'}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              {isCompact ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Close Assistant"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Status & Game Context Bar */}
        <div className="px-5 py-2 bg-neutral-900/60 border-b border-neutral-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'LISTENING'
                  ? 'bg-rose-500'
                  : status === 'SPEAKING'
                  ? 'bg-emerald-400'
                  : status === 'CONNECTED'
                  ? 'bg-cyan-400'
                  : status === 'CONNECTING'
                  ? 'bg-amber-400'
                  : 'bg-neutral-500'
              }`}
            />
            <span className="font-mono text-neutral-300 uppercase text-[10px] tracking-wider font-bold">
              {status === 'LISTENING'
                ? '🎙️ Listening to You'
                : status === 'SPEAKING'
                ? '🔊 Radio Bazuu Speaking'
                : status === 'CONNECTED'
                ? '⚡ Live Duplex Ready'
                : status === 'CONNECTING'
                ? 'Connecting Live API...'
                : 'Disconnected'}
            </span>
          </div>

          {/* Context Badge */}
          <div className="flex items-center gap-3 font-mono text-[10px] text-neutral-400">
            <span className="text-emerald-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Ksh {stats.money}
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Heat {stats.policeHeat}
            </span>
            <span className="text-sky-300">📍 {zoneName}</span>
          </div>
        </div>

        {/* Dynamic Voice Visualizer Waveform Bar */}
        <div className="px-5 py-3 bg-neutral-950/70 border-b border-neutral-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest w-16">
              {status === 'SPEAKING' ? 'AI Voice' : 'Your Mic'}
            </span>
            {/* Visualizer bars */}
            <div className="flex items-center gap-1 h-6 flex-1 max-w-sm">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => {
                const activeLevel = status === 'SPEAKING' ? modelVol : userVol;
                const height = Math.max(
                  4,
                  Math.min(24, Math.sin(i * 0.5 + Date.now() * 0.01) * 16 * activeLevel + activeLevel * 20)
                );
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      status === 'SPEAKING'
                        ? 'bg-emerald-400'
                        : status === 'LISTENING'
                        ? 'bg-rose-500'
                        : 'bg-neutral-800'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Large Push to Talk / Toggle Live Audio Button */}
          <button
            onClick={handleToggleMic}
            className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              status === 'LISTENING'
                ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
            }`}
          >
            {status === 'LISTENING' ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Mute Mic</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Start Live Voice</span>
              </>
            )}
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="px-5 py-2 bg-rose-950/80 border-b border-rose-800 text-rose-300 text-xs flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white ml-2 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Live Conversation & Screen Transcripts */}
        <div
          ref={scrollRef}
          className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-neutral-950/40"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-neutral-400 font-mono">
                <span>{msg.sender === 'user' ? 'You (Msee wa Mtaa)' : '📻 Radio Mtaa Bazuu'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-100 shadow-md'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 bg-neutral-900/60 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-neutral-400 font-bold uppercase shrink-0">
            Form:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(prompt);
                const client = clientRef.current;
                if (client) {
                  client.sendText(prompt);
                }
              }}
              className="shrink-0 px-2.5 py-1 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700/80 text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Bottom Text Input & Fallback */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendText();
            }}
            placeholder="Type in Sheng, Swahili, or English... or speak into mic"
            className="flex-1 bg-neutral-950 border border-neutral-700/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
          />
          <button
            onClick={handleSendText}
            disabled={!inputText.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
