import { RandomStreetEvent } from '../types';

export const RANDOM_STREET_EVENTS: RandomStreetEvent[] = [
  {
    id: 'evt_boda_dispute',
    title: 'Boda Rider Fuel Argument',
    description: 'Two boda riders are shouting over who cut the queue at the petrol pump. A crowd is gathering and traffic is backing up.',
    location: 'Jogoo Road Highway',
    options: [
      {
        label: 'Mediate calmly: "Punguzeni hasira, barabara ni yetu sote"',
        credChange: 6,
        heatChange: -2,
        resultText: 'Both riders shook hands and cleared the road. Bystanders praised your maturity wa mtaa (+6 Street Cred).',
      },
      {
        label: 'Support the local Kayole rider forcefully',
        credChange: 8,
        heatChange: 5,
        resultText: 'The outside rider backed down. Kayole crew cheered, but Kanjo officers noticed (+8 Cred, +5 Heat).',
      },
      {
        label: 'Mind your business and walk past',
        resultText: 'You ignored the commotion and continued on your hustle.',
      },
    ],
  },
  {
    id: 'evt_kanjo_roadblock',
    title: 'Surprise Kanjo Checkpoint',
    description: 'County enforcement officers have set up an unannounced road barrier demanding trade permits and receipts.',
    location: 'CBD Approach',
    options: [
      {
        label: 'Show legit M-Pesa receipts and business card',
        credChange: 5,
        heatChange: -5,
        resultText: 'The officers were impressed with your clean documentation and waved you through (+5 Cred, -5 Heat).',
      },
      {
        label: 'Take a detour through River Road back alleys',
        heatChange: 2,
        resultText: 'You successfully dodged the roadblock by cutting through quiet back alleys (+2 Heat).',
      },
      {
        label: 'Pay "Chai ya haraka" Ksh 100',
        moneyChange: -100,
        resultText: 'Officer took the Ksh 100 note with a quick nod and let you pass.',
      },
    ],
  },
  {
    id: 'evt_suspicious_phone',
    title: 'Shady Alley Whisper',
    description: 'A young man in a worn cap pulls you aside in an alley: "Msee, niko na iPhone 14 mpya box, Ksh 3,000 tu ya chap chap."',
    location: 'Kayole Alleys',
    options: [
      {
        label: 'Decline firmly: "Hiyo ni mtego ya DCI, toka hapa"',
        credChange: 5,
        heatChange: -5,
        resultText: 'You avoided a blatant police sting operation. Inspector K sent a nod from across the street.',
      },
      {
        label: 'Buy the phone for Ksh 3,000 (Risky deal)',
        moneyChange: -3000,
        heatChange: 25,
        credChange: 10,
        resultText: 'You bought the phone! But within minutes, a message popped up: "Find My iPhone active" (+25 Heat).',
      },
      {
        label: 'Tip off Otieno and the boda security network',
        credChange: 8,
        relChange: { npcId: 'npc_otieno', delta: 15 },
        resultText: 'Otieno chased the conman away and thanked you for watching the neighborhood (+8 Cred).',
      },
    ],
  },
  {
    id: 'evt_mama_mboga_spill',
    title: 'Mama Mboga Produce Spill',
    description: 'A mama mboga carrying a huge basket of ripe tomatoes tripped on a broken pavement stone. Tomatoes are rolling everywhere.',
    location: 'Kayole Market',
    options: [
      {
        label: 'Help gather the tomatoes and give Ksh 100 assistance',
        moneyChange: -100,
        credChange: 10,
        heatChange: -5,
        relChange: { npcId: 'npc_achieng', delta: 15 },
        resultText: 'She thanked you with heartfelt blessings and estate elders took note of your kindness (+10 Street Cred).',
      },
      {
        label: 'Help gather the tomatoes quickly and move on',
        credChange: 5,
        resultText: 'She thanked you warmly for being a considerate neighbor (+5 Cred).',
      },
      {
        label: 'Walk around without stopping',
        credChange: -2,
        resultText: 'A few onlookers shook their heads at your indifference (-2 Cred).',
      },
    ],
  },
  {
    id: 'evt_blackout_party',
    title: 'Estate Power Blackout',
    description: 'Kenya Power transformers blew out in Kayole. The whole plot is plunged into pitch darkness! Generators are roaring to life.',
    location: 'Plot 42 Kayole',
    options: [
      {
        label: 'Offer your powerbank and torches to neighbors',
        credChange: 8,
        resultText: 'You became the hero of the block for the night. Neighbors shared hot mandazi with you (+8 Cred).',
      },
      {
        label: 'Stay alert and patrol the courtyard for sneak thieves',
        credChange: 12,
        heatChange: -5,
        resultText: 'You caught a petty thief attempting to break a padlock and scared him off (+12 Cred).',
      },
      {
        label: 'Sleep early in your bedsitter to save energy',
        resultText: 'You had an undisturbed night of rest and woke up fully energized.',
      },
    ],
  },
];
