import type { AdvantageType, CellKind, ObstacleType } from "./types";

export const BOARD_SIZE = 50;
export const COLS = 10;
export const ROWS = 5;

export interface SpecialCell {
  kind: "obstacle" | "advantage" | "goal";
  type?: ObstacleType | AdvantageType;
  icon: string;
  label: string;
}

/**
 * 10 obstacles + 5 advantages, spread along the path.
 * Cell 50 is the castle. Everything else is a question stone.
 */
export const SPECIALS: Record<number, SpecialCell> = {
  6: { kind: "advantage", type: "portal", icon: "⭐", label: "Portal mágico" },
  8: { kind: "obstacle", type: "swirl", icon: "🌀", label: "Remolino mágico" },
  11: { kind: "obstacle", type: "mushroom", icon: "🍄", label: "Hongo confundidor" },
  14: { kind: "obstacle", type: "web", icon: "🕸️", label: "Telaraña encantada" },
  16: { kind: "advantage", type: "rainbow", icon: "🌈", label: "Arcoíris" },
  19: { kind: "obstacle", type: "storm", icon: "🌧️", label: "Nube de tormenta" },
  21: { kind: "advantage", type: "fairy", icon: "🧚", label: "Hada madrina" },
  23: { kind: "obstacle", type: "river", icon: "🌊", label: "Río encantado" },
  27: { kind: "obstacle", type: "swirl", icon: "🌀", label: "Remolino mágico" },
  31: { kind: "advantage", type: "portal", icon: "⭐", label: "Portal mágico" },
  33: { kind: "obstacle", type: "mushroom", icon: "🍄", label: "Hongo confundidor" },
  36: { kind: "obstacle", type: "web", icon: "🕸️", label: "Telaraña encantada" },
  39: { kind: "advantage", type: "fairy", icon: "🧚", label: "Hada madrina" },
  42: { kind: "obstacle", type: "storm", icon: "🌧️", label: "Nube de tormenta" },
  47: { kind: "obstacle", type: "river", icon: "🌊", label: "Río encantado" },
  50: { kind: "goal", icon: "👑", label: "Castillo mágico" },
};

export function cellKind(n: number): CellKind {
  if (n <= 0) return "start";
  const special = SPECIALS[n];
  if (!special) return "question";
  if (special.kind === "goal") return "goal";
  return special.kind;
}

/** Serpentine grid: bottom→top, alternating direction. */
export function cellGridPos(n: number, cols = COLS): { col: number; row: number } {
  const i = n - 1;
  const rows = Math.ceil(BOARD_SIZE / cols);
  const rowFromBottom = Math.floor(i / cols);
  const idx = i % cols;
  const col = rowFromBottom % 2 === 0 ? idx : cols - 1 - idx;
  const row = rows - 1 - rowFromBottom;
  return { col, row };
}

export function boardLayout(cols: number) {
  const rows = Math.ceil(BOARD_SIZE / cols);
  const cell = cols <= 5 ? 76 : 70;
  const gapX = cols <= 5 ? 42 : 34;
  const gapY = cols <= 5 ? 108 : 76;
  const padX = 72;
  const padYTop = 120;
  const padYBottom = 168;
  const width = padX * 2 + cols * cell + (cols - 1) * gapX;
  const height = padYTop + padYBottom + rows * cell + (rows - 1) * gapY;
  return { cols, rows, cell, gapX, gapY, padX, padYTop, padYBottom, width, height };
}

export function cellPixel(n: number, layout: ReturnType<typeof boardLayout>): { x: number; y: number } {
  const { col, row } = cellGridPos(n, layout.cols);
  const x = layout.padX + col * (layout.cell + layout.gapX) + layout.cell / 2;
  const y = layout.padYTop + row * (layout.cell + layout.gapY) + layout.cell / 2;
  const amp = layout.cols <= 5 ? 16 : 13;
  const waveX = Math.sin(n * 0.62) * amp;
  const waveY = Math.cos(n * 0.41) * (amp * 0.55);
  return { x: x + waveX, y: y + waveY };
}

export function startPixel(layout: ReturnType<typeof boardLayout>): { x: number; y: number } {
  const first = cellPixel(1, layout);
  return { x: first.x, y: layout.height - layout.padYBottom / 2 };
}

export function allCellNumbers(): number[] {
  return Array.from({ length: BOARD_SIZE }, (_, i) => i + 1);
}

export function isQuestionCell(n: number): boolean {
  return cellKind(n) === "question";
}

export function nextQuestionCell(from: number): number {
  for (let i = from + 1; i <= BOARD_SIZE; i++) {
    if (i === BOARD_SIZE || isQuestionCell(i)) return i;
  }
  return BOARD_SIZE;
}

/** Largest multiple of 5 strictly below `pos` (the river always sends you back). */
export function nearestLowerMultipleOf5(pos: number): number {
  if (pos <= 5) return Math.max(0, pos === 5 ? 0 : Math.floor(pos / 5) * 5);
  const lower = pos % 5 === 0 ? pos - 5 : Math.floor(pos / 5) * 5;
  return Math.max(0, lower);
}

export function clampPos(n: number): number {
  return Math.max(0, Math.min(BOARD_SIZE, n));
}

export const EVENT_COPY: Record<
  ObstacleType | AdvantageType,
  { title: string; message: string; icon: string }
> = {
  swirl: {
    icon: "🌀",
    title: "¡Remolino mágico!",
    message: "El remolino te envuelve con luces y te lleva un poquito atrás, 3 casilleros, para seguir explorando.",
  },
  web: {
    icon: "🕸️",
    title: "¡Telaraña encantada!",
    message: "Una telaraña de estrellas te abraza un momento. En el próximo turno el camino seguirá sin ti, y luego vuelves.",
  },
  storm: {
    icon: "🌧️",
    title: "¡Nube de tormenta!",
    message: "Cae una lluvia de destellos. Retrocedes 2 casilleros, como si el viento te invitara a mirar de nuevo el paisaje.",
  },
  mushroom: {
    icon: "🍄",
    title: "¡Hongo confundidor!",
    message: "El hongo luminoso te hace reír. ¡Repites el turno y vuelves a lanzar el dado!",
  },
  river: {
    icon: "🌊",
    title: "¡Río encantado!",
    message: "La corriente brillante te lleva suavemente hasta el casillero divisible por 5 más cercano hacia atrás.",
  },
  portal: {
    icon: "⭐",
    title: "¡Portal mágico!",
    message: "Un portal de estrellas se abre. ¡Avanzas 4 casilleros!",
  },
  rainbow: {
    icon: "🌈",
    title: "¡Arcoíris!",
    message: "Un arcoíris te sostiene. ¡Avanzas 3 casilleros!",
  },
  fairy: {
    icon: "🧚",
    title: "¡Hada madrina!",
    message: "El hada te toma de la mano y te lleva al siguiente casillero de pregunta.",
  },
};
