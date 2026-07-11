// Seasons, weather and wardrobe for The Cycle Of Life.
// 5 outfit sets per season, each in two colour variants (10 cards per season).

export type Season = "summer" | "winter" | "autumn" | "spring";

export interface SeasonInfo {
  name: string;
  emoji: string;
  sky: string;      // room background gradient
  weather: string;  // one-line weather description
}

export const SEASONS: Record<Season, SeasonInfo> = {
  summer: { name: "Summer", emoji: "☀️", sky: "linear-gradient(180deg,#fde68a,#fca5a5)", weather: "It's hot and sunny outside!" },
  winter: { name: "Winter", emoji: "❄️", sky: "linear-gradient(180deg,#bfdbfe,#e0e7ff)", weather: "Brrr… it's freezing and snowy!" },
  autumn: { name: "Autumn", emoji: "🍂", sky: "linear-gradient(180deg,#fed7aa,#fdba74)", weather: "Windy with falling leaves and rain." },
  spring: { name: "Spring", emoji: "🌸", sky: "linear-gradient(180deg,#bbf7d0,#fbcfe8)", weather: "Mild and fresh — flowers everywhere!" },
};

export interface Outfit {
  id: string;
  season: Season;
  emoji: string;
  name: string;
  colour: string;      // display colour chip
  colourName: string;
}

// 5 sets per season × 2 colours each.
const SETS: Record<Season, { emoji: string; name: string; colours: [string, string, string, string] }[]> = {
  summer: [
    { emoji: "👕", name: "Tee & Shorts", colours: ["#f87171", "Red", "#60a5fa", "Blue"] },
    { emoji: "👗", name: "Sundress", colours: ["#f9a8d4", "Pink", "#fde047", "Yellow"] },
    { emoji: "🩱", name: "Swimsuit", colours: ["#5eead4", "Teal", "#c4b5fd", "Purple"] },
    { emoji: "🧢", name: "Cap Outfit", colours: ["#86efac", "Green", "#fdba74", "Orange"] },
    { emoji: "🕶️", name: "Beach Set", colours: ["#fcd34d", "Gold", "#a5b4fc", "Sky"] },
  ],
  winter: [
    { emoji: "🧥", name: "Big Coat & Scarf", colours: ["#93c5fd", "Ice Blue", "#fca5a5", "Berry"] },
    { emoji: "🧤", name: "Mittens Set", colours: ["#d8b4fe", "Lilac", "#86efac", "Pine"] },
    { emoji: "⛷️", name: "Snow Suit", colours: ["#f9fafb", "Snow", "#fda4af", "Rose"] },
    { emoji: "🧶", name: "Wool Sweater", colours: ["#fbbf24", "Honey", "#94a3b8", "Grey"] },
    { emoji: "🥾", name: "Boots & Beanie", colours: ["#a16207", "Brown", "#0ea5e9", "Blue"] },
  ],
  autumn: [
    { emoji: "🧥", name: "Light Jacket", colours: ["#d97706", "Amber", "#65a30d", "Olive"] },
    { emoji: "☂️", name: "Raincoat", colours: ["#facc15", "Yellow", "#f472b6", "Pink"] },
    { emoji: "🧦", name: "Cozy Socks Set", colours: ["#c2410c", "Rust", "#7c3aed", "Plum"] },
    { emoji: "👖", name: "Jeans & Hoodie", colours: ["#1d4ed8", "Denim", "#111827", "Black"] },
    { emoji: "🍂", name: "Flannel Shirt", colours: ["#b91c1c", "Red", "#92400e", "Maple"] },
  ],
  spring: [
    { emoji: "🌸", name: "Light Dress", colours: ["#f9a8d4", "Blossom", "#a7f3d0", "Mint"] },
    { emoji: "🧥", name: "Windbreaker", colours: ["#38bdf8", "Sky", "#fb923c", "Peach"] },
    { emoji: "👟", name: "Tee & Sneakers", colours: ["#4ade80", "Green", "#e879f9", "Magenta"] },
    { emoji: "☔", name: "Light Raincoat", colours: ["#fde047", "Sun", "#93c5fd", "Cloud"] },
    { emoji: "🌼", name: "Cardigan", colours: ["#fbbf24", "Daisy", "#c084fc", "Violet"] },
  ],
};

export const OUTFITS: Outfit[] = (Object.keys(SETS) as Season[]).flatMap((season) =>
  SETS[season].flatMap((set, i) => [
    { id: `${season}-${i}-a`, season, emoji: set.emoji, name: set.name, colour: set.colours[0], colourName: set.colours[1] },
    { id: `${season}-${i}-b`, season, emoji: set.emoji, name: set.name, colour: set.colours[2], colourName: set.colours[3] },
  ]),
);

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomSeason(): Season {
  const all: Season[] = ["summer", "winter", "autumn", "spring"];
  return all[Math.floor(Math.random() * all.length)];
}

/** Build a round's wardrobe: one CORRECT outfit for the season + 3 from other
 *  seasons, shuffled. */
export function buildWardrobe(season: Season): Outfit[] {
  const correct = shuffle(OUTFITS.filter((o) => o.season === season))[0];
  const wrong = shuffle(OUTFITS.filter((o) => o.season !== season)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

// ── Life stages: you start as a baby and grow as the rooms go by ──────────────
export interface LifeStage {
  name: string;
  emoji: { girl: string; boy: string };
  /** rooms survived to reach this stage */
  fromRoom: number;
}

export const LIFE_STAGES: LifeStage[] = [
  { name: "Baby", emoji: { girl: "👶", boy: "👶" }, fromRoom: 0 },
  { name: "Kid", emoji: { girl: "👧", boy: "👦" }, fromRoom: 4 },
  { name: "Teen", emoji: { girl: "🙋‍♀️", boy: "🙋‍♂️" }, fromRoom: 8 },
  { name: "Grown-up", emoji: { girl: "👩", boy: "👨" }, fromRoom: 13 },
  { name: "Grandparent", emoji: { girl: "👵", boy: "👴" }, fromRoom: 19 },
];

export function stageForRoom(room: number): LifeStage {
  let s = LIFE_STAGES[0];
  for (const st of LIFE_STAGES) if (room >= st.fromRoom) s = st;
  return s;
}
