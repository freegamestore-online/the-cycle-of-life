import kaplay, { KAPLAYCtx } from "kaplay";
import { SEASONS, OUTFITS, LIFE_STAGES, randomSeason, buildWardrobe, stageForRoom } from "./outfits";
import type { Season, Outfit } from "./outfits";

const VW = 480;
const VH = 640;

// ── colour palette ────────────────────────────────────────────────────────────
const C = {
  white:   [255, 255, 255] as [number, number, number],
  black:   [20,  20,  20 ] as [number, number, number],
  grey:    [160, 160, 160] as [number, number, number],
  green:   [16,  185, 129] as [number, number, number],
  red:     [239, 68,  68 ] as [number, number, number],
  yellow:  [250, 204, 21 ] as [number, number, number],
  blue:    [59,  130, 246] as [number, number, number],
  pink:    [244, 114, 182] as [number, number, number],
  orange:  [249, 115, 22 ] as [number, number, number],
  purple:  [167, 139, 250] as [number, number, number],
  teal:    [20,  184, 166] as [number, number, number],
};

// Season sky colours (top → bottom)
const SKY: Record<Season, [[number,number,number],[number,number,number]]> = {
  summer: [[253,230,138],[252,165,165]],
  winter: [[191,219,254],[224,231,255]],
  autumn: [[254,215,170],[253,186,116]],
  spring: [[187,247,208],[251,207,232]],
};

// ── shared game state passed between scenes ───────────────────────────────────
interface GameState {
  gender: "girl" | "boy";
  room: number;
  sickCount: number;
  score: number;
}

