import { Suspense } from "react";
import { SearchExperience } from "@/components/search/SearchExperience";

function SearchFallback() {
  return (
    <div className="space-y-6 animate-pulse pb-6">
      <div className="h-8 w-48 rounded-lg bg-white/10" />
      <div className="h-14 rounded-2xl bg-white/10" />
      <div className="h-40 rounded-2xl bg-white/5" />
      <div className="grid grid-cols-2 gap-2">
        <div className="aspect-[4/5] rounded-2xl bg-white/5" />
        <div className="aspect-[4/5] rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchExperience />
    </Suspense>
  );
}
