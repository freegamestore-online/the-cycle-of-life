import { GameShell, GameTopbar } from "@freegamestore/games";
import { useCallback, useState } from "react";
import {
  SEASONS, buildWardrobe, randomSeason, stageForRoom,
  type Outfit, type Season,
} from "./outfits";

// The Cycle Of Life — a dress-up game.
// Pick a girl or a boy; you start life as a baby. Endless rooms, each with a
// random season — dress for the weather! Wrong outfit → you get sick; three
// sicknesses and your life ends. Survive rooms to grow up: baby → kid → teen
// → grown-up → grandparent.

type Phase = "start" | "room" | "result" | "dead";
type Gender = "girl" | "boy";

const MAX_SICK = 3;

interface RoundState {
  season: Season;
  wardrobe: Outfit[];
  picked: Outfit | null;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("start");
  const [gender, setGender] = useState<Gender>("girl");
  const [room, setRoom] = useState(0);       // rooms survived (score)
  const [sick, setSick] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("cycleoflife_best") || 0));
  const [round, setRound] = useState<RoundState>(() => ({ season: randomSeason(), wardrobe: [], picked: null }));

  const newRoom = useCallback(() => {
    const season = randomSeason();
    setRound({ season, wardrobe: buildWardrobe(season), picked: null });
    setPhase("room");
  }, []);

  const start = useCallback((g: Gender) => {
    setGender(g);
    setRoom(0);
    setSick(0);
    newRoom();
  }, [newRoom]);

  const pick = useCallback((o: Outfit) => {
    if (round.picked) return;
    setRound((r) => ({ ...r, picked: o }));
    setPhase("result");
    if (o.season === round.season) {
      const nr = room + 1;
      setRoom(nr);
      if (nr > best) {
        setBest(nr);
        localStorage.setItem("cycleoflife_best", String(nr));
      }
    } else {
      const ns = sick + 1;
      setSick(ns);
      if (ns >= MAX_SICK) {
        setTimeout(() => setPhase("dead"), 1400);
        return;
      }
    }
  }, [round.picked, round.season, room, sick, best]);

  const stage = stageForRoom(room);
  const info = SEASONS[round.season];
  const correct = round.picked?.season === round.season;

  return (
    <GameShell topbar={<GameTopbar title="The Cycle Of Life" score={room} />}>
      {phase === "start" && (
        <div className="flex flex-col items-center justify-center h-full gap-6 px-4 text-center"
          style={{ background: "linear-gradient(180deg,#e0f2fe,#fce7f3)" }}>
          <h1 className="text-4xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "#334155" }}>
            🌱 The Cycle Of Life
          </h1>
          <p className="max-w-sm text-base" style={{ color: "#475569" }}>
            Live a whole life, one room at a time! Dress for the season's weather.
            Dress wrong and you get sick — <strong>3 sicknesses</strong> and your story ends. 🌸☀️🍂❄️
          </p>
          <p className="text-lg font-semibold" style={{ color: "#334155" }}>Who will you be?</p>
          <div className="flex gap-5">
            {(["girl", "boy"] as Gender[]).map((g) => (
              <button key={g} onClick={() => start(g)}
                className="flex flex-col items-center gap-2 px-8 py-5 rounded-3xl border-4 bg-white transition-transform active:scale-95 cursor-pointer"
                style={{ borderColor: g === "girl" ? "#f9a8d4" : "#93c5fd", minWidth: 130 }}>
                <span style={{ fontSize: 64 }}>{g === "girl" ? "👧" : "👦"}</span>
                <span className="text-xl font-bold capitalize" style={{ fontFamily: "Fraunces, serif", color: "#334155" }}>{g}</span>
              </button>
            ))}
          </div>
          {best > 0 && <p className="text-sm" style={{ color: "#64748b" }}>🏆 Longest life so far: {best} rooms</p>}
        </div>
      )}

      {(phase === "room" || phase === "result") && (
        <div className="flex flex-col h-full overflow-hidden" style={{ background: info.sky }}>
          {/* status row */}
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.75)" }}>
            <span className="text-sm font-bold" style={{ color: "#334155" }}>
              {stage.emoji[gender]} {stage.name} · Room {room + 1}
            </span>
            <span className="text-sm font-bold" style={{ color: "#334155" }}>
              {Array.from({ length: MAX_SICK }).map((_, i) => (i < MAX_SICK - sick ? "❤️" : "🤒")).join(" ")}
            </span>
          </div>

          {/* season + character */}
          <div className="flex flex-col items-center gap-1 pt-4 pb-2 flex-shrink-0">
            <div className="px-4 py-1.5 rounded-full text-lg font-bold bg-white/85" style={{ fontFamily: "Fraunces, serif", color: "#334155" }}>
              {info.emoji} {info.name}
            </div>
            <p className="text-sm font-semibold" style={{ color: "#475569" }}>{info.weather}</p>
            <div className="relative mt-1" style={{ fontSize: 84, lineHeight: 1.1 }}>
              {stage.emoji[gender]}
              {phase === "result" && (
                <span className="absolute -right-10 top-0" style={{ fontSize: 40 }}>
                  {correct ? "✨" : "🤧"}
                </span>
              )}
            </div>
          </div>

          {/* result banner OR wardrobe */}
          {phase === "result" ? (
            <div className="flex flex-col items-center gap-3 px-4 pt-2">
              <div className="px-5 py-3 rounded-2xl text-center bg-white/90" style={{ maxWidth: 340 }}>
                {correct ? (
                  <p className="text-lg font-bold" style={{ color: "#16a34a" }}>Perfect outfit! You stayed cozy 🎉</p>
                ) : (
                  <p className="text-lg font-bold" style={{ color: "#dc2626" }}>
                    Oh no — {round.picked?.name} in {info.name}?! You got sick 🤒
                  </p>
                )}
                <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                  {sick >= MAX_SICK ? "…" : correct ? "On to the next room!" : `${MAX_SICK - sick} ${MAX_SICK - sick === 1 ? "heart" : "hearts"} left — be careful!`}
                </p>
              </div>
              {sick < MAX_SICK && (
                <button onClick={newRoom}
                  className="px-8 py-3 rounded-2xl text-lg font-bold text-white cursor-pointer active:scale-95"
                  style={{ background: "#10b981", minHeight: 48, fontFamily: "Manrope, sans-serif" }}>
                  Next room →
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <p className="text-center text-sm font-bold mb-2" style={{ color: "#334155" }}>
                👗 Pick the right outfit for the weather:
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {round.wardrobe.map((o) => (
                  <button key={o.id} onClick={() => pick(o)}
                    className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/90 border-2 border-transparent hover:border-emerald-400 transition-all active:scale-95 cursor-pointer"
                    style={{ minHeight: 110 }}>
                    <span style={{ fontSize: 40 }}>{o.emoji}</span>
                    <span className="text-sm font-bold text-center" style={{ color: "#334155" }}>{o.name}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                      <span className="inline-block rounded-full" style={{ width: 10, height: 10, background: o.colour }} />
                      {o.colourName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "dead" && (
        <div className="flex flex-col items-center justify-center h-full gap-5 px-4 text-center"
          style={{ background: "linear-gradient(180deg,#e2e8f0,#cbd5e1)" }}>
          <span style={{ fontSize: 72 }}>🪦</span>
          <h2 className="text-3xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "#334155" }}>
            Your life story ends…
          </h2>
          <p className="text-base" style={{ color: "#475569", maxWidth: 340 }}>
            You got sick {MAX_SICK} times as a {stageForRoom(room).name.toLowerCase()}.
            You lived through <strong>{room}</strong> {room === 1 ? "room" : "rooms"}.
            {best === room && room > 0 ? " 🏆 A new longest life!" : ` Longest life: ${best}.`}
          </p>
          <button onClick={() => setPhase("start")}
            className="px-8 py-3 rounded-2xl text-lg font-bold text-white cursor-pointer active:scale-95"
            style={{ background: "#10b981", minHeight: 48 }}>
            🌱 Live again
          </button>
        </div>
      )}
    </GameShell>
  );
}