export function startGame(
  canvas: HTMLCanvasElement,
  onScore: (n: number) => void,
): () => void {
  const k = kaplay({
    canvas,
    width: VW,
    height: VH,
    letterbox: true,
    background: [24, 24, 27],
    global: false,
    pixelDensity: Math.min(window.devicePixelRatio || 1, 2),
  });

  // ── helpers ────────────────────────────────────────────────────────────────

  function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  function drawSky(k: KAPLAYCtx, season: Season) {
    const [top, bot] = SKY[season];
    // Draw sky as stacked horizontal strips
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      k.add([
        k.rect(VW, VH / steps + 2),
        k.pos(0, (VH / steps) * i),
        k.color(
          Math.round(top[0] + (bot[0] - top[0]) * t),
          Math.round(top[1] + (bot[1] - top[1]) * t),
          Math.round(top[2] + (bot[2] - top[2]) * t),
        ),
        k.z(-10),
        "bg",
      ]);
    }
  }

  function btn(
    label: string,
    x: number, y: number, w: number, h: number,
    col: [number,number,number],
    onClick: () => void,
  ) {
    const b = k.add([
      k.rect(w, h, { radius: 10 }),
      k.color(...col),
      k.anchor("center"),
      k.pos(x, y),
      k.area(),
      k.z(10),
      "btn",
    ]);
    k.add([
      k.text(label, { size: 18, font: "monospace" }),
      k.anchor("center"),
      k.pos(x, y),
      k.color(...C.white),
      k.z(11),
    ]);
    b.onClick(onClick);
    // touch
    b.onTouchStart(() => onClick());
    return b;
  }

  function heartRow(sickCount: number, x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      k.add([
        k.text(i < 3 - sickCount ? "❤️" : "🖤", { size: 22 }),
        k.anchor("center"),
        k.pos(x + i * 34, y),
        k.z(12),
      ]);
    }
  }

  function drawCharacter(
    cx: number, cy: number,
    gender: "girl" | "boy",
    room: number,
    outfit: Outfit | null,
  ) {
    const stage = stageForRoom(room);
    const emoji = stage.emoji[gender];

    // body
    const bodySize = 64 + (room >= 4 ? 8 : 0) + (room >= 8 ? 8 : 0);
    k.add([
      k.text(emoji, { size: bodySize }),
      k.anchor("center"),
      k.pos(cx, cy),
      k.z(5),
      "character",
    ]);

    // outfit overlay
    if (outfit) {
      k.add([
        k.text(outfit.emoji, { size: bodySize * 0.7 }),
        k.anchor("center"),
        k.pos(cx + 4, cy + 8),
        k.z(6),
        "character",
      ]);
    }
  }

  // ── SCENE: title / gender select ──────────────────────────────────────────
  k.scene("title", () => {
    // gradient bg
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      k.add([
        k.rect(VW, VH / 20 + 2),
        k.pos(0, (VH / 20) * i),
        k.color(
          Math.round(167 + (251 - 167) * t),
          Math.round(139 + (207 - 139) * t),
          Math.round(250 + (232 - 250) * t),
        ),
        k.z(-10),
      ]);
    }

    k.add([k.text("🌱 The Cycle Of Life", { size: 26, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 90), k.color(...C.black), k.z(5)]);
    k.add([k.text("A dress-up adventure", { size: 16, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 124), k.color(...C.black), k.z(5)]);

    k.add([k.text("Choose your character:", { size: 18, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 200), k.color(...C.black), k.z(5)]);

    // Girl card
    const girlCard = k.add([
      k.rect(140, 180, { radius: 16 }),
      k.color(244, 114, 182),
      k.anchor("center"),
      k.pos(VW / 2 - 85, 330),
      k.area(),
      k.z(5),
    ]);
    k.add([k.text("👧", { size: 64 }), k.anchor("center"), k.pos(VW / 2 - 85, 310), k.z(6)]);
    k.add([k.text("Girl", { size: 20, font: "monospace" }), k.anchor("center"), k.pos(VW / 2 - 85, 390), k.color(...C.white), k.z(6)]);
    girlCard.onClick(() => k.go("walk", { gender: "girl", room: 0, sickCount: 0, score: 0 } as GameState, "in"));
    girlCard.onTouchStart(() => k.go("walk", { gender: "girl", room: 0, sickCount: 0, score: 0 } as GameState, "in"));

    // Boy card
    const boyCard = k.add([
      k.rect(140, 180, { radius: 16 }),
      k.color(59, 130, 246),
      k.anchor("center"),
      k.pos(VW / 2 + 85, 330),
      k.area(),
      k.z(5),
    ]);
    k.add([k.text("👦", { size: 64 }), k.anchor("center"), k.pos(VW / 2 + 85, 310), k.z(6)]);
    k.add([k.text("Boy", { size: 20, font: "monospace" }), k.anchor("center"), k.pos(VW / 2 + 85, 390), k.color(...C.white), k.z(6)]);
    boyCard.onClick(() => k.go("walk", { gender: "boy", room: 0, sickCount: 0, score: 0 } as GameState, "in"));
    boyCard.onTouchStart(() => k.go("walk", { gender: "boy", room: 0, sickCount: 0, score: 0 } as GameState, "in"));

    k.add([k.text("Dress for the weather to survive!", { size: 13, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 480), k.color(...C.black), k.z(5)]);
    k.add([k.text("❤️❤️❤️  3 sick = game over", { size: 13, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 510), k.color(...C.black), k.z(5)]);
  });

  // ── SCENE: walk (character walks into the new room) ───────────────────────
  k.scene("walk", (state: GameState, _dir: string) => {
    const season = randomSeason();
    const si = SEASONS[season];

    drawSky(k, season);
    drawFloor(k, season);
    drawSeasonDecorations(k, season);

    // door on the left (entry)
    k.add([k.text("🚪", { size: 48 }), k.anchor("center"), k.pos(30, VH - 120), k.z(4)]);
    // door on the right (exit)
    k.add([k.text("🚪", { size: 48 }), k.anchor("center"), k.pos(VW - 30, VH - 120), k.z(4)]);

    // character walks from left door to centre
    let charX = -40;
    const targetX = VW / 2;
    let walking = true;
    let bobT = 0;

    const stage = stageForRoom(state.room);
    const charEmoji = stage.emoji[state.gender];

    const charLabel = k.add([
      k.text(charEmoji, { size: 72 }),
      k.anchor("center"),
      k.pos(charX, VH - 150),
      k.z(5),
    ]);

    k.onUpdate(() => {
      if (!walking) return;
      charX += 3;
      bobT += 0.25;
      charLabel.pos.x = charX;
      charLabel.pos.y = VH - 150 + Math.sin(bobT) * 5;
      if (charX >= targetX) {
        charX = targetX;
        charLabel.pos.x = targetX;
        charLabel.pos.y = VH - 150;
        walking = false;
        k.wait(0.3, () => k.go("dress", state, season));
      }
    });

    // Room number
    k.add([k.text(`Room ${state.room + 1}`, { size: 16, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 30), k.color(...C.black), k.z(10)]);
    heartRow(state.sickCount, VW / 2 - 50, 60);
  });

  // ── SCENE: dress (pick outfit for this room's season) ────────────────────
  k.scene("dress", (state: GameState, season: Season) => {
    const si = SEASONS[season];
    const wardrobe = buildWardrobe(season);

    drawSky(k, season);
    drawFloor(k, season);
    drawSeasonDecorations(k, season);

    // doors
    k.add([k.text("🚪", { size: 48 }), k.anchor("center"), k.pos(30, VH - 120), k.z(4)]);
    k.add([k.text("🚪", { size: 48 }), k.anchor("center"), k.pos(VW - 30, VH - 120), k.z(4)]);

    // HUD
    k.add([k.text(`Room ${state.room + 1}  ${si.emoji} ${si.name}`, { size: 16, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 30), k.color(...C.black), k.z(10)]);
    heartRow(state.sickCount, VW / 2 - 50, 60);

    // Weather banner
    k.add([
      k.rect(VW - 40, 36, { radius: 8 }),
      k.color(255, 255, 255),
      k.anchor("center"),
      k.pos(VW / 2, 95),
      k.z(9),
      k.opacity(0.7),
    ]);
    k.add([k.text(si.weather, { size: 13, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 95), k.color(...C.black), k.z(10)]);

    // Character standing
    drawCharacter(VW / 2, VH - 160, state.gender, state.room, null);

    // Prompt
    k.add([k.text("What will you wear?", { size: 15, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, VH - 260), k.color(...C.black), k.z(10)]);

    // Outfit cards — 2×2 grid
    const cols = 2;
    const cardW = 180;
    const cardH = 90;
    const gapX = 20;
    const gapY = 12;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (VW - gridW) / 2 + cardW / 2;
    const startY = VH - 220;

    wardrobe.forEach((outfit, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      const [r, g, b] = hexToRgb(outfit.colour);
      const card = k.add([
        k.rect(cardW, cardH, { radius: 10 }),
        k.color(r, g, b),
        k.anchor("center"),
        k.pos(cx, cy),
        k.area(),
        k.z(10),
        "card",
      ]);

      k.add([k.text(outfit.emoji, { size: 28 }), k.anchor("center"), k.pos(cx - 30, cy), k.z(11)]);
      k.add([
        k.text(`${outfit.name}\n${outfit.colourName}`, { size: 12, font: "monospace", align: "left" }),
        k.anchor("center"),
        k.pos(cx + 20, cy),
        k.color(...C.black),
        k.z(11),
      ]);

      const choose = () => {
        const correct = outfit.season === season;
        k.go("result", state, season, outfit, correct);
      };
      card.onClick(choose);
      card.onTouchStart(choose);
    });
  });

  // ── SCENE: result (show feedback then walk to next room) ──────────────────
  k.scene("result", (state: GameState, season: Season, outfit: Outfit, correct: boolean) => {
    const si = SEASONS[season];

    drawSky(k, season);
    drawFloor(k, season);
    drawSeasonDecorations(k, season);

    // doors
    k.add([k.text("🚪", { size: 48 }), k.anchor("center"), k.pos(30, VH - 120), k.z(4)]);
    k.add([k.text("🚪", { size: 48 }), k.anchor("center"), k.pos(VW - 30, VH - 120), k.z(4)]);

    const newSick = correct ? state.sickCount : state.sickCount + 1;
    const newScore = correct ? state.score + 1 : state.score;
    onScore(newScore);

    // Character with chosen outfit
    drawCharacter(VW / 2, VH - 160, state.gender, state.room, outfit);

    // Feedback bubble
    const bubbleY = VH - 310;
    k.add([
      k.rect(VW - 60, 110, { radius: 14 }),
      k.color(...(correct ? C.green : C.red)),
      k.anchor("center"),
      k.pos(VW / 2, bubbleY),
      k.z(10),
      k.opacity(0.92),
    ]);

    if (correct) {
      k.add([k.text("✅ Perfect outfit!", { size: 20, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, bubbleY - 22), k.color(...C.white), k.z(11)]);
      k.add([k.text(`${outfit.emoji} ${outfit.name} — ${outfit.colourName}`, { size: 14, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, bubbleY + 8), k.color(...C.white), k.z(11)]);
      k.add([k.text(`Great choice for ${si.name}! 🎉`, { size: 13, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, bubbleY + 32), k.color(...C.white), k.z(11)]);
    } else {
      k.add([k.text("🤧 Wrong outfit! You got sick!", { size: 17, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, bubbleY - 22), k.color(...C.white), k.z(11)]);
      k.add([k.text(`${outfit.emoji} doesn't suit ${si.name}`, { size: 13, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, bubbleY + 8), k.color(...C.white), k.z(11)]);
      k.add([k.text(`${newSick}/3 sick 🤒`, { size: 14, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, bubbleY + 32), k.color(...C.white), k.z(11)]);
    }

    // Hearts
    heartRow(newSick, VW / 2 - 50, 60);
    k.add([k.text(`Room ${state.room + 1}  ${si.emoji} ${si.name}`, { size: 16, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 30), k.color(...C.black), k.z(10)]);

    // Life stage milestone
    const nextRoom = state.room + 1;
    const oldStage = stageForRoom(state.room);
    const newStage = stageForRoom(nextRoom);
    if (newStage.name !== oldStage.name) {
      k.add([
        k.text(`🎂 You grew up! Now a ${newStage.name}!`, { size: 14, font: "monospace" }),
        k.anchor("center"),
        k.pos(VW / 2, bubbleY + 62),
        k.color(...C.yellow),
        k.z(11),
      ]);
    }

    // Auto-advance or game over
    k.wait(2.2, () => {
      if (newSick >= 3) {
        k.go("over", { ...state, sickCount: newSick, score: newScore });
      } else {
        // Walk to next room
        k.go("walkOut", { ...state, room: nextRoom, sickCount: newSick, score: newScore }, outfit);
      }
    });
  });

  // ── SCENE: walkOut (character walks out the right door, then new room) ────
  k.scene("walkOut", (state: GameState, outfit: Outfit) => {
    const season = randomSeason();
    // Use the CURRENT room's season for this walk-out visual
    const si = SEASONS[season];

    drawSky(k, season);
    drawFloor(k, season);
    drawSeasonDecorations(k, season);

    k.add([k.text("🚪", { size: 48 }), k.anchor("center"), k.pos(30, VH - 120), k.z(4)]);
    k.add([k.text("🚪", { size: 48 }), k.anchor("center"), k.pos(VW - 30, VH - 120), k.z(4)]);

    k.add([k.text(`Room ${state.room}  ➡️  Room ${state.room + 1}`, { size: 15, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 30), k.color(...C.black), k.z(10)]);
    heartRow(state.sickCount, VW / 2 - 50, 60);

    const stage = stageForRoom(state.room - 1);
    const charEmoji = stage.emoji[state.gender];

    let charX = VW / 2;
    let bobT = 0;
    const charLabel = k.add([
      k.text(charEmoji, { size: 72 }),
      k.anchor("center"),
      k.pos(charX, VH - 150),
      k.z(5),
    ]);
    // outfit overlay walking out
    const outfitLabel = k.add([
      k.text(outfit.emoji, { size: 50 }),
      k.anchor("center"),
      k.pos(charX + 4, VH - 142),
      k.z(6),
    ]);

    k.onUpdate(() => {
      charX += 3.5;
      bobT += 0.25;
      charLabel.pos.x = charX;
      charLabel.pos.y = VH - 150 + Math.sin(bobT) * 5;
      outfitLabel.pos.x = charX + 4;
      outfitLabel.pos.y = VH - 142 + Math.sin(bobT) * 5;
      if (charX > VW + 60) {
        k.go("walk", state, "in");
      }
    });
  });

  // ── SCENE: game over ──────────────────────────────────────────────────────
  k.scene("over", (state: GameState) => {
    // dark overlay
    k.add([k.rect(VW, VH), k.color(20, 20, 27), k.pos(0, 0), k.z(-1)]);

    k.add([k.text("💀 Game Over", { size: 36, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 140), k.color(...C.red), k.z(5)]);
    k.add([k.text("You got sick too many times!", { size: 16, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 190), k.color(...C.grey), k.z(5)]);

    const stage = stageForRoom(state.room);
    k.add([k.text(stage.emoji[state.gender], { size: 80 }), k.anchor("center"), k.pos(VW / 2, 290), k.z(5)]);
    k.add([k.text(`You reached: ${stage.name}`, { size: 18, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 360), k.color(...C.yellow), k.z(5)]);
    k.add([k.text(`Rooms survived: ${state.room}`, { size: 18, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 395), k.color(...C.white), k.z(5)]);
    k.add([k.text(`Correct outfits: ${state.score}`, { size: 18, font: "monospace" }), k.anchor("center"), k.pos(VW / 2, 430), k.color(...C.green), k.z(5)]);

    btn("Play Again", VW / 2, 510, 180, 52, C.green, () => k.go("title"));
  });

  k.go("title");
  return () => k.quit();
}

// ── Room floor & decorations ─────────────────────────────────────────────────

function drawFloor(k: KAPLAYCtx, season: Season) {
  const floorColours: Record<Season, [number,number,number]> = {
    summer: [253, 224, 71],
    winter: [219, 234, 254],
    autumn: [180, 120, 60],
    spring: [134, 239, 172],
  };
  const [r, g, b] = floorColours[season];
  // floor strip
  k.add([k.rect(VW, 80), k.color(r, g, b), k.pos(0, VH - 80), k.z(0)]);
  // wall
  k.add([k.rect(VW, VH - 80), k.color(r + 20, g + 20, b + 20), k.pos(0, 0), k.z(-5), k.opacity(0.25)]);
  // skirting board
  k.add([k.rect(VW, 8), k.color(180, 140, 100), k.pos(0, VH - 82), k.z(1)]);
}

function drawSeasonDecorations(k: KAPLAYCtx, season: Season) {
  if (season === "summer") {
    // sun
    k.add([k.text("☀️", { size: 56 }), k.anchor("center"), k.pos(VW - 70, 80), k.z(2)]);
    // flowers
    k.add([k.text("🌺🌻🌸", { size: 28 }), k.anchor("center"), k.pos(VW / 2, VH - 55), k.z(3)]);
    // window
    k.add([k.text("🪟", { size: 56 }), k.anchor("center"), k.pos(80, 180), k.z(2)]);
  } else if (season === "winter") {
    // snowflakes
    k.add([k.text("❄️❄️❄️", { size: 28 }), k.anchor("center"), k.pos(VW / 2, 80), k.z(2)]);
    k.add([k.text("⛄", { size: 48 }), k.anchor("center"), k.pos(VW - 80, VH - 100), k.z(2)]);
    k.add([k.text("🪟", { size: 56 }), k.anchor("center"), k.pos(80, 180), k.z(2)]);
    // snow on floor
    k.add([k.rect(VW, 12), k.color(240, 248, 255), k.pos(0, VH - 82), k.z(2)]);
  } else if (season === "autumn") {
    k.add([k.text("🍂🍁🍂", { size: 28 }), k.anchor("center"), k.pos(VW / 2, 80), k.z(2)]);
    k.add([k.text("🌧️", { size: 48 }), k.anchor("center"), k.pos(VW - 80, 100), k.z(2)]);
    k.add([k.text("🪟", { size: 56 }), k.anchor("center"), k.pos(80, 180), k.z(2)]);
  } else {
    k.add([k.text("🌸🌼🌷", { size: 28 }), k.anchor("center"), k.pos(VW / 2, 80), k.z(2)]);
    k.add([k.text("🌈", { size: 48 }), k.anchor("center"), k.pos(VW - 80, 100), k.z(2)]);
    k.add([k.text("🪟", { size: 56 }), k.anchor("center"), k.pos(80, 180), k.z(2)]);
  }
}
