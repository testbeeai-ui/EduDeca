import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarStackMember {
  id: string;
  initials: string;
  avatarColor: string;
}

interface AvatarStackProps {
  members: AvatarStackMember[];
  max?: number;
  className?: string;
}

export function AvatarStack({ members, max = 4, className }: AvatarStackProps) {
  const visible = members.slice(0, max);

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visible.map((member) => (
        <Avatar key={member.id} className="size-8 border-2 border-background">
          <AvatarFallback className={cn("text-xs font-semibold text-white", member.avatarColor)}>
            {member.initials}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
