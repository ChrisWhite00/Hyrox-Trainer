import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// PROFIL : Homme | DM 40-60kg | Squat gob 24-30kg | RDL 65-80kg
// Stations faibles : Burpee BJ ⚡ Sandbag Lunges ⚡ Wall Ball ⚡ Sled ⚡
// Progression ONDULATOIRE : semaines impaires = VOLUME · paires = INTENSITÉ
// Phase 1 S1-8 · Phase 2 S9-17 · Phase 3 S18-26 · Objectif 1h15 duo
// ═══════════════════════════════════════════════════════════════════════════

const r25 = w => Math.round(w / 2.5) * 2.5;
const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const getPhaseNum = w => w<=8?1:w<=17?2:3;
const getPhaseStart = p => [0,1,9,18][p];
const getPhaseData = w => PHASES[getPhaseNum(w)-1];
const getSession = (w,s) => SESSIONS[getPhaseNum(w)][s];
const getWeekType = w => { const p=getPhaseNum(w),pos=w-getPhaseStart(p); return pos%2===0?"vol":"int"; };
const getWP = (key,week) => {
  const prog=WEIGHT_PROG[key]; if(!prog) return null;
  const p=getPhaseNum(week),pos=week-getPhaseStart(p);
  const isInt=pos%2===1,period=Math.floor(pos/2);
  const pd=prog[`p${p}`]; if(!pd) return null;
  const v=isInt?pd.int:pd.vol;
  return { w:r25(v.w+period*v.inc), s:v.s, r:v.r, u:v.u||"kg", type:isInt?"INTENSITÉ":"VOLUME" };
};

// ─── POIDS PAR SEMAINE (progression ondulatoire) ────────────────────────────
// Format : p1/p2/p3 × vol/int → { w=base, inc=+/2semaines, s=séries, r=reps, u=unité }
const WEIGHT_PROG = {
  mil_press:    { p1:{vol:{w:40,inc:2.5,s:4,r:"10"},  int:{w:47.5,inc:2.5,s:4,r:"5"}},
                  p2:{vol:{w:47.5,inc:2.5,s:4,r:"8"}, int:{w:57.5,inc:2.5,s:5,r:"4"}},
                  p3:{vol:{w:52.5,inc:2.5,s:3,r:"8"}, int:{w:60,inc:2.5,s:3,r:"4"}} },
  rowing_barre: { p1:{vol:{w:50,inc:5,s:4,r:"10"},    int:{w:62.5,inc:5,s:4,r:"5"}},
                  p2:{vol:{w:65,inc:5,s:5,r:"8"},      int:{w:80,inc:5,s:5,r:"4"}},
                  p3:{vol:{w:72.5,inc:5,s:3,r:"8"},    int:{w:87.5,inc:5,s:3,r:"4"}} },
  dips:         { p1:{vol:{w:0,inc:2.5,s:3,r:"12",u:"kg lest"},    int:{w:5,inc:2.5,s:3,r:"7",u:"kg lest"}},
                  p2:{vol:{w:7.5,inc:2.5,s:4,r:"10",u:"kg lest"}, int:{w:15,inc:2.5,s:4,r:"6",u:"kg lest"}},
                  p3:{vol:{w:12.5,inc:2.5,s:3,r:"10",u:"kg lest"},int:{w:20,inc:2.5,s:3,r:"6",u:"kg lest"}} },
  push_press:   { p1:{vol:{w:35,inc:2.5,s:4,r:"8"},   int:{w:42.5,inc:2.5,s:4,r:"5"}},
                  p2:{vol:{w:42.5,inc:2.5,s:4,r:"8"}, int:{w:52.5,inc:2.5,s:4,r:"4"}},
                  p3:{vol:{w:47.5,inc:2.5,s:3,r:"8"}, int:{w:57.5,inc:2.5,s:3,r:"4"}} },
  bench:        { p2:{vol:{w:55,inc:2.5,s:4,r:"8"},   int:{w:67.5,inc:2.5,s:5,r:"4"}},
                  p3:{vol:{w:60,inc:2.5,s:3,r:"8"},   int:{w:72.5,inc:2.5,s:3,r:"4"}} },
  tractions:    { p1:{vol:{w:0,inc:0,s:4,r:"8",u:"anneaux"},      int:{w:0,inc:0,s:4,r:"6",u:"anneaux"}},
                  p2:{vol:{w:0,inc:2.5,s:4,r:"6",u:"kg lest"},   int:{w:5,inc:2.5,s:4,r:"4",u:"kg lest"}},
                  p3:{vol:{w:5,inc:2.5,s:3,r:"6",u:"kg lest"},   int:{w:10,inc:2.5,s:3,r:"4",u:"kg lest"}} },
  rdl:          { p1:{vol:{w:65,inc:5,s:4,r:"10"},   int:{w:80,inc:5,s:4,r:"5"}},
                  p2:{vol:{w:80,inc:5,s:4,r:"8"},    int:{w:95,inc:5,s:4,r:"4"}},
                  p3:{vol:{w:90,inc:5,s:3,r:"8"},    int:{w:107.5,inc:5,s:3,r:"4"}} },
  squat_gob:    { p1:{vol:{w:24,inc:4,s:4,r:"12"},  int:{w:28,inc:4,s:4,r:"8"}},
                  p2:{vol:{w:32,inc:4,s:3,r:"12"},  int:{w:36,inc:4,s:3,r:"8"}},
                  p3:{vol:{w:36,inc:4,s:3,r:"12"},  int:{w:40,inc:4,s:3,r:"8"}} },
  front_sq:     { p2:{vol:{w:50,inc:5,s:5,r:"6"},   int:{w:62.5,inc:5,s:5,r:"4"}},
                  p3:{vol:{w:60,inc:5,s:3,r:"6"},   int:{w:72.5,inc:5,s:3,r:"4"}} },
  hip_thrust:   { p1:{vol:{w:50,inc:5,s:3,r:"15"},  int:{w:65,inc:5,s:4,r:"10"}},
                  p2:{vol:{w:65,inc:5,s:4,r:"12"},  int:{w:80,inc:5,s:4,r:"8"}},
                  p3:{vol:{w:75,inc:5,s:3,r:"12"},  int:{w:90,inc:5,s:3,r:"8"}} },
  bulgarian:    { p1:{vol:{w:14,inc:2,s:3,r:"12/j",u:"kg/m"}, int:{w:18,inc:2,s:3,r:"8/j",u:"kg/m"}},
                  p2:{vol:{w:18,inc:2,s:4,r:"10/j",u:"kg/m"}, int:{w:22,inc:2,s:4,r:"6/j",u:"kg/m"}},
                  p3:{vol:{w:22,inc:2,s:3,r:"10/j",u:"kg/m"}, int:{w:26,inc:2,s:3,r:"6/j",u:"kg/m"}} },
  lunge_barre:  { p2:{vol:{w:30,inc:5,s:4,r:"12/j"}, int:{w:40,inc:5,s:4,r:"8/j"}},
                  p3:{vol:{w:40,inc:5,s:3,r:"12/j"}, int:{w:50,inc:5,s:3,r:"8/j"}} },
  good_morning: { p1:{vol:{w:20,inc:2.5,s:3,r:"12"}, int:{w:27.5,inc:2.5,s:3,r:"8"}},
                  p2:{vol:{w:27.5,inc:2.5,s:3,r:"10"},int:{w:35,inc:2.5,s:3,r:"6"}},
                  p3:{vol:{w:32.5,inc:2.5,s:2,r:"10"},int:{w:40,inc:2.5,s:2,r:"6"}} },
  step_up:      { p2:{vol:{w:16,inc:2,s:3,r:"10/j",u:"kg/m"}, int:{w:20,inc:2,s:3,r:"8/j",u:"kg/m"}},
                  p3:{vol:{w:20,inc:2,s:3,r:"10/j",u:"kg/m"}, int:{w:24,inc:2,s:3,r:"8/j",u:"kg/m"}} },
};

