import React from 'react';
import { soundEngine } from '../audio/soundEngine';
import { X, Wrench, FastForward, DollarSign, Award, Shield, Compass, CheckCircle, CloudRain } from 'lucide-react';
import { WeatherType } from '../types';

interface Props {
  weather: WeatherType;
  onToggleWeather: () => void;
  onAddMoney: () => void;
  onAddCred: () => void;
  onReduceHeat: () => void;
  onTeleportKayole: () => void;
  onTeleportCbd: () => void;
  onAdvanceTime: () => void;
  onCompleteMission: () => void;
  onClose: () => void;
}

export const DebugMenu: React.FC<Props> = ({
  weather,
  onToggleWeather,
  onAddMoney,
  onAddCred,
  onReduceHeat,
  onTeleportKayole,
  onTeleportCbd,
  onAdvanceTime,
  onCompleteMission,
  onClose,
}) => {
  return (
    <div className="fixed top-16 right-4 z-50 w-72 bg-zinc-950/95 border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl font-mono text-xs select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
        <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
          <Wrench className="w-4 h-4" />
          <span>DEV SHORTCUTS (F1-F7)</span>
        </span>
        <button
          onClick={() => {
            soundEngine.playUiClick();
            onClose();
          }}
          className="text-zinc-500 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => {
            soundEngine.playUiClick();
            onAddMoney();
          }}
          className="w-full py-1.5 px-2.5 bg-zinc-900 hover:bg-emerald-950/80 border border-zinc-800 hover:border-emerald-500 text-zinc-200 rounded-lg flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-emerald-400">
            <DollarSign className="w-3.5 h-3.5" />
            +Ksh 10,000 Cash
          </span>
          <kbd className="bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded text-zinc-400">F1</kbd>
        </button>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onAddCred();
          }}
          className="w-full py-1.5 px-2.5 bg-zinc-900 hover:bg-amber-950/80 border border-zinc-800 hover:border-amber-500 text-zinc-200 rounded-lg flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-amber-400">
            <Award className="w-3.5 h-3.5" />
            +10 Street Cred
          </span>
          <kbd className="bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded text-zinc-400">F2</kbd>
        </button>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onReduceHeat();
          }}
          className="w-full py-1.5 px-2.5 bg-zinc-900 hover:bg-sky-950/80 border border-zinc-800 hover:border-sky-500 text-zinc-200 rounded-lg flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-sky-400">
            <Shield className="w-3.5 h-3.5" />
            -20 Police Heat
          </span>
          <kbd className="bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded text-zinc-400">F3</kbd>
        </button>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onTeleportKayole();
          }}
          className="w-full py-1.5 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Compass className="w-3.5 h-3.5" />
            Teleport: Kayole
          </span>
          <kbd className="bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded text-zinc-400">F4</kbd>
        </button>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onTeleportCbd();
          }}
          className="w-full py-1.5 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Compass className="w-3.5 h-3.5" />
            Teleport: CBD
          </span>
          <kbd className="bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded text-zinc-400">F5</kbd>
        </button>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onAdvanceTime();
          }}
          className="w-full py-1.5 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-zinc-300">
            <FastForward className="w-3.5 h-3.5" />
            Advance 3 Hours
          </span>
          <kbd className="bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded text-zinc-400">F6</kbd>
        </button>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onCompleteMission();
          }}
          className="w-full py-1.5 px-2.5 bg-zinc-900 hover:bg-emerald-950/80 border border-zinc-800 hover:border-emerald-500 text-zinc-200 rounded-lg flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            Complete Mission
          </span>
          <kbd className="bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded text-zinc-400">F7</kbd>
        </button>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onToggleWeather();
          }}
          className="w-full py-1.5 px-2.5 bg-zinc-900 hover:bg-sky-950/80 border border-zinc-800 hover:border-sky-500 text-zinc-200 rounded-lg flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-sky-400">
            <CloudRain className="w-3.5 h-3.5" />
            Weather: {weather}
          </span>
          <kbd className="bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded text-zinc-400">F8</kbd>
        </button>
      </div>
    </div>
  );
};
