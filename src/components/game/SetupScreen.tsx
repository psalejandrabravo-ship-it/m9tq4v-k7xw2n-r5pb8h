import { useState } from "react";
import { BookOpen, Flame, Heart, Info, ListPlus, Minus, Plus, Sparkles } from "lucide-react";
import { CreditsModal } from "@/components/brand/CreditsModal";
import { PurposeStrip, MirarimMark } from "@/components/brand/MirarimMark";
import { AVATARS } from "@/lib/game/avatars";
import { audio } from "@/lib/game/audio";
import { activeCustomCount } from "@/lib/game/customQuestions";
import { useGame } from "@/lib/game/store";
import type { AgeGroup, AvatarId, QuestionPack } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { QuestionsPanel } from "./QuestionsPanel";
import { FullscreenButton } from "./FullscreenButton";
import { Token } from "./Token";

const AGES: { id: AgeGroup; icon: typeof Heart; caption: string }[] = [
  { id: "4-6", icon: Heart, caption: "4 a 6 años" },
  { id: "7-10", icon: BookOpen, caption: "7 a 10 años" },
  { id: "11-16", icon: Flame, caption: "11 a 16 años" },
];

const PACKS: { id: QuestionPack; label: string; hint: string }[] = [
  { id: "builtin", label: "Solo predeterminadas", hint: "El banco original del juego" },
  { id: "custom", label: "Solo personalizadas", hint: "Las que tú creaste y estén activas" },
  { id: "both", label: "Ambas", hint: "Originales más las tuyas" },
];