const PHASES = [
  { id:1,name:"PHASE 1",subtitle:"Développement & Volume",weeks:[1,2,3,4,5,6,7,8],color:"#F97316",
    difficulty:"6 → 7.5/10",desc:"Volume intermédiaire. Références chrono établies dès S1. Force construite avec progression ondulatoire. Finishers métaboliques pour la perte de poids." },
  { id:2,name:"PHASE 2",subtitle:"Intensification & Vitesse",weeks:[9,10,11,12,13,14,15,16,17],color:"#EAB308",
    difficulty:"7.5 → 9/10",desc:"Race pace sur toutes les stations. Charges maximales en renforcement. Enchaînements de stations pour simuler la fatigue cumulée." },
  { id:3,name:"PHASE 3",subtitle:"Performance & Pic",weeks:[18,19,20,21,22,23,24,25,26],color:"#22C55E",
    difficulty:"9 → 10/10",desc:"Distances et charges de compétition. Simulation complète. Affûtage. Objectif 1h15 duo validé en séance avant le jour J." },
];

const WEEK_NOTES = {
  vol: { label:"SEMAINE VOLUME",  color:"#60A5FA", desc:"Reps hautes, charges à 70%. Technique parfaite, endurance de force. Récupération partielle (60s)." },
  int: { label:"SEMAINE INTENSITÉ", color:"#EF4444", desc:"Reps basses, charges à 82%. Récupération COMPLÈTE entre les séries (90-120s). Explosivité maximale." },
};

const STATIONS_REF = [
  { name:"SkiErg",         icon:"⛷️",  dist:"500m",     obj:"< 2:00" },
  { name:"Sled Push",      icon:"🛷",  dist:"25m",      obj:"< 0:45" },
  { name:"Sled Pull",      icon:"💪",  dist:"25m",      obj:"< 0:45" },
  { name:"Burpee BJ",      icon:"🔥",  dist:"40m×2",    obj:"< 3:00" },
  { name:"Rowing",         icon:"🚣",  dist:"500m",     obj:"< 2:00" },
  { name:"Farmer Carry",   icon:"🏋️", dist:"100m",     obj:"< 1:00" },
  { name:"Sandbag Lunges", icon:"🎒",  dist:"50m×2",    obj:"< 3:00" },
  { name:"Wall Ball",      icon:"🏀",  dist:"50 reps",  obj:"< 3:00" },
];

const WARMUP = [
  { zone:"CERVICALES", icon:"🔵", color:"#60A5FA", exos:[
    { name:"Rotations cervicales",    detail:"10 reps × 2 sens",         note:"Lentes, menton vers épaule" },
    { name:"Inclinaisons latérales",  detail:"8 reps × 2 côtés",         note:"Oreille vers épaule, sans forcer" },
  ]},
  { zone:"ÉPAULES & POIGNETS", icon:"🟡", color:"#EAB308", exos:[
    { name:"Cercles bras tendus",     detail:"10 avant + 10 arrière",    note:"Amplitude max, bras à l'horizontal" },
    { name:"Rotations coudes",        detail:"10 reps × 2 sens",         note:"Coudes à 90°" },
    { name:"Rotations poignets",      detail:"15 reps × 2 sens",         note:"Doigts entrelacés" },
  ]},
  { zone:"THORACIQUE & HANCHES", icon:"🟠", color:"#F97316", exos:[
    { name:"Cat-Cow",                 detail:"10 reps",                   note:"Inspiration extension / expiration flexion" },
    { name:"Rotations thoraciques",   detail:"8 reps × 2 côtés",         note:"Main derrière tête, regard plafond" },
    { name:"Cercles de hanches",      detail:"10 reps × 2 sens",         note:"Grands cercles, mains sur hanches" },
    { name:"Hip flexor dynamique",    detail:"8 reps × 2 côtés",         note:"Fente basse + rotation bras opposé en haut" },
  ]},
  { zone:"GENOUX & CHEVILLES", icon:"🔴", color:"#EF4444", exos:[
    { name:"Cercles de genoux",       detail:"15 × 2 sens × 2 côtés",    note:"⚠️ Doux — genou légèrement fléchi" },
    { name:"Squat de mobilité",       detail:"10 reps (3s descente)",     note:"Talons au sol, bras tendus, profondeur max" },
    { name:"Rotations de chevilles",  detail:"12 × 2 sens × 2 pieds",    note:"Pied décollé, cercles complets" },
  ]},
  { zone:"ACTIVATION", icon:"🟢", color:"#22C55E", exos:[
    { name:"Inchworm",                detail:"6 reps",                    note:"Debout → planche → retour, dos droit" },
    { name:"World's greatest stretch",detail:"5 reps × 2 côtés",         note:"Fente + coude sol + rotation bras haut" },
    { name:"Jumping jacks",           detail:"30 secondes",               note:"Température corporelle" },
  ]},
];

// ─── SESSIONS ────────────────────────────────────────────────────────────────
// Exercices avec `key` → poids vient de WEIGHT_PROG[key]
// Exercices sans `key` → sets/reps fixes (hyrox, core, genoux)
// isFocus: true → +1 série, badge ⚡ STATION FAIBLE

