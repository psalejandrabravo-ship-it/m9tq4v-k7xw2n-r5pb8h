import { useEffect } from "react";
import { audio } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import { GameScreen } from "./GameScreen";
import { SetupScreen } from "./SetupScreen";

export function GameApp() {
  const phase = useGame((s) => s.phase);
  const hydratePersistence = useGame((s) => s.hydratePersistence);

  useEffect(() => {
    void hydratePersistence();
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    const onVis = () => {
      if (document.visibilityState === "visible") audio.unlock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hydratePersistence]);

  return phase === "setup" ? <SetupScreen /> : <GameScreen />;
}
