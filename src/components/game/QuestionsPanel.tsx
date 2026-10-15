import { useMemo, useRef, useState } from "react";
import { Check, Download, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import {
  ACTIVITY_TYPES,
  isDuplicate,
  parseCsv,
  parseJsonFile,
  parseQuestionLines,
  toExportJson,
} from "@/lib/game/customQuestions";
import { audio } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import type { CustomAge, CustomQuestion, ImportIssue } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const AGE_OPTIONS: { id: CustomAge | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "general", label: "General" },
  { id: "4-8", label: "4 a 8" },
  { id: "9-13", label: "9 a 13" },
  { id: "14-18", label: "14 a 18" },
];

export function QuestionsPanel({ onClose }: { onClose: () => void }) {
  const items = useGame((s) => s.customQuestions);
  const setCustomQuestions = useGame((s) => s.setCustomQuestions);
  const [query, setQuery] = useState("");
  const [ageFilter, setAgeFilter] = useState<CustomAge | "all">("all");
  const [text, setText] = useState("");
  const [age, setAge] = useState<CustomAge>("general");
  const [activityType, setActivityType] = useState("Pregunta");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<CustomQuestion[] | null>(null);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (ageFilter !== "all" && it.age !== ageFilter) return false;
      if (q && !it.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, ageFilter]);

  const readyLines = useMemo(() => {
    if (editingId) return text.trim() ? 1 : 0;
    return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length >= 3).length;
  }, [text, editingId]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const persist = async (next: CustomQuestion[]) => {
    await setCustomQuestions(next);
  };

  const saveOne = async () => {
    if (editingId) {
      const trimmed = text.trim();
      if (!trimmed) {
        setFormError("Escribe una pregunta antes de guardar.");
        return;
      }
      if (isDuplicate(items, trimmed, editingId)) {
        setFormError("Ya existe una pregunta con ese texto.");
        return;
      }
      setFormError(null);
      const next = items.map((it) =>
        it.id === editingId ? { ...it, text: trimmed, age, activityType, updatedAt: Date.now() } : it,
      );
      await persist(next);
      setEditingId(null);
      setText("");
      audio.playUi();
      flash("Pregunta guardada");
      return;
    }

    const parsed = parseQuestionLines(text, age, activityType);
    if (!parsed.items.length) {
      setFormError(parsed.issues[0]?.message ?? "Escribe una pregunta, o pega varias (una por línea).");
      return;
    }

    const existing = items.slice();
    let added = 0;
    let repeated = 0;
    for (const row of [...parsed.items].reverse()) {
      if (isDuplicate(existing, row.text)) {
        repeated += 1;
        continue;
      }
      existing.unshift(row);
      added += 1;
    }
    if (added === 0) {
      setFormError("Esas preguntas ya están en la lista.");
      return;
    }
    setFormError(null);
    await persist(existing);
    setText("");
    setIssues(parsed.issues);
    audio.playUi();
    if (added === 1 && repeated === 0 && parsed.issues.length === 0) {
      flash("Pregunta guardada");
    } else {
      const bits = [`Se agregaron ${added}`];
      if (repeated) bits.push(`${repeated} ya existían`);
      if (parsed.issues.length) bits.push(`${parsed.issues.length} se omitieron por ser muy cortas`);
      flash(bits.join(". "));
    }
  };

  const startEdit = (it: CustomQuestion) => {
    setEditingId(it.id);
    setText(it.text);
    setAge(it.age);
    setActivityType(it.activityType || "Pregunta");
    setFormError(null);
  };

  const removeOne = async (id: string) => {
    await persist(items.filter((it) => it.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setText("");
    }
    flash("Pregunta eliminada");
  };

  const toggle = async (id: string) => {
    await persist(items.map((it) => (it.id === id ? { ...it, enabled: !it.enabled, updatedAt: Date.now() } : it)));
  };

  const applyPreview = async () => {
    if (!preview?.length) return;
    const merged = [...preview];
    const existing = items.slice();
    for (const row of merged) {
      if (!isDuplicate(existing, row.text)) existing.unshift(row);
    }
    await persist(existing);
    setPreview(null);
    setIssues([]);
    flash(`${merged.length} pregunta(s) importadas`);
  };

  const onFile = async (file: File) => {
    try {
      const raw = await file.text();
      const name = file.name.toLowerCase();
      let parsed: { items: CustomQuestion[]; issues: ImportIssue[] };
      if (name.endsWith(".json") || file.type.includes("json")) parsed = parseJsonFile(raw, age);
      else if (name.endsWith(".csv") || file.type.includes("csv")) parsed = parseCsv(raw, age);
      else parsed = parseQuestionLines(raw, age, activityType);
      setPreview(parsed.items);
      setIssues(parsed.issues);
      if (!parsed.items.length && !parsed.issues.length) {
        setIssues([{ line: 0, message: "No se encontraron preguntas en el archivo." }]);
      }
    } catch {
      setIssues([{ line: 0, message: "Este navegador no pudo leer el archivo. Prueba pegar el texto en el recuadro." }]);
    }
  };

  const exportJson = () => {
    try {
      const blob = new Blob([toExportJson(items)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mis-preguntas.json";
      a.click();
      URL.revokeObjectURL(url);
      flash("Archivo descargado");
    } catch {
      setPreview(items);
      setIssues([{ line: 0, message: "No se pudo descargar. Copia el JSON desde la vista previa." }]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-deep text-fg">
      <header className="flex items-center gap-2 px-3 py-3 shadow-[0_1px_0_rgba(246,241,232,0.08)]">
        <h2 className="font-display flex-1 text-lg font-semibold">Mis preguntas</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="pressable flex size-11 items-center justify-center rounded-full bg-surface"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-3 pb-8">
        <p className="mt-2 text-sm text-muted">
          {items.filter((i) => i.enabled).length} activas de {items.length}. Se combinan con el banco original si eliges «Ambas».
        </p>

        <section className="mt-4 rounded-2xl bg-surface p-4">
          <h3 className="font-display text-base font-medium">{editingId ? "Editar pregunta" : "Preguntas"}</h3>
          <p className="mt-1 text-sm text-muted">
            Escribe una, o pega varias (una por línea) y agrégalas juntas. La edad y el tipo se aplican a todas.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={"¿Qué te hace sentir tranquilo?\n¿A quién pedirías ayuda?\n¿Qué te gustaría imaginar hoy?"}
            className="mt-3 w-full rounded-xl bg-bg px-3 py-3 text-base text-fg outline-none ring-1 ring-fg/15 focus:ring-2 focus:ring-gold"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-muted">
              Edad
              <select
                value={age}
                onChange={(e) => setAge(e.target.value as CustomAge)}
                className="mt-1 min-h-12 w-full rounded-xl bg-bg px-3 text-sm text-fg"
              >
                <option value="general">General</option>
                <option value="4-8">4 a 8 años</option>
                <option value="9-13">9 a 13 años</option>
                <option value="14-18">14 a 18 años</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-muted">
              Tipo
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="mt-1 min-h-12 w-full rounded-xl bg-bg px-3 text-sm text-fg"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {formError ? <p className="mt-2 text-sm font-semibold text-rose">{formError}</p> : null}
          {!preview && issues.length ? (
            <ul className="mt-2 space-y-1 text-sm font-semibold text-rose">
              {issues.map((iss, i) => (
                <li key={i}>
                  {iss.line ? `Línea ${iss.line}: ` : ""}
                  {iss.message}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void saveOne()}
              className="pressable flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold font-display font-semibold text-ink"
            >
              <Check className="size-4" />
              {editingId ? "Guardar" : readyLines > 1 ? `Agregar ${readyLines} preguntas` : "Agregar"}
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-surface p-4">
          <h3 className="font-display text-base font-medium">Importar archivo</h3>
          <p className="mt-1 text-sm text-muted">TXT (una por línea), CSV (pregunta, edad) o JSON.</p>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,.json,text/plain,text/csv,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
              e.target.value = "";
            }}
          />
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="pressable flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface-2 font-semibold text-fg"
            >
              <Upload className="size-4" />
              Adjuntar archivo
            </button>
            <button
              type="button"
              onClick={exportJson}
              disabled={!items.length}
              className="pressable flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface-2 font-semibold text-fg disabled:opacity-40"
            >
              <Download className="size-4" />
              Exportar JSON
            </button>
          </div>
        </section>

        {preview ? (
          <section className="mt-4 rounded-2xl bg-parchment p-4 text-ink">
            <h3 className="font-display text-base font-medium">Vista previa</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {preview.map((p, i) => (
                <li key={p.id} className="rounded-lg bg-stone/80 px-3 py-2">
                  {i + 1}. {p.text}{" "}
                  <span className="font-semibold">({p.age})</span>
                </li>
              ))}
            </ul>
            {issues.length ? (
              <ul className="mt-3 space-y-1 text-sm font-semibold text-ink">
                {issues.map((iss, i) => (
                  <li key={i}>
                    {iss.line ? `Línea ${iss.line}: ` : ""}
                    {iss.message}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void applyPreview()}
                disabled={!preview.length}
                className="pressable min-h-12 rounded-xl bg-gold font-display font-semibold text-ink disabled:opacity-40"
              >
                Añadir estas preguntas
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setIssues([]);
                }}
                className="pressable min-h-12 rounded-xl bg-stone font-semibold text-ink"
              >
                Cerrar vista previa
              </button>
            </div>
          </section>
        ) : null}

        <section className="mt-4 rounded-2xl bg-surface p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="min-h-12 w-full rounded-xl bg-bg py-2 pl-10 pr-3 text-base text-fg outline-none ring-1 ring-fg/15"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {AGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAgeFilter(opt.id)}
                className={cn(
                  "pressable min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold",
                  ageFilter === opt.id ? "bg-gold text-ink" : "bg-bg text-fg",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <ul className="mt-3 space-y-2">
            {filtered.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted">Aún no hay preguntas en esta lista.</li>
            ) : (
              filtered.map((it) => (
                <li key={it.id} className="rounded-xl bg-bg p-3">
                  <p className="text-sm leading-snug text-fg">{it.text}</p>
                  <p className="mt-1 text-xs font-semibold text-muted">
                    {it.age === "general" ? "General" : it.age} · {it.activityType} · {it.enabled ? "Activa" : "Pausada"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void toggle(it.id)}
                      className={cn(
                        "pressable min-h-11 rounded-xl px-3 text-sm font-semibold",
                        it.enabled ? "bg-teal text-ink" : "bg-surface-2 text-fg",
                      )}
                    >
                      {it.enabled ? "Activa" : "Pausada"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(it)}
                      className="pressable flex min-h-11 items-center gap-1 rounded-xl bg-surface-2 px-3 text-sm font-semibold text-fg"
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeOne(it.id)}
                      className="pressable flex min-h-11 items-center gap-1 rounded-xl bg-surface-2 px-3 text-sm font-semibold text-fg"
                    >
                      <Trash2 className="size-3.5" />
                      Eliminar
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>

          {items.length > 0 ? (
            confirmClear ? (
              <div className="mt-4 rounded-xl bg-parchment p-3 text-ink">
                <p className="text-sm font-semibold">¿Eliminar todas las preguntas personalizadas?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void persist([]);
                      setConfirmClear(false);
                      flash("Lista vaciada");
                    }}
                    className="pressable min-h-11 flex-1 rounded-xl bg-gold font-semibold text-ink"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="pressable min-h-11 flex-1 rounded-xl bg-stone font-semibold text-ink"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="pressable mt-4 min-h-12 w-full rounded-xl bg-surface-2 text-sm font-semibold text-fg"
              >
                Eliminar todas
              </button>
            )
          ) : null}
        </section>
      </div>

      {toast ? (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