const SESSIONS = {
  1: {
    A: {
      name:"HAUT + ASSAULT BIKE", duration:"60–70 min",
      stations:["SkiErg","Rowing","Burpee BJ"],
      focus:["SkiErg","Rowing","Burpee BJ ⚡","Push/Pull Force"],
      strength:[
        { key:"mil_press",    name:"Développé militaire barre",   rest:90,  note:"Barre passe devant le visage. Omoplates serrées en bas." },
        { key:"rowing_barre", name:"Rowing barre prise pronation", rest:90,  note:"Dos à 45°, barre vers le nombril. Omoplate serrée en fin." },
        { key:"dips",         name:"Dips (parallèles ou anneaux)", rest:75,  note:"Descente 3s. Poitrine légèrement penchée en avant." },
        { key:"push_press",   name:"Push Press barre",             rest:75,  note:"Légère flexion → extension explosive → barre au-dessus. Puissance = SkiErg." },
      ],
      core:[
        { name:"Ab wheel rollout",     sets:3, reps:"8–10",      rest:60, note:"Amplitude max. Ne pas s'affaisser en extension." },
        { name:"Hollow hold",           sets:3, reps:"35s",       rest:45, note:"Bas du dos au sol. Bras et jambes tendus." },
        { name:"Pallof press élastique",sets:3, reps:"12/côté",   rest:45, note:"Bras tendus = gainage anti-rotation." },
      ],
      hyrox:[
        { name:"SkiErg",            sets:4, reps:"300m",  rest:90,  note:"⛷️ Chrono chaque série. Objectif P1 : < 1:15/300m. Notez vos temps." },
        { name:"Rowing intervalle",  sets:5, reps:"250m",  rest:60,  note:"🚣 Drive jambes 60% / dos 20% / bras 20%. Objectif : < 1:00/250m." },
        { name:"Burpee Broad Jump",  sets:5, reps:"20m",   rest:90,  note:"🔥 Saut MAX vers l'avant. Bras au-dessus. Objectif ≥ 14 reps/20m.", isFocus:true },
      ],
      airbike:{ title:"POWER INTERVALS", sets:6, work:"30s", rest:"90s", effort:"MAX",
        note:"6 × 30s effort MAXIMAL / 90s repos. Comptez les calories à chaque sprint. Objectif : score régulier sprint 1→6." },
      finisher:{ type:"emom", duration:14, note:"Min impairs : 200m SkiErg. Min pairs : 8 Burpee BJ. Le reste = repos.",
        oddMin:{name:"SkiErg",reps:"200m"}, evenMin:{name:"Burpee BJ",reps:"8 reps"} }
    },
    B: {
      name:"BAS + CHARGES LOURDES", duration:"60–70 min",
      stations:["Sled Push","Sled Pull","Farmer Carry","Sandbag Lunges","Wall Ball"],
      focus:["Sled P+P ⚡","Sandbag ⚡","Wall Ball ⚡","RDL/Hip Thrust"],
      strength:[
        { key:"rdl",         name:"Romanian Deadlift barre",  rest:90,  note:"Dos neutre, gainage total. Tension ischios max en bas." },
        { key:"bulgarian",   name:"Bulgarian Split Squat",     rest:90,  note:"⚠️ Genoux : pied arrière banc 40cm. Descente 3s. Haltères." },
        { key:"hip_thrust",  name:"Hip Thrust barre",          rest:75,  note:"Protection hanches. Pause 1s en haut. Fessiers = moteur Sled." },
        { key:"good_morning",name:"Good Morning barre",        rest:75,  note:"Charnière hanches, dos droit. Endurance lombaire = Sled 25m." },
      ],
      core:[
        { name:"Ab wheel rollout",          sets:3, reps:"8",        rest:60, note:"Gainage complet. Dos neutre en extension." },
        { name:"Hollow hold",                sets:3, reps:"35s",      rest:45, note:"Corps rigide. Base du gainage fonctionnel." },
        { name:"Planche latérale dynamique", sets:3, reps:"10/côté",  rest:45, note:"Abaisser et remonter la hanche 10×. Gainage latéral actif." },
      ],
      knee:[
        { name:"TKE élastique",       sets:3, reps:"15/j",   rest:45, note:"Élastique derrière genou. Extension finale → contraction VMO. Genou droit en fin." },
        { name:"Step-down excentrique",sets:3, reps:"8/j",   rest:60, note:"Sur marche 20cm. Descente LENTE 5s sur 1 pied. Renforce sous charge." },
        { name:"Copenhagen plank",     sets:3, reps:"20s/côté",rest:45,note:"Pied sur banc, corps en planche latérale. Adducteurs + stabilité genou." },
      ],
      hyrox:[
        { name:"Sled Push + Pull",    sets:5, reps:"20m+20m", rest:90,  note:"🛷💪 Dos à 45° Push. Pas alternés Pull. Charge : 100kg. Chrono A/R.", isFocus:true },
        { name:"Farmer Carry",         sets:4, reps:"50m",     rest:75,  note:"🏋️ 24kg/main. Épaules basses. Pas courts. 50m sans poser." },
        { name:"Sandbag Lunges",       sets:5, reps:"15m",     rest:90,  note:"🎒 Sac 20kg. Poitrine haute, genou arrière proche sol. Chrono.", isFocus:true },
        { name:"Wall Ball",            sets:5, reps:"15",       rest:75,  note:"🏀 9kg. Squat complet. Unbroken. Chrono chaque série.", isFocus:true },
      ],
      finisher:{ type:"amrap", duration:12, note:"Pace de course. Régulier. Notez vos rounds — c'est votre référence Phase 1.",
        exercises:[{name:"15m Sled Push",reps:"15m"},{name:"10 Wall Ball",reps:"10"},{name:"15m Sandbag Lunges",reps:"15m"}] }
    }
  },
  2: {
    A: {
      name:"HAUT + RACE PACE", duration:"65–70 min",
      stations:["SkiErg","Rowing","Burpee BJ"],
      focus:["SkiErg vitesse","Rowing force","Burpee BJ ⚡ volume","Puissance"],
      strength:[
        { key:"bench",        name:"Développé couché haltères / barre", rest:120, note:"Phase 2 → passage au couché. Explosif à la montée." },
        { key:"rowing_barre", name:"Rowing barre Pendlay",               rest:120, note:"Barre décolle du sol chaque rep. Dos horizontal. Force dorsale pure." },
        { key:"push_press",   name:"Push Press barre",                   rest:90,  note:"+charge vs P1. Explosivité max. Puissance directement transférable au SkiErg." },
        { key:"tractions",    name:"Tractions / Ring Rows lestés",       rest:90,  note:"Phase 2 : lest si possible. Grand dorsal = moteur SkiErg + Rowing." },
      ],
      core:[
        { name:"Ab wheel rollout",   sets:4, reps:"10",       rest:60, note:"Amplitude maximale. +1 série vs P1." },
        { name:"L-sit (anneaux)",     sets:3, reps:"20s",      rest:60, note:"Jambes tendues ou genoux si trop difficile. Gainage complet." },
        { name:"Pallof press lourd",  sets:3, reps:"12/côté",  rest:45, note:"+résistance vs P1. Anti-rotation de course." },
      ],
      hyrox:[
        { name:"SkiErg RACE PACE",   sets:3, reps:"500m",  rest:180, note:"⛷️ OBJECTIF DUO : < 2:00. Full effort. Notez vos 3 temps." },
        { name:"Rowing RACE PACE",   sets:3, reps:"500m",  rest:180, note:"🚣 OBJECTIF DUO : < 2:00. Split cible 1:55. Notez temps + split." },
        { name:"Burpee BJ for time", sets:4, reps:"40m",   rest:180, note:"🔥 OBJECTIF DUO : < 3:00/40m. Notez vos 4 temps.", isFocus:true },
      ],
      airbike:{ title:"TABATA ASSAULT BIKE", sets:8, work:"20s", rest:"10s", effort:"MAXIMAL",
        note:"8 × 20s effort MAXIMAL / 10s repos. Comptez calories/round. Objectif : rester > 8 cal jusqu'au bout. Équivalent SkiErg race pace." },
      finisher:{ type:"chipper", note:"FOR TIME — Étalon Phase 2 haut du corps. Notez votre chrono total.",
        exercises:[{name:"500m SkiErg",reps:"500m"},{name:"15 Burpee BJ",reps:"15"},{name:"500m Rowing",reps:"500m"},{name:"15 Burpee BJ",reps:"15"}] }
    },
    B: {
      name:"BAS + SIMULATION STATIONS", duration:"65–70 min",
      stations:["Sled Push","Sled Pull","Farmer Carry","Sandbag Lunges","Wall Ball"],
      focus:["Sled ⚡ lourd","Sandbag ⚡ endurance","WB ⚡ unbroken","Force max bas"],
      strength:[
        { key:"front_sq",    name:"Front Squat barre",         rest:120, note:"⚠️ Genoux dans l'axe. Coudes hauts. Descente 3s. Puissance = Sled Push." },
        { key:"rdl",         name:"Romanian Deadlift barre",   rest:120, note:"+charge vs P1. Tension ischios maximale. Gainage constant." },
        { key:"lunge_barre", name:"Fentes marchées barre",     rest:90,  note:"⚠️ Genoux : amplitude contrôlée. Barre sur trapèzes. Identique Sandbag Lunges." },
        { key:"step_up",     name:"Step-up explosif haltères", rest:75,  note:"Box 50cm. Montée explosive. Descente contrôlée. Puissance = Sled." },
      ],
      core:[
        { name:"Copenhagen plank",  sets:4, reps:"25s/côté", rest:45, note:"Pied ou genou sur banc. Adducteurs + stabilité genou. +dur vs P1." },
        { name:"Nordic curl",        sets:3, reps:"5–8",      rest:90, note:"Ischios excentriques. Descente lente 5s, aide bras à la remontée." },
        { name:"Ab wheel rollout",   sets:3, reps:"10",       rest:60, note:"Maintien P1. Gainage total." },
      ],
      knee:[
        { name:"TKE élastique",         sets:3, reps:"15/j",   rest:45, note:"+résistance vs P1." },
        { name:"Nordic curl",            sets:3, reps:"5–8",    rest:90, note:"Ischio = protection genou. Descente 5s, montée aidée." },
        { name:"VMO isométrique",        sets:3, reps:"45s",    rest:60, note:"Squat 90° sur 1 jambe, genou légèrement devant orteils. VMO." },
      ],
      hyrox:[
        { name:"Sled Push+Pull ENCHAÎNÉ",sets:5, reps:"25m+25m", rest:120, note:"🛷💪 Charge compétition (~150kg). Chrono A/R. Objectif : < 1:30 A/R.", isFocus:true },
        { name:"Farmer Carry lourd",      sets:4, reps:"50m",     rest:75,  note:"🏋️ 32kg/main. 50m sans poser." },
        { name:"Sandbag Lunges",          sets:5, reps:"25m",     rest:90,  note:"🎒 20kg. Chrono chaque série. Objectif : 25m < 1:30.", isFocus:true },
        { name:"Wall Ball UNBROKEN",      sets:5, reps:"20",       rest:90,  note:"🏀 NE POSEZ PAS. 9kg. Chrono chaque série.", isFocus:true },
      ],
      finisher:{ type:"rounds", sets:4, rest:60, note:"4 rounds. Notez le temps de chaque round. Objectif : régularité.",
        exercises:[{name:"10 Wall Ball",reps:"10"},{name:"15m Sandbag Lunges",reps:"15m"},{name:"5 Burpee BJ",reps:"5"}] }
    }
  },
  3: {
    A: {
      name:"SIMULATION COURSE — HAUT", duration:"65–70 min",
      stations:["SkiErg","Rowing","Burpee BJ"],
      focus:["SkiErg compète","Rowing splits","Burpee BJ ⚡ distance","Maintien force"],
      strength:[
        { key:"bench",        name:"Développé couché maintien",    rest:120, note:"Charge Phase 2. Volume -20%. Qualité > quantité." },
        { key:"rowing_barre", name:"Rowing barre maintien",         rest:120, note:"Charge Phase 2. Maintien des gains." },
        { key:"push_press",   name:"Push Press maintien",           rest:90,  note:"Explosivité max. Volume réduit." },
        { key:"tractions",    name:"Face pull + rotation externe",  rest:60,  note:"3×15. Santé épaules avant compétition. Incontournable." },
      ],
      core:[
        { name:"Ab wheel rollout",    sets:3, reps:"10",       rest:60, note:"Maintien P2. Amplitude maximale." },
        { name:"Hollow hold",          sets:3, reps:"45s",      rest:45, note:"+10s vs P2. Gainage de course." },
        { name:"Pallof press lourd",   sets:3, reps:"12/côté",  rest:45, note:"Charge max P2." },
      ],
      hyrox:[
        { name:"500m SkiErg × 2",    sets:2, reps:"500m",  rest:300, note:"⛷️ DISTANCE COMPÉT. OBJECTIF DUO : < 2:00. 5min récup entre les 2. Notez vos 2 temps." },
        { name:"500m Rowing × 2",    sets:2, reps:"500m",  rest:300, note:"🚣 DISTANCE COMPÉT. OBJECTIF DUO : < 2:00. Split cible 1:55. Notez." },
        { name:"80m Burpee BJ",       sets:1, reps:"80m",   rest:300, note:"🔥 DISTANCE COMPÉT (40m×2). OBJECTIF DUO : < 6:00. Chrono total.", isFocus:true },
      ],
      airbike:{ title:"VO₂MAX INTERVALS", sets:3, work:"2 min", rest:"2 min", effort:"90–95%",
        note:"3 × 2min à 90-95% effort / 2min repos complet. Même score sur les 3 efforts. Développe VO2max = base cardio course." },
      finisher:{ type:"fortime", note:"FOR TIME — Simulation haut pré-compétition. Votre chrono le plus important.",
        exercises:[{name:"500m SkiErg",reps:"500m"},{name:"20 Burpee BJ",reps:"20"},{name:"500m Rowing",reps:"500m"},{name:"20 Burpee BJ",reps:"20"}] }
    },
    B: {
      name:"SIMULATION COURSE — BAS", duration:"65–70 min",
      stations:["Sled Push","Sled Pull","Farmer Carry","Sandbag Lunges","Wall Ball"],
      focus:["Sled ⚡ compète","100m Farmer","50m Sandbag ⚡","50 WB ⚡"],
      strength:[
        { key:"front_sq",    name:"Front Squat maintien",      rest:120, note:"Charge P2. Technique parfaite. Volume réduit." },
        { key:"rdl",         name:"RDL maintien",               rest:120, note:"Charge P2. Maintien des gains." },
        { key:"hip_thrust",  name:"Hip Thrust maintien",        rest:90,  note:"Activation fessiers avant Sled. Volume réduit." },
        { key:"good_morning",name:"Good Morning + gainage",     rest:60,  note:"30s planche + 15 mountain climbers + 20s gainage lat/côté. Sans pause." },
      ],
      core:[
        { name:"Copenhagen plank",   sets:3, reps:"30s/côté", rest:45, note:"+5s vs P2. Maintien." },
        { name:"Nordic curl",         sets:3, reps:"6–8",      rest:90, note:"Maintien P2." },
        { name:"Ab wheel rollout",    sets:2, reps:"10",       rest:60, note:"Volume réduit. Gainage de base." },
      ],
      knee:[
        { name:"TKE élastique",        sets:2, reps:"20/j",   rest:45, note:"Maintien. Volume réduit avant compétition." },
        { name:"Step-down excentrique",sets:2, reps:"8/j",    rest:60, note:"Descente 5s. Maintien protection genou." },
      ],
      hyrox:[
        { name:"Sled P+P × 2",       sets:2, reps:"25m+25m",  rest:300, note:"🛷💪 DISTANCE COMPÉT. OBJECTIF : < 1:30 A/R. Charge compète. Chrono.", isFocus:true },
        { name:"100m Farmer Carry",   sets:2, reps:"100m",     rest:300, note:"🏋️ DISTANCE COMPÉT. OBJECTIF DUO : < 1:00. 32kg/main. Notez pauses." },
        { name:"50m Sandbag Lunges",  sets:1, reps:"50m",      rest:300, note:"🎒 DISTANCE COMPÉT. OBJECTIF DUO : < 3:00. 20kg. Chrono.", isFocus:true },
        { name:"50 Wall Ball",         sets:1, reps:"50 reps",  rest:300, note:"🏀 VOLUME COMPÉT. OBJECTIF DUO : < 3:00. Séries de 15–20. Chrono.", isFocus:true },
      ],
      finisher:{ type:"amrap", duration:10, note:"Pace de course. Régulier et contrôlé. Notez vos rounds. Référence finale.",
        exercises:[{name:"10 Wall Ball",reps:"10"},{name:"10m Sandbag Lunges",reps:"10m"},{name:"5 Burpee BJ",reps:"5"}] }
    }
  }
};

