export type CareerPath = 'NONE' | 'MABOYZ_WA_MTAA' | 'MATATU_HUSTLER' | 'LEGIT_HUSTLER' | 'DCI_UNDERCOVER';

export type HeatLevel = 'NORMAL' | 'SUSPICIOUS' | 'WANTED' | 'SEARCH' | 'PURSUIT';

export type CredRank = 'NOBODY' | 'KNOWN_FACE' | 'WA_MTAA' | 'BIG_MAN' | 'LEGEND';

export type AvatarOutfit = 'STREETWEAR' | 'BODA' | 'MATATU_TOUT' | 'UNDERCOVER' | 'SMART_HUSTLER';

export type CameraMode = 'THIRD_PERSON' | 'ISOMETRIC' | 'FIRST_PERSON' | 'CINEMATIC';

export interface PlayerStats {
  money: number;              // Starting Ksh 200
  streetCred: number;         // 0 - 100
  policeHeat: number;         // 0 - 100
  health: number;             // 0 - 100
  hunger: number;             // 0 - 100 (0 = starved, 100 = full)
  energy: number;             // 0 - 100
  career: CareerPath;
  careerProgress: number;     // 0 - 100
  daysSurvived: number;
  rentDueDays: number;        // Countdown to rent day
  rentAmount: number;         // Ksh 2,500
  undercoverCoverBlown: boolean;
  hasCountyPermit?: boolean;  // Nairobi County Hawkers & Traders License
  countyPermitDaysLeft?: number;
}

export interface RestrictedZone {
  id: string;
  name: string;
  shengName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  riskFactor: number;
  description: string;
}

export interface PlayerPosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  speed: number;
  isSprinting: boolean;
  isInVehicle: boolean;
  vehicleId: string | null;
}

export interface MpesaTransaction {
  id: string;
  code: string;               // e.g. "SH89XK492"
  type: 'RECEIVED' | 'SENT' | 'PAYBILL' | 'BUY_GOODS';
  party: string;
  amount: number;
  timestamp: string;
  balanceAfter: number;
  note: string;
}

export type WeatherType = 'SUNNY' | 'CLOUDY' | 'RAINY';

export interface NPC {
  id: string;
  name: string;
  nickname?: string;
  occupation: string;
  personality: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  rotation: number;
  speed: number;
  originalSpeed?: number;
  zone: string;
  relationship: number;       // 0 - 100
  dialogueId?: string;
  color: string;
  isImportant: boolean;
  role: 'VENDOR' | 'BODA' | 'TOUT' | 'POLICE' | 'KANJO' | 'STREET_CREW' | 'DCI' | 'CIVILIAN';
  idleSpeechTimer: number;
  currentSpeech?: string;
  hasUmbrella?: boolean;
  isSeekingShelter?: boolean;
}

export interface Vehicle {
  id: string;
  type: 'MATATU' | 'BODA' | 'POLICE_CAR' | 'CIVILIAN_CAR';
  name: string;
  plate: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  color: string;
  accentColor: string;
  passengers: number;
  maxPassengers: number;
  farePerPassenger: number;
  isDrivenByPlayer: boolean;
  isPolicePatrol: boolean;
  health: number;
  route?: string;
}

export interface Building {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'RESIDENTIAL' | 'SHOP' | 'KIBANDASKI' | 'POLICE_POST' | 'ELECTRONICS' | 'MATATU_STAGE' | 'HOTEL' | 'BEDSITTER';
  zone: string;
  color: string;
  doorX: number;
  doorY: number;
  interactLabel: string;
  isOpen: boolean;
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dangerLevel: number;
  policeLevel: number;
}

export interface MissionChoice {
  text: string;
  outcomeText: string;
  reqCred?: number;
  reqMoney?: number;
  reqHeatMax?: number;
  moneyChange: number;
  credChange: number;
  heatChange: number;
  relChanges?: Record<string, number>;
  nextMissionId?: string;
}

export interface Mission {
  id: string;
  title: string;
  client: string;
  zone: string;
  description: string;
  objective: string;
  targetLocation?: { x: number; y: number; label: string; radius?: number };
  targetNPCId?: string;
  rewardMoney: number;
  rewardCred: number;
  heatImpact: number;
  timeLimitSeconds?: number;
  remainingTime?: number;
  status: 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  prerequisites?: {
    minCred?: number;
    completedMissions?: string[];
    career?: CareerPath;
  };
  dialogueOnStart?: string;
  choices?: MissionChoice[];
  isProcedural?: boolean;
}

export interface DialogueChoice {
  text: string;
  reqCred?: number;
  reqMoney?: number;
  reqCareer?: CareerPath;
  costMoney?: number;
  nextDialogueId?: string;
  giveMissionId?: string;
  consequences?: {
    money?: number;
    cred?: number;
    heat?: number;
    relationship?: { npcId: string; delta: number };
    careerChange?: CareerPath;
    setRentPaid?: boolean;
  };
}

export interface DialogueNode {
  id: string;
  speaker: string;
  speakerRole: string;
  text: string;
  avatarColor?: string;
  choices: DialogueChoice[];
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'FOOD' | 'GOODS' | 'UPGRADE';
  price: number;
  hungerRestore?: number;
  energyRestore?: number;
  healthRestore?: number;
  description: string;
  icon: string;
}

export interface RandomStreetEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  options: {
    label: string;
    moneyChange?: number;
    credChange?: number;
    heatChange?: number;
    relChange?: { npcId: string; delta: number };
    resultText: string;
  }[];
}

export interface GameSaveState {
  version: number;
  saveTime: string;
  playerStats: PlayerStats;
  playerPosition: { x: number; y: number; rotation: number };
  clock: { day: number; hour: number; minute: number };
  inventory: ShopItem[];
  mpesaHistory: MpesaTransaction[];
  completedMissionIds: string[];
  activeMission: Mission | null;
  availableMissionIds: string[];
  relationships: Record<string, number>;
}
