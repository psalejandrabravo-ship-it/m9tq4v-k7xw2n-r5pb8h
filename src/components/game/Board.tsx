import { useEffect, useMemo, useRef, useState } from "react";
import {
  SPECIALS,
  allCellNumbers,
  boardLayout,
  cellKind,
  cellPixel,
  startPixel,
} from "@/lib/game/board";
import { STEP_MS, useGame } from "@/lib/game/store";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { Token } from "./Token";

function useBoardCols() {
  const [cols, setCols] = useState(5);
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const landscape = w > h && w >= 700;
      setCols(landscape ? 10 : 5);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  return cols;
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function Board({ zoom }: { zoom: number }) {
  const players = useGame((s) => s.players);
  const currentIndex = useGame((s) => s.currentIndex);
  const pendingCell = useGame((s) => s.pendingCell);
  const turnState = useGame((s) => s.turnState);
  const tapCell = useGame((s) => s.tapCell);
  const scroller = useRef<HTMLDivElement>(null);
  const cols = useBoardCols();
  const layout = useMemo(() => boardLayout(cols), [cols]);
  const active = players[currentIndex];
  const focusCell = active?.displayPosition ?? 0;

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const id = focusCell <= 0 ? "cell-start" : `cell-${focusCell}`;
    const el = document.getElementById(id);
    if (!el) return;
    const er = el.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    const left = root.scrollLeft + (er.left - rr.left) - rr.width / 2 + er.width / 2;
    const top = root.scrollTop + (er.top - rr.top) - rr.height * 0.4 + er.height / 2;
    root.scrollTo({
      left: Math.max(0, left),
      top: Math.max(0, top),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [focusCell, zoom, cols]);

  const trail = useMemo(() => {
    const start = startPixel(layout);
    const pts = [start, ...allCellNumbers().map((n) => cellPixel(n, layout))];
    return smoothPath(pts);
  }, [layout]);

  const start = startPixel(layout);

  return (
    <div ref={scroller} className="relative min-h-0 flex-1 overflow-auto overscroll-contain">
      <div
        className="relative mx-auto origin-top"
        style={{
          width: layout.width * zoom,
          height: layout.height * zoom,
        }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <div className="world-ground absolute inset-0 overflow-hidden rounded-[28px]">
            <img
              src={cols <= 5 ? "/game/world-tall.jpg" : "/game/world-wide.jpg"}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/35 via-bg-deep/15 to-bg-deep/45" />
            <ScenicBits layout={layout} />
          </div>

          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          >
            <path d={trail} className="trail-glow" />
            <path d={trail} className="trail-earth" />
            <path d={trail} className="trail-gold" />
          </svg>

          {allCellNumbers().map((n) => {
            const { x, y } = cellPixel(n, layout);
            const kind = cellKind(n);
            const special = SPECIALS[n];
            const waiting = pendingCell === n && turnState === "awaitingQuestion";
            const arrived = pendingCell === n;
            const here = players.filter((p) => p.displayPosition === n);
            return (
              <button
                key={n}
                id={`cell-${n}`}
                type="button"
                disabled={turnState === "awaitingQuestion" && pendingCell !== n}
                onClick={() => tapCell(n)}
                className={cn(
                  "stone absolute flex items-center justify-center rounded-full",
                  kind === "question" && "stone-q",
                  kind === "obstacle" && "stone-obs",
                  kind === "advantage" && "stone-adv",
                  kind === "goal" && "stone-goal",
                  waiting && "cell-await",
                  arrived && turnState === "resolving" && overlaySafe(kind) && "cell-landed",
                )}
                style={{
                  width: layout.cell,
                  height: layout.cell,
                  left: x - layout.cell / 2,
                  top: y - layout.cell / 2,
                  zIndex: waiting ? 8 : 3,
                }}
                aria-label={`Casillero ${n}${special ? `, ${special.label}` : ""}`}
              >
                {kind === "goal" ? (
                  <img
                    src="/game/castle.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                  />
                ) : null}
                <span className="cell-num relative z-[1]">{n}</span>
                {special ? (
                  <span className="absolute -right-1 -top-1 text-base drop-shadow" aria-hidden>
                    {special.icon}
                  </span>
                ) : null}
                {waiting ? (
                  <>
                    <span className="sparkle-dot left-[8%] top-[6%]" />
                    <span className="sparkle-dot right-[10%] top-[18%]" style={{ animationDelay: "0.4s" }} />
                    <span className="sparkle-dot left-[18%] bottom-[10%]" style={{ animationDelay: "0.8s" }} />
                  </>
                ) : null}
                {here.length > 0 ? (
                  <span className="sr-only">
                    {here.length} ficha{here.length > 1 ? "s" : ""}
                  </span>
                ) : null}
              </button>
            );
          })}

          <div
            id="cell-start"
            className="absolute z-[4] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-bg-deep/85 px-3 py-2 shadow-[0_0_0_1px_rgba(246,241,232,0.18)]"
            style={{ left: start.x + 56, top: start.y }}
          >
            <span className="font-display text-xs font-semibold uppercase tracking-wide text-gold">Inicio</span>
          </div>

          {players.map((p) => {
            const pos = p.displayPosition <= 0 ? start : cellPixel(p.displayPosition, layout);
            const stack = players.filter((o) => o.displayPosition === p.displayPosition);
            const idx = stack.findIndex((o) => o.id === p.id);
            const offset = (idx - (stack.length - 1) / 2) * 14;
            const isActive = p.id === active?.id;
            return (
              <div
                key={p.id}
                className="token-float pointer-events-none absolute z-[6]"
                style={{
                  left: pos.x + offset,
                  top: pos.y - 10,
                  transition: prefersReducedMotion()
                    ? "none"
                    : `left ${STEP_MS}ms cubic-bezier(0.22, 1, 0.36, 1), top ${STEP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  zIndex: isActive ? 7 : 6,
                }}
              >
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <Token
                    avatarId={p.avatarId}
                    size={isActive ? 48 : 40}
                    active={isActive}
                    crowned={p.finished}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function overlaySafe(kind: ReturnType<typeof cellKind>) {
  return kind === "question" || kind === "goal";
}

function ScenicBits({ layout }: { layout: ReturnType<typeof boardLayout> }) {
  const trees = [
    { x: 7, y: 14, s: 1.1 },
    { x: 91, y: 12, s: 1.25 },
    { x: 5, y: 38, s: 0.9 },
    { x: 94, y: 42, s: 1 },
    { x: 8, y: 62, s: 1.15 },
    { x: 90, y: 68, s: 0.95 },
    { x: 6, y: 84, s: 1.05 },
    { x: 92, y: 88, s: 1.2 },
  ];
  const flowers = [
    { x: 18, y: 28 },
    { x: 78, y: 22 },
    { x: 24, y: 52 },
    { x: 72, y: 48 },
    { x: 20, y: 76 },
    { x: 80, y: 72 },
    { x: 46, y: 18 },
    { x: 52, y: 90 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {trees.map((t, i) => (
        <span
          key={`t-${i}`}
          className="scenic-tree"
          style={{ left: `${t.x}%`, top: `${t.y}%`, transform: `scale(${t.s})` }}
        />
      ))}
      <span className="scenic-crystal" style={{ left: "16%", top: "34%" }} />
      <span className="scenic-crystal scenic-crystal-b" style={{ left: "82%", top: "40%" }} />
      <span className="scenic-crystal" style={{ left: "28%", top: "70%" }} />
      {flowers.map((f, i) => (
        <span key={`f-${i}`} className="scenic-flower" style={{ left: `${f.x}%`, top: `${f.y}%` }} />
      ))}
      <span
        className="scenic-bridge"
        style={{ left: "42%", top: `${layout.padYTop + layout.cell * 3.1}px` }}
      />
    </div>
  );
}
