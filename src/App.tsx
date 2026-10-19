import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { OpeningCutscene } from './components/OpeningCutscene';
import { HUD } from './components/HUD';
import { PhoneModal } from './components/PhoneModal';
import { MapModal } from './components/MapModal';
import { DialogueModal } from './components/DialogueModal';
import { ShopModal } from './components/ShopModal';
import { EventModal } from './components/EventModal';
import { GameOverModal } from './components/GameOverModal';
import { DebugMenu } from './components/DebugMenu';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { soundEngine } from './audio/soundEngine';
import { SaveSystem } from './systems/saveSystem';
import { EconomySystem } from './systems/economySystem';
import { particleSystem } from './engine/particleSystem';
import { HANDCRAFTED_MISSIONS } from './data/missions';
import { INITIAL_NPCS } from './data/npcs';
import { INITIAL_VEHICLES } from './data/vehicles';
import {
  PlayerStats,
  PlayerPosition,
  Mission,
  DialogueNode,
  DialogueChoice,
  ShopItem,
  RandomStreetEvent,
  MpesaTransaction,
  NPC,
  Vehicle,
  WeatherType,
  RestrictedZone,
} from './types';

const INITIAL_STATS: PlayerStats = {
  money: 200,
  streetCred: 10,
  policeHeat: 0,
  health: 100,
  hunger: 40,
  energy: 100,
  career: 'NONE',
  careerProgress: 0,
  daysSurvived: 1,
  rentDueDays: 7,
  rentAmount: 2500,
  undercoverCoverBlown: false,
};

