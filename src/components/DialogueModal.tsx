import React from 'react';
import { DialogueNode, DialogueChoice, PlayerStats } from '../types';
import { soundEngine } from '../audio/soundEngine';
import { MessageSquare, AlertCircle, CheckCircle, Award, DollarSign, ShieldAlert } from 'lucide-react';

interface Props {
  node: DialogueNode;
  playerStats: PlayerStats;
  onSelectChoice: (choice: DialogueChoice) => void;
  onClose: () => void;
}

export const DialogueModal: React.FC<Props> = ({ node, playerStats, onSelectChoice, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl bg-zinc-950/95 border-2 border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Speaker Header */}
        <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md"
              style={{ backgroundColor: node.avatarColor || '#10b981' }}
            >
              {node.speaker[0]}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base tracking-wide flex items-center gap-2">
                <span>{node.speaker}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400">
                  {node.speakerRole}
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Leave [ESC]
          </button>
        </div>

        {/* Speech Content Bubble */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <p className="text-zinc-100 text-sm sm:text-base leading-relaxed italic font-medium">
            "{node.text}"
          </p>
        </div>

        {/* Branching Dialogue Choices */}
        <div className="p-4 space-y-2 bg-zinc-950 max-h-72 overflow-y-auto">
          {node.choices.map((choice, idx) => {
            const meetsMoney = !choice.reqMoney || playerStats.money >= choice.reqMoney;
            const meetsCred = !choice.reqCred || playerStats.streetCred >= choice.reqCred;
            const canChoose = meetsMoney && meetsCred;

            return (
              <button
                key={idx}
                disabled={!canChoose}
                onClick={() => {
                  soundEngine.playUiClick();
                  onSelectChoice(choice);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                  canChoose
                    ? 'bg-zinc-900 hover:bg-zinc-800/90 border-zinc-700 hover:border-emerald-500 text-zinc-200'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-emerald-400 text-xs mt-0.5">[{idx + 1}]</span>
                  <span className="text-xs sm:text-sm font-medium flex-1">{choice.text}</span>
                </div>

                {/* Requirement and Consequence Badges */}
                <div className="flex flex-wrap items-center gap-2 pl-6 pt-0.5 text-[10px]">
                  {choice.reqMoney && (
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold ${
                        meetsMoney ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                      }`}
                    >
                      Requires Ksh {choice.reqMoney.toLocaleString()}
                    </span>
                  )}
                  {choice.reqCred && (
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold ${
                        meetsCred ? 'bg-amber-950 text-amber-400' : 'bg-red-950 text-red-400'
                      }`}
                    >
                      Requires {choice.reqCred} Cred
                    </span>
                  )}
                  {choice.consequences?.money && (
                    <span
                      className={`font-mono font-bold ${
                        choice.consequences.money > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {choice.consequences.money > 0 ? '+' : ''}Ksh {choice.consequences.money.toLocaleString()}
                    </span>
                  )}
                  {choice.consequences?.cred && (
                    <span className="text-amber-400 font-mono font-bold">
                      +{choice.consequences.cred} Cred
                    </span>
                  )}
                  {choice.consequences?.heat && (
                    <span
                      className={`font-mono font-bold ${
                        choice.consequences.heat > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {choice.consequences.heat > 0 ? '+' : ''}{choice.consequences.heat} Heat
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
