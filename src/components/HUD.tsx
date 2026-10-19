import React from 'react';
import { PlayerStats, Mission, WeatherType, RestrictedZone } from '../types';
import {
  Smartphone,
  Map as MapIcon,
  Volume2,
  VolumeX,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Award,
  Clock,
  DollarSign,
  Utensils,
  Zap,
  Heart,
  Sun,
  Cloud,
  CloudRain,
  Target,
  Radio,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  stats: PlayerStats;
  clock: { day: number; hour: number; minute: number };
  weather: WeatherType;
  onToggleWeather?: () => void;
  activeMission: Mission | null;
  onOpenPhone: () => void;
  onOpenMap: () => void;
  onOpenVoiceAssistant?: () => void;
  onToggleDebug: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  restrictedZone?: RestrictedZone | null;
  kanjoAlert?: { state: string; suspicion: number; dist: number } | null;
}

export const HUD: React.FC<Props> = ({
  stats,
  clock,
  weather,
  onToggleWeather,
  activeMission,
  onOpenPhone,
  onOpenMap,
  onOpenVoiceAssistant,
  onToggleDebug,
  isMuted,
  onToggleMute,
  restrictedZone,
  kanjoAlert,
}) => {
  const getCredRank = (cred: number): { label: string; color: string } => {
    if (cred >= 80) return { label: 'LEGEND', color: 'text-amber-400' };
    if (cred >= 60) return { label: 'BIG MAN', color: 'text-purple-400' };
    if (cred >= 40) return { label: 'WA MTAA', color: 'text-blue-400' };
    if (cred >= 20) return { label: 'KNOWN FACE', color: 'text-emerald-400' };
    return { label: 'NOBODY', color: 'text-neutral-400' };
  };

  const getHeatTier = (heat: number): { label: string; color: string; stars: number } => {
    if (heat >= 80) return { label: 'PURSUIT', color: 'text-red-500', stars: 5 };
    if (heat >= 60) return { label: 'SEARCH', color: 'text-orange-500', stars: 4 };
    if (heat >= 40) return { label: 'WANTED', color: 'text-amber-400', stars: 3 };
    if (heat >= 20) return { label: 'SUSPICIOUS', color: 'text-yellow-300', stars: 2 };
    return { label: 'NORMAL', color: 'text-emerald-400', stars: 1 };
  };

  const credRank = getCredRank(stats.streetCred);
  const heatTier = getHeatTier(stats.policeHeat);

  const formatTime = (h: number, m: number) => {
    const padH = h.toString().padStart(2, '0');
    const padM = m.toString().padStart(2, '0');
    return `${padH}:${padM}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none font-sans z-20">
      {/* TOP ROW: Money, Active Objective, Street Cred, Heat, Clock & Utility Buttons */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left Cluster: M-Pesa Balance & Active Mission */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* M-Pesa Cash */}
          <div className="bg-neutral-950/95 border border-emerald-500/60 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="p-2 bg-emerald-950 rounded-xl text-emerald-400 border border-emerald-500/40">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">M-Pesa Balance</div>
              <div className="text-lg font-black text-emerald-400 tracking-tight tabular-nums">
                Ksh {stats.money.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Active Objective Compact Banner */}
          {activeMission && (
            <div className="bg-neutral-950/95 border border-amber-500/40 px-3.5 py-2 rounded-2xl shadow-xl max-w-sm space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3 h-3 text-amber-400" />
                  <span>{activeMission.title}</span>
                </span>
                <span className="text-emerald-400 font-mono font-bold text-xs">
                  +Ksh {activeMission.rewardMoney.toLocaleString()}
                </span>
              </div>
              <p className="text-neutral-300 text-xs font-medium line-clamp-2">
                {activeMission.objective}
              </p>
            </div>
          )}
        </div>

        {/* Right Cluster: Cred, Heat, Time, Weather, Phone & Mute */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {/* Street Cred */}
          <div className="bg-neutral-950/95 border border-neutral-800 px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Cred: {stats.streetCred}</span>
                <span className={`text-[10px] font-black ${credRank.color}`}>{credRank.label}</span>
              </div>
              <div className="w-20 h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, stats.streetCred)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Police Heat */}
          <div className="bg-neutral-950/95 border border-neutral-800 px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2">
            <ShieldAlert className={`w-4 h-4 ${heatTier.color}`} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Heat: {stats.policeHeat}</span>
                <span className={`text-[10px] font-black ${heatTier.color}`}>{heatTier.label}</span>
              </div>
              <div className="flex gap-1 mt-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`w-3 h-1.5 rounded-xs transition-colors ${
                      s <= heatTier.stars ? 'bg-red-500' : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Time & Day */}
          <div className="bg-neutral-950/95 border border-neutral-800 px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <div className="text-right">
              <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">
                DAY {clock.day.toString().padStart(2, '0')}
              </span>
              <div className="text-xs font-mono font-bold text-sky-300">{formatTime(clock.hour, clock.minute)}</div>
            </div>
          </div>

          {/* Weather Status */}
          <button
            onClick={() => {
              if (onToggleWeather) {
                soundEngine.playUiClick();
                onToggleWeather();
              }
            }}
            title="Toggle Weather [T]"
            className="bg-neutral-950/95 hover:bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            {weather === 'SUNNY' && <Sun className="w-4 h-4 text-amber-400" />}
            {weather === 'CLOUDY' && <Cloud className="w-4 h-4 text-neutral-300" />}
            {weather === 'RAINY' && <CloudRain className="w-4 h-4 text-sky-400" />}
            <span
              className={`text-xs font-bold ${
                weather === 'SUNNY'
                  ? 'text-amber-300'
                  : weather === 'CLOUDY'
                  ? 'text-neutral-200'
                  : 'text-sky-300'
              }`}
            >
              {weather === 'SUNNY' ? 'Sunny' : weather === 'CLOUDY' ? 'Cloudy' : 'Rain'}
            </span>
          </button>

          {/* Smartphone Button */}
          <button
            onClick={onOpenPhone}
            title="Open Smartphone (P)"
            className="p-2.5 bg-neutral-900/95 hover:bg-emerald-950 border border-neutral-700 hover:border-emerald-500 rounded-2xl text-neutral-200 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Map Button */}
          <button
            onClick={onOpenMap}
            title="Open Map (M)"
            className="p-2.5 bg-neutral-900/95 hover:bg-sky-950 border border-neutral-700 hover:border-sky-500 rounded-2xl text-neutral-200 hover:text-sky-300 transition-colors cursor-pointer"
          >
            <MapIcon className="w-4 h-4" />
          </button>

          {/* Radio Mtaa Voice Assistant Button */}
          {onOpenVoiceAssistant && (
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenVoiceAssistant();
              }}
              title="Radio Mtaa Voice Assistant (Y)"
              className="p-2.5 bg-emerald-950/95 hover:bg-emerald-900 border border-emerald-500/60 rounded-2xl text-emerald-300 hover:text-white transition-colors cursor-pointer shadow-sm"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Audio Mute Button */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2.5 bg-neutral-900/95 hover:bg-neutral-800 border border-neutral-700 rounded-2xl text-neutral-200 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Dev Debug Button */}
          <button
            onClick={onToggleDebug}
            title="Dev Shortcuts (F1-F8)"
            className="px-2.5 py-2 bg-neutral-900/95 hover:bg-neutral-800 border border-neutral-700 rounded-2xl text-[10px] font-mono text-neutral-400 font-bold cursor-pointer"
          >
            DEV
          </button>
        </div>
      </div>

      {/* RESTRICTED ZONE, KANJO ALERT & POLICE SIREN RADAR BAR */}
      {(restrictedZone || (kanjoAlert && kanjoAlert.dist < 500) || stats.policeHeat >= 50) && (
        <div className="flex flex-col items-center gap-1.5 pointer-events-none mt-2 animate-in fade-in zoom-in-95 duration-150">
          {/* Restricted Zone Status Pill */}
          {restrictedZone && (
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold backdrop-blur-md shadow-xl border pointer-events-auto transition-all ${
                stats.hasCountyPermit
                  ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300'
                  : 'bg-amber-950/95 border-amber-500/90 text-amber-300 animate-pulse'
              }`}
            >
              {stats.hasCountyPermit ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>
                {restrictedZone.name} —{' '}
                {stats.hasCountyPermit
                  ? 'County Permit Active (Legal Trader)'
                  : '⚠️ Restricted Vending (Kanjo Active)'}
              </span>
            </div>
          )}

          {/* Kanjo Nearby Alert & Suspicion Meter */}
          {kanjoAlert && kanjoAlert.dist < 450 && (
            <div
              className={`flex items-center gap-2.5 px-3.5 py-1 rounded-2xl text-xs font-bold backdrop-blur-md shadow-xl border pointer-events-auto transition-all ${
                kanjoAlert.state === 'PURSUIT'
                  ? 'bg-red-950/95 border-red-500 text-white animate-bounce shadow-red-500/20'
                  : 'bg-neutral-950/90 border-amber-500/70 text-amber-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${kanjoAlert.state === 'PURSUIT' ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`} />
              <span>
                {kanjoAlert.state === 'PURSUIT'
                  ? '🚨 KANJO PURSUIT! ESCAPE LINE OF SIGHT!'
                  : `Officer Mutua Nearby (~${Math.round(kanjoAlert.dist / 10)}m)`}
              </span>
              {kanjoAlert.suspicion > 0 && kanjoAlert.state !== 'PURSUIT' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-neutral-400 font-mono">Suspicion</span>
                  <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-150"
                      style={{ width: `${Math.min(100, kanjoAlert.suspicion)}%` }}
                    />
                  </div>
                </div>
              )}
              {/* Visual Siren Active Audio Indicator */}
              {(kanjoAlert.state === 'PURSUIT' || kanjoAlert.dist <= 350 || stats.policeHeat >= 50) && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-red-500/40 text-[10px] text-red-400 font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                  <span>SIREN</span>
                  <div className="flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 h-2 bg-red-400 animate-pulse" />
                    <span className="w-0.5 h-3 bg-red-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 h-1.5 bg-red-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* High Heat Police Siren Banner (when not already shown by Kanjo alert) */}
          {stats.policeHeat >= 50 && (!kanjoAlert || kanjoAlert.dist >= 450) && (
            <div className="flex items-center gap-2.5 px-3.5 py-1 rounded-2xl text-xs font-bold backdrop-blur-md shadow-xl border border-red-500 bg-red-950/95 text-white animate-bounce shadow-red-500/20 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              <span>🚨 POLICE PURSUIT ACTIVE — EVADE PATROLS!</span>
              <div className="flex items-center gap-1.5 pl-2 border-l border-red-500/40 text-[10px] text-red-300 font-mono font-bold">
                <span>SIREN</span>
                <div className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 h-2 bg-red-400 animate-pulse" />
                  <span className="w-0.5 h-3 bg-red-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-1.5 bg-red-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM ROW: Vitals Dial (Health, Hunger, Energy) on Left; Center kept unobstructed for 3D Dock */}
      <div className="flex items-end justify-between pointer-events-none mb-16 sm:mb-20">
        <div className="pointer-events-auto bg-neutral-950/95 border border-neutral-800 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-4">
          {/* Health */}
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
            <div>
              <div className="text-[9px] text-neutral-400 font-bold uppercase">Health</div>
              <div className="w-16 h-2 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${stats.health}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-300 tabular-nums">{stats.health}</span>
          </div>

          {/* Hunger */}
          <div className="flex items-center gap-1.5 border-l border-neutral-800 pl-3">
            <Utensils className="w-3.5 h-3.5 text-amber-500" />
            <div>
              <div className="text-[9px] text-neutral-400 font-bold uppercase">Hunger</div>
              <div className="w-16 h-2 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    stats.hunger <= 20 ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${stats.hunger}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-300 tabular-nums">{stats.hunger}%</span>
          </div>

          {/* Energy */}
          <div className="flex items-center gap-1.5 border-l border-neutral-800 pl-3">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <div>
              <div className="text-[9px] text-neutral-400 font-bold uppercase">Energy</div>
              <div className="w-16 h-2 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${stats.energy}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-300 tabular-nums">
              {Math.round(stats.energy)}%
            </span>
          </div>
        </div>

        {/* Quick Cheatsheet Key Callout on Right */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-neutral-950/90 border border-neutral-800 px-3 py-1.5 rounded-2xl text-xs font-mono text-neutral-300 shadow-lg">
          <span className="text-amber-400 font-bold">[TAB]</span>
          <span>Controls & 3D Guide</span>
        </div>
      </div>
    </div>
  );
};
