import { create } from "zustand";
import { audio } from "./audio";
import { avatarById } from "./avatars";
import {
  BOARD_SIZE,
  EVENT_COPY,
  SPECIALS,
  cellKind,
  clampPos,
  nearestLowerMultipleOf5,
  nextQuestionCell,
} from "./board";
import {
  activeCustomCount,
  buildPlayBank,
  loadCustomQuestions,
  loadQuestionPack,
  saveCustomQuestions,
  saveQuestionPack,
} from "./customQuestions";
import { stopSpeaking } from "./tts";
import type {
  AgeGroup,
  AvatarId,
  BoardEvent,
  CustomQuestion,
  Phase,
  Player,
  Question,
  QuestionPack,
  TurnState,
} from "./types";
import { fisherYates, prefersReducedMotion, waitMs } from "@/lib/utils";

export const STEP_MS = 620;
export const STEP_PAUSE_MS = 140;

export type Overlay =
  | { type: "none" }
  | { type: "question"; question: Question; swapped?: boolean }
  | { type: "event"; event: BoardEvent }
  | { type: "celebration"; winnerId: number }
  | { type: "reset" };

interface GameStore {
  phase: Phase;
  ageGroup: AgeGroup | null;
  playerCount: number;
  slots: (AvatarId | null)[];
  players: Player[];
  currentIndex: number;
  turnState: TurnState;
  diceValue: number | null;
  rolling: boolean;
  spinKey: number;
  muted: boolean;
  overlay: Overlay;
  askedIds: string[];
  lastQuestionId: string | null;
  remainingIds: string[];
  pendingCell: number | null;
  customQuestions: CustomQuestion[];
  questionPack: QuestionPack;
  persistenceReady: boolean;

  setAgeGroup: (g: AgeGroup) => void;
  setPlayerCount: (n: number) => void;
  pickAvatar: (slot: number, id: AvatarId) => void;
  setQuestionPack: (pack: QuestionPack) => void;
  hydratePersistence: () => Promise<void>;
  setCustomQuestions: (items: CustomQuestion[]) => Promise<void>;
  canStart: () => boolean;
  startAdventure: () => void;
  rollDice: () => void;
  continueQuestion: () => void;
  changeQuestion: () => void;
  resolveEvent: () => void;
  openPendingQuestion: () => void;
  tapCell: (n: number) => void;
  keepPlaying: () => void;
  endGame: () => void;
  requestReset: () => void;
  cancelOverlay: () => void;
  confirmReset: () => void;
  toggleMute: () => void;
}

const initial = {
  phase: "setup" as Phase,
  ageGroup: null as AgeGroup | null,
  playerCount: 2,
  slots: [null, null] as (AvatarId | null)[],
  players: [] as Player[],
  currentIndex: 0,
  turnState: "idle" as TurnState,
  diceValue: null as number | null,
  rolling: false,
  spinKey: 0,
  muted: false,
  overlay: { type: "none" } as Overlay,
  askedIds: [] as string[],
  lastQuestionId: null as string | null,
  remainingIds: [] as string[],
  pendingCell: null as number | null,
  customQuestions: [] as CustomQuestion[],
  questionPack: "both" as QuestionPack,
  persistenceReady: false,
};

function bankFor(get: () => GameStore): Question[] {
  const { ageGroup, customQuestions, questionPack } = get();
  if (!ageGroup) return [];
  return buildPlayBank(ageGroup, customQuestions, questionPack);
}

function shuffleIds(bank: Question[], avoid: string | null): string[] {
  let shuffled = fisherYates(bank.map((q) => q.id));
  if (avoid != null && shuffled.length > 1 && shuffled[0] === avoid) {
    const swapWith = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    const a = shuffled[0]!;
    shuffled[0] = shuffled[swapWith]!;
    shuffled[swapWith] = a;
  }
  return shuffled;
}

