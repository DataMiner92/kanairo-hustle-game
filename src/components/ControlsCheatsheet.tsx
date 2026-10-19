import React from 'react';
import { X, Keyboard, Compass, ShieldAlert, Award, Car, User, Smartphone, CloudRain, MousePointerClick } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsCheatsheet: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const keyGroups = [
    {
      title: 'Mouse Keystrokes & Controls',
      icon: <MousePointerClick className="w-4 h-4 text-cyan-400" />,
      items: [
        { key: 'Left Click (Ground)', desc: 'Set Holographic Waypoint & Move (Click-to-Move navigation)' },
        { key: 'Double Left Click', desc: 'Sprint / Fast Dash to Clicked Target (Uses Energy)' },
        { key: 'Left Click (Entity)', desc: 'Direct Action (Talk to NPC, Board Vehicle, Enter Shop)' },
        { key: 'Right Click', desc: 'Matatu Fanfare Horn (vehicle) / Nairobi Sheng Greet & Shout (foot)' },
        { key: 'Right / Middle Drag', desc: '360° Free Camera Orbit & Pitch Angle View Rotation' },
        { key: 'Mouse Wheel Scroll', desc: 'Dynamic Camera Zoom In / Zoom Out (0.5x - 2.2x)' },
        { key: 'Middle Click (Wheel)', desc: 'Instant Reset Camera Orbit & Zoom to Default' },
      ],
    },
    {
      title: 'Movement & Physics',
      icon: <User className="w-4 h-4 text-emerald-400" />,
      items: [
        { key: 'W / A / S / D', desc: 'Walk / Run / Steer Vehicle' },
        { key: 'SHIFT', desc: 'Sprint (on foot) / Turbo Boost (in vehicle)' },
        { key: 'SPACE', desc: 'Jump into the air (foot) / Handbrake & Horn (vehicle)' },
      ],
    },
    {
      title: 'Interactions & World',
      icon: <Car className="w-4 h-4 text-amber-400" />,
      items: [
        { key: 'E', desc: 'Interact (Talk to NPCs, Shop Kibandaski, Sleep in Bedsitter)' },
        { key: 'F', desc: 'Enter / Exit Vehicle (Matatu, Boda, Cars)' },
        { key: 'H', desc: 'Matatu Fanfare Horn / Street Sheng Shout ("Wewe toka kwa njia!")' },
        { key: 'B', desc: 'Fast Bribe Police / Clear Wanted Heat (Costs Ksh 400)' },
      ],
    },
    {
      title: '3D Views & Customization',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      items: [
        { key: 'C', desc: 'Cycle Camera (3rd Person, Isometric 3D RPG, 1st Person, Cinematic)' },
        { key: 'V', desc: 'Switch Avatar Outfit (Streetwear, Boda Rider, Matatu Tout, Undercover, Boss)' },
        { key: 'T', desc: 'Toggle Dynamic Weather (☀️ Sunny, ⛅ Cloudy, 🌧️ Nairobi Rain)' },
      ],
    },
    {
      title: 'Phone & Management',
      icon: <Smartphone className="w-4 h-4 text-violet-400" />,
      items: [
        { key: 'P', desc: 'Open Smartphone (M-Pesa Wallet, Missions, Contacts, GPS, Stats)' },
        { key: 'M', desc: 'Open Nairobi City GPS Map Hologram' },
        { key: 'Y', desc: 'Radio Mtaa AI Voice Assistant (gemini-3.8-live real-time copilot)' },
        { key: 'TAB', desc: 'Toggle this Controls & Commands Cheatsheet' },
        { key: 'ESC', desc: 'Pause / Main Menu' },
      ],
    },
    {
      title: 'Developer Shortcuts',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      items: [
        { key: 'F1 / F2', desc: '+Ksh 10,000 M-Pesa / +10 Street Cred' },
        { key: 'F3', desc: '-20 Police Heat' },
        { key: 'F4 / F5', desc: 'Teleport to Kayole / Teleport to CBD' },
        { key: 'F6 / F7', desc: 'Advance Time +3 hrs / Complete Active Mission' },
        { key: 'F8', desc: 'Toggle Weather Cycle' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Keyboard Command Controls & 3D Guide</h2>
              <p className="text-xs text-neutral-400">Kanairo: Mtaa Hustle — Complete Nairobi Street Controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyGroups.map((group, idx) => (
              <div
                key={idx}
                className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 flex flex-col gap-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300 pb-1 border-b border-neutral-800/60">
                  {group.icon}
                  <span>{group.title}</span>
                </div>
                <div className="space-y-2">
                  {group.items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-xs">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700/60 shrink-0">
                        {item.key}
                      </span>
                      <span className="text-neutral-300 text-right">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Nairobi Street Hustle Pro Tips */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span>💡 Nairobi Street Hustler Pro-Tips</span>
            </div>
            <p>
              • <strong>Rainy Weather:</strong> Matatu & boda fares surge during Nairobi downpours! Carry passengers from Kayole Stage to CBD for high cash rewards.
            </p>
            <p>
              • <strong>Bedsitter Rest:</strong> Sleep in your bedsitter (Plot 42) by pressing [E] near the door to restore 100% energy, reduce police heat, and auto-save your game!
            </p>
            <p>
              • <strong>Camera Modes:</strong> Press [C] anytime to cycle between Over-the-shoulder 3rd Person, angled Isometric 3D RPG view, or 1st Person street view.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/50 flex justify-between items-center text-xs text-neutral-400">
          <span>Press [TAB] or [ESC] anytime to return to the game</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Got it, Let's Hustle!
          </button>
        </div>
      </div>
    </div>
  );
};
