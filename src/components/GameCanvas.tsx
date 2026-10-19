import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ThreeWorld } from '../engine/threeWorld';
import { particleSystem } from '../engine/particleSystem';
import { soundEngine } from '../audio/soundEngine';
import { PlayerSystem } from '../systems/playerSystem';
import { VehicleSystem } from '../systems/vehicleSystem';
import { PoliceSystem } from '../systems/policeSystem';
import { EconomySystem } from '../systems/economySystem';
import { SaveSystem } from '../systems/saveSystem';
import { generateProceduralMission } from '../engine/missionGenerator';
import { RANDOM_STREET_EVENTS } from '../systems/eventSystem';
import { HANDCRAFTED_MISSIONS } from '../data/missions';
import { BUILDINGS } from '../data/zones';
import { DIALOGUES } from '../data/dialogues';
import { BottomDock } from './BottomDock';
import { ControlsCheatsheet } from './ControlsCheatsheet';
import { MouseControlsHUD } from './MouseControlsHUD';
import { KanjoSystem } from '../systems/kanjoSystem';
import { KanjoConfrontModal } from './KanjoConfrontModal';
import { KanjoDepotModal } from './KanjoDepotModal';
import {
  PlayerPosition,
  PlayerStats,
  Vehicle,
  NPC,
  Mission,
  DialogueNode,
  RandomStreetEvent,
  MpesaTransaction,
  WeatherType,
  CameraMode,
  AvatarOutfit,
  RestrictedZone,
} from '../types';

interface Props {
  initialSaveData?: any;
  onOpenPhone: () => void;
  onOpenMap: () => void;
  onOpenVoiceAssistant?: () => void;
  onTriggerDialogue: (node: DialogueNode) => void;
  onTriggerShop: (type: 'KIBANDASKI' | 'ELECTRONICS', title: string) => void;
  onTriggerEvent: (event: RandomStreetEvent) => void;
  onTriggerEnding: (type: 'LEGIT_SUCCESS' | 'STREET_KINGPIN' | 'MATATU_BOSS' | 'DCI_SUCCESS' | 'BURNED') => void;
  onKanjoUpdate?: (zone: RestrictedZone | null, alert: { state: string; suspicion: number; dist: number; x?: number; y?: number } | null) => void;
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  clock: { day: number; hour: number; minute: number };
  setClock: React.Dispatch<React.SetStateAction<{ day: number; hour: number; minute: number }>>;
  weather: WeatherType;
  setWeather: React.Dispatch<React.SetStateAction<WeatherType>>;
  activeMission: Mission | null;
  setActiveMission: React.Dispatch<React.SetStateAction<Mission | null>>;
  completedMissions: string[];
  setCompletedMissions: React.Dispatch<React.SetStateAction<string[]>>;
  availableMissions: Mission[];
  setAvailableMissions: React.Dispatch<React.SetStateAction<Mission[]>>;
  mpesaHistory: MpesaTransaction[];
  setMpesaHistory: React.Dispatch<React.SetStateAction<MpesaTransaction[]>>;
  npcs: NPC[];
  setNpcs: React.Dispatch<React.SetStateAction<NPC[]>>;
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  relationships: Record<string, number>;
  setRelationships: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  playerPosRef: React.MutableRefObject<PlayerPosition>;
  showTouchControls: boolean;
}

