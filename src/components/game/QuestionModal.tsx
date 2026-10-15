import { Check, RefreshCw, Volume2 } from "lucide-react";
import { AGE_META } from "@/lib/game/questions";
import { useGame } from "@/lib/game/store";
import { speakQuestion, stopSpeaking } from "@/lib/game/tts";
import { avatarById } from "@/lib/game/avatars";
import { Token } from "./Token";

export function QuestionModal() {
  const overlay = useGame((s) => s.overlay);
  const ageGroup = useGame((s) => s.ageGroup);
  const players = useGame((s) => s.players);
  const currentIndex = useGame((s) => s.currentIndex);
  const continueQuestion = useGame((s) => s.continueQuestion);
  const changeQuestion = useGame((s) => s.changeQuestion);

  if (overlay.type !== "question" || !ageGroup) return null;
  const q = overlay.question;
  const minPx = AGE_META[ageGroup].minPx;
  const player = players[currentIndex];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="backdrop-in absolute inset-0 bg-bg-deep/70" />
      <div className="modal-in relative z-10 w-full max-w-xl rounded-[28px] bg-parchment p-6 text-ink shadow-[0_20px_60px_rgba(18,14,50,0.45)] sm:p-8">
        {player ? (
          <div className="mb-4 flex items-center gap-3">
            <Token avatarId={player.avatarId} size={44} active />
            <p className="text-sm font-semibold text-ink/70">
              Responde {avatarById(player.avatarId).name}
            </p>
          </div>
        ) : null}
        <div className="flex justify-center text-5xl" aria-hidden>
          {q.emoji}
        </div>
        {overlay.swapped ? (
          <p className="mt-3 text-center text-sm font-semibold text-ink/60">Nueva pregunta mágica</p>
        ) : null}
        <p
          className="mt-4 text-center font-display font-medium leading-snug"
          style={{ fontSize: `max(${minPx}px, 1.15rem)` }}
        >
          {q.text}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => speakQuestion(q.text)}
            className="pressable flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-stone px-3 font-semibold text-ink"
          >
            <Volume2 className="size-4" />
            Escuchar pregunta
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              changeQuestion();
            }}
            className="pressable flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-stone px-3 font-semibold text-ink shadow-[0_0_0_1px_rgba(42,36,96,0.18)]"
          >
            <RefreshCw className="size-4" />
            Cambiar pregunta
          </button>
        </div>
        <button
          type="button"
          onClick={continueQuestion}
          className="pressable mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold font-display text-base font-semibold text-ink"
        >
          <Check className="size-5" />
          Continuar
        </button>
      </div>
    </div>
  );
}
