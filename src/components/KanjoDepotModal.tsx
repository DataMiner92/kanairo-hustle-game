import React from 'react';
import { Building, ShieldCheck, X, FileText, MapPin, DollarSign, Award, AlertTriangle } from 'lucide-react';
import { PlayerStats } from '../types';
import { RESTRICTED_HUSTLE_ZONES } from '../data/zones';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
}

export const KanjoDepotModal: React.FC<Props> = ({
  isOpen,
  onClose,
  stats,
  setStats,
}) => {
  if (!isOpen) return null;

  const permitCost = 600;
  const canAffordPermit = stats.money >= permitCost;
  const hasPermit = Boolean(stats.hasCountyPermit);
  const bailCost = 400;
  const canAffordBail = stats.money >= bailCost;

  const handleBuyPermit = () => {
    if (!canAffordPermit) return;
    soundEngine.playCashRegister();
    setStats((prev) => ({
      ...prev,
      money: prev.money - permitCost,
      hasCountyPermit: true,
      countyPermitDaysLeft: 7,
      streetCred: Math.min(100, prev.streetCred + 15),
      policeHeat: 0,
    }));
  };

  const handleClearBail = () => {
    if (!canAffordBail) return;
    soundEngine.playCashRegister();
    setStats((prev) => ({
      ...prev,
      money: prev.money - bailCost,
      policeHeat: 0,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Nairobi City County Enforcement Depot</h2>
              <p className="text-xs text-neutral-400">Licensing, Street Trading Permits & Impound Yard</p>
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Licensing Card */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                  Official City Certification
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Nairobi County Street Traders & Hawkers Permit</span>
                  {hasPermit && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/40 font-mono">
                      ACTIVE (7 Days)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-300">
                  Authorizes legitimate trading across CBD streets. Provides full immunity against Kanjo Officer street raids and confiscation!
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-black text-amber-400">Ksh 600</div>
                <div className="text-[10px] text-neutral-400">Valid 7 in-game days</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Kanjo Immunity</span>
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Award className="w-4 h-4" />
                  <span>+15 Street Cred</span>
                </span>
              </div>

              {hasPermit ? (
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Certified Trader</span>
                </div>
              ) : (
                <button
                  onClick={handleBuyPermit}
                  disabled={!canAffordPermit}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    canAffordPermit
                      ? 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer shadow-lg shadow-amber-500/20'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Purchase Permit (Ksh 600)</span>
                </button>
              )}
            </div>
          </div>

          {/* Clear Wanted Heat / Impound Bail */}
          {stats.policeHeat > 0 && (
            <div className="bg-neutral-900/60 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Settle County Heat & Warrants</div>
                  <div className="text-xs text-neutral-400">
                    Clear active wanted level ({stats.policeHeat}%) and release impounded items.
                  </div>
                </div>
              </div>
              <button
                onClick={handleClearBail}
                disabled={!canAffordBail}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  canAffordBail
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                Pay Bail (Ksh 400)
              </button>
            </div>
          )}

          {/* Restricted Zones Directory */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Restricted Hustling Zones under Active Enforcement</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {RESTRICTED_HUSTLE_ZONES.map((zone) => (
                <div
                  key={zone.id}
                  className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{zone.name}</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Risk: {zone.riskFactor}/5
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">{zone.shengName}</div>
                  <div className="text-[11px] text-neutral-300 leading-snug">{zone.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
