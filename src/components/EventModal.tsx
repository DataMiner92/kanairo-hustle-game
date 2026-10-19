import React, { useState } from 'react';
import { RandomStreetEvent } from '../types';
import { soundEngine } from '../audio/soundEngine';
import { AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';

interface Props {
  event: RandomStreetEvent;
  onResolve: (optionIndex: number) => void;
}

export const EventModal: React.FC<Props> = ({ event, onResolve }) => {
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const handleSelect = (idx: number) => {
    soundEngine.playUiClick();
    setSelectedResult(event.options[idx].resultText);
    onResolve(idx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none font-sans">
      <div className="w-full max-w-lg bg-zinc-950 border-2 border-amber-500/70 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-amber-950/70 px-5 py-3 border-b border-amber-500/40 flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">
              RANDOM STREET EVENT · {event.location}
            </span>
            <h3 className="text-base font-extrabold text-white">{event.title}</h3>
          </div>
        </div>

        {/* Event Narrative */}
        <div className="p-5 bg-zinc-900/60 border-b border-zinc-800">
          <p className="text-sm text-zinc-200 leading-relaxed italic">
            "{event.description}"
          </p>
        </div>

        {/* Choices or Result */}
        <div className="p-5 space-y-2.5 bg-zinc-950">
          {!selectedResult ? (
            event.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className="w-full text-left p-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/80 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300">
                    {opt.label}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    {opt.moneyChange && (
                      <span className={opt.moneyChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {opt.moneyChange > 0 ? '+' : ''}Ksh {opt.moneyChange}
                      </span>
                    )}
                    {opt.credChange && (
                      <span className="text-amber-400">+{opt.credChange} Cred</span>
                    )}
                    {opt.heatChange && (
                      <span className={opt.heatChange > 0 ? 'text-red-400' : 'text-emerald-400'}>
                        {opt.heatChange > 0 ? '+' : ''}{opt.heatChange} Heat
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              </button>
            ))
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900 border border-emerald-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" />
                  <span>Consequence</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  {selectedResult}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
