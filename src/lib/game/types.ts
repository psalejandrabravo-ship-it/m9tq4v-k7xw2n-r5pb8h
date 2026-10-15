export type AgeGroup = "4-8" | "9-13" | "14-18";
export type CustomAge = AgeGroup | "general";
export type QuestionPack = "builtin" | "custom" | "both";

export type AvatarId =
  | "wizard"
  | "fairy"
  | "dragon"
  | "unicorn"
  | "elf"
  | "oracle"
  | "star"
  | "gnome"
  | "butterfly"
  | "wolf";

export type ObstacleType = "swirl" | "web" | "storm" | "mushroom" | "river";
export type AdvantageType = "portal" | "rainbow" | "fairy";

export type CellKind = "question" | "obstacle" | "advantage" | "goal" | "start";

export interface BuiltInQuestion {
  id: number;
  emoji: string;
  text: string;
  area: string;
}

export interface Question {
  id: string;
  emoji: string;
  text: string;
  area: string;
}

export interface CustomQuestion {
  id: string;
  text: string;
  age: CustomAge;
  activityType: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AvatarDef {
  id: AvatarId;
  name: string;
  src: string;
  accent: string;
}

export interface Player {
  id: number;
  avatarId: AvatarId;
  /** Logical position 0 (camp) … 50 (castle). */
  position: number;
  /** Position currently rendered while stepping. */
  displayPosition: number;
  skipNextTurn: boolean;
  finished: boolean;
}

export interface BoardEvent {
  kind: "obstacle" | "advantage" | "skip";
  title: string;
  message: string;
  icon: string;
  extraTo?: number;
  repeatTurn?: boolean;
  skipNext?: boolean;
}

export type Phase = "setup" | "play";

export type TurnState = "idle" | "rolling" | "moving" | "awaitingQuestion" | "resolving";

export interface ImportIssue {
  line: number;
  message: string;
}
