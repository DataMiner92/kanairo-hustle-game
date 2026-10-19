import { Mission, CareerPath } from '../types';

interface GeneratorContext {
  playerCred: number;
  playerHeat: number;
  career: CareerPath;
  zone: string;
}

const CLIENTS = [
  { name: 'Jemo', role: 'Street Connect', zone: 'kayole' },
  { name: 'Achieng', role: 'Kibandaski Queen', zone: 'kayole' },
  { name: 'Mwas', role: 'Electronics Specialist', zone: 'kayole' },
  { name: 'Otieno', role: 'Boda Chairman', zone: 'kayole' },
  { name: 'Anita', role: 'CBD Hawker Leader', zone: 'cbd' },
  { name: 'Inspector K', role: 'DCI Special Unit', zone: 'cbd' },
  { name: 'Stage Chairman', role: 'Matatu Union Boss', zone: 'cbd' },
  { name: 'Pastor John', role: 'Community Elder', zone: 'kayole' },
];

const TEMPLATES = [
  {
    type: 'DELIVERY',
    titleTpl: ['Express Parcel Drop', 'Quick Hardware Supply', 'Fresh Produce Dropoff', 'Secret Document Handover'],
    descTpl: 'Deliver critical supplies across town before the schedule slips.',
    baseReward: 750,
    credGain: 4,
    heatGain: 1,
    timeLimit: 120,
  },
  {
    type: 'TRANSPORT',
    titleTpl: ['Rush Hour Matatu Commute', 'VIP City Shuttle', 'Midnight Staff Pickup', 'Airport Shuttle Express'],
    descTpl: 'Ferry passengers safely through high traffic areas along Jogoo Road to CBD.',
    baseReward: 1200,
    credGain: 8,
    heatGain: 4,
    timeLimit: 150,
  },
  {
    type: 'NEGOTIATION',
    titleTpl: ['Stage Turf Truce', 'Vendor Dispute Settlement', 'License Settlement', 'Estate Boundary Agreement'],
    descTpl: 'Mediate a heated disagreement between conflicting parties on the street.',
    baseReward: 900,
    credGain: 10,
    heatGain: -2,
  },
  {
    type: 'SURVEILLANCE',
    titleTpl: ['Undercover Stakeout', 'Checkpoint Monitoring', 'Rival Crew Recon', 'Wholesale Market Watch'],
    descTpl: 'Keep an eye on key locations and gather valuable intelligence without getting caught.',
    baseReward: 1500,
    credGain: 12,
    heatGain: 2,
  },
  {
    type: 'BUSINESS',
    titleTpl: ['Market Arbitrage Hustle', 'Bulk Spare Part Sale', 'Event Sound Rig Setup', 'Boda Fleet Servicing'],
    descTpl: 'Invest capital or labor into expanding local commercial ventures for a high return.',
    baseReward: 1800,
    credGain: 15,
    heatGain: 0,
  },
  {
    type: 'CONFLICT',
    titleTpl: ['Extortion Ring Pushback', 'Kanjo Raid Alert', 'Counterfeit Ring Raid', 'Estate Security Sweep'],
    descTpl: 'Stand your ground and protect local business interests from unlawful exploitation.',
    baseReward: 2200,
    credGain: 18,
    heatGain: 8,
  },
];

const TARGET_COORDS = [
  { x: 750, y: 1480, label: 'Kayole Food Quarter' },
  { x: 980, y: 1490, label: 'Kayole Electronics Hub' },
  { x: 1310, y: 1540, label: 'Kayole Matatu Stage' },
  { x: 2410, y: 1160, label: 'Jogoo Road Highway Station' },
  { x: 3590, y: 1480, label: 'CBD Koja Matatu Hub' },
  { x: 3700, y: 970, label: 'Tom Mboya Street Market' },
  { x: 4120, y: 1480, label: 'Marikiti Wholesale Hub' },
  { x: 4470, y: 880, label: 'Central Police Perimeter' },
  { x: 4940, y: 1430, label: 'Kenya Trade Hub CBD' },
];

let proceduralCounter = 1;

export function generateProceduralMission(ctx: GeneratorContext): Mission {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const client = CLIENTS[Math.floor(Math.random() * CLIENTS.length)];
  const target = TARGET_COORDS[Math.floor(Math.random() * TARGET_COORDS.length)];
  const titleName = template.titleTpl[Math.floor(Math.random() * template.titleTpl.length)];

  // Scale reward based on Cred and career
  const credMultiplier = 1 + (ctx.playerCred / 100) * 1.5;
  const reward = Math.round(template.baseReward * credMultiplier);
  const credReward = template.credGain + Math.floor(ctx.playerCred / 25);

  const missionId = `proc_${Date.now()}_${proceduralCounter++}`;

  return {
    id: missionId,
    title: `${titleName} (#${proceduralCounter})`,
    client: client.name,
    zone: target.x > 3000 ? 'cbd' : target.x > 1800 ? 'highway' : 'kayole',
    description: `${client.name} (${client.role}): "${template.descTpl}"`,
    objective: `Travel to ${target.label} and complete the hustle.`,
    targetLocation: {
      x: target.x,
      y: target.y,
      label: target.label,
      radius: 90,
    },
    rewardMoney: reward,
    rewardCred: credReward,
    heatImpact: template.heatGain,
    timeLimitSeconds: template.timeLimit,
    remainingTime: template.timeLimit,
    status: 'AVAILABLE',
    isProcedural: true,
  };
}
