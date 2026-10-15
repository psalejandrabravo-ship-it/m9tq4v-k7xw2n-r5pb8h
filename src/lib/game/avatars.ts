import type { AvatarDef, AvatarId } from "./types";

export const AVATARS: AvatarDef[] = [
  { id: "wizard", name: "Mago", src: "/game/avatars/wizard.jpg", accent: "#7c6bc4" },
  { id: "fairy", name: "Hada", src: "/game/avatars/fairy.jpg", accent: "#e8a0c0" },
  { id: "dragon", name: "Dragón pequeño", src: "/game/avatars/dragon.jpg", accent: "#5ec8c0" },
  { id: "unicorn", name: "Unicornio", src: "/game/avatars/unicorn.jpg", accent: "#c9b6f0" },
  { id: "elf", name: "Elfo", src: "/game/avatars/elf.jpg", accent: "#7dba6a" },
  { id: "oracle", name: "Oráculo", src: "/game/avatars/oracle.jpg", accent: "#6b7fd7" },
  { id: "star", name: "Estrella mágica", src: "/game/avatars/star.jpg", accent: "#e8c56b" },
  { id: "gnome", name: "Duende del bosque", src: "/game/avatars/gnome.jpg", accent: "#d45c5c" },
  { id: "butterfly", name: "Mariposa encantada", src: "/game/avatars/butterfly.jpg", accent: "#e89b6b" },
  { id: "wolf", name: "Lobo del bosque", src: "/game/avatars/wolf.jpg", accent: "#7aa0d4" },
];

export function avatarById(id: AvatarId): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0]!;
}
