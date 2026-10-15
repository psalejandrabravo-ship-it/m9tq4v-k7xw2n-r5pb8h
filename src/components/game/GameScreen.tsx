import { useState } from "react";
import { ChevronUp, Minus, Plus, Settings, Sparkles, Volume2, VolumeX } from "lucide-react";
import { avatarById } from "@/lib/game/avatars";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";
import { Board } from "./Board";
import { Celebration } from "./Celebration";
import { Dice } from "./Dice";
import { EventModal } from "./EventModal";
import { QuestionModal } from "./QuestionModal";
import { Token } from "./Token";

export function GameScreen() {
  const players = useGame((s) => s.players);
  const currentIndex = useGame((s) => s.currentIndex);
  const turnState = useGame((s) => s.turnState);
  const overlay = useGame((s) => s.overlay);
  const diceValue = useGame((s) => s.diceValue);
  const rolling = useGame((s) => s.rolling);
  const spinKey = useGame((s) => s.spinKey);
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  const rollDice = useGame((s) => s.rollDice);
  const requestReset = useGame((s) => s.requestReset);
  const cancelOverlay = useGame((s) => s.cancelOverlay);
  const confirmReset = useGame((s) => s.confirmReset);
  const openPendingQuestion = useGame((s) => s.openPendingQuestion);
  const [openPanel, setOpenPanel] = useState(false);
  const [zoom, setZoom] = useState(1.15);

  const current = players[currentIndex];
  const canRoll = turnState === "idle" && overlay.type === "none";
  const waitingQ = turnState === "awaitingQuestion";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <div className="starfield" />

      <header className="relative z-20 flex items-center gap-2 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-bg-deep/80 px-2 py-1.5 shadow-[0_0_0_1px_rgba(246,241,232,0.12)]">
          {current ? (
            <>
              <Token avatarId={current.avatarId} size={36} active crowned={current.finished} />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gold">Turno de</p>
                <p className="font-display truncate text-sm font-medium text-fg">
                  {avatarById(current.avatarId).name}
                </p>
              </div>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Alejar"
            onClick={() => setZoom((z) => Math.max(0.85, Math.round((z - 0.15) * 100) / 100))}
            className="pressable flex size-10 items-center justify-center rounded-full bg-surface text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.1)]"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Acercar"
            onClick={() => setZoom((z) => Math.min(1.7, Math.round((z + 0.15) * 100) / 100))}
            className="pressable flex size-10 items-center justify-center rounded-full bg-surface text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.1)]"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Activar sonido" : "Silenciar"}
            className="pressable flex size-10 items-center justify-center rounded-full bg-surface text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.1)]"
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button
            type="button"
            onClick={requestReset}
            aria-label="Volver a configuración"
            className="pressable flex size-10 items-center justify-center rounded-full bg-surface text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.1)]"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </header>

      <Board zoom={zoom} />

      {waitingQ ? (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4">
          <div className="rounded-full bg-parchment px-4 py-2 text-center text-sm font-semibold text-ink shadow-[0_8px_24px_rgba(18,14,50,0.35)]">
            Toca el casillero iluminado para descubrir tu pregunta
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-2 sm:inset-x-auto sm:right-3 sm:bottom-3 sm:w-72">
        <div className="pointer-events-auto rounded-2xl bg-bg-deep/92 p-2.5 shadow-[0_0_0_1px_rgba(246,241,232,0.12)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="scale-75">
              <Dice value={diceValue} rolling={rolling} spinKey={spinKey} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl font-semibold tabular-nums text-gold">
                {rolling ? "…" : diceValue ?? "—"}
              </p>
              {waitingQ ? (
                <button
                  type="button"
                  onClick={openPendingQuestion}
                  className="pressable mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold font-display text-sm font-semibold text-ink"
                >
                  <Sparkles className="size-4" />
                  Abrir pregunta
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canRoll}
                  onClick={rollDice}
                  className={cn(
                    "pressable mt-1 flex min-h-11 w-full items-center justify-center rounded-xl font-display text-sm font-semibold",
                    canRoll ? "bg-gold text-ink" : "bg-surface-2 text-muted",
                  )}
                >
                  Lanzar dado
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpenPanel((v) => !v)}
            className="mt-2 flex min-h-10 w-full items-center justify-center gap-1 text-xs font-semibold text-muted"
          >
            <ChevronUp className={cn("size-4 transition-transform", openPanel ? "rotate-180" : "")} />
            {openPanel ? "Ocultar fichas" : "Ver fichas"}
          </button>
          {openPanel ? (
            <ul className="mt-1 flex flex-col gap-1">
              {players.map((p, i) => (
                <li
                  key={p.id}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-xl px-2 py-1",
                    i === currentIndex ? "bg-gold/15 shadow-[0_0_0_1px_var(--color-gold)]" : "bg-surface/60",
                  )}
                >
                  <Token avatarId={p.avatarId} size={32} active={i === currentIndex} crowned={p.finished} />
                  <span className="font-display text-sm font-medium text-fg">{avatarById(p.avatarId).name}</span>
                  <span className="ml-auto text-xs font-semibold tabular-nums text-muted">
                    {p.displayPosition === 0 ? "Inicio" : p.displayPosition === 50 ? "Meta" : `${p.displayPosition}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <QuestionModal />
      <EventModal />
      <Celebration />

      {overlay.type === "reset" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Cancelar" className="absolute inset-0 bg-bg-deep/70" onClick={cancelOverlay} />
          <div className="modal-in relative z-10 w-full max-w-sm rounded-2xl bg-surface p-6 text-fg">
            <h3 className="font-display text-xl font-medium">¿Volver al inicio?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              El tablero se reinicia. Las fichas y el grupo etario se eligen de nuevo.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmReset}
                className="pressable min-h-12 rounded-xl bg-gold font-display font-semibold text-ink"
              >
                Sí, volver a configurar
              </button>
              <button
                type="button"
                onClick={cancelOverlay}
                className="pressable min-h-12 rounded-xl bg-surface-2 font-semibold text-fg"
              >
                Seguir en el tablero
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
