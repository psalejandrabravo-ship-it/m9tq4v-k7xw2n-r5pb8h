import { cn } from "@/lib/utils";

const SRC = {
  "horizontal-blanco": "/brand/mirarim/MIRARIM-horizontal-blanco.png",
  "horizontal-color": "/brand/mirarim/MIRARIM-horizontal-color.png",
  "horizontal-negro": "/brand/mirarim/MIRARIM-horizontal-negro.png",
} as const;

type Variant = keyof typeof SRC;

export const PURPOSE = [
  { verb: "Mirar", line: "para descubrir" },
  { verb: "Crear", line: "para aprender" },
  { verb: "Imaginar", line: "para crecer" },
] as const;

export function MirarimMark({
  variant,
  height = 28,
  className,
}: {
  variant: Variant;
  height?: number;
  className?: string;
}) {
  const wide = variant.startsWith("horizontal");
  return (
    <img
      src={SRC[variant]}
      alt="MIRARIM"
      height={height}
      draggable={false}
      className={cn("mirarim-mark", wide ? "mirarim-wordmark" : "mirarim-symbol", className)}
      style={{ height, width: "auto" }}
    />
  );
}

export function PurposeStrip({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <ul className="grid grid-cols-3 gap-2">
      {PURPOSE.map((item) => (
        <li
          key={item.verb}
          className={cn(
            "rounded-xl px-2 py-2 text-center",
            light ? "bg-white/70 text-mirarim-ink" : "bg-surface-2/80 text-fg",
          )}
        >
          <span
            className={cn(
              "font-display block text-sm font-semibold leading-tight",
              light ? "text-mirarim-coral" : "text-gold",
            )}
          >
            {item.verb}
          </span>
          <span className={cn("mt-0.5 block text-xs leading-tight", light ? "text-mirarim-ink/70" : "text-muted")}>
            {item.line}
          </span>
        </li>
      ))}
    </ul>
  );
}
