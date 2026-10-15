import { cn } from "@/lib/utils";

const FACE_ROT: Record<number, string> = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(0deg) rotateY(-90deg)",
  3: "rotateX(-90deg) rotateY(0deg)",
  4: "rotateX(90deg) rotateY(0deg)",
  5: "rotateX(0deg) rotateY(90deg)",
  6: "rotateX(0deg) rotateY(180deg)",
};

const PIP_SLOTS: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

interface DiceProps {
  value: number | null;
  rolling: boolean;
  spinKey: number;
  canRoll: boolean;
  onRoll: () => void;
}

export function Dice({ value, rolling, spinKey, canRoll, onRoll }: DiceProps) {
  const shown = value ?? 1;
  const extra = rolling ? 360 * (4 + (spinKey % 3)) : 0;
  const transform = rolling
    ? `rotateX(${extra + 20}deg) rotateY(${extra * 1.35 + 40}deg)`
    : FACE_ROT[shown];

  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={!canRoll}
      aria-label="Lanzar dado"
      className={cn("dice-hit", canRoll && "dice-ready")}
    >
      <span className="dice-scene" aria-hidden>
        <span className={cn("dice-cube", rolling && "is-rolling")} style={{ transform }}>
          {([1, 2, 3, 4, 5, 6] as const).map((face) => (
            <span key={face} className="dice-face" data-face={face}>
              {Array.from({ length: 9 }, (_, i) => {
                const slot = i + 1;
                const on = PIP_SLOTS[face]!.includes(slot);
                return <span key={slot} className={on ? "pip" : "pip-empty"} />;
              })}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
