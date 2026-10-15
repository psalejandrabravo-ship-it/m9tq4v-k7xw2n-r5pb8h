import { Sparkles } from "lucide-react";
import { useGame } from "@/lib/game/store";

export function EventModal() {
  const overlay = useGame((s) => s.overlay);
  const resolveEvent = useGame((s) => s.resolveEvent);
  if (overlay.type !== "event") return null;
  const { event } = overlay;
  const isGift = event.kind === "advantage";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="backdrop-in absolute inset-0 bg-bg-deep/70" />
      <div
        className={
          isGift
            ? "modal-in relative z-10 w-full max-w-md rounded-[28px] bg-parchment p-7 text-center text-ink shadow-[0_0_0_3px_var(--color-teal)]"
            : "modal-in relative z-10 w-full max-w-md rounded-[28px] bg-parchment p-7 text-center text-ink shadow-[0_0_0_3px_var(--color-rose)]"
        }
      >
        <div className="event-burst text-6xl" aria-hidden>
          {event.icon}
        </div>
        <h3 className="font-display mt-4 text-2xl font-semibold">{event.title}</h3>
        <p className="mt-3 text-base leading-relaxed">{event.message}</p>
        <button
          type="button"
          onClick={resolveEvent}
          className="pressable mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold font-display font-semibold text-ink"
        >
          <Sparkles className="size-4" />
          Seguir el camino
        </button>
      </div>
    </div>
  );
}
