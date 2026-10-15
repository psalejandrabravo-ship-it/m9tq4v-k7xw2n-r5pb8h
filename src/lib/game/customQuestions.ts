import type { AgeGroup, CustomAge, CustomQuestion, ImportIssue, Question, QuestionPack } from "./types";
import { QUESTIONS } from "./questions";

const DB_NAME = "camino-magico";
const DB_VERSION = 1;
const Q_STORE = "questions";
const S_STORE = "settings";
const LS_QUESTIONS = "camino-magico:custom-questions:v1";
const LS_PACK = "camino-magico:question-pack:v1";

const VALID_AGES = new Set<CustomAge>(["general", "4-8", "9-13", "14-18"]);

export const ACTIVITY_TYPES = ["Pregunta", "Actividad", "Imaginación", "Cuerpo", "Valores"] as const;

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(Q_STORE)) db.createObjectStore(Q_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(S_STORE)) db.createObjectStore(S_STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB no disponible"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function idbGetAll(): Promise<CustomQuestion[] | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(Q_STORE, "readonly");
      const req = tx.objectStore(Q_STORE).getAll();
      req.onsuccess = () => resolve(req.result as CustomQuestion[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbPutAll(items: CustomQuestion[]): Promise<boolean> {
  try {
    const db = await openDb();
    const tx = db.transaction(Q_STORE, "readwrite");
    const store = tx.objectStore(Q_STORE);
    store.clear();
    for (const item of items) store.put(item);
    await txDone(tx);
    return true;
  } catch {
    return false;
  }
}

async function idbGetPack(): Promise<QuestionPack | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(S_STORE, "readonly");
      const req = tx.objectStore(S_STORE).get("pack");
      req.onsuccess = () => {
        const row = req.result as { key: string; value: QuestionPack } | undefined;
        resolve(row?.value ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSetPack(pack: QuestionPack): Promise<boolean> {
  try {
    const db = await openDb();
    const tx = db.transaction(S_STORE, "readwrite");
    tx.objectStore(S_STORE).put({ key: "pack", value: pack });
    await txDone(tx);
    return true;
  } catch {
    return false;
  }
}

function lsReadQuestions(): CustomQuestion[] {
  try {
    const raw = localStorage.getItem(LS_QUESTIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomQuestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function lsWriteQuestions(items: CustomQuestion[]): void {
  localStorage.setItem(LS_QUESTIONS, JSON.stringify(items));
}

function withCurrentAges(items: CustomQuestion[]): CustomQuestion[] {
  return items.map((q) => {
    const age = normalizeAge(String(q.age));
    return age && age !== q.age ? { ...q, age } : q;
  });
}

export async function loadCustomQuestions(): Promise<CustomQuestion[]> {
  if (typeof window === "undefined") return [];
  const fromIdb = await idbGetAll();
  let items: CustomQuestion[] = [];
  if (fromIdb) {
    if (fromIdb.length === 0) {
      const fromLs = lsReadQuestions();
      items = fromLs.length ? fromLs : fromIdb;
    } else {
      items = fromIdb;
    }
  } else {
    items = lsReadQuestions();
  }
  const migrated = withCurrentAges(items);
  const changed = migrated.some((q, i) => q.age !== items[i]?.age);
  if (changed) await saveCustomQuestions(migrated);
  else if (fromIdb && fromIdb.length === 0 && items.length) await idbPutAll(items);
  return migrated;
}

export async function saveCustomQuestions(items: CustomQuestion[]): Promise<void> {
  if (typeof window === "undefined") return;
  lsWriteQuestions(items);
  await idbPutAll(items);
}

export async function loadQuestionPack(): Promise<QuestionPack> {
  if (typeof window === "undefined") return "both";
  const fromIdb = await idbGetPack();
  if (fromIdb === "builtin" || fromIdb === "custom" || fromIdb === "both") return fromIdb;
  const ls = localStorage.getItem(LS_PACK);
  if (ls === "builtin" || ls === "custom" || ls === "both") return ls;
  return "both";
}

export async function saveQuestionPack(pack: QuestionPack): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_PACK, pack);
  await idbSetPack(pack);
}

export function normalizeAge(raw: string): CustomAge | null {
  const v = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (v === "general" || v === "todas" || v === "all") return "general";
  if (v === "4-8" || v === "4a8" || v === "4a8años" || v === "4-6" || v === "4a6" || v === "4a6años") return "4-8";
  if (v === "9-13" || v === "9a13" || v === "9a13años" || v === "7-10" || v === "7a10" || v === "7a10años") return "9-13";
  if (v === "14-18" || v === "14a18" || v === "14a18años" || v === "4-18" || v === "4a18" || v === "4a18años" || v === "11-16" || v === "11a16" || v === "11a16años") return "14-18";
  return VALID_AGES.has(raw.trim() as CustomAge) ? (raw.trim() as CustomAge) : null;
}

export function makeCustom(partial: {
  text: string;
  age: CustomAge;
  activityType?: string;
  enabled?: boolean;
  id?: string;
}): CustomQuestion {
  const now = Date.now();
  return {
    id: partial.id ?? uuid(),
    text: partial.text.trim(),
    age: partial.age,
    activityType: (partial.activityType ?? "Pregunta").trim() || "Pregunta",
    enabled: partial.enabled ?? true,
    createdAt: now,
    updatedAt: now,
  };
}

export function isDuplicate(items: CustomQuestion[], text: string, ignoreId?: string): boolean {
  const key = text.trim().toLowerCase();
  return items.some((q) => q.id !== ignoreId && q.text.trim().toLowerCase() === key);
}

export function parseQuestionLines(
  raw: string,
  defaultAge: CustomAge,
  activityType = "Pregunta",
): { items: CustomQuestion[]; issues: ImportIssue[] } {
  const items: CustomQuestion[] = [];
  const issues: ImportIssue[] = [];
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
  lines.forEach((line, i) => {
    const text = line.trim();
    if (!text) return;
    if (text.length < 3) {
      issues.push({ line: i + 1, message: "El texto es demasiado corto." });
      return;
    }
    items.push(makeCustom({ text, age: defaultAge, activityType }));
  });
  return { items, issues };
}

export function parseCsv(
  raw: string,
  defaultAge: CustomAge,
): { items: CustomQuestion[]; issues: ImportIssue[] } {
  const items: CustomQuestion[] = [];
  const issues: ImportIssue[] = [];
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) {
    issues.push({ line: 0, message: "El archivo CSV está vacío." });
    return { items, issues };
  }
  const header = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const textIdx = header.findIndex((h) => h === "pregunta" || h === "texto" || h === "text");
  const ageIdx = header.findIndex((h) => h === "edad" || h === "age");
  const typeIdx = header.findIndex((h) => h === "tipo" || h === "actividad" || h === "activitytype");
  const start = textIdx >= 0 ? 1 : 0;
  if (textIdx < 0 && header.some((h) => h.includes(","))) {
    issues.push({ line: 1, message: "No se encontró la columna «pregunta»." });
  }
  const tCol = textIdx >= 0 ? textIdx : 0;
  const aCol = ageIdx >= 0 ? ageIdx : 1;
  for (let i = start; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    const text = (cols[tCol] ?? "").trim();
    if (!text) {
      issues.push({ line: i + 1, message: "Falta el texto de la pregunta." });
      continue;
    }
    const ageRaw = (cols[aCol] ?? "").trim();
    const age = ageRaw ? normalizeAge(ageRaw) : defaultAge;
    if (!age) {
      issues.push({ line: i + 1, message: `Edad no válida: «${ageRaw}». Usa general, 4-8, 9-13 o 14-18.` });
      continue;
    }
    const activityType = typeIdx >= 0 ? (cols[typeIdx] ?? "Pregunta").trim() : "Pregunta";
    items.push(makeCustom({ text, age, activityType }));
  }
  return { items, issues };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseJsonFile(
  raw: string,
  defaultAge: CustomAge,
): { items: CustomQuestion[]; issues: ImportIssue[] } {
  const items: CustomQuestion[] = [];
  const issues: ImportIssue[] = [];
  try {
    const data = JSON.parse(raw) as unknown;
    const list = Array.isArray(data) ? data : Array.isArray((data as { preguntas?: unknown }).preguntas)
      ? (data as { preguntas: unknown[] }).preguntas
      : null;
    if (!list) {
      issues.push({ line: 0, message: "El JSON debe ser una lista de preguntas o { «preguntas»: [...] }." });
      return { items, issues };
    }
    list.forEach((row, i) => {
      if (!row || typeof row !== "object") {
        issues.push({ line: i + 1, message: "La fila no es un objeto." });
        return;
      }
      const rec = row as Record<string, unknown>;
      const text = String(rec.pregunta ?? rec.text ?? rec.texto ?? "").trim();
      if (!text) {
        issues.push({ line: i + 1, message: "Falta el texto de la pregunta." });
        return;
      }
      const ageRaw = String(rec.edad ?? rec.age ?? defaultAge);
      const age = normalizeAge(ageRaw);
      if (!age) {
        issues.push({ line: i + 1, message: `Edad no válida: «${ageRaw}».` });
        return;
      }
      const activityType = String(rec.tipo ?? rec.activityType ?? rec.actividad ?? "Pregunta");
      const enabled = rec.enabled === false || rec.activa === false ? false : true;
      items.push(makeCustom({ text, age, activityType, enabled }));
    });
  } catch {
    issues.push({ line: 0, message: "El archivo JSON no se pudo leer. Revisa las comas y comillas." });
  }
  return { items, issues };
}

export function buildPlayBank(
  age: AgeGroup,
  custom: CustomQuestion[],
  pack: QuestionPack,
): Question[] {
  const out: Question[] = [];
  if (pack !== "custom") {
    for (const q of QUESTIONS[age]) {
      out.push({ id: `b:${age}:${q.id}`, emoji: q.emoji, text: q.text, area: q.area });
    }
  }
  if (pack !== "builtin") {
    for (const c of custom) {
      if (!c.enabled) continue;
      if (c.age !== "general" && c.age !== age) continue;
      out.push({
        id: `c:${c.id}`,
        emoji: "✨",
        text: c.text,
        area: c.activityType || "personalizada",
      });
    }
  }
  return out;
}

export function activeCustomCount(custom: CustomQuestion[], age: AgeGroup | null): number {
  return custom.filter((c) => {
    if (!c.enabled) return false;
    if (!age) return true;
    return c.age === "general" || c.age === age;
  }).length;
}

export function toExportJson(items: CustomQuestion[]): string {
  return JSON.stringify(
    {
      version: 1,
      preguntas: items.map((q) => ({
        pregunta: q.text,
        edad: q.age,
        tipo: q.activityType,
        activa: q.enabled,
      })),
    },
    null,
    2,
  );
}
