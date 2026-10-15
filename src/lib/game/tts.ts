/** SpeechSynthesis in Spanish — only when the facilitator presses Listen. */

let preferred: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const ranked = [
    (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith("es-cl"),
    (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith("es-es"),
    (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith("es-mx"),
    (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith("es"),
  ];
  for (const test of ranked) {
    const found = voices.find(test);
    if (found) return found;
  }
  return voices[0] ?? null;
}

function ensureVoices(): void {
  preferred = pickVoice();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      preferred = pickVoice();
    });
  }
}

if (typeof window !== "undefined") ensureVoices();

export function speakQuestion(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = preferred ?? pickVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "es-ES";
  }
  utterance.rate = 0.92;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
