import React, { useState, useEffect } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  onComplete: () => void;
}

export const OpeningCutscene: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    // Step 0: KANAIRO
    // Step 1: MTAA HUSTLE
    // Step 2: NAIROBI
    // Step 3: Bedsitter fade & Jemo SMS
    const timer1 = setTimeout(() => setStep(1), 1200);
    const timer2 = setTimeout(() => setStep(2), 2400);
    const timer3 = setTimeout(() => {
      setStep(3);
      soundEngine.playMpesaChime();
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-white px-6 font-mono select-none overflow-hidden">
      {step < 3 && (
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-widest text-emerald-400">
            KANAIRO
          </h1>
          {step >= 1 && (
            <h2 className="text-3xl md:text-5xl font-black tracking-wider text-amber-400">
              MTAA HUSTLE
            </h2>
          )}
          {step >= 2 && (
            <p className="text-xl md:text-2xl text-zinc-400 tracking-widest pt-4">
              "NAIROBI."
            </p>
          )}
        </div>
      )}

      {step >= 3 && (
        <div className="max-w-lg w-full bg-zinc-900/95 border-2 border-emerald-500/60 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-700 pb-3">
            <span className="text-emerald-400 font-bold text-sm tracking-wider">M-PESA WALLET</span>
            <span className="bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold">
              Ksh 200.00
            </span>
          </div>

          <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span>💬 SMS Notification · JEMO</span>
            </div>
            <p className="text-zinc-200 text-sm leading-relaxed italic">
              "Umefika? Karibu Kayole. Kuna ka-job hapa CBD. Si big money lakini inaweza kusaidia kuanza. Amka utoke nje ukuje nikuonyeshe vile form inakaa."
            </p>
          </div>

          <div className="bg-zinc-950/70 border border-emerald-500/30 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Current Objective</p>
            <p className="text-base text-emerald-300 font-bold tracking-wide mt-1">FIND A HUSTLE</p>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onComplete();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-black font-black text-sm tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer uppercase"
            >
              Start Hustling (Ingia Mtaa) →
            </button>
            <p className="text-zinc-500 text-xs mt-3">
              Press [SPACE] or Click to step out of bedsitter
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