export const useGame = create<GameStore>((set, get) => {
  const drawQuestion = (): Question | null => {
    const bank = bankFor(get);
    if (bank.length === 0) return null;
    let remaining = get().remainingIds.slice();
    const last = get().lastQuestionId;
    if (remaining.length === 0) remaining = shuffleIds(bank, last);
    const id = remaining.shift()!;
    const q = bank.find((item) => item.id === id) ?? bank[0]!;
    set({
      remainingIds: remaining,
      lastQuestionId: q.id,
      askedIds: [...get().askedIds, q.id],
    });
    return q;
  };

  const currentPlayer = () => get().players[get().currentIndex];

  const advanceTurn = (repeatSame = false) => {
    stopSpeaking();
    const { players, currentIndex } = get();
    if (players.length === 0) return;
    const next = repeatSame ? currentIndex : (currentIndex + 1) % players.length;
    set({
      currentIndex: next,
      turnState: "idle",
      overlay: { type: "none" },
      rolling: false,
      pendingCell: null,
    });
  };

  const showQuestion = () => {
    const q = drawQuestion();
    if (!q) {
      advanceTurn();
      return;
    }
    audio.playQuestion();
    set({
      overlay: { type: "question", question: q },
      turnState: "resolving",
      pendingCell: null,
    });
  };

  const promptQuestion = (cell: number) => {
    set({
      turnState: "awaitingQuestion",
      pendingCell: cell,
      overlay: { type: "none" },
      rolling: false,
    });
    audio.playUi();
  };

  const celebrateIfNeeded = (player: Player) => {
    if (player.position >= BOARD_SIZE && !player.finished) {
      const nextPlayers = get().players.map((p) =>
        p.id === player.id ? { ...p, finished: true, position: BOARD_SIZE, displayPosition: BOARD_SIZE } : p,
      );
      audio.playWin();
      set({
        players: nextPlayers,
        overlay: { type: "celebration", winnerId: player.id },
        turnState: "resolving",
        pendingCell: null,
      });
      return true;
    }
    return false;
  };

  const animateMove = async (playerId: number, from: number, to: number) => {
    const reduced = prefersReducedMotion();
    const dir = to === from ? 0 : to > from ? 1 : -1;
    if (reduced || dir === 0) {
      set({
        players: get().players.map((p) =>
          p.id === playerId ? { ...p, position: to, displayPosition: to } : p,
        ),
      });
      return;
    }
    set({ turnState: "moving" });
    let cur = from;
    while (cur !== to) {
      cur += dir;
      audio.playMove();
      set({
        players: get().players.map((p) =>
          p.id === playerId ? { ...p, displayPosition: cur, position: to } : p,
        ),
      });
      await waitMs(STEP_MS);
      await waitMs(STEP_PAUSE_MS);
    }
  };

  const landOn = async (player: Player, pos: number, chain = false) => {
    const kind = cellKind(pos);

    if (pos >= BOARD_SIZE) {
      const updated = { ...player, position: BOARD_SIZE, displayPosition: BOARD_SIZE };
      if (!celebrateIfNeeded(updated)) {
        promptQuestion(BOARD_SIZE);
      }
      return;
    }

    if (pos <= 0) {
      advanceTurn();
      return;
    }

    if (kind === "obstacle" || kind === "advantage") {
      if (chain) {
        advanceTurn();
        return;
      }
      const special = SPECIALS[pos]!;
      const type = special.type!;
      const copy = EVENT_COPY[type];
      let extraTo: number | undefined;
      let repeatTurn = false;
      let skipNext = false;
      if (type === "swirl") extraTo = clampPos(pos - 3);
      if (type === "storm") extraTo = clampPos(pos - 2);
      if (type === "river") extraTo = nearestLowerMultipleOf5(pos);
      if (type === "portal") extraTo = clampPos(pos + 4);
      if (type === "rainbow") extraTo = clampPos(pos + 3);
      if (type === "fairy") extraTo = nextQuestionCell(pos);
      if (type === "mushroom") repeatTurn = true;
      if (type === "web") skipNext = true;

      const event: BoardEvent = {
        kind: kind === "obstacle" ? "obstacle" : "advantage",
        title: copy.title,
        message: copy.message,
        icon: copy.icon,
        extraTo,
        repeatTurn,
        skipNext,
      };
      if (kind === "advantage") audio.playAdvantage();
      else audio.playObstacle();
      set({ overlay: { type: "event", event }, turnState: "resolving", pendingCell: pos });
      return;
    }

    promptQuestion(pos);
  };

  return {
    ...initial,

    setAgeGroup: (g) => set({ ageGroup: g }),

    setPlayerCount: (n) => {
      const count = Math.max(1, Math.min(6, n));
      const slots = get().slots.slice(0, count);
      while (slots.length < count) slots.push(null);
      set({ playerCount: count, slots });
    },

    pickAvatar: (slot, id) => {
      const slots = get().slots.slice();
      if (slots.some((s, i) => s === id && i !== slot)) return;
      slots[slot] = id;
      set({ slots });
    },

    setQuestionPack: (pack) => {
      set({ questionPack: pack });
      void saveQuestionPack(pack);
    },

    hydratePersistence: async () => {
      const [customQuestions, questionPack] = await Promise.all([loadCustomQuestions(), loadQuestionPack()]);
      set({ customQuestions, questionPack, persistenceReady: true });
    },

    setCustomQuestions: async (items) => {
      set({ customQuestions: items });
      await saveCustomQuestions(items);
    },

    canStart: () => {
      const { ageGroup, slots, playerCount, questionPack, customQuestions } = get();
      if (!ageGroup || slots.length !== playerCount || slots.some((s) => !s)) return false;
      if (questionPack === "custom") return activeCustomCount(customQuestions, ageGroup) > 0;
      return true;
    },

    startAdventure: () => {
      const { ageGroup, slots, customQuestions, questionPack } = get();
      if (!ageGroup || slots.some((s) => !s)) return;
      const bank = buildPlayBank(ageGroup, customQuestions, questionPack);
      if (bank.length === 0) return;
      audio.unlock();
      audio.startMusic();
      const players: Player[] = slots.map((id, i) => ({
        id: i,
        avatarId: id as AvatarId,
        position: 0,
        displayPosition: 0,
        skipNextTurn: false,
        finished: false,
      }));
      set({
        phase: "play",
        players,
        currentIndex: 0,
        turnState: "idle",
        diceValue: null,
        overlay: { type: "none" },
        askedIds: [],
        lastQuestionId: null,
        remainingIds: shuffleIds(bank, null),
        pendingCell: null,
      });
    },

    rollDice: () => {
      const { turnState, overlay, players, currentIndex } = get();
      if (turnState !== "idle" || overlay.type !== "none") return;
      const player = players[currentIndex];
      if (!player) return;

      audio.unlock();

      if (player.skipNextTurn) {
        set({
          players: players.map((p) => (p.id === player.id ? { ...p, skipNextTurn: false } : p)),
          overlay: {
            type: "event",
            event: {
              kind: "skip",
              icon: "🕸️",
              title: "Un momentito de estrellas",
              message: `La telaraña encantada todavía envuelve a ${avatarById(player.avatarId).name}. El camino sigue con la siguiente ficha; ¡pronto le toca de nuevo!`,
            },
          },
          turnState: "resolving",
        });
        return;
      }

      const value = 1 + Math.floor(Math.random() * 6);
      set({ rolling: true, turnState: "rolling", spinKey: get().spinKey + 1, diceValue: null });
      audio.playDice();

      const duration = prefersReducedMotion() ? 80 : 1400 + Math.floor(Math.random() * 400);

      window.setTimeout(() => {
        void (async () => {
          set({ rolling: false, diceValue: value });
          const fresh = get().players[get().currentIndex];
          if (!fresh) return;

          if (fresh.finished) {
            await waitMs(prefersReducedMotion() ? 80 : 400);
            promptQuestion(BOARD_SIZE);
            return;
          }

          const dest = clampPos(fresh.position + value);
          await waitMs(prefersReducedMotion() ? 40 : 200);
          await animateMove(fresh.id, fresh.displayPosition, dest);
          const after = get().players.find((p) => p.id === fresh.id)!;
          await landOn(after, after.position, false);
        })();
      }, duration);
    },

    continueQuestion: () => {
      stopSpeaking();
      advanceTurn(false);
    },

    changeQuestion: () => {
      const overlay = get().overlay;
      if (overlay.type !== "question") return;
      const bank = bankFor(get);
      const currentId = overlay.question.id;
      const pool = bank.filter((q) => q.id !== currentId);
      const next = pool[Math.floor(Math.random() * pool.length)];
      if (!next) return;
      set({
        overlay: { type: "question", question: next, swapped: true },
        lastQuestionId: next.id,
      });
      audio.playUi();
    },

    openPendingQuestion: () => {
      if (get().turnState !== "awaitingQuestion") return;
      showQuestion();
    },

    tapCell: (n) => {
      const { turnState, pendingCell } = get();
      if (turnState !== "awaitingQuestion") return;
      if (pendingCell === n || (pendingCell === BOARD_SIZE && n === BOARD_SIZE)) {
        showQuestion();
      }
    },

    resolveEvent: () => {
      const overlay = get().overlay;
      if (overlay.type !== "event") return;
      const event = overlay.event;
      const player = currentPlayer();
      if (!player) return;

      void (async () => {
        if (event.skipNext) {
          set({
            players: get().players.map((p) => (p.id === player.id ? { ...p, skipNextTurn: true } : p)),
          });
          advanceTurn(false);
          return;
        }
        if (event.repeatTurn) {
          advanceTurn(true);
          return;
        }
        if (typeof event.extraTo === "number") {
          const from = player.displayPosition;
          const to = event.extraTo;
          set({ overlay: { type: "none" }, pendingCell: null });
          await animateMove(player.id, from, to);
          const after = get().players.find((p) => p.id === player.id)!;
          if (after.position >= BOARD_SIZE) {
            if (!celebrateIfNeeded({ ...after, finished: after.finished })) {
              promptQuestion(BOARD_SIZE);
            }
            return;
          }
          if (cellKind(after.position) === "question") {
            promptQuestion(after.position);
            return;
          }
          advanceTurn(false);
          return;
        }
        advanceTurn(false);
      })();
    },

    keepPlaying: () => {
      advanceTurn(false);
    },

    endGame: () => {
      stopSpeaking();
      audio.stopMusic();
      const keep = get();
      set({
        ...initial,
        muted: keep.muted,
        slots: keep.slots,
        playerCount: keep.playerCount,
        ageGroup: keep.ageGroup,
        customQuestions: keep.customQuestions,
        questionPack: keep.questionPack,
        persistenceReady: true,
      });
    },

    requestReset: () => set({ overlay: { type: "reset" } }),
    cancelOverlay: () => {
      if (get().overlay.type === "reset") set({ overlay: { type: "none" } });
    },
    confirmReset: () => {
      stopSpeaking();
      audio.stopMusic();
      const keep = get();
      set({
        ...initial,
        muted: keep.muted,
        customQuestions: keep.customQuestions,
        questionPack: keep.questionPack,
        persistenceReady: true,
      });
    },

    toggleMute: () => {
      const next = !get().muted;
      audio.setMuted(next);
      set({ muted: next });
    },
  };
});
