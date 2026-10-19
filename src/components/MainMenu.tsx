import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { Play, RotateCcw, HelpCircle, Settings as SettingsIcon, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface Props {
  hasSaveGame: boolean;
  onNewGame: () => void;
  onContinueGame: () => void;
}

export const MainMenu: React.FC<Props> = ({ hasSaveGame, onNewGame, onContinueGame }) => {
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 z-50 bg-zinc-950 flex flex-col justify-between p-6 sm:p-12 text-white select-none overflow-y-auto font-sans">
      {/* Background Ambience: Skyline & Street Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
        {/* City skyline silhouettes */}
        <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-emerald-950/70 via-black/80 to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-amber-500/10 via-emerald-500/15 to-transparent blur-3xl rounded-full" />
      </div>

      {/* Top Bar: Subtitle & Audio Toggle */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
            Nairobi Street-Life Open-World RPG
          </span>
        </div>
        <button
          onClick={handleToggleMute}
          className="p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-xs font-mono"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'Muted' : 'Audio ON'}</span>
        </button>
      </div>

      {/* Hero Title Section */}
      <div className="relative z-10 my-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 bg-amber-950/80 border border-amber-500/50 rounded-full text-amber-300 text-xs font-bold tracking-wider uppercase mb-2">
            🇰🇪 Version 1.0 · Nairobi SandBox
          </div>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-white drop-shadow-2xl">
            KANAIRO
          </h1>
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 tracking-wider">
            MTAA HUSTLE
          </h2>
          <p className="text-base sm:text-xl text-zinc-300 italic font-mono pt-2">
            "Uko na Ksh 200. Utaifanya ikue how?"
          </p>
        </div>

        {/* Menu Buttons */}
        <div className="space-y-3 max-w-sm pt-4">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onNewGame();
            }}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-black font-black text-sm tracking-widest uppercase rounded-2xl shadow-xl hover:shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center justify-between cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <Play className="w-5 h-5 fill-black" />
              New Game (Anza Mtaa)
            </span>
            <span className="text-xs opacity-75 font-mono">ENTER →</span>
          </button>

          {hasSaveGame && (
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onContinueGame();
              }}
              className="w-full py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/60 text-white font-bold text-sm tracking-wider uppercase rounded-2xl shadow-lg transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                Continue Saved Game
              </span>
              <span className="text-xs text-zinc-500 font-mono">RESTORE</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                soundEngine.playUiClick();
                setShowHowToPlay(true);
              }}
              className="py-3 px-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              How To Play
            </button>

            <button
              onClick={() => {
                soundEngine.playUiClick();
                setShowSettings(true);
              }}
              className="py-3 px-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4 text-sky-400" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Credits & Hotkey Hints */}
      <div className="relative z-10 flex flex-wrap items-center justify-between text-xs text-zinc-500 font-mono pt-6 border-t border-zinc-900">
        <span>WASD Move · Shift Sprint · E Interact · P Phone · M Map · Space Horn</span>
        <span>Built for Desktop & Mobile Browser</span>
      </div>

      {/* HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-zinc-950 border-2 border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-black text-amber-400">HOW TO PLAY · SURVIVING KANAIRO</h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-zinc-400 hover:text-white text-xs bg-zinc-800 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-sans max-h-96 overflow-y-auto pr-1">
              <p>
                <strong>1. STARTING OUT:</strong> You arrive in Kayole with only <span className="text-emerald-400 font-bold">Ksh 200</span>. Talk to Jemo and Achieng at the kibandaski to earn your first cash.
              </p>
              <p>
                <strong>2. SURVIVAL & RENT:</strong> You have 7 days to pay <span className="text-amber-400 font-bold">Ksh 2,500</span> rent to Mama Caro. Watch your hunger meter—eat chapo madondo or ugali nyama to keep your stamina high.
              </p>
              <p>
                <strong>3. VEHICLES & NGANYA:</strong> Walk near any Matatu or Boda and press <strong>[E]</strong> to drive. Stop at stages to collect fares of <span className="text-emerald-400 font-bold">Ksh 70</span> per passenger! Press <strong>[SPACE]</strong> to honk custom Nairobi horns.
              </p>
              <p>
                <strong>4. HEAT & POLICE:</strong> Don't let Police Heat reach 80+. If sirens start blaring, duck into alleys, pay bail at the police post, or change into a hoodie.
              </p>
              <p>
                <strong>5. CAREER PATHS:</strong> Reach Mission 10 to pick your destiny: Legit Business, Matatu Hustler, Street Crew Kingpin, or DCI Undercover Agent!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-950 border-2 border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-black text-sky-400">SETTINGS</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-zinc-400 hover:text-white text-xs bg-zinc-800 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl">
                <span>Sound Synthesizer Audio</span>
                <button
                  onClick={handleToggleMute}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  {isMuted ? 'Muted' : 'Enabled'}
                </button>
              </div>
              <div className="p-3 bg-zinc-900 rounded-xl space-y-1 text-zinc-400 text-[11px]">
                <div className="font-bold text-zinc-200">Developer Hotkeys:</div>
                <div>F1 = +Ksh 10k · F2 = +10 Cred · F3 = -20 Heat</div>
                <div>F4 = Kayole · F5 = CBD · F6 = +3 Hours · F7 = Win Mission</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
