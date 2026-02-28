export const DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export const PLAYER_COLORS = {
  red: "#FF4757",
  blue: "#2E86FF",
  green: "#2ED573",
  yellow: "#FFD32A",
};

export const PLAYER_ICONS = { red: "🔴", blue: "🔵", green: "🟢", yellow: "🟡" };

export const INITIAL_PLAYERS = [
  { id: 0, name: "KingSlayer99", color: "red",    home: 0, isBot: true  },
  { id: 1, name: "ZuriQueen",    color: "blue",   home: 0, isBot: true  },
  { id: 2, name: "AceJoker",     color: "green",  home: 0, isBot: false },
  { id: 3, name: "DiceGod",      color: "yellow", home: 0, isBot: true  },
];

export const INITIAL_CHAT = [
  { player: "KingSlayer99", color: "#FF4757", msg: "gl hf everyone 🎲" },
  { player: "ZuriQueen",    color: "#2E86FF", msg: "may the best player win 😈" },
];

export const LB_DATA = [
  { rank: 1, name: "KingSlayer99", color: "#FF4757", wins: 102, games: 130, pts: 3410 },
  { rank: 2, name: "ZuriQueen",    color: "#2E86FF", wins: 87,  games: 115, pts: 2840 },
  { rank: 3, name: "DiceGod",      color: "#FFD32A", wins: 79,  games: 110, pts: 2610 },
  { rank: 4, name: "AceJoker",     color: "#2ED573", wins: 62,  games: 90,  pts: 1240 },
  { rank: 5, name: "RollerKing",   color: "#FF4757", wins: 58,  games: 88,  pts: 1180 },
  { rank: 6, name: "NightOwl23",   color: "#2E86FF", wins: 51,  games: 80,  pts: 980  },
  { rank: 7, name: "QuickMove",    color: "#FFD32A", wins: 44,  games: 72,  pts: 870  },
  { rank: 8, name: "LudoLord",     color: "#2ED573", wins: 39,  games: 65,  pts: 750  },
];

export const ROOM_DATA = [
  { id: "#4821", name: "Classic Showdown",     mode: "Standard rules • No timer",   status: "open",    players: 3, max: 4, colors: ["red","blue","green"] },
  { id: "#3310", name: "Speed Blitz ⚡",       mode: "30s turn timer • Fast mode",  status: "waiting", players: 1, max: 4, colors: ["yellow"] },
  { id: "#2289", name: "Diamond League 💎",    mode: "Tournament • Prize: ₦10,000", status: "full",    players: 4, max: 4, colors: ["red","blue","green","yellow"] },
  { id: "#5541", name: "Beginner Friendly 🌱", mode: "No timer • Standard rules",   status: "open",    players: 2, max: 4, colors: ["blue","yellow"] },
  { id: "#6603", name: "Night Owls 🦉",        mode: "60s timer • Competitive",     status: "open",    players: 1, max: 4, colors: ["red"] },
];