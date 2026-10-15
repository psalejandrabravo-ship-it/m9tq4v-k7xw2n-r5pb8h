import { X } from "lucide-react";
import { MirarimMark, PurposeStrip } from "./MirarimMark";

export function CreditsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Cerrar" className="backdrop-in absolute inset-0 bg-bg-deep/70" onClick={onClose} />
      <div className="modal-in relative z-10 max-h-[min(90dvh,720px)] w-full max-w-md overflow-y-auto rounded-2xl bg-mirarim-cream p-6 text-mirarim-ink shadow-[0_20px_60px_rgba(30,24,48,0.35)] sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="pressable absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-mirarim-ink shadow-[0_0_0_1px_rgba(30,24,48,0.18)]"
        >
          <X className="size-5" />
        </button>
        <p className="font-display text-2xl font-semibold leading-tight">Camino Mágico</p>
        <p className="mt-0.5 text-sm font-semibold">Un juego de MIRARIM</p>
        <div className="mt-5 flex justify-center">
          <MirarimMark variant="horizontal-color" height={36} />
        </div>
        <div className="mt-4">
          <PurposeStrip tone="light" />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-mirarim-ink/80">
          MIRARIM nace de fragmentos de los nombres de una familia. El nombre también se lee como
          mirar, crear e imaginar: mirar para descubrir, crear para aprender, imaginar para crecer.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-mirarim-ink/80">
          El tablero se juega con el acompañamiento de un psicólogo, profesor u otro adulto facilitador.
        </p>
      </div>
    </div>
  );
}
