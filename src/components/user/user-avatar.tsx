import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-24 w-24",
} as const;

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function UserAvatar({
  src,
  name,
  size = "sm",
  className,
}: UserAvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || "U";

  return (
    <Avatar
      className={cn(sizeClasses[size], "ring-1 ring-border", className)}
    >
      <AvatarImage key={src || "fallback"} src={src || ""} alt={name || "User"} />
      <AvatarFallback
        className={cn(
          size === "lg" && "text-2xl",
          size === "xs" && "text-[10px]",
          size === "sm" && "text-xs"
        )}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
