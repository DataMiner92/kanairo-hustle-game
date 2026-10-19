import React, { useState } from 'react';
import { CameraMode, AvatarOutfit, WeatherType } from '../types';
import {
  Camera,
  Shirt,
  CloudRain,
  Sun,
  Cloud,
  Volume2,
  HelpCircle,
  Smartphone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Car,
  User,
  Radio,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  cameraMode: CameraMode;
  onSelectCamera: (mode: CameraMode) => void;
  avatarOutfit: AvatarOutfit;
  onSelectOutfit: (outfit: AvatarOutfit) => void;
  weather: WeatherType;
  onToggleWeather: () => void;
  onHonk: () => void;
  onOpenPhone: () => void;
  onOpenMap: () => void;
  onToggleCheatsheet: () => void;
  onOpenVoiceAssistant: () => void;
  isInVehicle: boolean;
}

export const BottomDock: React.FC<Props> = ({
  cameraMode,
  onSelectCamera,
  avatarOutfit,
  onSelectOutfit,
  weather,
  onToggleWeather,
  onHonk,
  onOpenPhone,
  onOpenMap,
  onToggleCheatsheet,
  onOpenVoiceAssistant,
  isInVehicle,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const cameraOptions: { id: CameraMode; label: string; icon: string }[] = [
    { id: 'THIRD_PERSON', label: '3rd Person', icon: '🎥' },
    { id: 'ISOMETRIC', label: 'Isometric 3D', icon: '📐' },
    { id: 'FIRST_PERSON', label: '1st Person', icon: '👁️' },
    { id: 'CINEMATIC', label: 'Cinematic', icon: '🎬' },
  ];

  const outfitOptions: { id: AvatarOutfit; label: string; icon: string }[] = [
    { id: 'STREETWEAR', label: 'Mtaa Street', icon: '🧢' },
    { id: 'BODA', label: 'Boda Rider', icon: '🏍️' },
    { id: 'MATATU_TOUT', label: 'Matatu Tout', icon: '🦺' },
    { id: 'UNDERCOVER', label: 'Undercover', icon: '🕶️' },
    { id: 'SMART_HUSTLER', label: 'Boss Hustler', icon: '👔' },
  ];

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 ease-out ${
        isCollapsed ? 'bottom-0 translate-y-[calc(100%-28px)]' : 'bottom-4'
      }`}
      style={{ maxWidth: 'min(980px, 96vw)' }}
    >
      {/* Collapse / Expand Tab Handle */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-neutral-900/90 text-neutral-300 hover:text-white border border-neutral-700/80 px-4 py-1 rounded-t-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-lg backdrop-blur-sm cursor-pointer select-none"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Show 3D Dock [H]</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Cinema Mode [H]</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Horizontal Dock */}
      <div className="bg-neutral-950/90 border border-neutral-800 text-white rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left Section: Camera Mode Pills */}
        <div className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800/80">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-2 flex items-center gap-1">
            <Camera className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Cam [C]</span>
          </span>
          {cameraOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                soundEngine.playUiClick();
                onSelectCamera(opt.id);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                cameraMode === opt.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span>{opt.icon}</span>
              <span className="hidden md:inline">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Center Section: Avatar Outfits */}
        <div className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800/80">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-2 flex items-center gap-1">
            <Shirt className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Outfit [V]</span>
          </span>
          {outfitOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                soundEngine.playUiClick();
                onSelectOutfit(opt.id);
              }}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                avatarOutfit === opt.id
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span>{opt.icon}</span>
              <span className="hidden lg:inline">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Right Section: Weather & Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* Weather Toggle */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onToggleWeather();
            }}
            title="Toggle Weather [T]"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-semibold text-neutral-200 transition-all cursor-pointer"
          >
            {weather === 'RAINY' ? (
              <>
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-400">Rainy [T]</span>
              </>
            ) : weather === 'CLOUDY' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-300">Cloudy [T]</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">Sunny [T]</span>
              </>
            )}
          </button>

          {/* Radio Mtaa Voice Assistant Button */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onOpenVoiceAssistant();
            }}
            title="Open Radio Mtaa Live Voice Assistant [Y]"
            className="px-2.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-400/40 shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">Radio Mtaa [Y]</span>
          </button>

          {/* Horn / Shout Button */}
          <button
            onClick={() => {
              onHonk();
            }}
            title={isInVehicle ? 'Matatu Fanfare Horn [H]' : 'Shout Street Sheng [H]'}
            className="px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isInVehicle ? 'Horn [H]' : 'Shout [H]'}</span>
          </button>

          {/* Quick Cheatsheet Help */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onToggleCheatsheet();
            }}
            title="Keyboard Commands [TAB]"
            className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Controls [TAB]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
