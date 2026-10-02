/**
 * KINGDOM 500 - DATA STORE
 * 8 Council & Officer slots with photo support
 * 80 Warrior roster pre-populated list
 * Editable Kingdom Stats store
 */

export const defaultStats = {
  power: 3250000000,
  kills: 28400000,
  alliances: 4,
  days: 485
};

export const leaders = [
  {
    id: 1,
    name: "Odin_The_Allfather",
    role: "King of Kingdom 500",
    alliance: "xHTx",
    photo: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80",
    avatar: "👑",
    desc: "Supreme Strategist & Kingdom Leader"
  },
  {
    id: 2,
    name: "Freya_Valkyrie",
    role: "Queen / Chief Diplomat",
    alliance: "xHTx",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    avatar: "🛡️",
    desc: "Foreign Affairs, Treaties & Alliances"
  },
  {
    id: 3,
    name: "Ragnar_Ironclad",
    role: "High War Marshal",
    alliance: "xVGx",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    avatar: "⚔️",
    desc: "KvK Rally Commander & Gate Offense"
  },
  {
    id: 4,
    name: "Bjorn_Ironside",
    role: "Rune Architect",
    alliance: "xNKx",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    avatar: "⚡",
    desc: "Shrine Rotation & Tech Management"
  },
  {
    id: 5,
    name: "Lagertha_Shield",
    role: "Vanguard Commander",
    alliance: "xVGx",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    avatar: "🪓",
    desc: "Garrison Defense & Reinforcements"
  },
  {
    id: 6,
    name: "Ivar_Boneless",
    role: "Siege Mastermind",
    alliance: "xHTx",
    photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80",
    avatar: "🏹",
    desc: "Tactical Scout & Artillery Rallies"
  },
  {
    id: 7,
    name: "Sigurd_SnakeEye",
    role: "High Council Member",
    alliance: "xNKx",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80",
    avatar: "👁️",
    desc: "Internal Affairs & Loot Council"
  },
  {
    id: 8,
    name: "Harald_Fairhair",
    role: "Academy Commandant",
    alliance: "xRAx",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
    avatar: "📜",
    desc: "Training New Warriors & Recruits"
  }
];

// Generate 80 sample players for the full roster
export const generate80Players = () => {
  const alliances = ["xHTx", "xVGx", "xNKx", "xRAx"];
  const namesPrefix = [
    "Thor", "Odin", "Loki", "Freya", "Ragnar", "Bjorn", "Lagertha", "Ivar", "Sigurd", "Harald",
    "Erik", "Rollo", "Floki", "Astrid", "Halfdan", "Torstein", "Gunnar", "Aslaug", "Ubbe", "Hvitserk",
    "Skuld", "Tyr", "Heimdall", "Balder", "Frigg", "Sif", "Bragi", "Forseti", "Njord", "Freyr"
  ];
  const namesSuffix = [
    "Ironclad", "Bloodaxe", "Shield", "Valkyrie", "Storm", "Thunder", "Frost", "Rune", "Wolf", "Raven",
    "Bear", "Fang", "Flame", "Shadow", "Glory", "Valor", "Honor", "Strike", "Breaker", "Slayer"
  ];

  const players = [];
  for (let i = 1; i <= 80; i++) {
    const pName = `${namesPrefix[i % namesPrefix.length]}_${namesSuffix[i % namesSuffix.length]}_${i}`;
    const pAlliance = alliances[i % alliances.length];
    const power = Math.floor(135000000 - i * 1150000 + Math.random() * 800000);
    const kills = Math.floor(power * (0.04 + (80 - i) * 0.001));

    players.push({
      rank: i,
      id: `500${1000 + i}`,
      name: pName,
      alliance: pAlliance,
      power: Math.max(15000000, power),
      kills: Math.max(800000, kills),
      share: `${(4.5 - i * 0.04).toFixed(1)}%`,
      status: "Active"
    });
  }
  return players;
};

export const initialPlayers = generate80Players();

export const initialChatMessages = [
  { nick: "Ragnar_Ironclad", text: "KvK Pass 3 opens in 4 hours warriors! Stock up on healing speedups and march boosts!", time: "10:12" },
  { nick: "Freya_Valkyrie", text: "Diplomatic NAP confirmed with Kingdom 498. All rallies focus strictly on Kingdom 502!", time: "10:18" },
  { nick: "Bjorn_Ironside", text: "Rune buff for Attack +15% active at Flame Shrine! Claim your marches now!", time: "10:24" },
  { nick: "Lagertha_Shield", text: "Duty roll call submitted! House of Thor ready with 4 full T5 war marches!", time: "10:31" }
];

export const initialActivityFeed = [
  { icon: "🏆", title: "KvK Stage 2 Victorious!", text: "Kingdom 500 secured #1 rank in Kingdom vs Kingdom honor points.", time: "12 mins ago" },
  { icon: "⚔️", title: "Dragon Shrine Captured", text: "Alliance [xHTx] successfully garrisoned the Central Dragon Shrine.", time: "45 mins ago" },
  { icon: "📜", title: "New Treaty Signed", text: "Council published updated KvK loot distribution rules.", time: "2 hours ago" },
  { icon: "🛡️", title: "Rally Success", text: "Ragnar_Ironclad led a 2.5M troop rally defeating Enemy Pass 2.", time: "4 hours ago" }
];

export const channels = [
  { icon: "💬", title: "Discord War Room", desc: "Live voice coordination during rallies, KvK gates, and dragon shrines.", link: "discord.gg/kingdom500" },
  { icon: "📨", title: "In-Game Mail System", desc: "Official kingdom notices, title requests, and rally announcements.", link: "#" },
  { icon: "✈️", title: "Telegram Emergency", desc: "24/7 instant alerts for unexpected defense runs and emergency mobilization.", link: "t.me/k500viking" },
  { icon: "🌐", title: "Global Timezones", desc: "Dedicated leadership coverage for NA, EU, and Asian timezones.", link: "#" }
];
