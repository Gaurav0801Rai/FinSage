import { cn } from "@/lib/utils";
import { getUnreadAlertCount } from "@/app/actions/alerts";

export async function AlertsBadge() {
  try {
    const count = await getUnreadAlertCount();
    if (count === 0) return null;

    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          "min-w-[20px] h-5 px-1.5 rounded-full",
          "text-xs font-semibold font-mono",
          "bg-loss text-white"
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  } catch {
    return null;
  }
}