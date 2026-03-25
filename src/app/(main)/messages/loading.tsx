import { Skeleton } from "@/components/ui/Skeleton";

export default function MessagesLoading() {
  return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[4.5rem] w-full rounded-2xl" />
      ))}
    </div>
  );
}
