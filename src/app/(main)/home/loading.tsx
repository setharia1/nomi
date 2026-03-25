export default function HomeLoading() {
  return (
    <div className="flex h-full min-h-[100dvh] flex-1 flex-col gap-2 p-2">
      <div className="h-10 max-w-xs mx-auto w-full rounded-full skeleton-shimmer" />
      <div className="min-h-0 flex-1 rounded-2xl skeleton-shimmer" />
    </div>
  );
}
