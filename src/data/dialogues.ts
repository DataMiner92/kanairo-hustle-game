import { DialogueNode } from '../types';

export const DIALOGUES: Record<string, DialogueNode> = {
  // --- JEMO DIALOGUES ---
  dlg_jemo_start: {
    id: 'dlg_jemo_start',
    speaker: 'Jemo',
    speakerRole: 'Bazuu wa Mtaa (Street Connect)',
    text: 'Budaaa! Umefika salama Kayole? Hii mtaa inataka akili nyingi na roho safi. Uko na Ksh 200 kwa M-Pesa pekee—lazima uamke mapema upige hustle. Uko tayari kuanza na kazi gani?',
    choices: [
      {
        text: 'Niko tayari, Jemo! Nipe ka-job ka kwanza nianze kusurvive.',
        nextDialogueId: 'dlg_jemo_job_advice',
      },
      {
        text: 'Hii mtaa inakaa rough sana. Polisi na ma-Kanjo wako aje huku?',
        nextDialogueId: 'dlg_jemo_street_lore',
      },
      {
        text: 'Wacha kwanza nipate chapo dondo kwa Achieng niko na njaa sana.',
        nextDialogueId: 'dlg_jemo_food_advice',
      },
      {
        text: 'Niko fiti kaka, wacha nizunguke nione vile barabara inakaa.',
      },
    ],
  },
  dlg_jemo_job_advice: {
    id: 'dlg_jemo_job_advice',
    speaker: 'Jemo',
    speakerRole: 'Bazuu wa Mtaa',
    text: 'Form iko hivi: Anza kwa Achieng hapo kibandaski amebeba mizigo ya viazi, atakupa Ksh 350. Kisha niko na package inafaa kufika CBD kwa Anita. Ukipiga hizo mbili utakuwa na Ksh 1,000+ kwa M-Pesa pap!',
    choices: [
      {
        text: 'Safi sana bro! Naenda kwa Achieng sasa hivi.',
        consequences: { cred: 2 },
      },
      {
        text: 'Kuna njia ya kupata gari ama boda nitembee nayo haraka?',
        nextDialogueId: 'dlg_jemo_vehicles',
      },
    ],
  },
  dlg_jemo_street_lore: {
    id: 'dlg_jemo_street_lore',
    speaker: 'Jemo',
    speakerRole: 'Bazuu wa Mtaa',
    text: 'Kayole tuko na ma-boys wa mtaa, lakini ukiwa na heshima hakuna atakusumbua. Shida ni ukifika CBD—ma-Kanjo wanawinda ma-hawker, na DCI wanatafuta ma-gangster. Usifanye ujinga ya kukuongezea Police Heat bure!',
    choices: [
      {
        text: 'Nimekuelewa bro. Rada iko chonjo.',
        consequences: { cred: 3 },
      },
    ],
  },
  dlg_jemo_food_advice: {
    id: 'dlg_jemo_food_advice',
    speaker: 'Jemo',
    speakerRole: 'Bazuu wa Mtaa',
    text: 'Achieng anapika poa sana! Chapo madondo ni Ksh 80 pekee, inashiba masaa tano. Usiwahi kuanza siku na njaa, mwili utachoka ushindwe kukimbia!',
    choices: [
      {
        text: 'Asante Jemo, wacha niende nimuone.',
      },
    ],
  },
  dlg_jemo_vehicles: {
    id: 'dlg_jemo_vehicles',
    speaker: 'Jemo',
    speakerRole: 'Bazuu wa Mtaa',
    text: 'Hapo mbele kuna matatu "Kiboko Ya Barabara" ya Route 19 na boda ya Otieno. Ukikaribia bonyeza E uingie. Ukiendesha matatu unaweza kubeba abiria na kukusanya nauli za Ksh 70 kila mmoja!',
    choices: [
      {
        text: 'Hiyo ni hustle poa sana! Nitaijaribu.',
      },
    ],
  },

  // --- ACHIENG DIALOGUES ---
  dlg_achieng_start: {
    id: 'dlg_achieng_start',
    speaker: 'Achieng',
    speakerRole: 'Mama Kibandaski',
    text: 'Karibu mteja! Leo niko na chapo laini kama pamba, madondo ya manjano, na ugali nyama choma moto. Unakula nini leo, ama ulikuja kusaidia mama kupanga vibanda?',
    choices: [
      {
        text: 'Niko hapa kusaidia kibandaski upate delivery (Kazi ya kwanza)!',
        nextDialogueId: 'dlg_achieng_give_work',
      },
      {
        text: 'Nipe Chapo Madondo ya Ksh 80 nishibe kwanza.',
        costMoney: 80,
        reqMoney: 80,
        nextDialogueId: 'dlg_achieng_bought_food',
        consequences: { money: -80, relationship: { npcId: 'npc_achieng', delta: 10 } },
      },
      {
        text: 'Nipe Chai ya Tangawizi na Mandazi Moto (Ksh 50).',
        costMoney: 50,
        reqMoney: 50,
        nextDialogueId: 'dlg_achieng_bought_chai',
        consequences: { money: -50, relationship: { npcId: 'npc_achieng', delta: 5 } },
      },
      {
        text: 'Mama Caro amesema nini kuhusu rent leo?',
        nextDialogueId: 'dlg_achieng_gossip',
      },
      {
        text: 'Asante Mama, nitarudi baadaye.',
      },
    ],
  },
  dlg_achieng_give_work: {
    id: 'dlg_achieng_give_work',
    speaker: 'Achieng',
    speakerRole: 'Mama Kibandaski',
    text: 'Baraka zikufuate kijana! Kuna magunia mawili ya mboga nilikuwa nahitaji kusafisha na kupeleka kwa mama mboga. Umefanya kazi safi sana, chukua Ksh 350 hii kwa M-Pesa yako!',
    choices: [
      {
        text: 'Asante sana Achieng! M-Pesa imeingia.',
        consequences: {
          money: 350,
          cred: 5,
          relationship: { npcId: 'npc_achieng', delta: 15 },
        },
      },
    ],
  },
  dlg_achieng_bought_food: {
    id: 'dlg_achieng_bought_food',
    speaker: 'Achieng',
    speakerRole: 'Mama Kibandaski',
    text: 'Chakula kitamu sana! Umekula umeshiba kabisa. Sasa nenda upige kazi bila uchovu wowote!',
    choices: [
      {
        text: 'Shukran sana Mama!',
      },
    ],
  },
  dlg_achieng_bought_chai: {
    id: 'dlg_achieng_bought_chai',
    speaker: 'Achieng',
    speakerRole: 'Mama Kibandaski',
    text: 'Chai ya moto imekupa nguvu mpya na energy ya kutosha!',
    choices: [
      {
        text: 'Asante sana!',
      },
    ],
  },
  dlg_achieng_gossip: {
    id: 'dlg_achieng_gossip',
    speaker: 'Achieng',
    speakerRole: 'Mama Kibandaski',
    text: 'Yule mama Caro hana huruma hata tone! Amesema yeyote ambaye hajalipa Ksh 2,500 kufikia jioni atafungiwa kufuli kubwa ya China. Jikakamue upate pesa zake mapema!',
    choices: [
      {
        text: 'Wacha nipambane nisifungiwe bedsitter.',
      },
    ],
  },

  // --- MWAS TECH DIALOGUES ---
  dlg_mwas_start: {
    id: 'dlg_mwas_start',
    speaker: 'Mwas',
    speakerRole: 'Fundi Tech & Electronics',
    text: 'Niaje msee! Niko na screen protectors, powerbanks kali, na gadgets zote. Pia kama una deals za tech ama simu unataka tu-fix, hapa ndio base!',
    choices: [
      {
        text: 'Nunua Tempered Glass Screens (Pack ya 5) - Ksh 250 kuuza CBD kwa faida',
        reqMoney: 250,
        costMoney: 250,
        consequences: { money: -250, cred: 4 },
      },
      {
        text: 'Nunua Mtaa Disguise Hoodie (Ksh 500 - Inapunguza Police Heat)',
        reqMoney: 500,
        costMoney: 500,
        consequences: { money: -500, cred: 5, heat: -20 },
      },
      {
        text: 'Je, kuna kazi yoyote ya haraka ya tech ama consignment?',
        nextDialogueId: 'dlg_mwas_deal',
      },
      {
        text: 'Nitarudi baadaye, bro.',
      },
    ],
  },
  dlg_mwas_deal: {
    id: 'dlg_mwas_deal',
    speaker: 'Mwas',
    speakerRole: 'Fundi Tech & Electronics',
    text: 'Watu wa Luthuli Avenue CBD wanataka screen za OLED za simu. Ukinipelekea mzigo huo bila Kanjo kuweka mikono, tutagawana faida poa sana!',
    choices: [
      {
        text: 'Nipe hiyo kazi ya Luthuli!',
        consequences: { cred: 6 },
      },
    ],
  },

  // --- OTIENO BODA DIALOGUES ---
  dlg_otieno_start: {
    id: 'dlg_otieno_start',
    speaker: 'Otieno',
    speakerRole: 'Chairman wa Boda',
    text: 'Karibu Boda Stage! Sisi ndio tunafikisha watu mahali matatu haipiti. Kama unataka bike ya kazi ama deliveries za haraka, niambie.',
    choices: [
      {
        text: 'Otieno, naweza kusaidia na deliveries za Boda leo?',
        nextDialogueId: 'dlg_otieno_work',
      },
      {
        text: 'Rival stage wanasumbua barabara, tuko pamoja?',
        nextDialogueId: 'dlg_otieno_solidarity',
      },
      {
        text: 'Niko sawa kwa sasa, asante mkubwa.',
      },
    ],
  },
  dlg_otieno_work: {
    id: 'dlg_otieno_work',
    speaker: 'Otieno',
    speakerRole: 'Chairman wa Boda',
    text: 'Kuna mizigo inafaa kufika kituo cha petroli cha Jogoo Road. Ukiendesha bike yangu kwa uangalifu kuna Ksh 1,100 na heshima ya chama cha boda!',
    choices: [
      {
        text: 'Wacha nishike usukani sasa hivi!',
        consequences: { cred: 8, relationship: { npcId: 'npc_otieno', delta: 15 } },
      },
    ],
  },
  dlg_otieno_solidarity: {
    id: 'dlg_otieno_solidarity',
    speaker: 'Otieno',
    speakerRole: 'Chairman wa Boda',
    text: 'Sisi watu wa boda tuko na umoja. Ukiguswa na mtu wa mtaa jirani piga honi mara mbili, stage nzima itakua nyuma yako!',
    choices: [
      {
        text: 'Heshima kwako Chairman!',
        consequences: { cred: 5 },
      },
    ],
  },

  // --- BRAYO STREET CREW DIALOGUES ---
  dlg_brayo_start: {
    id: 'dlg_brayo_start',
    speaker: 'Brayo',
    speakerRole: 'Simba wa Kayole (Street Crew Leader)',
    text: 'Uko na sura ngeni hapa mtaa. Hapa hatutaki watu wa uoga au mateka. Kama unataka kuwa mmoja wa Maboyz wa Mtaa lazima uwe na msimamo. Una mipango gani?',
    choices: [
      {
        text: 'Natafuta doh halali na connections za nguvu mtaani.',
        nextDialogueId: 'dlg_brayo_advice',
      },
      {
        text: 'Mimi ni kijana wa mtaa. Niambie nani anazingua tumshughulikie.',
        reqCred: 20,
        nextDialogueId: 'dlg_brayo_crew_offer',
        consequences: { cred: 8, heat: 5, relationship: { npcId: 'npc_brayo', delta: 20 } },
      },
      {
        text: 'Sina maneno, nimetulia tu.',
      },
    ],
  },
  dlg_brayo_advice: {
    id: 'dlg_brayo_advice',
    speaker: 'Brayo',
    speakerRole: 'Simba wa Kayole',
    text: 'Hata ukitaka biashara safi, heshima ya mtaa inahitajika. Usiruhusu mtu yeyote akunyanganye stage yako au afunge duka lako bila sababu.',
    choices: [
      {
        text: 'Nimekuelewa kiongozi.',
      },
    ],
  },
  dlg_brayo_crew_offer: {
    id: 'dlg_brayo_crew_offer',
    speaker: 'Brayo',
    speakerRole: 'Simba wa Kayole',
    text: 'Hapo sasa! Kuna snitch anayevuja habari zetu kwa polisi. Nikusaidie kuingia kwenye syndicate kubwa inayovuna maelfu kila wiki!',
    choices: [
      {
        text: 'Niko tayari, Brayo.',
        consequences: { cred: 15 },
      },
    ],
  },

  // --- MAMA CARO LANDLADY DIALOGUES ---
  dlg_caro_start: {
    id: 'dlg_caro_start',
    speaker: 'Mama Caro',
    speakerRole: 'Landlady wa Plot 42',
    text: 'Wewe kijana! Rent ya mwezi huu Ksh 2,500 iko wapi? Umeme unapotea kila siku unalalamika lakini kulipa kodi unajifanya bubu! Nipe pesa zangu leo!',
    choices: [
      {
        text: 'Mama Caro, chukua Ksh 2,500 kamili kwa M-PESA sasa hivi.',
        reqMoney: 2500,
        costMoney: 2500,
        nextDialogueId: 'dlg_caro_paid',
        consequences: { money: -2500, cred: 20, setRentPaid: true, relationship: { npcId: 'npc_caro', delta: 35 } },
      },
      {
        text: 'Mama naomba siku mbili tu nikamilishe delivery ya CBD nitakulipa na bonasi.',
        nextDialogueId: 'dlg_caro_plea',
      },
      {
        text: 'Mbona unanifokea? Nitakulipa nitakapopata.',
        consequences: { relationship: { npcId: 'npc_caro', delta: -15 } },
      },
    ],
  },
  dlg_caro_paid: {
    id: 'dlg_caro_paid',
    speaker: 'Mama Caro',
    speakerRole: 'Landlady wa Plot 42',
    text: 'Aha! Hapo sasa ndio mwanaume kamili! Nimepokea ujumbe wa M-PESA. Nyumba ni yako kwa mwezi mwingine mzima. Endelea na bidii kijana!',
    choices: [
      {
        text: 'Asante sana Mama Caro. Nitaendelea na amani.',
      },
    ],
  },
  dlg_caro_plea: {
    id: 'dlg_caro_plea',
    speaker: 'Mama Caro',
    speakerRole: 'Landlady wa Plot 42',
    text: 'Nimekupa masaa 48 pekee! Ukishindwa nitakuwekea padlock ya kichina ule kwa kibanda cha Achieng usiku kucha!',
    choices: [
      {
        text: 'Nitajituma nilete pesa mapema.',
      },
    ],
  },

  // --- INSPECTOR K (DCI) DIALOGUES ---
  dlg_inspector_start: {
    id: 'dlg_inspector_start',
    speaker: 'Inspector K',
    speakerRole: 'Afande wa DCI (Special Unit)',
    text: 'Nimekuona ukizunguka kutoka Kayole hadi CBD. Ninajua historia yako yote kijana. Jiji hili lina pande mbili: unaweza kumezwa na wahalifu au unaweza kutusaidia kusafisha mitaa.',
    choices: [
      {
        text: 'Afande, mimi ni hustler tu natafuta riziki ya kisheria.',
        nextDialogueId: 'dlg_inspector_recruit',
      },
      {
        text: 'Niko tayari kuwa undercover agent wako. Nitakupa intel zote za mtaa.',
        reqCred: 25,
        nextDialogueId: 'dlg_inspector_accept_agent',
        consequences: { careerChange: 'DCI_UNDERCOVER', cred: 15, heat: -30, relationship: { npcId: 'npc_inspector_k', delta: 40 } },
      },
      {
        text: 'Je, unaweza kunisaidia kupunguza Police Heat niliyonayo?',
        reqMoney: 1000,
        costMoney: 1000,
        nextDialogueId: 'dlg_inspector_clear_heat',
        consequences: { money: -1000, heat: -40 },
      },
      {
        text: 'Sina mambo na serikali, afande.',
      },
    ],
  },
  dlg_inspector_recruit: {
    id: 'dlg_inspector_recruit',
    speaker: 'Inspector K',
    speakerRole: 'Afande wa DCI',
    text: 'Kama unataka riziki safi utalindwa. Lakini nikiona unashirikiana na genge la silaha ama magendo, tutakutafuta hadi kitandani kwako. Shika namba hii, ukinusa jambo nifahamishe.',
    choices: [
      {
        text: 'Nimeelewa afande. Heshima kwako.',
      },
    ],
  },
  dlg_inspector_accept_agent: {
    id: 'dlg_inspector_accept_agent',
    speaker: 'Inspector K',
    speakerRole: 'Afande wa DCI',
    text: 'Karibu katika kikosi cha siri (DCI Special Operative). Jina lako litafutwa kwenye orodha ya washukiwa. Pata taarifa za mafuta ghushi na mipango ya mitaa utuletee Central.',
    choices: [
      {
        text: 'Kazi imeanza Afande!',
      },
    ],
  },
  dlg_inspector_clear_heat: {
    id: 'dlg_inspector_clear_heat',
    speaker: 'Inspector K',
    speakerRole: 'Afande wa DCI',
    text: 'Nimewasiliana na stesheni za mtaa kufuta ripoti ya dharura iliyotolewa dhidi yako. Kaa chini na usijitie matatani tena!',
    choices: [
      {
        text: 'Shukran sana Afande.',
      },
    ],
  },

  // --- OFFICER MUTUA (KANJO) DIALOGUES ---
  dlg_mutua_start: {
    id: 'dlg_mutua_start',
    speaker: 'Officer Mutua',
    speakerRole: 'County Enforcement (Kanjo)',
    text: 'Simama hapo! CBD si soko ya kila mtu kutupa vitu chini. License ya County iko wapi ama nikuweke kwa gari ya impound tuende City Hall?',
    choices: [
      {
        text: 'Lipa faini rasmi ya County (Ksh 300)',
        reqMoney: 300,
        costMoney: 300,
        nextDialogueId: 'dlg_mutua_paid_fine',
        consequences: { money: -300, heat: -15 },
      },
      {
        text: '"Afande, ongea kando... chukua soda ya Ksh 150 tukubaliane."',
        reqMoney: 150,
        costMoney: 150,
        nextDialogueId: 'dlg_mutua_bribe',
        consequences: { money: -150, cred: 5, heat: 5 },
      },
      {
        text: 'Kimbia! (Chomoka mbio)',
        consequences: { heat: 25, cred: 6 },
      },
    ],
  },
  dlg_mutua_paid_fine: {
    id: 'dlg_mutua_paid_fine',
    speaker: 'Officer Mutua',
    speakerRole: 'County Enforcement',
    text: 'Hii receipt yako. Unaweza kufanya shughuli zako kwa amani hadi jioni. Fuata sheria kijana.',
    choices: [{ text: 'Asante Afande.' }],
  },
  dlg_mutua_bribe: {
    id: 'dlg_mutua_bribe',
    speaker: 'Officer Mutua',
    speakerRole: 'County Enforcement',
    text: 'Hahaha, kijana mjanja sana! Nimepokea soda. Toka hapa kabla mkubwa wangu hajafika na gari kubwa.',
    choices: [{ text: 'Rada safi afande!' }],
  },

  // --- ANITA (CBD HAWKER) DIALOGUES ---
  dlg_anita_start: {
    id: 'dlg_anita_start',
    speaker: 'Anita',
    speakerRole: 'Mwenyekiti wa Hawkers CBD',
    text: 'Niaje mwenzangu! Umefika Tom Mboya Street. Hapa ndio moyo wa biashara ya haraka Nairobi. Tuko na wateja maelfu kila saa, lakini macho lazima yawe pande zote!',
    choices: [
      {
        text: 'Uza Screen Protectors ulizochukua kwa Mwas (Pata Ksh 600)',
        nextDialogueId: 'dlg_anita_sell_screens',
        consequences: { money: 600, cred: 8 },
      },
      {
        text: 'Unajuaje wakati ma-Kanjo wanakaribia kufanya msako?',
        nextDialogueId: 'dlg_anita_kanjo_radar',
      },
      {
        text: 'Tuko pamoja dada, acha nisonge na biashara.',
      },
    ],
  },
  dlg_anita_sell_screens: {
    id: 'dlg_anita_sell_screens',
    speaker: 'Anita',
    speakerRole: 'Mwenyekiti wa Hawkers CBD',
    text: 'Wateja wamenunua screen zote mbio sana! Chukueni faida yenu Ksh 600. Karibu tena na mzigo mpya!',
    choices: [{ text: 'Asante sana Anita!' }],
  },
  dlg_anita_kanjo_radar: {
    id: 'dlg_anita_kanjo_radar',
    speaker: 'Anita',
    speakerRole: 'Mwenyekiti wa Hawkers CBD',
    text: 'Tuko na ma-whistleblowers kila corner. Wakianza kupiga miluzi tu, tunakunja bidhaa kwa sekunde tano na kupotea kwenye arcades!',
    choices: [{ text: 'Mbinu kali sana!' }],
  },
};