export const GameCanvas: React.FC<Props> = ({
  stats,
  setStats,
  clock,
  setClock,
  weather,
  setWeather,
  activeMission,
  setActiveMission,
  completedMissions,
  setCompletedMissions,
  availableMissions,
  setAvailableMissions,
  mpesaHistory,
  setMpesaHistory,
  npcs,
  setNpcs,
  vehicles,
  setVehicles,
  relationships,
  setRelationships,
  playerPosRef,
  onOpenPhone,
  onOpenMap,
  onOpenVoiceAssistant,
  onTriggerDialogue,
  onTriggerShop,
  onTriggerEvent,
  onTriggerEnding,
  onKanjoUpdate,
  showTouchControls,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);
  const overlay2DRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Scene instance
  const threeWorldRef = useRef<ThreeWorld | null>(null);

  // Gameplay simulation systems
  const playerSystemRef = useRef<PlayerSystem>(new PlayerSystem());
  const vehicleSystemRef = useRef<VehicleSystem>(new VehicleSystem());
  const policeSystemRef = useRef<PoliceSystem>(new PoliceSystem());
  const kanjoSystemRef = useRef<KanjoSystem>(new KanjoSystem());

  // Input states
  const keysRef = useRef<Record<string, boolean>>({});
  const virtualInputRef = useRef<{ dx: number; dy: number; isSprinting: boolean }>({
    dx: 0,
    dy: 0,
    isSprinting: false,
  });

  // Mouse Keystrokes & Click-to-Move Waypoint state
  const waypointRef = useRef<{
    x: number;
    y: number;
    isSprinting: boolean;
    targetEntity?: { type: 'NPC' | 'VEHICLE' | 'BUILDING'; id: string };
  } | null>(null);
  const [hasActiveWaypoint, setHasActiveWaypoint] = useState<boolean>(false);

  // Mouse Hover Tooltip state
  const [hoverTooltip, setHoverTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    subtitle?: string;
  } | null>(null);

  // Mouse Drag Orbit Tracking
  const pointerStateRef = useRef<{
    isDown: boolean;
    button: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    isDragging: boolean;
    downTime: number;
  }>({
    isDown: false,
    button: 0,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    isDragging: false,
    downTime: 0,
  });

  const lastLeftClickTimeRef = useRef<number>(0);

  // UI state
  const [cameraMode, setCameraMode] = useState<CameraMode>('THIRD_PERSON');
  const [avatarOutfit, setAvatarOutfit] = useState<AvatarOutfit>('STREETWEAR');
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState<boolean>(false);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [isKanjoConfrontOpen, setIsKanjoConfrontOpen] = useState<boolean>(false);
  const [isKanjoDepotOpen, setIsKanjoDepotOpen] = useState<boolean>(false);

  // Target interaction state
  const interactableTargetRef = useRef<{ label: string; x: number; y: number; type: string; id: string } | null>(null);

  // Time & Event Tracking
  const lastTimeRef = useRef<number>(performance.now());
  const secondAccumulatorRef = useRef<number>(0);
  const randomEventTimerRef = useRef<number>(0);
  const weatherTimerRef = useRef<number>(0);
  const thunderTimerRef = useRef<number>(0);
  const autoSaveTimerRef = useRef<number>(0);

  // Initialize Three.js 3D World
  useEffect(() => {
    if (!canvas3DRef.current) return;

    const threeWorld = new ThreeWorld(canvas3DRef.current);
    threeWorldRef.current = threeWorld;

    const handleResize = () => {
      if (containerRef.current && threeWorldRef.current && overlay2DRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        threeWorldRef.current.resize(w, h);
        overlay2DRef.current.width = w;
        overlay2DRef.current.height = h;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      threeWorld.dispose();
      threeWorldRef.current = null;
    };
  }, []);

  // Sync Weather with 3D Scene
  useEffect(() => {
    if (threeWorldRef.current) {
      threeWorldRef.current.updateWeather(weather, 0.016);
    }
  }, [weather]);

  // Toggle Weather
  const toggleWeather = useCallback(() => {
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

      if (threeWorldRef.current) {
        threeWorldRef.current.updateWeather(next, 0.016);
      }
      return next;
    });
  }, [setWeather, playerPosRef]);

  // Cycle Camera Mode
  const handleCycleCamera = useCallback((mode?: CameraMode) => {
    if (!threeWorldRef.current) return;
    const nextMode = mode || threeWorldRef.current.cycleCameraMode();
    threeWorldRef.current.cameraMode = nextMode;
    setCameraMode(nextMode);

    const labels: Record<CameraMode, string> = {
      THIRD_PERSON: '🎥 3rd Person Follow Cam',
      ISOMETRIC: '📐 Isometric 3D RPG Cam',
      FIRST_PERSON: '👁️ 1st Person Street Cam',
      CINEMATIC: '🎬 Cinematic Orbit Cam',
    };
    particleSystem.addFloatingText(labels[nextMode], playerPosRef.current.x, playerPosRef.current.y - 30, '#06b6d4');
  }, [playerPosRef]);

  // Cycle Outfit
  const handleCycleOutfit = useCallback((outfit?: AvatarOutfit) => {
    if (!threeWorldRef.current) return;
    let nextOutfit = outfit;
    if (!nextOutfit) {
      nextOutfit = threeWorldRef.current.cyclePlayerOutfit();
    } else {
      threeWorldRef.current.setPlayerOutfit(nextOutfit);
    }
    setAvatarOutfit(nextOutfit);

    const labels: Record<AvatarOutfit, string> = {
      STREETWEAR: '🧢 Mtaa Streetwear',
      BODA: '🏍️ Boda Rider (Helmet & Leather)',
      MATATU_TOUT: '🦺 Matatu Conductor (Reflector)',
      UNDERCOVER: '🕶️ Undercover Detective',
      SMART_HUSTLER: '👔 Boss Entrepreneur',
    };
    particleSystem.addFloatingText(labels[nextOutfit], playerPosRef.current.x, playerPosRef.current.y - 30, '#f59e0b');
  }, [playerPosRef]);

  // Horn Honk / Street Sheng Shout
  const handleHonkOrShout = useCallback(() => {
    const isDriving = playerPosRef.current.isInVehicle;
    if (isDriving) {
      soundEngine.playMatatuHorn();
      particleSystem.addFloatingText('PEEEP PEEEP! 📯 (Kiboko Fanfare)', playerPosRef.current.x, playerPosRef.current.y - 25, '#fbbf24');
    } else {
      soundEngine.playUiClick();
      const shouts = [
        'Wewe toka kwa njia! 🏃',
        'Twende CBD mbao! 🚐',
        'Kaa chonjo bazuu! ⚡',
        'Panda gari ishajaa! 🔥',
        'Hustle haitaki uvivu! 💪',
      ];
      const randomShout = shouts[Math.floor(Math.random() * shouts.length)];
      particleSystem.addFloatingText(randomShout, playerPosRef.current.x, playerPosRef.current.y - 25, '#38bdf8');
    }
  }, [playerPosRef]);

  // Complete Active Mission Logic
  const completeActiveMission = useCallback(() => {
    if (!activeMission) return;

    soundEngine.playMissionComplete();
    const pos = playerPosRef.current;
    particleSystem.addFloatingText(`MISSION COMPLETE! 🏆`, pos.x, pos.y - 45, '#fbbf24');

    setStats((prev) => ({
      ...prev,
      money: prev.money + activeMission.rewardMoney,
      streetCred: Math.min(100, prev.streetCred + activeMission.rewardCred),
      policeHeat: Math.max(0, Math.min(100, prev.policeHeat + activeMission.heatImpact)),
    }));

    EconomySystem.credit(
      stats,
      mpesaHistory,
      activeMission.rewardMoney,
      `Reward: ${activeMission.title}`,
      `Day ${clock.day}, ${clock.hour.toString().padStart(2, '0')}:${clock.minute.toString().padStart(2, '0')}`,
      pos.x,
      pos.y
    );

    setCompletedMissions((prev) => [...prev, activeMission.id]);

    if (activeMission.id === 'm20_empire_building') {
      if (stats.career === 'LEGIT_HUSTLER') {
        onTriggerEnding('LEGIT_SUCCESS');
      } else if (stats.career === 'MATATU_HUSTLER') {
        onTriggerEnding('MATATU_BOSS');
      } else if (stats.career === 'DCI_UNDERCOVER') {
        onTriggerEnding('DCI_SUCCESS');
      } else {
        onTriggerEnding('STREET_KINGPIN');
      }
    }

    const nextMission = HANDCRAFTED_MISSIONS.find(
      (m) =>
        m.prerequisites?.completedMissions?.includes(activeMission.id) &&
        !completedMissions.includes(m.id)
    );

    if (nextMission) {
      setActiveMission({ ...nextMission, status: 'ACTIVE' });
    } else {
      const proc = generateProceduralMission({
        playerCred: stats.streetCred,
        playerHeat: stats.policeHeat,
        career: stats.career,
        zone: pos.x > 3000 ? 'cbd' : 'kayole',
      });
      setActiveMission({ ...proc, status: 'ACTIVE' });
    }
  }, [activeMission, completedMissions, stats, clock, mpesaHistory, onTriggerEnding, playerPosRef, setActiveMission, setCompletedMissions, setStats]);

  // Handle Interaction (E key)
  const handleInteract = useCallback(() => {
    const target = interactableTargetRef.current;
    const pos = playerPosRef.current;

    // First check vehicle enter / exit
    const didVehicle = vehicleSystemRef.current.tryEnterOrExitVehicle(pos, vehicles);
    if (didVehicle) return;

    if (!target) return;

    if (target.type === 'NPC') {
      const allNpcs = [...npcs, kanjoSystemRef.current.toNPC()];
      const npc = allNpcs.find((n) => n.id === target.id);
      if (npc && npc.dialogueId && DIALOGUES[npc.dialogueId]) {
        soundEngine.playUiClick();
        onTriggerDialogue(DIALOGUES[npc.dialogueId]);
      }
    } else if (target.type === 'BUILDING') {
      const b = BUILDINGS.find((bld) => bld.id === target.id);
      if (!b) return;

      if (b.id === 'b_kanjo_depot') {
        soundEngine.playUiClick();
        setIsKanjoDepotOpen(true);
      } else if (b.type === 'BEDSITTER') {
        soundEngine.playUiClick();
        setStats((prev) => ({
          ...prev,
          energy: 100,
          health: Math.min(100, prev.health + 20),
          policeHeat: Math.max(0, prev.policeHeat - 15),
        }));
        setClock((prev) => {
          let newHour = prev.hour + 8;
          let newDay = prev.day;
          if (newHour >= 24) {
            newHour %= 24;
            newDay += 1;
          }
          return { day: newDay, hour: newHour, minute: 0 };
        });
        particleSystem.addFloatingText('Rested in Bedsitter (+Energy, -Heat, Saved) 🛏️', pos.x, pos.y - 30, '#38bdf8');
        SaveSystem.saveGame(
          stats,
          pos,
          clock,
          [],
          mpesaHistory,
          completedMissions,
          activeMission,
          availableMissions.map((m) => m.id),
          relationships
        );
      } else if (b.type === 'KIBANDASKI') {
        soundEngine.playUiClick();
        onTriggerShop('KIBANDASKI', b.name);
      } else if (b.type === 'ELECTRONICS') {
        soundEngine.playUiClick();
        onTriggerShop('ELECTRONICS', b.name);
      } else if (b.type === 'POLICE_POST') {
        if (stats.policeHeat > 0 && stats.money >= 400) {
          setStats((prev) => ({ ...prev, money: prev.money - 400, policeHeat: 0 }));
          particleSystem.addFloatingText('Cleared Police Heat (-Ksh 400) 📋', pos.x, pos.y - 30, '#00e676');
          soundEngine.playCashRegister();
        } else {
          particleSystem.addFloatingText('No Warrant or Need Ksh 400 Bail', pos.x, pos.y - 30, '#94a3b8');
        }
      }
    }
  }, [vehicles, npcs, stats, clock, mpesaHistory, completedMissions, activeMission, availableMissions, relationships, onTriggerDialogue, onTriggerShop, playerPosRef, setClock, setStats]);

  // Reset 3D Camera Orbit & Zoom
  const handleResetCamera = useCallback(() => {
    if (threeWorldRef.current) {
      threeWorldRef.current.resetCameraOrbit();
      particleSystem.addFloatingText('Camera View Reset 📷', playerPosRef.current.x, playerPosRef.current.y - 25, '#a855f7');
      soundEngine.playUiClick();
    }
  }, [playerPosRef]);

  // Clear Active Movement Waypoint
  const handleClearWaypoint = useCallback(() => {
    waypointRef.current = null;
    setHasActiveWaypoint(false);
    if (threeWorldRef.current) {
      threeWorldRef.current.setWaypoint(null);
    }
    soundEngine.playUiClick();
  }, []);

  // Handle Arrival at Waypoint Target
  const handleWaypointArrival = useCallback(() => {
    const currentWaypoint = waypointRef.current;
    if (!currentWaypoint) return;

    const targetEntity = currentWaypoint.targetEntity;
    waypointRef.current = null;
    setHasActiveWaypoint(false);
    if (threeWorldRef.current) {
      threeWorldRef.current.setWaypoint(null);
    }

    if (targetEntity) {
      if (targetEntity.type === 'NPC') {
        const allNpcs = [...npcs, kanjoSystemRef.current.toNPC()];
        const npc = allNpcs.find((n) => n.id === targetEntity.id);
        if (npc) {
          soundEngine.playUiClick();
          const dlg = (npc.dialogueId && DIALOGUES[npc.dialogueId]) || DIALOGUES[npc.id] || {
            id: `dlg_${npc.id}`,
            speaker: npc.name,
            speakerRole: npc.occupation,
            text: `Niaje bazuu! Mimi ni ${npc.name}, hustler wa huku mtaa.`,
            choices: [{ text: 'Sasa bazuu, tuonane baadaye.', consequences: {} }],
          };
          onTriggerDialogue(dlg);
        }
      } else if (targetEntity.type === 'VEHICLE') {
        vehicleSystemRef.current.tryEnterOrExitVehicle(playerPosRef.current, vehicles);
      } else if (targetEntity.type === 'BUILDING') {
        const b = BUILDINGS.find((item) => item.id === targetEntity.id);
        if (b) {
          soundEngine.playUiClick();
          if (b.id === 'b_kanjo_depot') {
            setIsKanjoDepotOpen(true);
          } else if (b.type === 'BEDSITTER') {
            setStats((prev) => ({
              ...prev,
              energy: 100,
              health: Math.min(100, prev.health + 20),
              policeHeat: Math.max(0, prev.policeHeat - 15),
            }));
            setClock((prev) => {
              let newHour = prev.hour + 8;
              let newDay = prev.day;
              if (newHour >= 24) {
                newHour %= 24;
                newDay += 1;
              }
              return { day: newDay, hour: newHour, minute: 0 };
            });
            particleSystem.addFloatingText('Rested in Bedsitter (+Energy, -Heat, Saved) 🛏️', playerPosRef.current.x, playerPosRef.current.y - 30, '#38bdf8');
          } else if (b.type === 'KIBANDASKI') {
            onTriggerShop('KIBANDASKI', b.name);
          } else if (b.type === 'ELECTRONICS') {
            onTriggerShop('ELECTRONICS', b.name);
          } else if (b.type === 'POLICE_POST') {
            if (stats.policeHeat > 0 && stats.money >= 400) {
              setStats((prev) => ({ ...prev, money: prev.money - 400, policeHeat: 0 }));
              particleSystem.addFloatingText('Cleared Police Heat (-Ksh 400) 📋', playerPosRef.current.x, playerPosRef.current.y - 30, '#00e676');
              soundEngine.playCashRegister();
            }
          }
        }
      }
    }
  }, [npcs, vehicles, stats, setClock, setStats, onTriggerDialogue, onTriggerShop, playerPosRef]);

  // Mouse Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerStateRef.current = {
      isDown: true,
      button: e.button,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      isDragging: false,
      downTime: performance.now(),
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pState = pointerStateRef.current;
    if (pState.isDown) {
      const dist = Math.hypot(e.clientX - pState.startX, e.clientY - pState.startY);
      if (dist > 5) {
        pState.isDragging = true;
      }

      if (pState.isDragging && threeWorldRef.current) {
        const dx = e.clientX - pState.lastX;
        const dy = e.clientY - pState.lastY;

        // Orbit camera around avatar
        threeWorldRef.current.orbitYaw -= dx * 0.006;
        threeWorldRef.current.orbitPitch = THREE.MathUtils.clamp(
          threeWorldRef.current.orbitPitch + dy * 0.005,
          -0.35,
          0.55
        );
      }
      pState.lastX = e.clientX;
      pState.lastY = e.clientY;
    }

    // Hover raycasting when not dragging
    if (!pState.isDragging && threeWorldRef.current && canvas3DRef.current) {
      const rect = canvas3DRef.current.getBoundingClientRect();
      const hit = threeWorldRef.current.getGroundIntersection(e.clientX, e.clientY, rect);
      if (hit) {
        // 1. Check NPC hover
        const allNpcs = [...npcs, kanjoSystemRef.current.toNPC()];
        let hoveredNpc: NPC | null = null;
        for (const n of allNpcs) {
          if (Math.hypot(hit.x - n.x, hit.y - n.y) < 55) {
            hoveredNpc = n;
            break;
          }
        }
        if (hoveredNpc) {
          const isKanjo = hoveredNpc.role === 'KANJO';
          setHoverTooltip({
            x: e.clientX,
            y: e.clientY,
            title: isKanjo ? `👮 ${hoveredNpc.name}` : `👤 ${hoveredNpc.name}`,
            subtitle: isKanjo
              ? `[Left-Click] Inspect / Negotiate • [Right-Click] Keep Distance`
              : `[Left-Click] Talk • [Right-Click] Greet`,
          });
          return;
        }

        // 2. Check Vehicle hover
        let hoveredVeh: Vehicle | null = null;
        for (const v of vehicles) {
          if (Math.hypot(hit.x - v.x, hit.y - v.y) < 65) {
            hoveredVeh = v;
            break;
          }
        }
        if (hoveredVeh) {
          setHoverTooltip({
            x: e.clientX,
            y: e.clientY,
            title: `🚐 ${hoveredVeh.name}`,
            subtitle: playerPosRef.current.isInVehicle
              ? `[Left-Click] Exit / Switch • [Right-Click] Horn`
              : `[Left-Click] Drive Vehicle`,
          });
          return;
        }

        // 3. Check Building door hover
        let hoveredBuilding: typeof BUILDINGS[0] | null = null;
        for (const b of BUILDINGS) {
          if (Math.hypot(hit.x - b.doorX, hit.y - b.doorY) < 55) {
            hoveredBuilding = b;
            break;
          }
        }
        if (hoveredBuilding) {
          setHoverTooltip({
            x: e.clientX,
            y: e.clientY,
            title: `🏬 ${hoveredBuilding.name}`,
            subtitle: hoveredBuilding.id === 'b_kanjo_depot'
              ? `[Left-Click] County Permits & Impound`
              : `[Left-Click] Enter / Shop`,
          });
          return;
        }

        setHoverTooltip(null);
      } else {
        setHoverTooltip(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pState = pointerStateRef.current;
    pState.isDown = false;

    if (!pState.isDragging && threeWorldRef.current && canvas3DRef.current) {
      const rect = canvas3DRef.current.getBoundingClientRect();
      const hit = threeWorldRef.current.getGroundIntersection(e.clientX, e.clientY, rect);

      // LEFT CLICK (Button 0)
      if (e.button === 0 && hit) {
        const now = performance.now();
        const isSprint = now - lastLeftClickTimeRef.current < 280;
        lastLeftClickTimeRef.current = now;

        const playerPos = playerPosRef.current;

        // Check if an NPC was clicked
        const allNpcs = [...npcs, kanjoSystemRef.current.toNPC()];
        let clickedNpc: NPC | null = null;
        for (const n of allNpcs) {
          if (Math.hypot(hit.x - n.x, hit.y - n.y) < 55) {
            clickedNpc = n;
            break;
          }
        }

        if (clickedNpc) {
          const distToNpc = Math.hypot(playerPos.x - clickedNpc.x, playerPos.y - clickedNpc.y);
          if (distToNpc < 65) {
            soundEngine.playUiClick();
            const dlg = (clickedNpc.dialogueId && DIALOGUES[clickedNpc.dialogueId]) || DIALOGUES[clickedNpc.id] || {
              id: `dlg_${clickedNpc.id}`,
              speaker: clickedNpc.name,
              speakerRole: clickedNpc.occupation,
              text: `Niaje bazuu! Mimi ni ${clickedNpc.name}, tuko hapa Nairobi hustle.`,
              choices: [{ text: 'Sasa bazuu, tuonane baadaye.', consequences: {} }],
            };
            onTriggerDialogue(dlg);
            waypointRef.current = null;
            setHasActiveWaypoint(false);
            threeWorldRef.current.setWaypoint(null);
          } else {
            waypointRef.current = {
              x: clickedNpc.x,
              y: clickedNpc.y,
              isSprinting: isSprint,
              targetEntity: { type: 'NPC', id: clickedNpc.id },
            };
            setHasActiveWaypoint(true);
            threeWorldRef.current.setWaypoint({ x: clickedNpc.x, y: clickedNpc.y });
            particleSystem.addFloatingText(`Approaching ${clickedNpc.name} 👤`, playerPos.x, playerPos.y - 25, '#38bdf8');
            soundEngine.playUiClick();
          }
          return;
        }

        // Check if a Vehicle was clicked
        let clickedVeh: Vehicle | null = null;
        for (const v of vehicles) {
          if (Math.hypot(hit.x - v.x, hit.y - v.y) < 65) {
            clickedVeh = v;
            break;
          }
        }

        if (clickedVeh) {
          if (playerPos.isInVehicle) {
            vehicleSystemRef.current.tryEnterOrExitVehicle(playerPos, vehicles);
            waypointRef.current = null;
            setHasActiveWaypoint(false);
            threeWorldRef.current.setWaypoint(null);
          } else {
            const distToVeh = Math.hypot(playerPos.x - clickedVeh.x, playerPos.y - clickedVeh.y);
            if (distToVeh < 70) {
              vehicleSystemRef.current.tryEnterOrExitVehicle(playerPos, vehicles);
              waypointRef.current = null;
              setHasActiveWaypoint(false);
              threeWorldRef.current.setWaypoint(null);
            } else {
              waypointRef.current = {
                x: clickedVeh.x,
                y: clickedVeh.y,
                isSprinting: isSprint,
                targetEntity: { type: 'VEHICLE', id: clickedVeh.id },
              };
              setHasActiveWaypoint(true);
              threeWorldRef.current.setWaypoint({ x: clickedVeh.x, y: clickedVeh.y });
              particleSystem.addFloatingText(`Heading to ${clickedVeh.name} 🚐`, playerPos.x, playerPos.y - 25, '#38bdf8');
              soundEngine.playUiClick();
            }
          }
          return;
        }

        // Check if a Building door was clicked
        let clickedBuilding: typeof BUILDINGS[0] | null = null;
        for (const b of BUILDINGS) {
          if (Math.hypot(hit.x - b.doorX, hit.y - b.doorY) < 55) {
            clickedBuilding = b;
            break;
          }
        }

        if (clickedBuilding) {
          const distToDoor = Math.hypot(playerPos.x - clickedBuilding.doorX, playerPos.y - clickedBuilding.doorY);
          if (distToDoor < 55) {
            soundEngine.playUiClick();
            if (clickedBuilding.id === 'b_kanjo_depot') {
              setIsKanjoDepotOpen(true);
            } else if (clickedBuilding.type === 'BEDSITTER') {
              setClock((prev) => ({ ...prev, hour: (prev.hour + 6) % 24 }));
              setStats((prev) => ({ ...prev, energy: 100 }));
              particleSystem.addFloatingText('Rested in Bedsitter (+Energy) 🛏️', playerPos.x, playerPos.y - 30);
            } else if (clickedBuilding.type === 'KIBANDASKI') {
              onTriggerShop('KIBANDASKI', clickedBuilding.name);
            } else if (clickedBuilding.type === 'ELECTRONICS') {
              onTriggerShop('ELECTRONICS', clickedBuilding.name);
            } else if (clickedBuilding.type === 'POLICE_POST') {
              if (stats.policeHeat > 0 && stats.money >= 400) {
                setStats((prev) => ({ ...prev, money: prev.money - 400, policeHeat: 0 }));
                particleSystem.addFloatingText('Cleared Police Heat (-Ksh 400) 📋', playerPos.x, playerPos.y - 30, '#00e676');
                soundEngine.playCashRegister();
              }
            }
            waypointRef.current = null;
            setHasActiveWaypoint(false);
            threeWorldRef.current.setWaypoint(null);
          } else {
            waypointRef.current = {
              x: clickedBuilding.doorX,
              y: clickedBuilding.doorY,
              isSprinting: isSprint,
              targetEntity: { type: 'BUILDING', id: clickedBuilding.id },
            };
            setHasActiveWaypoint(true);
            threeWorldRef.current.setWaypoint({ x: clickedBuilding.doorX, y: clickedBuilding.doorY });
            particleSystem.addFloatingText(`Heading to ${clickedBuilding.name} 🏬`, playerPos.x, playerPos.y - 25, '#38bdf8');
            soundEngine.playUiClick();
          }
          return;
        }

        // Ground clicked: set navigation waypoint
        waypointRef.current = {
          x: hit.x,
          y: hit.y,
          isSprinting: isSprint,
        };
        setHasActiveWaypoint(true);
        threeWorldRef.current.setWaypoint({ x: hit.x, y: hit.y });
        particleSystem.addFloatingText(isSprint ? '⚡ Sprinting to Waypoint!' : '📍 Waypoint Set', playerPos.x, playerPos.y - 25, '#06b6d4');
        soundEngine.playUiClick();
      }

      // RIGHT CLICK (Button 2)
      if (e.button === 2) {
        e.preventDefault();
        const playerPos = playerPosRef.current;
        if (playerPos.isInVehicle) {
          soundEngine.playMatatuHorn();
          particleSystem.addFloatingText('PEEEP PEEEP! 📯', playerPos.x, playerPos.y - 20, '#fbbf24');
        } else {
          // Check if right clicked near police for fast bribe
          let nearPolice = false;
          for (const n of npcs) {
            if (n.role === 'POLICE' && Math.hypot(playerPos.x - n.x, playerPos.y - n.y) < 85) {
              nearPolice = true;
              break;
            }
          }
          if (nearPolice && stats.policeHeat > 0 && stats.money >= 400) {
            setStats((prev) => ({ ...prev, money: prev.money - 400, policeHeat: 0 }));
            particleSystem.addFloatingText('Settled Heat with Afande (-Ksh 400) 📋', playerPos.x, playerPos.y - 30, '#00e676');
            soundEngine.playCashRegister();
          } else {
            const shouts = [
              'Sasa Bazuu! 👋',
              'Niaje Kiongozi! 🤙',
              'Toka kwa barabara bana! 🗣️',
              'Niko chonjo sana! 🇰🇪',
              'Mambo vipi msee! ✨',
            ];
            const randShout = shouts[Math.floor(Math.random() * shouts.length)];
            soundEngine.playUiClick();
            particleSystem.addFloatingText(randShout, playerPos.x, playerPos.y - 30, '#f59e0b');
          }
        }
      }

      // MIDDLE CLICK (Button 1)
      if (e.button === 1) {
        threeWorldRef.current.resetCameraOrbit();
        particleSystem.addFloatingText('Camera View Reset 📷', playerPosRef.current.x, playerPosRef.current.y - 25, '#a855f7');
        soundEngine.playUiClick();
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (threeWorldRef.current) {
      threeWorldRef.current.zoomFactor = THREE.MathUtils.clamp(
        threeWorldRef.current.zoomFactor + e.deltaY * 0.0012,
        0.55,
        2.2
      );
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Cancel mouse waypoint when manual movement keys are pressed
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        if (waypointRef.current) {
          waypointRef.current = null;
          setHasActiveWaypoint(false);
          threeWorldRef.current?.setWaypoint(null);
        }
      }

      // Phone (P)
      if (e.code === 'KeyP') {
        soundEngine.playUiClick();
        onOpenPhone();
      }

      // Map (M)
      if (e.code === 'KeyM') {
        soundEngine.playUiClick();
        onOpenMap();
      }

      // Radio Mtaa Live Voice Assistant (Y)
      if (e.code === 'KeyY') {
        soundEngine.playUiClick();
        if (onOpenVoiceAssistant) onOpenVoiceAssistant();
      }

      // Interaction (E)
      if (e.code === 'KeyE') {
        handleInteract();
      }

      // Vehicle Enter/Exit (F)
      if (e.code === 'KeyF') {
        vehicleSystemRef.current.tryEnterOrExitVehicle(playerPosRef.current, vehicles);
      }

      // Jump / Space action
      if (e.code === 'Space') {
        e.preventDefault();
        if (playerPosRef.current.isInVehicle) {
          handleHonkOrShout();
        } else if (threeWorldRef.current && threeWorldRef.current.jumpY <= 0.05) {
          // Trigger 3D Jump
          threeWorldRef.current.jumpVy = 7.5;
          threeWorldRef.current.jumpY = 0.1;
        }
      }

      // Cycle 3D Camera (C)
      if (e.code === 'KeyC') {
        handleCycleCamera();
      }

      // Switch Avatar Outfit (V)
      if (e.code === 'KeyV') {
        handleCycleOutfit();
      }

      // Horn / Shout (H)
      if (e.code === 'KeyH') {
        handleHonkOrShout();
      }

      // Quick Bribe / Clear Heat (B)
      if (e.code === 'KeyB') {
        if (stats.policeHeat > 0 && stats.money >= 400) {
          setStats((prev) => ({ ...prev, money: prev.money - 400, policeHeat: 0 }));
          particleSystem.addFloatingText('Cleared Police Heat via Quick Bribe (-Ksh 400) 📋', playerPosRef.current.x, playerPosRef.current.y - 30, '#00e676');
          soundEngine.playCashRegister();
        } else {
          particleSystem.addFloatingText('No Warrant or need Ksh 400', playerPosRef.current.x, playerPosRef.current.y - 30, '#94a3b8');
        }
      }

      // Toggle Weather (T)
      if (e.code === 'KeyT') {
        toggleWeather();
      }

      // Controls Cheatsheet (Tab)
      if (e.code === 'Tab') {
        e.preventDefault();
        setIsCheatsheetOpen((prev) => !prev);
      }

      // Dev Shortcuts (F1-F8)
      if (e.code === 'F1') {
        e.preventDefault();
        setStats((prev) => ({ ...prev, money: prev.money + 10000 }));
        particleSystem.addFloatingText('+Ksh 10,000 [DEV]', playerPosRef.current.x, playerPosRef.current.y - 30, '#00e676');
      } else if (e.code === 'F2') {
        e.preventDefault();
        setStats((prev) => ({ ...prev, streetCred: Math.min(100, prev.streetCred + 10) }));
        particleSystem.addFloatingText('+10 Cred [DEV]', playerPosRef.current.x, playerPosRef.current.y - 30, '#f59e0b');
      } else if (e.code === 'F3') {
        e.preventDefault();
        setStats((prev) => ({ ...prev, policeHeat: Math.max(0, prev.policeHeat - 20) }));
        particleSystem.addFloatingText('-20 Heat [DEV]', playerPosRef.current.x, playerPosRef.current.y - 30, '#38bdf8');
      } else if (e.code === 'F4') {
        e.preventDefault();
        playerPosRef.current.x = 450;
        playerPosRef.current.y = 1540;
        particleSystem.addFloatingText('Teleported: Kayole [DEV]', playerPosRef.current.x, playerPosRef.current.y - 30);
      } else if (e.code === 'F5') {
        e.preventDefault();
        playerPosRef.current.x = 3600;
        playerPosRef.current.y = 1100;
        particleSystem.addFloatingText('Teleported: CBD [DEV]', playerPosRef.current.x, playerPosRef.current.y - 30);
      } else if (e.code === 'F6') {
        e.preventDefault();
        setClock((prev) => ({ ...prev, hour: (prev.hour + 3) % 24 }));
      } else if (e.code === 'F7') {
        e.preventDefault();
        if (activeMission) completeActiveMission();
      } else if (e.code === 'F8') {
        e.preventDefault();
        toggleWeather();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const handleBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [
    vehicles,
    activeMission,
    stats,
    onOpenPhone,
    onOpenMap,
    handleInteract,
    handleCycleCamera,
    handleCycleOutfit,
    handleHonkOrShout,
    toggleWeather,
    completeActiveMission,
    playerPosRef,
    setStats,
    setClock,
  ]);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      const dt = Math.min(rawDt, 0.05);

      const pos = playerPosRef.current;

      // 1. Update Player Physics (weather affects surface speed, mouse waypoint navigation)
      playerSystemRef.current.update(
        dt,
        pos,
        stats,
        keysRef.current,
        virtualInputRef.current,
        weather,
        waypointRef.current,
        handleWaypointArrival
      );

      // 2. Update Vehicle Physics (weather affects grip and fares, mouse steering/throttle)
      vehicleSystemRef.current.update(
        dt,
        vehicles,
        pos,
        stats,
        keysRef.current,
        (fareEarned, reason) => {
          setStats((prev) => ({ ...prev, money: prev.money + fareEarned }));
          EconomySystem.credit(
            stats,
            mpesaHistory,
            fareEarned,
            reason,
            `Day ${clock.day}, ${clock.hour.toString().padStart(2, '0')}:${clock.minute.toString().padStart(2, '0')}`,
            pos.x,
            pos.y
          );
        },
        weather,
        waypointRef.current,
        handleWaypointArrival
      );

      // 3. Update NPC behavior based on weather conditions
      for (const n of npcs) {
        if (weather === 'RAINY') {
          if (!n.hasUmbrella && n.role === 'CIVILIAN') {
            let nearestDoor = { x: 500, y: 1550 };
            let minDist = 9999;
            for (const b of BUILDINGS) {
              const d = Math.hypot(n.x - b.doorX, n.y - b.doorY);
              if (d < minDist) {
                minDist = d;
                nearestDoor = { x: b.doorX, y: b.doorY };
              }
            }
            n.targetX = nearestDoor.x;
            n.targetY = nearestDoor.y;
            if (minDist > 28) {
              n.speed = 1.6;
              n.currentSpeech = 'Mvua imeshuka! Kimbia veranda!';
            } else {
              n.speed = 0;
              n.currentSpeech = 'Nimeshuka veranda kwanza mvua ipite.';
            }
          } else if (n.hasUmbrella) {
            n.speed = 0.85;
            n.currentSpeech = 'Mvua ya Nairobi haina huruma bana!';
          } else if (n.role === 'BODA') {
            n.speed = 0.55;
            n.currentSpeech = 'Barabara inateleza, pole pole ndio mwendo.';
          }
        } else if (weather === 'CLOUDY') {
          n.speed = n.originalSpeed || 0.75;
          if (n.role === 'CIVILIAN' && Math.random() < 0.003) {
            n.currentSpeech = 'Mawingu inatanda juu ya mtaa... mvua inakaribia.';
          }
        } else {
          n.speed = n.originalSpeed || 0.7;
        }

        // Move roaming NPCs towards targets
        if (n.targetX !== undefined && n.targetY !== undefined && n.speed > 0) {
          const dx = n.targetX - n.x;
          const dy = n.targetY - n.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 18) {
            n.rotation = Math.atan2(dy, dx);
            n.x += Math.cos(n.rotation) * n.speed * 60 * dt;
            n.y += Math.sin(n.rotation) * n.speed * 60 * dt;
          } else if (weather !== 'RAINY') {
            if (n.id === 'ped_1') n.targetX = n.targetX === 1000 ? 550 : 1000;
            else if (n.id === 'ped_2') n.targetX = n.targetX === 3500 ? 3900 : 3500;
            else if (n.id === 'ped_3') n.targetX = n.targetX === 4700 ? 4050 : 4700;
            else if (n.id === 'ped_4') n.targetX = n.targetX === 700 ? 1150 : 700;
          }
        }
      }

      // 4. Update Police System
      policeSystemRef.current.update(dt, stats, pos, vehicles, (fine) => {
        setStats((prev) => ({ ...prev, money: Math.max(0, prev.money - fine), policeHeat: 10 }));
        particleSystem.addFloatingText(`Paid Ksh ${fine} Police Bail`, pos.x, pos.y - 30, '#ef4444');
      });

      // 5. Update Kanjo System (Wandering County Inspector AI in restricted zones)
      kanjoSystemRef.current.update(
        dt,
        pos,
        stats,
        weather,
        activeMission,
        onTriggerDialogue,
        () => {
          setIsKanjoConfrontOpen(true);
        }
      );

      // Notify parent about restricted zone & Kanjo radar
      if (onKanjoUpdate) {
        const curZone = kanjoSystemRef.current.getRestrictedZoneAt(pos.x, pos.y);
        const o = kanjoSystemRef.current.officer;
        const d = Math.hypot(pos.x - o.x, pos.y - o.y);
        onKanjoUpdate(
          curZone,
          o.isActive ? { state: o.state, suspicion: o.suspicion, dist: d, x: o.x, y: o.y } : null
        );
      }

      // 6. Sound Effect Trigger: Siren Audio Loop
      // Plays procedural siren audio loop whenever:
      // a) Kanjo Officer is within proximity to the player (d <= 350px) or in active PURSUIT / SUSPICIOUS alert
      // b) Player's 'policeHeat' reaches high threshold (>= 50) or police vehicle pursuit is active
      const officer = kanjoSystemRef.current.officer;
      const distToOfficer = Math.hypot(pos.x - officer.x, pos.y - officer.y);
      const isKanjoNearby = officer.isActive && distToOfficer <= 350;
      const isKanjoPursuit = officer.isActive && officer.state === 'PURSUIT';
      const isKanjoSuspicious = officer.isActive && officer.state === 'SUSPICIOUS' && distToOfficer <= 350;
      const isKanjoClosingIn = officer.isActive && distToOfficer <= 240;

      const isHighHeat = stats.policeHeat >= 50;
      const isPolicePursuing = policeSystemRef.current.isPolicePursuitActive;

      const shouldPlaySiren = isKanjoPursuit || isKanjoSuspicious || isKanjoClosingIn || isHighHeat || isPolicePursuing;

      if (shouldPlaySiren) {
        // Proximity intensity: scales smoothly up as officer approaches (from 350px down to 40px)
        let kanjoIntensity = 0;
        if (isKanjoPursuit) {
          kanjoIntensity = 1.0;
        } else if (isKanjoNearby) {
          kanjoIntensity = Math.max(0.15, 1 - (distToOfficer - 40) / 310);
        }

        // Heat intensity: scales smoothly up from 40 to 100 heat
        const heatIntensity = (isHighHeat || isPolicePursuing)
          ? Math.max(0.25, Math.min(1.0, (stats.policeHeat - 30) / 70))
          : 0;

        const finalIntensity = Math.min(1.0, Math.max(kanjoIntensity, heatIntensity));

        // Urgency factor (faster wail / yelp modulation in hot pursuit or close proximity)
        const isUrgent = isKanjoPursuit || stats.policeHeat >= 75 || distToOfficer < 100;
        const urgency = isUrgent ? 2.3 : 1.25;

        // Siren type: Kanjo County wail vs Police law enforcement sweep
        const sirenType = kanjoIntensity >= heatIntensity ? 'KANJO' : 'POLICE';

        soundEngine.updateSiren(true, finalIntensity, urgency, sirenType);
      } else {
        soundEngine.updateSiren(false);
      }

      const kanjoOfficerNpc = kanjoSystemRef.current.toNPC();
      const allNpcs = [...npcs, kanjoOfficerNpc];

      // 7. Update Particle System
      particleSystem.update(dt);

      // 8. Check Proximity for Interactions
      let closestTarget: { label: string; x: number; y: number; type: string; id: string } | null = null;
      let closestDist = 85;

      for (const v of vehicles) {
        const d = Math.hypot(pos.x - v.x, pos.y - v.y);
        if (d < 65) {
          closestTarget = {
            label: pos.isInVehicle ? `[F] Exit ${v.name}` : `[F] Drive ${v.name}`,
            x: v.x,
            y: v.y,
            type: 'VEHICLE',
            id: v.id,
          };
          closestDist = d;
          break;
        }
      }

      if (!closestTarget) {
        for (const n of allNpcs) {
          const d = Math.hypot(pos.x - n.x, pos.y - n.y);
          if (d < closestDist) {
            closestDist = d;
            closestTarget = {
              label: n.role === 'KANJO' ? `[E] Speak with Officer Mutua (Kanjo)` : `[E] Talk to ${n.name}`,
              x: n.x,
              y: n.y,
              type: 'NPC',
              id: n.id,
            };
          }
        }
      }

      if (!closestTarget) {
        for (const b of BUILDINGS) {
          const d = Math.hypot(pos.x - b.doorX, pos.y - b.doorY);
          if (d < 55) {
            closestTarget = {
              label: `[E] ${b.interactLabel}`,
              x: b.doorX,
              y: b.doorY,
              type: 'BUILDING',
              id: b.id,
            };
            break;
          }
        }
      }

      interactableTargetRef.current = closestTarget;
      setCurrentPrompt(closestTarget ? closestTarget.label : null);

      // 7. Check Active Mission Target Arrival
      if (activeMission && activeMission.targetLocation) {
        const target = activeMission.targetLocation;
        const dist = Math.hypot(pos.x - target.x, pos.y - target.y);
        const radius = target.radius || 90;
        if (dist <= radius) {
          if (activeMission.choices && activeMission.choices.length > 0) {
            const choiceNode: DialogueNode = {
              id: `mission_dlg_${activeMission.id}`,
              speaker: activeMission.client,
              speakerRole: 'Mission Objective Point',
              text: activeMission.description,
              choices: activeMission.choices.map((c) => ({
                text: c.text,
                consequences: {
                  money: c.moneyChange,
                  cred: c.credChange,
                  heat: c.heatChange,
                },
                reqCred: c.reqCred,
                reqMoney: c.reqMoney,
              })),
            };
            onTriggerDialogue(choiceNode);
          } else {
            completeActiveMission();
          }
        }
      }

      // 8. Clock Progression (1 real sec = 2 game mins)
      secondAccumulatorRef.current += dt;
      if (secondAccumulatorRef.current >= 0.5) {
        secondAccumulatorRef.current = 0;
        setClock((prev) => {
          let newMin = prev.minute + 1;
          let newHour = prev.hour;
          let newDay = prev.day;

          if (newMin >= 60) {
            newMin = 0;
            newHour += 1;
            if (newHour >= 24) {
              newHour = 0;
              newDay += 1;
              setStats((s) => {
                const nextRentDays = s.rentDueDays - 1;
                if (nextRentDays <= 0 && s.money < s.rentAmount) {
                  onTriggerEnding('BURNED');
                }
                return { ...s, daysSurvived: s.daysSurvived + 1, rentDueDays: nextRentDays };
              });
            }
          }
          return { day: newDay, hour: newHour, minute: newMin };
        });
      }

      // 9. Random Street Events
      randomEventTimerRef.current += dt;
      if (randomEventTimerRef.current >= 95) {
        randomEventTimerRef.current = 0;
        const randEvt = RANDOM_STREET_EVENTS[Math.floor(Math.random() * RANDOM_STREET_EVENTS.length)];
        onTriggerEvent(randEvt);
      }

      // 10. Auto-Save periodically
      autoSaveTimerRef.current += dt;
      if (autoSaveTimerRef.current >= 60) {
        autoSaveTimerRef.current = 0;
        SaveSystem.saveGame(
          stats,
          pos,
          clock,
          [],
          mpesaHistory,
          completedMissions,
          activeMission,
          availableMissions.map((m) => m.id),
          relationships
        );
      }

      // 11. Weather Automatic Cycle (~120s)
      weatherTimerRef.current += dt;
      if (weatherTimerRef.current >= 120) {
        weatherTimerRef.current = 0;
        toggleWeather();
      }

      // 12. Distant Thunder in Rain
      if (weather === 'RAINY') {
        thunderTimerRef.current += dt;
        if (thunderTimerRef.current >= 24) {
          thunderTimerRef.current = 0;
          soundEngine.playThunder();
        }
      }

      // 13. Render 3D Scene via Three.js
      if (threeWorldRef.current) {
        threeWorldRef.current.update(
          dt,
          pos,
          stats,
          allNpcs,
          vehicles,
          activeMission,
          closestTarget
        );
      }

      // 14. Render 2D Floating Text Overlay
      const overlay = overlay2DRef.current;
      if (overlay) {
        const ctx2D = overlay.getContext('2d');
        if (ctx2D) {
          ctx2D.clearRect(0, 0, overlay.width, overlay.height);

          // Render floating particle text in top center screen
          particleSystem.floatingTexts.forEach((ft) => {
            const alpha = Math.max(0, ft.life / ft.maxLife);
            ctx2D.save();
            ctx2D.globalAlpha = alpha;
            ctx2D.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx2D.textAlign = 'center';
            ctx2D.fillStyle = '#09090b';
            ctx2D.fillText(ft.text, overlay.width / 2 + 1, overlay.height * 0.16 + (1 - alpha) * -30 + 1);
            ctx2D.fillStyle = ft.color;
            ctx2D.fillText(ft.text, overlay.width / 2, overlay.height * 0.16 + (1 - alpha) * -30);
            ctx2D.restore();
          });
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      soundEngine.updateSiren(false);
    };
  }, [
    stats,
    clock,
    weather,
    toggleWeather,
    activeMission,
    completedMissions,
    availableMissions,
    npcs,
    vehicles,
    relationships,
    mpesaHistory,
    completeActiveMission,
    onTriggerDialogue,
    onTriggerShop,
    onTriggerEvent,
    onTriggerEnding,
    onKanjoUpdate,
    handleWaypointArrival,
    playerPosRef,
    setClock,
    setStats,
  ]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-neutral-950">
      {/* Primary 3D WebGL Canvas with Mouse Controls & Gestures */}
      <canvas
        ref={canvas3DRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className="block w-full h-full cursor-crosshair active:cursor-grabbing touch-none"
      />

      {/* Transparent 2D Floating Text Overlay */}
      <canvas ref={overlay2DRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Dynamic Mouse Hover Tooltip */}
      {hoverTooltip && (
        <div
          className="fixed pointer-events-none z-30 transition-transform duration-75 ease-out"
          style={{ left: hoverTooltip.x + 14, top: hoverTooltip.y + 14 }}
        >
          <div className="bg-neutral-950/95 border border-cyan-500/60 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md text-white text-xs space-y-0.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>{hoverTooltip.title}</span>
            </div>
            {hoverTooltip.subtitle && (
              <div className="text-[10px] text-neutral-300 font-mono">
                {hoverTooltip.subtitle}
              </div>
            )}
          </div>
        </div>
      )}

      {/* On-screen Mouse Keystrokes & Controls Guide HUD */}
      <MouseControlsHUD
        hasActiveWaypoint={hasActiveWaypoint}
        onClearWaypoint={handleClearWaypoint}
        onResetCamera={handleResetCamera}
        onOpenCheatsheet={() => setIsCheatsheetOpen(true)}
        isInVehicle={playerPosRef.current.isInVehicle}
      />

      {/* Interaction Prompt Overlay Banner */}
      {currentPrompt && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-neutral-950/90 border border-emerald-500/60 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-2xl shadow-xl backdrop-blur-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>{currentPrompt}</span>
          </div>
        </div>
      )}

      {/* Collapsible Bottom Control Dock */}
      <BottomDock
        cameraMode={cameraMode}
        onSelectCamera={handleCycleCamera}
        avatarOutfit={avatarOutfit}
        onSelectOutfit={handleCycleOutfit}
        weather={weather}
        onToggleWeather={toggleWeather}
        onHonk={handleHonkOrShout}
        onOpenPhone={onOpenPhone}
        onOpenMap={onOpenMap}
        onOpenVoiceAssistant={onOpenVoiceAssistant || (() => {})}
        onToggleCheatsheet={() => setIsCheatsheetOpen(true)}
        isInVehicle={playerPosRef.current.isInVehicle}
      />

      {/* Controls Cheatsheet Modal */}
      <ControlsCheatsheet
        isOpen={isCheatsheetOpen}
        onClose={() => setIsCheatsheetOpen(false)}
      />

      {/* Touch Controls (Virtual D-Pad and Action Buttons for Mobile/Touch) */}
      {showTouchControls && (
        <div className="absolute inset-0 pointer-events-none flex items-end justify-between p-6 z-40">
          <div className="pointer-events-auto grid grid-cols-3 gap-1.5 w-36 h-36 bg-zinc-950/80 p-2 rounded-2xl border border-zinc-800 backdrop-blur-xs">
            <div />
            <button
              onPointerDown={() => { virtualInputRef.current.dy = -1; }}
              onPointerUp={() => { virtualInputRef.current.dy = 0; }}
              className="bg-zinc-800 active:bg-emerald-600 rounded-lg text-white font-black text-sm flex items-center justify-center cursor-pointer"
            >
              ▲
            </button>
            <div />
            <button
              onPointerDown={() => { virtualInputRef.current.dx = -1; }}
              onPointerUp={() => { virtualInputRef.current.dx = 0; }}
              className="bg-zinc-800 active:bg-emerald-600 rounded-lg text-white font-black text-sm flex items-center justify-center cursor-pointer"
            >
              ◀
            </button>
            <div className="flex items-center justify-center text-[10px] text-zinc-500 font-mono">MOVE</div>
            <button
              onPointerDown={() => { virtualInputRef.current.dx = 1; }}
              onPointerUp={() => { virtualInputRef.current.dx = 0; }}
              className="bg-zinc-800 active:bg-emerald-600 rounded-lg text-white font-black text-sm flex items-center justify-center cursor-pointer"
            >
              ▶
            </button>
            <div />
            <button
              onPointerDown={() => { virtualInputRef.current.dy = 1; }}
              onPointerUp={() => { virtualInputRef.current.dy = 0; }}
              className="bg-zinc-800 active:bg-emerald-600 rounded-lg text-white font-black text-sm flex items-center justify-center cursor-pointer"
            >
              ▼
            </button>
            <div />
          </div>

          <div className="pointer-events-auto flex items-center gap-2 mb-12">
            <button
              onClick={handleInteract}
              className="w-16 h-16 bg-emerald-600 active:bg-emerald-500 border-2 border-emerald-400 rounded-full text-black font-black text-sm shadow-xl flex flex-col items-center justify-center cursor-pointer"
            >
              <span>E</span>
              <span className="text-[8px] uppercase">Action</span>
            </button>
            <button
              onClick={handleHonkOrShout}
              className="w-14 h-14 bg-amber-500 active:bg-amber-400 border border-amber-300 rounded-full text-black font-black text-xs shadow-xl flex flex-col items-center justify-center cursor-pointer"
            >
              <span>HORN</span>
            </button>
          </div>
        </div>
      )}

      {/* Nairobi County Enforcement (Kanjo) Ambush Confrontation Modal */}
      <KanjoConfrontModal
        isOpen={isKanjoConfrontOpen}
        onClose={() => setIsKanjoConfrontOpen(false)}
        stats={stats}
        setStats={setStats}
        onEscape={() => {
          setIsKanjoConfrontOpen(false);
          // Burst dash escape backwards from confrontation
          const angle = playerPosRef.current.rotation + Math.PI;
          playerPosRef.current.x = Math.max(100, Math.min(5300, playerPosRef.current.x + Math.cos(angle) * 85));
          playerPosRef.current.y = Math.max(200, Math.min(2200, playerPosRef.current.y + Math.sin(angle) * 85));
          setStats((prev) => ({
            ...prev,
            energy: Math.max(0, prev.energy - 25),
            policeHeat: Math.min(100, prev.policeHeat + 10),
          }));
          particleSystem.addFloatingText('💨 BUSTED FREE FROM KANJO! (-25 Energy)', playerPosRef.current.x, playerPosRef.current.y - 30, '#f59e0b');
          soundEngine.playUiClick();
        }}
        zoneName={kanjoSystemRef.current.officer.activeZone?.name || 'CBD Restricted Vending Zone'}
      />

      {/* Nairobi City County Depot, Licensing & Impound Yard Modal */}
      <KanjoDepotModal
        isOpen={isKanjoDepotOpen}
        onClose={() => setIsKanjoDepotOpen(false)}
        stats={stats}
        setStats={setStats}
      />
    </div>
  );
};