export function SetupScreen() {
  const ageGroup = useGame((s) => s.ageGroup);
  const playerCount = useGame((s) => s.playerCount);
  const slots = useGame((s) => s.slots);
  const setAgeGroup = useGame((s) => s.setAgeGroup);
  const setPlayerCount = useGame((s) => s.setPlayerCount);
  const pickAvatar = useGame((s) => s.pickAvatar);
  const startAdventure = useGame((s) => s.startAdventure);
  const canStart = useGame((s) => s.canStart());
  const customQuestions = useGame((s) => s.customQuestions);
  const questionPack = useGame((s) => s.questionPack);
  const setQuestionPack = useGame((s) => s.setQuestionPack);
  const [picker, setPicker] = useState<number | null>(null);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);

  const activeCount = activeCustomCount(customQuestions, ageGroup);
  const customBlocked = questionPack === "custom" && activeCount === 0;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="starfield" />
      <img
        src="/game/landscape.jpg"
        alt=""
        className="pointer-events-none absolute inset-x-0 top-0 h-[18vh] w-full object-cover opacity-70"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[18vh] bg-gradient-to-b from-bg-deep/35 via-bg-deep/50 to-bg-deep" />

      <div className="relative z-20 flex items-center justify-between gap-2 px-3 pt-3">
        <button
          type="button"
          onClick={() => setCreditsOpen(true)}
          aria-label="Acerca de"
          className="pressable flex min-h-11 items-center gap-2 rounded-full bg-bg-deep/85 px-3 text-sm font-semibold text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.14)]"
        >
          <Info className="size-4" />
          <span className="hidden sm:inline">Acerca de</span>
        </button>
        <FullscreenButton />
        <button
          type="button"
          onClick={() => setQuestionsOpen(true)}
          className="pressable flex min-h-11 items-center gap-2 rounded-full bg-bg-deep/85 px-3 text-sm font-semibold text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.14)]"
        >
          <ListPlus className="size-4" />
          Mis preguntas
        </button>
      </div>

      <main className="relative z-10 mx-auto grid w-full max-w-[1600px] gap-4 px-4 pt-4 pb-10 sm:px-8 xl:grid-cols-2 xl:items-start xl:px-10">
        <header className="rounded-2xl bg-bg-deep/80 px-4 py-5 text-center shadow-[0_0_0_1px_rgba(246,241,232,0.08)] backdrop-blur-sm xl:col-span-2">
          <p className="mb-1 text-xs font-semibold tracking-wide text-gold">Tablero psicoeducativo</p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-fg sm:text-4xl">Camino Mágico</h1>
          <div className="mt-3 flex flex-col items-center gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted">Un juego de</p>
            <div className="mirarim-clear py-1">
              <MirarimMark variant="horizontal-blanco" height={28} />
            </div>
          </div>
          <div className="mx-auto mt-3 max-w-md">
            <PurposeStrip />
          </div>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-snug text-muted sm:leading-relaxed">
            Recorre un camino de 50 casilleros para el autoconocimiento, la expresión emocional y la
            conversación. Cada casillero propone preguntas y actividades según la edad. Se juega con el
            acompañamiento de un psicólogo, profesor u otro adulto facilitador.
          </p>
        </header>

        <section className="rounded-2xl bg-surface p-4 text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.08)] sm:p-5">
          <h2 className="font-display text-lg font-medium">Grupo etario</h2>
          <p className="mt-1 text-sm text-muted">Elige uno. Cambia el banco de preguntas.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {AGES.map((age) => {
              const Icon = age.icon;
              const selected = ageGroup === age.id;
              return (
                <button
                  key={age.id}
                  type="button"
                  onClick={() => {
                    audio.playUi();
                    setAgeGroup(age.id);
                  }}
                  className={cn(
                    "pressable flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl px-3 py-4 text-center",
                    selected
                      ? "bg-gold text-ink shadow-[0_0_0_2px_var(--color-gold)]"
                      : "bg-surface-2 text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.1)] hover:bg-surface-2/80",
                  )}
                >
                  <Icon className="size-7" strokeWidth={2} />
                  <span className="font-display text-lg font-medium">{age.caption}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-4 text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.08)] sm:p-5">
          <h2 className="font-display text-lg font-medium">Banco de preguntas</h2>
          <p className="mt-1 text-sm text-muted">
            {activeCount} pregunta{activeCount === 1 ? "" : "s"} personalizada{activeCount === 1 ? "" : "s"} activa{activeCount === 1 ? "" : "s"}
            {ageGroup ? " para este grupo" : ""}.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PACKS.map((pack) => {
              const selected = questionPack === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => {
                    audio.playUi();
                    setQuestionPack(pack.id);
                  }}
                  className={cn(
                    "pressable rounded-xl px-3 py-3 text-left",
                    selected ? "bg-gold text-ink" : "bg-surface-2 text-fg",
                  )}
                >
                  <span className="block font-display text-sm font-semibold">{pack.label}</span>
                  <span className={cn("mt-1 block text-xs", selected ? "text-ink/70" : "text-muted")}>
                    {pack.hint}
                  </span>
                </button>
              );
            })}
          </div>
          {customBlocked ? (
            <p className="mt-3 text-sm font-semibold text-gold">
              Añade al menos una pregunta personalizada activa o elige otro banco.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl bg-surface p-4 text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.08)] sm:p-5">
          <h2 className="font-display text-lg font-medium">Participantes</h2>
          <p className="mt-1 text-sm text-muted">De 1 a 6 fichas. Cada quien elige un avatar.</p>
          <div className="mt-4 flex items-center justify-center gap-6">
            <button
              type="button"
              aria-label="Menos participantes"
              onClick={() => setPlayerCount(playerCount - 1)}
              disabled={playerCount <= 1}
              className="pressable flex size-14 items-center justify-center rounded-full bg-surface-2 text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.12)] disabled:opacity-40"
            >
              <Minus className="size-6" />
            </button>
            <span className="font-display min-w-16 text-center text-5xl font-semibold tabular-nums text-gold">
              {playerCount}
            </span>
            <button
              type="button"
              aria-label="Más participantes"
              onClick={() => setPlayerCount(playerCount + 1)}
              disabled={playerCount >= 6}
              className="pressable flex size-14 items-center justify-center rounded-full bg-surface-2 text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.12)] disabled:opacity-40"
            >
              <Plus className="size-6" />
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-4 text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.08)] sm:p-5">
          <h2 className="font-display text-lg font-medium">Fichas</h2>
          <p className="mt-1 text-sm text-muted">No se piden nombres: cada jugador es su avatar.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {slots.map((id, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPicker(i)}
                className="pressable flex min-h-16 items-center gap-3 rounded-xl bg-surface-2 px-3 py-3 text-left text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.1)]"
              >
                {id ? (
                  <Token avatarId={id} size={52} />
                ) : (
                  <span className="flex size-[52px] items-center justify-center rounded-full bg-bg text-muted">
                    <Sparkles className="size-5" />
                  </span>
                )}
                <span className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Jugador {i + 1}
                  </span>
                  <span className="font-display text-base text-fg">
                    {id ? AVATARS.find((a) => a.id === id)?.name : "Elegir ficha"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          disabled={!canStart}
          onClick={() => {
            audio.unlock();
            startAdventure();
          }}
          className={cn(
            "pressable font-display mx-auto min-h-14 w-full max-w-md rounded-xl px-6 text-lg font-semibold xl:col-span-2",
            canStart ? "bg-mirarim-coral text-mirarim-ink shadow-[0_8px_24px_rgba(224,122,95,0.28)]" : "bg-surface-2 text-muted",
          )}
        >
          Comenzar aventura
        </button>
      </main>

      {picker !== null ? (
        <AvatarPicker
          slot={picker}
          taken={slots.filter((s): s is AvatarId => Boolean(s))}
          current={slots[picker] ?? null}
          onClose={() => setPicker(null)}
          onPick={(id) => {
            pickAvatar(picker, id);
            audio.playUi();
            setPicker(null);
          }}
        />
      ) : null}

      {questionsOpen ? <QuestionsPanel onClose={() => setQuestionsOpen(false)} /> : null}
      {creditsOpen ? <CreditsModal onClose={() => setCreditsOpen(false)} /> : null}
    </div>
  );
}

function AvatarPicker({
  slot,
  taken,
  current,
  onClose,
  onPick,
}: {
  slot: number;
  taken: AvatarId[];
  current: AvatarId | null;
  onClose: () => void;
  onPick: (id: AvatarId) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Cerrar" className="backdrop-in absolute inset-0 bg-bg-deep/70" onClick={onClose} />
      <div className="modal-in relative z-10 w-full max-w-lg rounded-2xl bg-surface p-5 text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.12)] sm:p-6">
        <h3 className="font-display text-xl font-medium">Ficha del jugador {slot + 1}</h3>
        <p className="mt-1 text-sm text-muted">Cada avatar solo puede usarlo una persona.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {AVATARS.map((a) => {
            const used = taken.includes(a.id) && a.id !== current;
            const selected = current === a.id;
            return (
              <button
                key={a.id}
                type="button"
                disabled={used}
                onClick={() => onPick(a.id)}
                className={cn(
                  "pressable flex flex-col items-center gap-2 rounded-xl p-2 text-fg",
                  selected && "bg-gold/20 shadow-[0_0_0_2px_var(--color-gold)]",
                  used && "opacity-35",
                  !selected && !used && "hover:bg-surface-2",
                )}
              >
                <Token avatarId={a.id} size={64} />
                <span className="text-center text-xs font-semibold leading-tight">{a.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
