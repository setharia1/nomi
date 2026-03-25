import { ExploreGridSkeleton } from "@/components/ui/Skeleton";

export default function ExploreLoading() {
  return (
    <div className="space-y-4 py-2">
      <div className="h-12 rounded-2xl skeleton-shimmer" />
      <ExploreGridSkeleton />
    </div>
  );
}
