import React, { useState } from 'react';
import { PlayerStats, MpesaTransaction, Mission, NPC } from '../types';
import {
  Smartphone,
  X,
  CreditCard,
  Send,
  ShoppingBag,
  Briefcase,
  Users,
  Compass,
  UserCheck,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  PhoneCall,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  stats: PlayerStats;
  mpesaHistory: MpesaTransaction[];
  activeMission: Mission | null;
  availableMissions: Mission[];
  completedMissions: string[];
  npcs: NPC[];
  clock: { day: number; hour: number; minute: number };
  onClose: () => void;
  onSendMpesa: (recipient: string, amount: number) => void;
  onAcceptMission: (mission: Mission) => void;
  onOpenMap: () => void;
  onOpenVoiceAssistant?: () => void;
}

type PhoneTab = 'HOME' | 'MPESA' | 'MISSIONS' | 'CONTACTS' | 'STATS';

export const PhoneModal: React.FC<Props> = ({
  stats,
  mpesaHistory,
  activeMission,
  availableMissions,
  completedMissions,
  npcs,
  clock,
  onClose,
  onSendMpesa,
  onAcceptMission,
  onOpenMap,
  onOpenVoiceAssistant,
}) => {
  const [activeTab, setActiveTab] = useState<PhoneTab>('MPESA');
  const [sendAmount, setSendAmount] = useState<string>('100');
  const [sendRecipient, setSendRecipient] = useState<string>('JEMO');
  const [mpesaView, setMpesaView] = useState<'HOME' | 'SEND' | 'HISTORY'>('HOME');

  const formatClock = `${clock.hour.toString().padStart(2, '0')}:${clock.minute.toString().padStart(2, '0')}`;

  const handleSendMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(sendAmount, 10);
    if (!isNaN(amt) && amt > 0 && amt <= stats.money) {
      onSendMpesa(sendRecipient, amt);
      setMpesaView('HISTORY');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      {/* Smartphone Hardware Frame */}
      <div className="relative w-full max-w-sm h-[640px] bg-zinc-950 border-4 border-zinc-700 rounded-[44px] shadow-2xl flex flex-col overflow-hidden ring-8 ring-zinc-900/60 font-sans">
        {/* Phone Notch & Speaker */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-900 rounded-full flex items-center justify-center gap-2 z-20">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
          <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full" />
        </div>

        {/* Top Status Bar (Network, Time, Battery) */}
        <div className="pt-3 px-6 pb-2 flex items-center justify-between text-[11px] font-mono text-zinc-400 z-10 bg-zinc-900/90 border-b border-zinc-800">
          <span className="font-bold text-emerald-400">SAFARICOM 5G</span>
          <span className="font-semibold text-zinc-200">{formatClock}</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">98%</span>
            <div className="w-5 h-2.5 border border-zinc-400 rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Phone Content Screen */}
        <div className="flex-1 overflow-y-auto bg-zinc-900 text-white p-4 space-y-4">
          {/* HEADER NAV */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                soundEngine.playUiClick();
                setActiveTab('HOME');
              }}
              className="text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {activeTab !== 'HOME' ? '← Apps' : 'KanairoOS'}
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              {activeTab === 'MPESA'
                ? 'M-PESA'
                : activeTab === 'MISSIONS'
                ? 'HUSTLE RADAR'
                : activeTab === 'CONTACTS'
                ? 'PHONEBOOK'
                : activeTab === 'STATS'
                ? 'PROFILE'
                : 'HOME'}
            </span>
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* APP: HOME ICONS */}
          {activeTab === 'HOME' && (
            <div className="grid grid-cols-3 gap-4 pt-4">
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveTab('MPESA');
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                  <CreditCard className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-zinc-300">M-PESA</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveTab('MISSIONS');
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 to-yellow-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                  <Briefcase className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-zinc-300">Missions</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveTab('CONTACTS');
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-zinc-300">Contacts</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onOpenMap();
                  onClose();
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-gradient-to-tr from-sky-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                  <Compass className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-zinc-300">GPS Map</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveTab('STATS');
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                  <UserCheck className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-zinc-300">Profile</span>
              </button>
            </div>
          )}

          {/* APP: M-PESA */}
          {activeTab === 'MPESA' && (
            <div className="space-y-4">
              {/* Wallet Card */}
              <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-900 rounded-2xl p-4 shadow-xl border border-emerald-400/40 text-white space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold tracking-wider opacity-90">
                  <span>M-PESA ACCOUNT</span>
                  <span className="bg-emerald-950/80 px-2 py-0.5 rounded-full text-[10px]">ACTIVE</span>
                </div>
                <div>
                  <div className="text-[11px] opacity-80 uppercase tracking-widest font-semibold">Available Balance</div>
                  <div className="text-3xl font-black tracking-tight tabular-nums mt-0.5">
                    Ksh {stats.money.toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] opacity-75 font-mono">
                  Safaricom MPESA · No Transaction Fees in Kanairo
                </div>
              </div>

              {/* M-Pesa Action Chips */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    setMpesaView('SEND');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    mpesaView === 'SEND'
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Money
                </button>
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    setMpesaView('HISTORY');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    mpesaView === 'HISTORY'
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Mini Statement
                </button>
              </div>

              {/* View: Send Money Form */}
              {mpesaView === 'SEND' && (
                <form onSubmit={handleSendMoneySubmit} className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-3.5 space-y-3">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Send Money via M-Pesa</div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Select Contact / Party</label>
                    <select
                      value={sendRecipient}
                      onChange={(e) => setSendRecipient(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="JEMO (0722***819)">Jemo (Street Connect)</option>
                      <option value="ACHIENG (0710***992)">Achieng (Kibandaski)</option>
                      <option value="MWAS (0733***411)">Mwas Tech (Shop)</option>
                      <option value="MAMA CARO (0720***300)">Mama Caro (Rent Paybill)</option>
                      <option value="OTIENO (0714***552)">Otieno (Boda Stage)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Amount (Ksh)</label>
                    <input
                      type="number"
                      min="10"
                      max={stats.money}
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={stats.money < parseInt(sendAmount, 10)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Confirm & Send Money
                  </button>
                </form>
              )}

              {/* View: Transaction Feed */}
              {mpesaView === 'HISTORY' && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent Transactions</div>
                  {mpesaHistory.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic text-center py-4">No transactions yet.</p>
                  ) : (
                    mpesaHistory.slice(0, 8).map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-zinc-800/90 border border-zinc-700/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              tx.type === 'RECEIVED' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                            }`}
                          >
                            {tx.type === 'RECEIVED' ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-200">{tx.party}</div>
                            <div className="text-[9px] font-mono text-zinc-500">
                              {tx.code} · {tx.timestamp}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-black font-mono tabular-nums ${
                              tx.type === 'RECEIVED' ? 'text-emerald-400' : 'text-zinc-200'
                            }`}
                          >
                            {tx.type === 'RECEIVED' ? '+' : '-'}Ksh {tx.amount.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-zinc-500 font-mono">
                            Bal: Ksh {tx.balanceAfter.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* APP: MISSIONS */}
          {activeTab === 'MISSIONS' && (
            <div className="space-y-3">
              {activeMission && (
                <div className="bg-amber-950/40 border border-amber-500/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400 uppercase">ACTIVE HUSTLE</span>
                    <span className="text-emerald-400 font-mono font-bold">+Ksh {activeMission.rewardMoney}</span>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-100">{activeMission.title}</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{activeMission.objective}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400">
                    <span>Client: {activeMission.client}</span>
                    <span>Zone: {activeMission.zone.toUpperCase()}</span>
                  </div>
                </div>
              )}

              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider pt-1">
                Available Mtaa Jobs ({availableMissions.length})
              </div>

              <div className="space-y-2">
                {availableMissions.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic text-center py-4">No jobs currently available. Explore the city!</p>
                ) : (
                  availableMissions.map((m) => (
                    <div
                      key={m.id}
                      className="bg-zinc-800/90 border border-zinc-700 hover:border-emerald-500/50 rounded-xl p-3 space-y-2 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{m.title}</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">+Ksh {m.rewardMoney}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2">{m.description}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-zinc-500">Cred: +{m.rewardCred} · Heat: +{m.heatImpact}</span>
                        <button
                          onClick={() => {
                            soundEngine.playUiClick();
                            onAcceptMission(m);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[10px] rounded-lg cursor-pointer"
                        >
                          Accept Hustle
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* APP: CONTACTS */}
          {activeTab === 'CONTACTS' && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Contacts & Connects</div>
              {npcs.filter((n) => n.isImportant).map((npc) => (
                <div
                  key={npc.id}
                  className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                      style={{ backgroundColor: npc.color }}
                    >
                      {npc.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{npc.name}</span>
                        {npc.nickname && <span className="text-[10px] text-amber-400">"{npc.nickname}"</span>}
                      </div>
                      <div className="text-[10px] text-zinc-400">{npc.occupation}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-mono">Rel: {npc.relationship}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* APP: PROFILE & STATS */}
          {activeTab === 'STATS' && (
            <div className="space-y-3">
              <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-3.5 space-y-2.5 text-xs">
                <div className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">Hustler Record</div>
                <div className="flex justify-between py-1 border-b border-zinc-700/60">
                  <span className="text-zinc-400">Street Cred:</span>
                  <span className="font-bold text-amber-400">{stats.streetCred} / 100</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-700/60">
                  <span className="text-zinc-400">Police Heat:</span>
                  <span className="font-bold text-red-400">{stats.policeHeat} / 100</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-700/60">
                  <span className="text-zinc-400">Career Path:</span>
                  <span className="font-bold text-sky-400">
                    {stats.career === 'NONE' ? 'Undecided Hustler' : stats.career.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-700/60">
                  <span className="text-zinc-400">Days Survived:</span>
                  <span className="font-bold text-zinc-200">{stats.daysSurvived} Days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-700/60">
                  <span className="text-zinc-400">Rent Status (Mama Caro):</span>
                  <span className="font-bold text-amber-300">Ksh {stats.rentAmount} due</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Missions Completed:</span>
                  <span className="font-bold text-emerald-400">{completedMissions.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Smartphone Navigation Bar */}
        <div className="py-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around z-10">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('HOME');
            }}
            className="w-10 h-10 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <div className="w-3.5 h-3.5 border-2 border-zinc-400 rounded-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};
