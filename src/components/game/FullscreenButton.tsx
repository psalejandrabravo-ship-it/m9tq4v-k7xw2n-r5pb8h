import { useEffect, useState } from "react";
import { Maximize, Minimize2 } from "lucide-react";

export function FullscreenButton() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const label = active ? "Salir de pantalla completa" : "Ver pantalla completa";

  return (
    <button
      type="button"
      onClick={() => {
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => {});
          return;
        }
        void document.documentElement.requestFullscreen().catch(() => {});
      }}
      aria-label={label}
      className="pressable flex h-10 shrink-0 items-center gap-2 rounded-full bg-surface px-3 text-sm font-semibold whitespace-nowrap text-fg shadow-[0_0_0_1px_rgba(246,241,232,0.1)]"
    >
      {active ? <Minimize2 className="size-4" /> : <Maximize className="size-4" />}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