// ─── TIMER ───────────────────────────────────────────────────────────────────
function Timer({ onClose }) {
  const [secs,setSecs]=useState(0),[running,setRunning]=useState(false),[mode,setMode]=useState("up");
  const [cdVal,setCdVal]=useState(90),[cd,setCd]=useState(90);
  const ref=useRef(null);
  useEffect(()=>{
    if(running){ ref.current=setInterval(()=>{ if(mode==="up") setSecs(s=>s+1); else setCd(s=>{ if(s<=1){setRunning(false);return 0;} return s-1; }); },1000); } else clearInterval(ref.current);
    return ()=>clearInterval(ref.current);
  },[running,mode]);
  const adj=d=>{ const v=Math.min(300,Math.max(5,cdVal+d)); setCdVal(v); if(!running) setCd(v); };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}}>
      <div style={{background:"#0f0f0f",border:"2px solid #F97316",borderRadius:20,padding:"32px 40px",textAlign:"center",minWidth:300,position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:10,right:14,background:"none",border:"none",color:"#444",fontSize:26,cursor:"pointer",fontFamily:"inherit"}}>×</button>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:18}}>
          {[["up","CHRONO"],["down","DÉCOMPTE"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setSecs(0);setCd(cdVal);setRunning(false);}}
              style={{padding:"4px 12px",borderRadius:6,border:`1px solid ${mode===m?"#F97316":"#222"}`,background:mode===m?"#F97316":"transparent",color:mode===m?"#000":"#555",cursor:"pointer",fontSize:10,letterSpacing:2,fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>
        {mode==="down"&&<>
          <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center",marginBottom:8}}>
            <button onClick={()=>adj(-15)} style={{background:"#1a1a1a",border:"1px solid #222",color:"#fff",width:34,height:34,borderRadius:8,cursor:"pointer",fontSize:20,fontFamily:"inherit"}}>−</button>
            <span style={{color:"#fff",fontFamily:"monospace",fontSize:20,minWidth:52,textAlign:"center"}}>{cdVal}s</span>
            <button onClick={()=>adj(15)} style={{background:"#1a1a1a",border:"1px solid #222",color:"#fff",width:34,height:34,borderRadius:8,cursor:"pointer",fontSize:20,fontFamily:"inherit"}}>+</button>
          </div>
          <div style={{background:"#1a1a1a",borderRadius:999,height:4,marginBottom:12,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${(cd/cdVal)*100}%`,background:"#F97316",transition:"width 0.5s"}}/>
          </div>
        </>}
        <div style={{fontSize:76,fontFamily:"monospace",color:running?"#F97316":"#fff",letterSpacing:4,marginBottom:22,lineHeight:1}}>{fmtTime(mode==="up"?secs:cd)}</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={()=>setRunning(r=>!r)} style={{padding:"11px 32px",borderRadius:10,background:running?"#ef4444":"#F97316",color:"#000",border:"none",cursor:"pointer",fontWeight:800,fontSize:13,letterSpacing:3,fontFamily:"inherit"}}>{running?"PAUSE":"START"}</button>
          <button onClick={()=>{setRunning(false);setSecs(0);setCd(cdVal);}} style={{padding:"11px 18px",borderRadius:10,background:"#1a1a1a",color:"#555",border:"1px solid #222",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>RESET</button>
        </div>
      </div>
    </div>
  );
}

// ─── WARMUP MODAL ────────────────────────────────────────────────────────────
function WarmupModal({ onClose }) {
  const [done,setDone]=useState({});
  const total=WARMUP.flatMap(z=>z.exos).length, doneCount=Object.values(done).filter(Boolean).length;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.98)",zIndex:200,overflowY:"auto",padding:"20px 16px"}}>
      <div style={{maxWidth:540,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div>
            <div style={{color:"#60A5FA",fontSize:9,letterSpacing:6}}>~8–10 MIN</div>
            <div style={{fontFamily:'"Bebas Neue",cursive',fontSize:26,letterSpacing:3}}>ÉCHAUFFEMENT ARTICULAIRE</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid #222",color:"#555",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:11,letterSpacing:2,fontFamily:"inherit"}}>FERMER</button>
        </div>
        <div style={{background:"#0d1520",borderRadius:10,padding:"10px 14px",marginBottom:18,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,background:"#111",borderRadius:999,height:5,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${(doneCount/total)*100}%`,background:"linear-gradient(90deg,#60A5FA,#22C55E)",transition:"width 0.3s"}}/>
          </div>
          <span style={{color:"#60A5FA",fontFamily:"monospace",fontSize:11,flexShrink:0}}>{doneCount}/{total}</span>
        </div>
        {WARMUP.map((zone,zi)=>(
          <div key={zi} style={{marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9}}>
              <span style={{fontSize:14}}>{zone.icon}</span>
              <span style={{color:zone.color,fontSize:9,letterSpacing:5}}>{zone.zone}</span>
            </div>
            {zone.exos.map((ex,ei)=>{
              const k=`${zi}-${ei}`,isDone=done[k];
              return(
                <div key={ei} onClick={()=>setDone(p=>({...p,[k]:!p[k]}))}
                  style={{background:isDone?`${zone.color}10`:"#111",border:`1px solid ${isDone?zone.color+"44":"#1a1a1a"}`,borderRadius:9,padding:"12px 14px",marginBottom:7,cursor:"pointer",transition:"all 0.2s"}}>
                  <div style={{display:"flex",gap:9}}>
                    <span style={{color:isDone?zone.color:"#252525",fontSize:17,flexShrink:0,lineHeight:1}}>{isDone?"✓":"○"}</span>
                    <div>
                      <div style={{color:isDone?zone.color:"#fff",fontWeight:600,fontSize:13}}>{ex.name}</div>
                      <div style={{color:"#F97316",fontFamily:"monospace",fontSize:11,marginTop:1}}>{ex.detail}</div>
                      {ex.note&&<div style={{color:"#3a3a3a",fontSize:10,marginTop:3,fontStyle:"italic"}}>{ex.note}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <button onClick={onClose} style={{width:"100%",padding:14,background:doneCount===total?"#22C55E":"#111",color:doneCount===total?"#000":"#3a3a3a",border:`1px solid ${doneCount===total?"#22C55E":"#2a2a2a"}`,borderRadius:11,fontWeight:800,fontSize:12,letterSpacing:3,cursor:"pointer",marginBottom:28,transition:"all 0.3s",fontFamily:"inherit"}}>
          {doneCount===total?"✓ PRÊT — LET'S GO !":"FERMER ET CONTINUER →"}
        </button>
      </div>
    </div>
  );
}

// ─── EXERCISE CARD (force avec poids + fixe) ─────────────────────────────────
function ExoCard({ ex, week, checked, onToggle, color }) {
  const wp = ex.key ? getWP(ex.key, week) : null;
  const [val,setVal]=useState(wp?`${wp.w} ${wp.u}`:"");
  const typeColor = wp?.type==="INTENSITÉ"?"#EF4444":"#60A5FA";
  return(
    <div onClick={onToggle} style={{background:checked?"#0a1a0a":"#111",border:`1px solid ${checked?"#22C55E33":ex.isFocus?"#F9731633":"#161616"}`,borderRadius:11,padding:"13px 15px",marginBottom:9,cursor:"pointer",transition:"all 0.2s"}}>
      <div style={{display:"flex",gap:9}}>
        <span style={{color:checked?"#22C55E":"#1e1e1e",fontSize:19,flexShrink:0,lineHeight:1.1}}>{checked?"✓":"○"}</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:6,marginBottom:4,alignItems:"flex-start"}}>
            <span style={{color:checked?"#22C55E":"#fff",fontWeight:700,fontSize:13,lineHeight:1.3}}>{ex.name}</span>
            <div style={{display:"flex",gap:4,flexShrink:0}}>
              {ex.isFocus&&<span style={{background:"#F9731612",color:"#F97316",border:"1px solid #F9731630",borderRadius:4,padding:"1px 5px",fontSize:8,letterSpacing:1,whiteSpace:"nowrap"}}>⚡FOCUS</span>}
              {wp&&<span style={{background:`${typeColor}12`,color:typeColor,border:`1px solid ${typeColor}30`,borderRadius:4,padding:"1px 5px",fontSize:8,letterSpacing:1,whiteSpace:"nowrap"}}>{wp.type}</span>}
            </div>
          </div>
          {wp?(
            <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:3,flexWrap:"wrap"}}>
              <span style={{fontFamily:'"Bebas Neue",cursive',fontSize:30,color,lineHeight:1}}>{wp.w}</span>
              <span style={{color:"#444",fontSize:12}}>{wp.u}</span>
              <span style={{color:"#2a2a2a",fontSize:12}}>·</span>
              <span style={{color:"#999",fontSize:12}}>{wp.s}×{wp.r}</span>
              {ex.rest&&<span style={{color:"#2a2a2a",fontSize:10}}>— {ex.rest}s repos</span>}
            </div>
          ):(
            <div style={{color,fontFamily:"monospace",fontSize:11,marginBottom:3}}>
              {ex.sets}×{ex.reps}{ex.rest?` — ${ex.rest}s repos`:""}
            </div>
          )}
          {ex.note&&<div style={{color:"#323232",fontSize:10,fontStyle:"italic",lineHeight:1.5}}>{ex.note}</div>}
          {checked&&<div onClick={e=>e.stopPropagation()} style={{marginTop:8}}>
            <input value={val} onChange={e=>setVal(e.target.value)} placeholder="Charge réelle / chrono / reps..."
              style={{background:"#0a0a0a",border:"1px solid #1a1a1a",color:"#aaa",padding:"5px 9px",borderRadius:5,fontSize:11,width:"100%",fontFamily:"inherit"}}/>
          </div>}
        </div>
      </div>
    </div>
  );
}

// ─── ASSAULT BIKE BLOCK ──────────────────────────────────────────────────────
function AirBikeBlock({ ab, color }) {
  const [log,setLog]=useState(""),[saved,setSaved]=useState(false);
  return(
    <div style={{background:"linear-gradient(135deg,#080f1a,#0c1525)",border:`2px solid ${color}44`,borderRadius:13,padding:16,marginBottom:20}}>
      <div style={{color,fontSize:9,letterSpacing:5,marginBottom:7}}>🚴 ASSAULT BIKE — {ab.title}</div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        {[["TRAVAIL",ab.work,color],["REPOS",ab.rest,"#555"],["SÉRIES",String(ab.sets),"#ccc"],["EFFORT",ab.effort,"#F97316"]].map(([l,v,c])=>(
          <div key={l} style={{background:"#0f0f0f",borderRadius:7,padding:"7px 10px",textAlign:"center",flex:1}}>
            <div style={{color:"#333",fontSize:8,letterSpacing:2,marginBottom:2}}>{l}</div>
            <div style={{color:c,fontFamily:'"Bebas Neue",cursive',fontSize:16,lineHeight:1}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{color:"#383838",fontSize:10,fontStyle:"italic",lineHeight:1.5,marginBottom:10}}>{ab.note}</div>
      <div style={{display:"flex",gap:7}}>
        <input value={log} onChange={e=>setLog(e.target.value)} placeholder="Cal/round ou distance totale..."
          style={{flex:1,background:"#0a0a0a",border:"1px solid #1a1a1a",color:"#fff",padding:"6px 10px",borderRadius:7,fontSize:11,fontFamily:"inherit"}}/>
        <button onClick={()=>setSaved(true)} style={{padding:"6px 13px",borderRadius:7,background:saved?color:"#111",color:saved?"#000":"#444",border:`1px solid ${saved?color:"#222"}`,cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"inherit"}}>{saved?"✓":"LOG"}</button>
      </div>
    </div>
  );
}

// ─── FINISHER ────────────────────────────────────────────────────────────────
function Finisher({ f, color }) {
  const [log,setLog]=useState(""),[saved,setSaved]=useState(false);
  const rows = exos => exos?.map((e,i)=><div key={i} style={{color:"#bbb",fontSize:12,marginBottom:2}}>→ {e.reps} {e.name}</div>);
  return(
    <div style={{background:"linear-gradient(135deg,#120800,#1c0e00)",border:`2px solid ${color}44`,borderRadius:13,padding:18,marginTop:4}}>
      <div style={{color,fontSize:9,letterSpacing:5,marginBottom:9}}>⚡ FINISHER</div>
      {f.type==="emom"&&<><div style={{color:"#fff",fontWeight:800,fontSize:15,marginBottom:7}}>EMOM {f.duration} MIN</div><div style={{color:"#bbb",fontSize:12,marginBottom:2}}>Min impairs → {f.oddMin.reps} {f.oddMin.name}</div><div style={{color:"#bbb",fontSize:12}}>Min pairs → {f.evenMin.reps} {f.evenMin.name}</div></>}
      {f.type==="amrap"&&<><div style={{color:"#fff",fontWeight:800,fontSize:15,marginBottom:7}}>AMRAP {f.duration} MIN</div>{rows(f.exercises)}</>}
      {f.type==="rounds"&&<><div style={{color:"#fff",fontWeight:800,fontSize:15,marginBottom:7}}>{f.sets} ROUNDS — {f.rest}s repos</div>{rows(f.exercises)}</>}
      {f.type==="chipper"&&<><div style={{color:"#fff",fontWeight:800,fontSize:15,marginBottom:7}}>CHIPPER — FOR TIME</div>{rows(f.exercises)}</>}
      {f.type==="fortime"&&<><div style={{color:"#fff",fontWeight:800,fontSize:15,marginBottom:7}}>FOR TIME</div>{rows(f.exercises)}</>}
      <div style={{color:"#404040",fontSize:10,marginTop:9,fontStyle:"italic",lineHeight:1.5}}>{f.note}</div>
      <div style={{marginTop:12,display:"flex",gap:7}}>
        <input value={log} onChange={e=>setLog(e.target.value)} placeholder="Score / chrono / rounds..."
          style={{flex:1,background:"#0a0a0a",border:"1px solid #1a1a1a",color:"#fff",padding:"7px 10px",borderRadius:7,fontSize:11,fontFamily:"inherit"}}/>
        <button onClick={()=>setSaved(true)} style={{padding:"7px 14px",borderRadius:7,background:saved?color:"#111",color:saved?"#000":"#444",border:`1px solid ${saved?color:"#222"}`,cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"inherit"}}>{saved?"✓":"LOG"}</button>
      </div>
    </div>
  );
}

// ─── SESSION VIEW ─────────────────────────────────────────────────────────────
function SessionView({ week, sessionType, onBack, onSaved }) {
  const sess=getSession(week,sessionType), phase=getPhaseData(week);
  const wt=getWeekType(week), wtInfo=WEEK_NOTES[wt];
  const [checked,setChecked]=useState({}),[showTimer,setShowTimer]=useState(false),[showWarmup,setShowWarmup]=useState(false);
  const [notes,setNotes]=useState(""),[saved,setSaved]=useState(false);
  const toggle=k=>setChecked(p=>({...p,[k]:!p[k]}));
  const allExo=[...(sess.strength||[]),...(sess.hyrox||[])];
  const done=allExo.filter((_,i)=>checked[`e${i}`]).length, pct=allExo.length?(done/allExo.length)*100:0;
  const handleSave=async()=>{
    try{ await window.storage.set(`session:w${week}:${sessionType}`,JSON.stringify({week,sessionType,notes,done:true,date:new Date().toISOString()})); setSaved(true); onSaved(); }catch(e){}
  };

  const Section = ({title,color:c,children}) => (
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
        <div style={{width:3,height:15,background:c||"#fff",borderRadius:999}}/>
        <span style={{color:c||"#fff",fontSize:9,letterSpacing:4,fontWeight:700}}>{title}</span>
      </div>
      {children}
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#fff",paddingBottom:60,fontFamily:'"DM Sans",sans-serif'}}>
      {showTimer&&<Timer onClose={()=>setShowTimer(false)}/>}
      {showWarmup&&<WarmupModal onClose={()=>setShowWarmup(false)}/>}
      {/* Header */}
      <div style={{background:`linear-gradient(160deg,${phase.color}15,#080808 65%)`,borderBottom:"1px solid #0f0f0f",padding:"18px 16px 14px"}}>
        <div style={{maxWidth:540,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <button onClick={onBack} style={{background:"none",border:"1px solid #1a1a1a",color:"#3a3a3a",padding:"6px 12px",borderRadius:7,cursor:"pointer",fontSize:10,letterSpacing:2,fontFamily:"inherit"}}>← RETOUR</button>
            <button onClick={()=>setShowTimer(true)} style={{background:"#111",border:`1px solid ${phase.color}33`,color:phase.color,padding:"6px 12px",borderRadius:7,cursor:"pointer",fontSize:10,letterSpacing:2,fontFamily:"inherit"}}>⏱ TIMER</button>
          </div>
          <div style={{color:phase.color,fontSize:9,letterSpacing:4,marginBottom:3}}>{phase.name} · S{week} · SÉANCE {sessionType}</div>
          <div style={{fontFamily:'"Bebas Neue",cursive',fontSize:22,letterSpacing:3,lineHeight:1.1,marginBottom:4}}>{sess.name}</div>
          {/* Week type banner */}
          <div style={{background:`${wtInfo.color}10`,border:`1px solid ${wtInfo.color}25`,borderRadius:8,padding:"7px 12px",marginTop:8,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:3,height:28,background:wtInfo.color,borderRadius:999,flexShrink:0}}/>
            <div>
              <div style={{color:wtInfo.color,fontSize:9,letterSpacing:4,marginBottom:1}}>{wtInfo.label}</div>
              <div style={{color:"#3a3a3a",fontSize:10,lineHeight:1.4}}>{wtInfo.desc}</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{maxWidth:540,margin:"0 auto",padding:"18px 16px"}}>
        {/* Progress */}
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:18}}>
          <div style={{flex:1,background:"#111",borderRadius:999,height:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:phase.color,transition:"width 0.3s"}}/>
          </div>
          <span style={{color:"#222",fontSize:9,fontFamily:"monospace",flexShrink:0}}>{done}/{allExo.length}</span>
        </div>
        {/* Stations badges */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
          {sess.stations.map((st,i)=>{
            const ref=STATIONS_REF.find(r=>r.name===st);
            return ref?<div key={i} style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:7,padding:"4px 9px",display:"flex",gap:5,alignItems:"center"}}>
              <span style={{fontSize:12}}>{ref.icon}</span>
              <span style={{color:"#999",fontSize:10,fontWeight:600}}>{ref.name}</span>
              <span style={{color:"#22C55E",fontFamily:"monospace",fontSize:9}}>{ref.obj}</span>
            </div>:null;
          })}
        </div>
        {/* Warmup */}
        <button onClick={()=>setShowWarmup(true)} style={{width:"100%",background:"linear-gradient(135deg,#07111a,#0b1726)",border:"1px solid #60A5FA22",borderRadius:12,padding:"14px 18px",cursor:"pointer",marginBottom:22,textAlign:"left",fontFamily:"inherit"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:"#60A5FA",fontSize:9,letterSpacing:4,marginBottom:3}}>ÉTAPE 1 — OBLIGATOIRE</div>
              <div style={{color:"#fff",fontWeight:800,fontSize:13}}>🔵 ÉCHAUFFEMENT ARTICULAIRE COMPLET</div>
              <div style={{color:"#60A5FA2a",fontSize:10,marginTop:1}}>5 zones · 13 exercices · 8–10 min</div>
            </div>
            <span style={{color:"#60A5FA",fontSize:20}}>→</span>
          </div>
        </button>
        {/* Renforcement */}
        <Section title="RENFORCEMENT MUSCULAIRE" color="#fff">
          <div style={{color:"#282828",fontSize:10,marginBottom:12,paddingLeft:10,fontStyle:"italic"}}>
            {wt==="vol"?"Charges modérées, reps hautes. Technique parfaite. Progressez de 2.5–5kg toutes les 2 semaines.":"Charges maximales, reps basses. Récupération COMPLÈTE. Battez votre record de la dernière séance intensité."}
          </div>
          {sess.strength.map((ex,i)=><ExoCard key={i} ex={ex} week={week} checked={!!checked[`e${i}`]} onToggle={()=>toggle(`e${i}`)} color={phase.color}/>)}
        </Section>
        {/* Core */}
        {sess.core?.length>0&&<Section title="CORE & GAINAGE" color="#8B5CF6">
          {sess.core.map((ex,i)=><ExoCard key={i} ex={ex} week={week} checked={!!checked[`c${i}`]} onToggle={()=>toggle(`c${i}`)} color="#8B5CF6"/>)}
        </Section>}
        {/* Genoux */}
        {sess.knee?.length>0&&<Section title="RENFORCEMENT GENOUX" color="#60A5FA">
          <div style={{color:"#1e2e3e",fontSize:10,marginBottom:10,paddingLeft:10,fontStyle:"italic"}}>⚠️ Spécifique à vos genoux fragiles. Ne sautez pas ce bloc.</div>
          {sess.knee.map((ex,i)=><ExoCard key={i} ex={ex} week={week} checked={!!checked[`k${i}`]} onToggle={()=>toggle(`k${i}`)} color="#60A5FA"/>)}
        </Section>}
        {/* Hyrox */}
        <Section title="STATIONS HYROX" color={phase.color}>
          <div style={{color:"#282828",fontSize:10,marginBottom:12,paddingLeft:10,fontStyle:"italic"}}>
            {getPhaseNum(week)===1?"Chronométrez chaque série dès maintenant. Ces temps = vos références.":getPhaseNum(week)===2?"Race pace. Chronos obligatoires. Comparez semaine après semaine.":"Distances et charges de compétition. Chronos uniquement."}
          </div>
          {sess.hyrox.map((ex,i)=>{
            const idx=sess.strength.length+i;
            return <ExoCard key={i} ex={ex} week={week} checked={!!checked[`e${idx}`]} onToggle={()=>toggle(`e${idx}`)} color={phase.color}/>;
          })}
        </Section>
        {/* Assault Bike (séance A uniquement) */}
        {sess.airbike&&<><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}><div style={{width:3,height:15,background:"#3B82F6",borderRadius:999}}/><span style={{color:"#3B82F6",fontSize:9,letterSpacing:4,fontWeight:700}}>ASSAULT BIKE</span></div><AirBikeBlock ab={sess.airbike} color="#3B82F6"/></>}
        {/* Finisher */}
        <Finisher f={sess.finisher} color={phase.color}/>
        {/* Notes */}
        <div style={{marginTop:22}}>
          <div style={{color:"#1a1a1a",fontSize:9,letterSpacing:4,marginBottom:7}}>NOTES DE SÉANCE</div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Poids utilisés, chronos, ressenti, douleurs éventuelles..."
            style={{width:"100%",background:"#111",border:"1px solid #161616",color:"#bbb",padding:12,borderRadius:9,fontSize:12,minHeight:75,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>
        </div>
        <button onClick={handleSave} style={{width:"100%",marginTop:12,padding:16,background:saved?"#22C55E":"#F97316",color:"#000",border:"none",borderRadius:11,fontWeight:800,fontSize:12,letterSpacing:4,cursor:"pointer",transition:"background 0.3s",fontFamily:"inherit"}}>
          {saved?"✓ SÉANCE SAUVEGARDÉE":"SAUVEGARDER LA SÉANCE"}
        </button>
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,setView]=useState("home"),[selW,setSelW]=useState(1),[selS,setSelS]=useState("A");
  const [completed,setCompleted]=useState({}),[expanded,setExpanded]=useState({1:true,2:false,3:false});
  const [stOpen,setStOpen]=useState(false);

  useEffect(()=>{ loadProgress(); },[]);
  const loadProgress=async()=>{
    try{
      const keys=await window.storage.list("session:"); const c={};
      for(const k of (keys?.keys||[])){ try{ const r=await window.storage.get(k); if(r?.value){const d=JSON.parse(r.value);c[`w${d.week}:${d.sessionType}`]=d;} }catch(e){} }
      setCompleted(c);
    }catch(e){}
  };

  const done=Object.keys(completed).length, curW=Math.min(Math.floor(done/2)+1,26), curPhase=getPhaseData(curW);
  const wt=getWeekType(curW), wtInfo=WEEK_NOTES[wt];

  if(view==="session") return <SessionView week={selW} sessionType={selS} onBack={()=>setView("home")} onSaved={()=>loadProgress()}/>;

  return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#fff",fontFamily:'"DM Sans",sans-serif'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;0,800;1,400&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:#1a1a1a;}button{font-family:"DM Sans",sans-serif;}`}</style>
      {/* HERO */}
      <div style={{background:"#0c0c0c",borderBottom:"1px solid #0f0f0f",padding:"28px 20px 20px"}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
            <div>
              <div style={{color:"#F97316",fontSize:9,letterSpacing:8,marginBottom:5}}>PROGRAMME PERSONNALISÉ</div>
              <div style={{fontFamily:'"Bebas Neue",cursive',fontSize:50,letterSpacing:5,lineHeight:0.85}}>HYROX</div>
              <div style={{fontFamily:'"Bebas Neue",cursive',fontSize:50,letterSpacing:5,lineHeight:0.85,color:"#F97316"}}>6 MOIS</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:9}}>
                {["HOMME","DUO 1H15","8 STATIONS","6→10/10","ONDULANT"].map((t,i)=>(
                  <span key={i} style={{background:"#111",border:"1px solid #181818",color:"#3a3a3a",padding:"2px 7px",borderRadius:3,fontSize:8,letterSpacing:1}}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:"#1e1e1e",fontSize:8,letterSpacing:3}}>NIVEAU</div>
              <div style={{fontFamily:'"Bebas Neue",cursive',fontSize:48,color:curPhase.color,lineHeight:1}}>{(5+(done/52)*5).toFixed(1)}<span style={{fontSize:18,color:"#1e1e1e"}}>/10</span></div>
              <div style={{color:"#1e1e1e",fontSize:9,marginTop:1}}>{done}/52 séances</div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{background:"#111",borderRadius:999,height:4,overflow:"hidden",marginBottom:5}}>
            <div style={{height:"100%",width:`${(done/52)*100}%`,background:`linear-gradient(90deg,#F97316 0%,#EAB308 50%,#22C55E 100%)`,transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"#1a1a1a",letterSpacing:1}}>
            <span>6/10 DÉPART</span><span>P1</span><span>P2</span><span>P3</span><span>10/10 OCT.</span>
          </div>
          {/* Semaine courante - type */}
          {done<52&&<div style={{background:`${wtInfo.color}08`,border:`1px solid ${wtInfo.color}20`,borderRadius:8,padding:"8px 12px",marginTop:12,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:3,height:24,background:wtInfo.color,borderRadius:999,flexShrink:0}}/>
            <div>
              <div style={{color:wtInfo.color,fontSize:8,letterSpacing:4}}>SEMAINE {curW} — {wtInfo.label}</div>
              <div style={{color:"#2a2a2a",fontSize:10,marginTop:1}}>{wtInfo.desc}</div>
            </div>
          </div>}
        </div>
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:"20px 16px"}}>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
          {[{l:"SEMAINE",v:curW,s:"/26"},{l:"SÉANCES",v:done,s:"/52"},{l:"PHASE",v:getPhaseNum(curW),s:"/3"},{l:"NIVEAU",v:(5+(done/52)*5).toFixed(1),s:"/10"}].map((s,i)=>(
            <div key={i} style={{background:"#0f0f0f",borderRadius:10,padding:"12px 8px",textAlign:"center",border:"1px solid #0f0f0f"}}>
              <div style={{color:"#1e1e1e",fontSize:8,letterSpacing:2,marginBottom:3}}>{s.l}</div>
              <div style={{fontFamily:'"Bebas Neue",cursive',fontSize:26,color:"#F97316",lineHeight:1}}>{s.v}<span style={{fontSize:10,color:"#161616"}}>{s.s}</span></div>
            </div>
          ))}
        </div>

        {/* Phase actuelle */}
        <div style={{background:`linear-gradient(135deg,${curPhase.color}0c,transparent)`,border:`1px solid ${curPhase.color}20`,borderRadius:12,padding:16,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div style={{color:curPhase.color,fontSize:9,letterSpacing:4}}>PHASE EN COURS</div>
            <span style={{color:curPhase.color,fontFamily:"monospace",fontSize:9,background:`${curPhase.color}12`,padding:"2px 7px",borderRadius:4}}>{curPhase.difficulty}</span>
          </div>
          <div style={{fontFamily:'"Bebas Neue",cursive',fontSize:18,letterSpacing:2,marginBottom:6}}>{curPhase.name} — {curPhase.subtitle}</div>
          <div style={{color:"#3a3a3a",fontSize:11,lineHeight:1.6}}>{curPhase.desc}</div>
        </div>

        {/* Stations référence */}
        <div style={{marginBottom:14}}>
          <button onClick={()=>setStOpen(v=>!v)} style={{width:"100%",background:"#0a1a0a",border:"1px solid #22C55E18",borderRadius:stOpen?"12px 12px 0 0":"12px",padding:"13px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"inherit",textAlign:"left"}}>
            <div><div style={{color:"#22C55E",fontSize:9,letterSpacing:4,marginBottom:2}}>OBJECTIFS DUO 1H15</div><div style={{color:"#fff",fontWeight:700,fontSize:12}}>🏁 8 STATIONS — TEMPS CIBLES</div></div>
            <span style={{color:"#22C55E",fontSize:14}}>{stOpen?"▲":"▼"}</span>
          </button>
          {stOpen&&<div style={{background:"#090909",border:"1px solid #22C55E15",borderTop:"none",borderRadius:"0 0 12px 12px",padding:"12px 14px"}}>
            {STATIONS_REF.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:9,marginBottom:i<7?10:0,paddingBottom:i<7?10:0,borderBottom:i<7?"1px solid #0f0f0f":"none",alignItems:"center"}}>
                <span style={{fontSize:16,flexShrink:0}}>{s.icon}</span>
                <span style={{color:"#ccc",fontWeight:700,fontSize:12,flex:1}}>{s.name}</span>
                <span style={{color:"#F97316",fontFamily:"monospace",fontSize:10}}>{s.dist}</span>
                <span style={{color:"#22C55E",fontFamily:"monospace",fontSize:10,minWidth:42,textAlign:"right"}}>{s.obj}</span>
              </div>
            ))}
            <div style={{background:"#0a1a0a",borderRadius:7,padding:9,marginTop:10}}>
              <div style={{color:"#22C55E",fontSize:8,letterSpacing:3,marginBottom:3}}>DÉCOUPAGE 1H15 DUO</div>
              <div style={{color:"#2a2a2a",fontSize:10,lineHeight:1.7}}>Course (8×1km) → 44–48 min · Stations → 24–28 min · Transitions → 3–5 min</div>
            </div>
          </div>}
        </div>

        {/* PHASES accordion */}
        {PHASES.map(phase=>{
          const phaseKeys=phase.weeks.flatMap(w=>["A","B"].map(s=>`w${w}:${s}`));
          const pDone=phaseKeys.filter(k=>completed[k]).length, isOpen=expanded[phase.id];
          return(
            <div key={phase.id} style={{marginBottom:8}}>
              <button onClick={()=>setExpanded(p=>({...p,[phase.id]:!p[phase.id]}))}
                style={{width:"100%",background:"#0d0d0d",border:`1px solid ${isOpen?phase.color+"44":phase.color+"15"}`,borderRadius:isOpen?"12px 12px 0 0":"12px",padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:11,transition:"all 0.2s",fontFamily:"inherit",textAlign:"left"}}>
                <div style={{width:4,height:40,background:phase.color,borderRadius:999,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                    <span style={{fontFamily:'"Bebas Neue",cursive',fontSize:17,letterSpacing:3,color:phase.color,lineHeight:1}}>{phase.name}</span>
                    <span style={{background:`${phase.color}12`,color:phase.color,border:`1px solid ${phase.color}25`,borderRadius:3,padding:"1px 6px",fontSize:8,letterSpacing:1}}>{phase.difficulty}</span>
                  </div>
                  <div style={{color:"#aaa",fontSize:11,fontWeight:600}}>{phase.subtitle}</div>
                  <div style={{color:"#1e1e1e",fontSize:9,marginTop:1}}>S{phase.weeks[0]}–S{phase.weeks[phase.weeks.length-1]} · {phase.weeks.length*2} séances</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{color:phase.color,fontSize:8,marginBottom:4}}>{pDone}/{phase.weeks.length*2}</div>
                  <div style={{background:"#111",borderRadius:999,width:48,height:3,overflow:"hidden",marginLeft:"auto",marginBottom:7}}>
                    <div style={{height:"100%",width:`${(pDone/(phase.weeks.length*2))*100}%`,background:phase.color}}/>
                  </div>
                  <span style={{color:"#2a2a2a",fontSize:13}}>{isOpen?"▲":"▼"}</span>
                </div>
              </button>
              {isOpen&&<div style={{background:"#090909",border:`1px solid ${phase.color}12`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:"12px 10px 14px"}}>
                {phase.weeks.map(w=>{
                  const wt=getWeekType(w), wtc=WEEK_NOTES[wt].color;
                  return(
                    <div key={w} style={{marginBottom:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                        <span style={{color:"#1a1a1a",fontSize:8,letterSpacing:4}}>SEMAINE {w}</span>
                        <span style={{background:`${wtc}12`,color:wtc,border:`1px solid ${wtc}25`,borderRadius:3,padding:"1px 6px",fontSize:7,letterSpacing:1}}>{WEEK_NOTES[wt].label}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                        {["A","B"].map(s=>{
                          const isDone=!!completed[`w${w}:${s}`], sess=getSession(w,s);
                          return(
                            <button key={s} onClick={()=>{setSelW(w);setSelS(s);setView("session");}}
                              style={{background:isDone?"#0a1a0a":"#111",border:`1px solid ${isDone?"#22C55E22":phase.color+"12"}`,borderRadius:10,padding:"12px",textAlign:"left",cursor:"pointer",position:"relative",fontFamily:"inherit",transition:"all 0.2s"}}>
                              {isDone&&<div style={{position:"absolute",top:7,right:7,width:16,height:16,borderRadius:"50%",background:"#22C55E10",border:"1px solid #22C55E33",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <span style={{color:"#22C55E",fontSize:9,lineHeight:1}}>✓</span>
                              </div>}
                              <div style={{color:"#1a1a1a",fontSize:8,letterSpacing:2,marginBottom:2}}>SÉANCE {s}</div>
                              <div style={{color:isDone?"#22C55E33":"#ccc",fontWeight:700,fontSize:10,lineHeight:1.3,marginBottom:4}}>{sess.name}</div>
                              <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:3}}>
                                {sess.stations.slice(0,4).map((st,i)=>{ const ref=STATIONS_REF.find(r=>r.name===st); return ref?<span key={i} style={{fontSize:11}}>{ref.icon}</span>:null; })}
                              </div>
                              <div style={{color:phase.color,fontFamily:"monospace",fontSize:8}}>{sess.duration}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>}
            </div>
          );
        })}

        {/* Protocole genoux */}
        <div style={{background:"#0c1220",border:"1px solid #1e3a5f22",borderRadius:11,padding:15,marginTop:12,marginBottom:22}}>
          <div style={{color:"#60A5FA",fontSize:9,letterSpacing:4,marginBottom:9}}>⚠️ PROTOCOLE GENOUX</div>
          {[["Phase 1","Fentes arrière uniquement"],["Phase 2+","Fentes marchées contrôlées"],["Toujours","Genou avant jamais en avant du pied"],["Seuil","Douleur > 3/10 → arrêt immédiat"],["Post-séance","Glace 10 min si chaleur articulaire"]].map(([l,t],i)=>(
            <div key={i} style={{display:"flex",gap:9,marginBottom:i<4?6:0}}>
              <span style={{color:"#60A5FA33",fontFamily:"monospace",fontSize:8,minWidth:55,paddingTop:2,flexShrink:0}}>{l}</span>
              <span style={{color:"#282828",fontSize:11,lineHeight:1.4}}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",color:"#111",fontSize:8,letterSpacing:4,paddingBottom:20}}>HYROX TRAINER · HOMME · DUO 1H15 · 6 MONTHS</div>
      </div>
    </div>
  );
}
