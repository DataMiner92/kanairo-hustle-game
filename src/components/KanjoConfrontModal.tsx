import React from 'react';
import { ShieldAlert, DollarSign, Award, Wind, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { PlayerStats } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  onEscape: () => void;
  zoneName?: string;
}

export const KanjoConfrontModal: React.FC<Props> = ({
  isOpen,
  onClose,
  stats,
  setStats,
  onEscape,
  zoneName = 'CBD Restricted Vending Zone',
}) => {
  if (!isOpen) return null;

  const canBribe = stats.money >= 250;
  const canPayFine = stats.money >= 350;
  const canEscape = stats.energy >= 25;
  const hasPermit = Boolean(stats.hasCountyPermit);

  const handleBribe = () => {
    if (!canBribe) return;
    soundEngine.playCashRegister();
    setStats((prev) => ({
      ...prev,
      money: Math.max(0, prev.money - 250),
      policeHeat: Math.max(0, prev.policeHeat - 20),
    }));
    onClose();
  };

  const handleShowPermit = () => {
    soundEngine.playUiClick();
    setStats((prev) => ({
      ...prev,
      streetCred: Math.min(100, prev.streetCred + 5),
      policeHeat: 0,
    }));
    onClose();
  };

  const handlePayOfficialFine = () => {
    if (!canPayFine) return;
    soundEngine.playCashRegister();
    setStats((prev) => ({
      ...prev,
      money: Math.max(0, prev.money - 350),
      policeHeat: 0,
    }));
    onClose();
  };

  const handleSurrender = () => {
    soundEngine.playCollision();
    setStats((prev) => ({
      ...prev,
      money: Math.max(0, prev.money - 150),
      policeHeat: 5,
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-950 border-2 border-amber-500/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-white">
        {/* Header with High-Vis County Theme */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-4 text-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/20 rounded-2xl">
              <ShieldAlert className="w-7 h-7 text-black" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-black/75">
                Nairobi City County Enforcement
              </div>
              <h2 className="text-xl font-black tracking-tight leading-tight">
                KANJO AMBUSH! — OFFICER MUTUA
              </h2>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-black text-amber-400 font-mono text-xs font-black rounded-lg">
            CRACKDOWN
          </span>
        </div>

        {/* Content & Dialogue */}
        <div className="p-6 space-y-5">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>Location: {zoneName}</span>
            </div>
            <p className="text-sm text-neutral-200 italic leading-relaxed">
              &quot;Simama hapo kijana! Sheria ya Kaunti ya Nairobi Kata Namba 14 inakataza kupiga biashara na
              street hawking hapa bila leseni halali. Mzigo wako wote unakwenda kwa pickup ya City Hall mara moja!&quot;
            </p>
          </div>

          {/* Action Choices */}
          <div className="space-y-2.5">
            {/* 1. Show Official Permit (Best option if purchased) */}
            {hasPermit ? (
              <button
                onClick={handleShowPermit}
                className="w-full flex items-center justify-between p-3.5 bg-emerald-950/70 hover:bg-emerald-900/80 border-2 border-emerald-500 rounded-2xl transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-emerald-300">
                      Onyesha County Hawkers Permit
                    </div>
                    <div className="text-[11px] text-emerald-200/70">
                      Leseni yako ni halali! (+5 Cred, zero faini, zero heat)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black bg-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg">
                  VALID
                </span>
              </button>
            ) : null}

            {/* 2. Lipa Kitu Kidogo (Bribe) */}
            <button
              onClick={handleBribe}
              disabled={!canBribe}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                canBribe
                  ? 'bg-neutral-900 hover:bg-neutral-800/90 border-amber-500/50 hover:border-amber-400 cursor-pointer'
                  : 'bg-neutral-900/40 border-neutral-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    Lipa &quot;Kitu Kidogo&quot; (Chai ya Asubuhi)
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Settle quietly with the askari. Keeps goods & resets heat.
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-amber-400 text-sm">
                  -Ksh 250
                </span>
              </div>
            </button>

            {/* 3. Chomoka na Mbio (Sprint Escape) */}
            <button
              onClick={() => {
                onClose();
                onEscape();
              }}
              disabled={!canEscape}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                canEscape
                  ? 'bg-neutral-900 hover:bg-neutral-800/90 border-cyan-500/50 hover:border-cyan-400 cursor-pointer'
                  : 'bg-neutral-900/40 border-neutral-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    Chomoka kwa Chochoro! (Sprint Escape)
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Push past askari into alleys (+15 Heat, costs 25 Energy)
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-cyan-400 text-xs">
                  -25 NRG
                </span>
              </div>
            </button>

            {/* 4. Official Fine */}
            <button
              onClick={handlePayOfficialFine}
              disabled={!canPayFine}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                canPayFine
                  ? 'bg-neutral-900 hover:bg-neutral-800/90 border-neutral-700 hover:border-neutral-600 cursor-pointer'
                  : 'bg-neutral-900/40 border-neutral-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-800 text-neutral-300 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    Lipa Faini Rasmi (County Court Receipt)
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Official town hall penalty. Clears all wanted heat.
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-rose-400 text-sm">
                  -Ksh 350
                </span>
              </div>
            </button>

            {/* 5. Surrender & Confiscate */}
            <button
              onClick={handleSurrender}
              className="w-full text-center py-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Salimika & Chukua Mzigo (Lose Ksh 150 / Escorted away)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