export default function App() {
  const [gameState, setGameState] = useState<'MENU' | 'CUTSCENE' | 'PLAYING'>('MENU');
  const [hasSave, setHasSave] = useState<boolean>(false);

  // Core Game State
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [weather, setWeather] = useState<WeatherType>('SUNNY');
  const [clock, setClock] = useState<{ day: number; hour: number; minute: number }>({
    day: 1,
    hour: 8,
    minute: 42,
  });

  const playerPosRef = useRef<PlayerPosition>({
    x: 500,
    y: 1560,
    vx: 0,
    vy: 0,
    rotation: 0,
    speed: 0,
    isSprinting: false,
    isInVehicle: false,
    vehicleId: null,
  });

  const [activeMission, setActiveMission] = useState<Mission | null>(HANDCRAFTED_MISSIONS[0]);
  const [availableMissions, setAvailableMissions] = useState<Mission[]>(
    HANDCRAFTED_MISSIONS.slice(1, 5)
  );
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [mpesaHistory, setMpesaHistory] = useState<MpesaTransaction[]>(
    EconomySystem.getInitialHistory()
  );
  const [npcs, setNpcs] = useState<NPC[]>(INITIAL_NPCS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [relationships, setRelationships] = useState<Record<string, number>>({
    npc_jemo: 35,
    npc_achieng: 20,
    npc_mwas: 15,
    npc_otieno: 20,
    npc_brayo: 10,
    npc_caro: 15,
    npc_inspector_k: 5,
    npc_anita: 25,
  });

  // Modals & Overlays
  const [isPhoneOpen, setIsPhoneOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [activeDialogue, setActiveDialogue] = useState<DialogueNode | null>(null);
  const [activeShop, setActiveShop] = useState<{ type: 'KIBANDASKI' | 'ELECTRONICS'; title: string } | null>(null);
  const [activeEvent, setActiveEvent] = useState<RandomStreetEvent | null>(null);
  const [endingType, setEndingType] = useState<
    'LEGIT_SUCCESS' | 'STREET_KINGPIN' | 'MATATU_BOSS' | 'DCI_SUCCESS' | 'BURNED' | null
  >(null);
  const [activeRestrictedZone, setActiveRestrictedZone] = useState<RestrictedZone | null>(null);
  const [kanjoAlert, setKanjoAlert] = useState<{ state: string; suspicion: number; dist: number; x?: number; y?: number } | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);

  // Check save on mount & detect touch devices
  useEffect(() => {
    setHasSave(SaveSystem.hasSave());
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      setShowTouchControls(true);
    }
  }, []);

  // START NEW GAME
  const handleStartNewGame = () => {
    setStats(INITIAL_STATS);
    setClock({ day: 1, hour: 8, minute: 42 });
    playerPosRef.current = {
      x: 500,
      y: 1560,
      vx: 0,
      vy: 0,
      rotation: 0,
      speed: 0,
      isSprinting: false,
      isInVehicle: false,
      vehicleId: null,
    };
    setActiveMission({ ...HANDCRAFTED_MISSIONS[0], status: 'ACTIVE' });
    setAvailableMissions(HANDCRAFTED_MISSIONS.slice(1, 5));
    setCompletedMissions([]);
    setMpesaHistory(EconomySystem.getInitialHistory());
    setNpcs(INITIAL_NPCS);
    setVehicles(INITIAL_VEHICLES);
    setEndingType(null);
    setGameState('CUTSCENE');
  };

  // CONTINUE SAVED GAME
  const handleContinueSavedGame = () => {
    const saved = SaveSystem.loadGame();
    if (saved) {
      setStats(saved.playerStats);
      setClock(saved.clock);
      playerPosRef.current.x = saved.playerPosition.x;
      playerPosRef.current.y = saved.playerPosition.y;
      playerPosRef.current.rotation = saved.playerPosition.rotation;
      setActiveMission(saved.activeMission);
      setCompletedMissions(saved.completedMissionIds);
      setMpesaHistory(saved.mpesaHistory);
      setRelationships(saved.relationships);
      setEndingType(null);
      setGameState('PLAYING');
      soundEngine.playMpesaChime();
    }
  };

  // SEND MONEY FROM PHONE
  const handleSendMpesa = (recipient: string, amount: number) => {
    const success = EconomySystem.debit(
      stats,
      mpesaHistory,
      amount,
      recipient,
      `Day ${clock.day}, ${clock.hour.toString().padStart(2, '0')}:${clock.minute.toString().padStart(2, '0')}`,
      'SENT',
      playerPosRef.current.x,
      playerPosRef.current.y
    );
    if (success) {
      setStats({ ...stats });
      setMpesaHistory([...mpesaHistory]);
    }
  };

  // BUY ITEM FROM SHOP
  const handleBuyShopItem = (item: ShopItem) => {
    const success = EconomySystem.debit(
      stats,
      mpesaHistory,
      item.price,
      item.name,
      `Day ${clock.day}, ${clock.hour.toString().padStart(2, '0')}:${clock.minute.toString().padStart(2, '0')}`,
      'BUY_GOODS',
      playerPosRef.current.x,
      playerPosRef.current.y
    );
    if (success) {
      setStats((prev) => ({
        ...prev,
        hunger: Math.min(100, prev.hunger + (item.hungerRestore || 0)),
        energy: Math.min(100, prev.energy + (item.energyRestore || 0)),
        health: Math.min(100, prev.health + (item.healthRestore || 0)),
      }));
      setMpesaHistory([...mpesaHistory]);
      particleSystem.addFloatingText(`Enjoyed ${item.name}! 😋`, playerPosRef.current.x, playerPosRef.current.y - 40, '#22c55e');
    }
  };

  // DIALOGUE CHOICE SELECTION
  const handleSelectDialogueChoice = (choice: DialogueChoice) => {
    // Deduct cost if applicable
    if (choice.costMoney) {
      EconomySystem.debit(
        stats,
        mpesaHistory,
        choice.costMoney,
        'Dialogue Choice / Service',
        `Day ${clock.day}, ${clock.hour}:${clock.minute}`,
        'BUY_GOODS',
        playerPosRef.current.x,
        playerPosRef.current.y
      );
    }

    // Apply consequences
    if (choice.consequences) {
      const c = choice.consequences;
      setStats((prev) => ({
        ...prev,
        money: prev.money + (c.money || 0),
        streetCred: Math.max(0, Math.min(100, prev.streetCred + (c.cred || 0))),
        policeHeat: Math.max(0, Math.min(100, prev.policeHeat + (c.heat || 0))),
        career: c.careerChange || prev.career,
      }));

      if (c.money && c.money > 0) {
        EconomySystem.credit(
          stats,
          mpesaHistory,
          c.money,
          'Street Transaction',
          `Day ${clock.day}, ${clock.hour}:${clock.minute}`,
          playerPosRef.current.x,
          playerPosRef.current.y
        );
      }

      if (c.relationship) {
        setRelationships((prev) => ({
          ...prev,
          [c.relationship!.npcId]: Math.min(100, (prev[c.relationship!.npcId] || 0) + c.relationship!.delta),
        }));
      }
    }

    // Advance or close dialogue
    if (choice.nextDialogueId && (window as any)._allDialogues?.[choice.nextDialogueId]) {
      setActiveDialogue((window as any)._allDialogues[choice.nextDialogueId]);
    } else {
      setActiveDialogue(null);
    }
  };

  // RESOLVE STREET EVENT
  const handleResolveEvent = (optIdx: number) => {
    if (!activeEvent) return;
    const opt = activeEvent.options[optIdx];

    setStats((prev) => ({
      ...prev,
      money: prev.money + (opt.moneyChange || 0),
      streetCred: Math.max(0, Math.min(100, prev.streetCred + (opt.credChange || 0))),
      policeHeat: Math.max(0, Math.min(100, prev.policeHeat + (opt.heatChange || 0))),
    }));

    if (opt.moneyChange && opt.moneyChange !== 0) {
      if (opt.moneyChange > 0) {
        EconomySystem.credit(
          stats,
          mpesaHistory,
          opt.moneyChange,
          activeEvent.title,
          `Day ${clock.day}, ${clock.hour}:${clock.minute}`,
          playerPosRef.current.x,
          playerPosRef.current.y
        );
      } else {
        EconomySystem.debit(
          stats,
          mpesaHistory,
          Math.abs(opt.moneyChange),
          activeEvent.title,
          `Day ${clock.day}, ${clock.hour}:${clock.minute}`,
          'BUY_GOODS',
          playerPosRef.current.x,
          playerPosRef.current.y
        );
      }
    }

    setTimeout(() => {
      setActiveEvent(null);
    }, 2500);
  };

  const handleToggleWeather = useCallback(() => {
    setWeather((curr) => {
      let next: WeatherType = 'SUNNY';
      if (curr === 'SUNNY') next = 'CLOUDY';
      else if (curr === 'CLOUDY') next = 'RAINY';
      else next = 'SUNNY';

      soundEngine.updateWeatherAudio(next);
      if (next === 'RAINY') {
        soundEngine.playThunder();
        particleSystem.addFloatingText('🌧️ Mvua ya Nairobi! (Rainy - Fares Surged)', playerPosRef.current.x, playerPosRef.current.y - 40, '#38bdf8');
      } else if (next === 'CLOUDY') {
        particleSystem.addFloatingText('⛅ Mawingu Yametanda (Cloudy Overcast)', playerPosRef.current.x, playerPosRef.current.y - 40, '#e2e8f0');
      } else {
        particleSystem.addFloatingText('☀️ Jua Kali (Clear & Sunny)', playerPosRef.current.x, playerPosRef.current.y - 40, '#fbbf24');
      }
      return next;
    });
  }, []);

  // Hook global dialogues lookup
  useEffect(() => {
    import('./data/dialogues').then((mod) => {
      (window as any)._allDialogues = mod.DIALOGUES;
    });
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      {/* 1. MAIN MENU SCREEN */}
      {gameState === 'MENU' && (
        <MainMenu
          hasSaveGame={hasSave}
          onNewGame={handleStartNewGame}
          onContinueGame={handleContinueSavedGame}
        />
      )}

      {/* 2. OPENING CUTSCENE */}
      {gameState === 'CUTSCENE' && (
        <OpeningCutscene
          onComplete={() => {
            setGameState('PLAYING');
          }}
        />
      )}

      {/* 3. ACTIVE GAME PLAYFIELD & 60FPS SIMULATION */}
      {gameState === 'PLAYING' && (
        <>
          <GameCanvas
            stats={stats}
            setStats={setStats}
            clock={clock}
            setClock={setClock}
            weather={weather}
            setWeather={setWeather}
            activeMission={activeMission}
            setActiveMission={setActiveMission}
            completedMissions={completedMissions}
            setCompletedMissions={setCompletedMissions}
            availableMissions={availableMissions}
            setAvailableMissions={setAvailableMissions}
            mpesaHistory={mpesaHistory}
            setMpesaHistory={setMpesaHistory}
            npcs={npcs}
            setNpcs={setNpcs}
            vehicles={vehicles}
            setVehicles={setVehicles}
            relationships={relationships}
            setRelationships={setRelationships}
            playerPosRef={playerPosRef}
            onOpenPhone={() => setIsPhoneOpen(true)}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
            onTriggerDialogue={(node) => setActiveDialogue(node)}
            onTriggerShop={(type, title) => setActiveShop({ type, title })}
            onTriggerEvent={(evt) => setActiveEvent(evt)}
            onTriggerEnding={(type) => setEndingType(type)}
            onKanjoUpdate={(zone, alert) => {
              setActiveRestrictedZone(zone);
              setKanjoAlert(alert);
            }}
            showTouchControls={showTouchControls}
          />

          {/* HUD Overlay with Kanjo Restricted Zone Alert & Radar */}
          <HUD
            stats={stats}
            clock={clock}
            weather={weather}
            onToggleWeather={handleToggleWeather}
            activeMission={activeMission}
            onOpenPhone={() => setIsPhoneOpen(true)}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
            onToggleDebug={() => setIsDebugOpen((prev) => !prev)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(soundEngine.toggleMute())}
            restrictedZone={activeRestrictedZone}
            kanjoAlert={kanjoAlert}
          />

          {/* Interactive Smartphone Modal */}
          {isPhoneOpen && (
            <PhoneModal
              stats={stats}
              mpesaHistory={mpesaHistory}
              activeMission={activeMission}
              availableMissions={availableMissions}
              completedMissions={completedMissions}
              npcs={npcs}
              clock={clock}
              onClose={() => setIsPhoneOpen(false)}
              onSendMpesa={handleSendMpesa}
              onAcceptMission={(m) => {
                setActiveMission(m);
                setIsPhoneOpen(false);
              }}
              onOpenMap={() => setIsMapOpen(true)}
            />
          )}

          {/* Interactive GPS Vector Map Modal */}
          {isMapOpen && (
            <MapModal
              playerPos={playerPosRef.current}
              activeMission={activeMission}
              vehicles={vehicles}
              kanjoPos={kanjoAlert && kanjoAlert.x !== undefined && kanjoAlert.y !== undefined ? { x: kanjoAlert.x, y: kanjoAlert.y, state: kanjoAlert.state } : null}
              onClose={() => setIsMapOpen(false)}
            />
          )}

          {/* Branching Dialogue Modal */}
          {activeDialogue && (
            <DialogueModal
              node={activeDialogue}
              playerStats={stats}
              onSelectChoice={handleSelectDialogueChoice}
              onClose={() => setActiveDialogue(null)}
            />
          )}

          {/* Shop & Food Kibandaski Modal */}
          {activeShop && (
            <ShopModal
              shopTitle={activeShop.title}
              shopType={activeShop.type}
              playerStats={stats}
              onBuyItem={handleBuyShopItem}
              onClose={() => setActiveShop(null)}
            />
          )}

          {/* Random Street Event Modal */}
          {activeEvent && (
            <EventModal
              event={activeEvent}
              onResolve={handleResolveEvent}
            />
          )}

          {/* Game Over / Ending Modal */}
          {endingType && (
            <GameOverModal
              type={endingType}
              stats={stats}
              completedCount={completedMissions.length}
              onRestart={handleStartNewGame}
              onContinue={() => setEndingType(null)}
            />
          )}

          {/* Developer Debug Shortcut Modal */}
          {isDebugOpen && (
            <DebugMenu
              weather={weather}
              onToggleWeather={handleToggleWeather}
              onAddMoney={() => {
                setStats((s) => ({ ...s, money: s.money + 10000 }));
                particleSystem.addFloatingText('+Ksh 10,000 [DEV]', playerPosRef.current.x, playerPosRef.current.y - 30, '#00e676');
              }}
              onAddCred={() => {
                setStats((s) => ({ ...s, streetCred: Math.min(100, s.streetCred + 10) }));
                particleSystem.addFloatingText('+10 Cred [DEV]', playerPosRef.current.x, playerPosRef.current.y - 30, '#f59e0b');
              }}
              onReduceHeat={() => {
                setStats((s) => ({ ...s, policeHeat: Math.max(0, s.policeHeat - 20) }));
                particleSystem.addFloatingText('-20 Heat [DEV]', playerPosRef.current.x, playerPosRef.current.y - 30, '#38bdf8');
              }}
              onTeleportKayole={() => {
                playerPosRef.current.x = 450;
                playerPosRef.current.y = 1540;
                particleSystem.addFloatingText('Teleported: Kayole', playerPosRef.current.x, playerPosRef.current.y - 30);
              }}
              onTeleportCbd={() => {
                playerPosRef.current.x = 3600;
                playerPosRef.current.y = 1100;
                particleSystem.addFloatingText('Teleported: CBD', playerPosRef.current.x, playerPosRef.current.y - 30);
              }}
              onAdvanceTime={() => {
                setClock((c) => ({ ...c, hour: (c.hour + 3) % 24 }));
              }}
              onCompleteMission={() => {
                if (activeMission) {
                  soundEngine.playMissionComplete();
                  setStats((prev) => ({
                    ...prev,
                    money: prev.money + activeMission.rewardMoney,
                    streetCred: Math.min(100, prev.streetCred + activeMission.rewardCred),
                  }));
                  setCompletedMissions((prev) => [...prev, activeMission.id]);
                  const nextMission = HANDCRAFTED_MISSIONS.find(
                    (m) =>
                      m.prerequisites?.completedMissions?.includes(activeMission.id) &&
                      !completedMissions.includes(m.id)
                  );
                  if (nextMission) {
                    setActiveMission({ ...nextMission, status: 'ACTIVE' });
                  }
                }
              }}
              onClose={() => setIsDebugOpen(false)}
            />
          )}

          {/* Radio Mtaa 102.5 FM Live Voice Assistant Modal */}
          {isVoiceAssistantOpen && (
            <VoiceAssistantModal
              isOpen={isVoiceAssistantOpen}
              onClose={() => setIsVoiceAssistantOpen(false)}
              stats={stats}
              weather={weather}
              activeMission={activeMission}
              zoneName={
                playerPosRef.current.x < 1800
                  ? 'Kayole Estate'
                  : playerPosRef.current.x < 3600
                  ? 'Jogoo Road Highway'
                  : 'Nairobi CBD'
              }
              isInVehicle={playerPosRef.current.isInVehicle}
              vehicleName={
                playerPosRef.current.isInVehicle
                  ? vehicles.find((v) => v.id === playerPosRef.current.vehicleId)?.name || 'Matatu'
                  : undefined
              }
            />
          )}
        </>
      )}
    </div>
  );
}
