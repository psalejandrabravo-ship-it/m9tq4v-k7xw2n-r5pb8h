import type { CSSProperties } from "react";
import { Flag, PartyPopper } from "lucide-react";
import { MirarimMark } from "@/components/brand/MirarimMark";
import { avatarById } from "@/lib/game/avatars";
import { useGame } from "@/lib/game/store";
import { Token } from "./Token";

const COLORS = ["#e8c56b", "#5ec8c0", "#e8a0c0", "#f6f1e8", "#7dba6a", "#6b7fd7"];

export function Celebration() {
  const overlay = useGame((s) => s.overlay);
  const players = useGame((s) => s.players);
  const keepPlaying = useGame((s) => s.keepPlaying);
  const endGame = useGame((s) => s.endGame);
  if (overlay.type !== "celebration") return null;
  const winner = players.find((p) => p.id === overlay.winnerId);
  if (!winner) return null;
  const name = avatarById(winner.avatarId).name;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-bg-deep/80" />
      {Array.from({ length: 42 }, (_, i) => (
        <span
          key={`c-${i}`}
          className="confetti-piece"
          style={{
            left: `${(i * 17) % 100}%`,
            background: COLORS[i % COLORS.length],
            animationDuration: `${2.4 + (i % 7) * 0.25}s`,
            animationDelay: `${(i % 10) * 0.08}s`,
            transform: `rotate(${i * 18}deg)`,
          }}
        />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={`f-${i}`}
          className="firework"
          style={
            {
              left: `${20 + ((i * 23) % 60)}%`,
              top: `${18 + ((i * 11) % 40)}%`,
              background: COLORS[i % COLORS.length],
              "--dx": `${((i * 37) % 80) - 40}px`,
              "--dy": `${((i * 53) % 80) - 50}px`,
              animationDelay: `${(i % 6) * 0.12}s`,
            } as CSSProperties
          }
        />
      ))}
      <div className="relative z-10 flex min-h-dvh items-center justify-center p-4">
        <div className="modal-in w-full max-w-md rounded-[28px] bg-surface p-8 text-center shadow-[0_0_0_1px_rgba(246,241,232,0.12)]">
          <Token avatarId={winner.avatarId} size={120} active crowned />
          <h2 className="font-display mt-5 text-2xl font-semibold text-fg">
            ¡{name} llegó al castillo mágico!
          </h2>
          <p className="mt-2 text-sm text-muted">El camino sigue abierto para quienes aún viajan.</p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={keepPlaying}
              className="pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold font-display font-semibold text-ink"
            >
              <PartyPopper className="size-4" />
              Seguir jugando
            </button>
            <button
              type="button"
              onClick={endGame}
              className="pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-2 font-semibold text-fg"
            >
              <Flag className="size-4" />
              Terminar juego
            </button>
          </div>
          <p className="mt-5 text-center text-xs font-semibold tracking-wide text-muted">
            Camino Mágico · Un juego de MIRARIM
          </p>
          <div className="mt-2 flex justify-center">
            <MirarimMark variant="horizontal-blanco" height={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
