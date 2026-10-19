import React from 'react';
import { PlayerStats, CareerPath } from '../types';
import { soundEngine } from '../audio/soundEngine';
import { Trophy, AlertOctagon, RefreshCw, Award, DollarSign, ShieldAlert, Check } from 'lucide-react';

interface Props {
  type: 'LEGIT_SUCCESS' | 'STREET_KINGPIN' | 'MATATU_BOSS' | 'DCI_SUCCESS' | 'BURNED';
  stats: PlayerStats;
  completedCount: number;
  onRestart: () => void;
  onContinue: () => void;
}

export const GameOverModal: React.FC<Props> = ({ type, stats, completedCount, onRestart, onContinue }) => {
  const isVictory = type !== 'BURNED';

  const getEndingDetails = () => {
    switch (type) {
      case 'LEGIT_SUCCESS':
        return {
          title: 'LEGITIMATE EMPIRE: BAZUU WA BIASHARA',
          tagline: 'From Ksh 200 in a Kayole bedsitter to a registered Kenyan corporate titan.',
          description:
            'You proved that honest grit, sharp intellect, and disciplined trading conquer Nairobi. You own multiple storefronts along Tom Mboya Street, employ 18 youth from Kayole, and sleep with zero police heat.',
          badgeColor: 'border-emerald-500 bg-emerald-950/80 text-emerald-300',
        };
      case 'STREET_KINGPIN':
        return {
          title: 'STREET KINGPIN: SIMBA WA NAIROBI',
          tagline: 'You rule the backstreets, stages, and underground networks of Kanairo.',
          description:
            'Nobody makes a move from Kayole to River Road without your sign-off. Your pockets overflow with millions of shillings and the street sings your name, though your eyes always watch the rear-view mirror.',
          badgeColor: 'border-purple-500 bg-purple-950/80 text-purple-300',
        };
      case 'MATATU_BOSS':
        return {
          title: 'ROUTE 19 BOSS: MATATU FLEET TYCOON',
          tagline: 'The undisputed monarch of Nairobi’s iconic Nganya culture.',
          description:
            'Your fleet of custom neon-lit matatus dominates Jogoo Road and CBD terminals. With deafening subwoofers, legendary graffiti, and hundreds of loyal touts, you dictate transit fares across the entire city.',
          badgeColor: 'border-amber-500 bg-amber-950/80 text-amber-300',
        };
      case 'DCI_SUCCESS':
        return {
          title: 'SPECIAL OPERATIVE: CITY SHADOW CLEANSER',
          tagline: 'Inspector K’s premier confidential undercover triumph.',
          description:
            'Under the guise of a humble street hustler, you dismantled dangerous fuel cartels, brought down rogue extortion syndicates, and brought order to Nairobi with the backing of state headquarters.',
          badgeColor: 'border-sky-500 bg-sky-950/80 text-sky-300',
        };
      case 'BURNED':
      default:
        return {
          title: 'BURNED OUT: CHINI YA MAJI',
          tagline: 'The heat caught up, funds ran dry, or Mama Caro clamped the padlock.',
          description:
            'Nairobi chewed you up this round. Accumulated police pursuit or unpaid rent caught up with you. But in Kanairo, every failure is just another lesson for the next hustle. Dust yourself off and rise again!',
          badgeColor: 'border-red-500 bg-red-950/80 text-red-300',
        };
    }
  };

  const details = getEndingDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-xl bg-zinc-950 border-2 border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Banner */}
        <div className={`p-6 border-b text-center space-y-2 ${details.badgeColor}`}>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center shadow-lg">
            {isVictory ? <Trophy className="w-8 h-8 text-amber-400" /> : <AlertOctagon className="w-8 h-8 text-red-500" />}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white uppercase">
            {details.title}
          </h2>
          <p className="text-xs sm:text-sm italic opacity-90">{details.tagline}</p>
        </div>

        {/* Narrative Summary */}
        <div className="p-6 bg-zinc-900/60 border-b border-zinc-800 space-y-3">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
            {details.description}
          </p>
        </div>

        {/* Career & Hustle Stats Summary */}
        <div className="p-6 bg-zinc-950 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Final Cash</div>
              <div className="text-base font-black font-mono text-emerald-400 mt-0.5">
                Ksh {stats.money.toLocaleString()}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Street Cred</div>
              <div className="text-base font-black font-mono text-amber-400 mt-0.5">
                {stats.streetCred} / 100
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Police Heat</div>
              <div className="text-base font-black font-mono text-red-400 mt-0.5">
                {stats.policeHeat} / 100
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Missions Done</div>
              <div className="text-base font-black font-mono text-sky-400 mt-0.5">
                {completedCount}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onContinue();
              }}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Keep Sandbox Hustling
            </button>
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onRestart();
              }}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-black font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 uppercase"
            >
              <RefreshCw className="w-4 h-4" />
              New Game (Anza Upya)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
