import { avatarById } from "@/lib/game/avatars";
import type { AvatarId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface TokenProps {
  avatarId: AvatarId;
  size?: number;
  active?: boolean;
  className?: string;
  crowned?: boolean;
}

export function Token({ avatarId, size = 48, active, className, crowned }: TokenProps) {
  const avatar = avatarById(avatarId);
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <img
        src={avatar.src}
        alt={avatar.name}
        width={size}
        height={size}
        draggable={false}
        className={cn(
          "h-full w-full rounded-full object-cover outline outline-1 -outline-offset-1 outline-white/25",
          active && "token-halo",
        )}
      />
      {crowned ? (
        <span
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-base leading-none"
          aria-hidden
        >
          👑
        </span>
      ) : null}
    </span>
  );
}
