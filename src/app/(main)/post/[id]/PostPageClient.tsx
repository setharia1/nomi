"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { PostDetailClient } from "@/components/post/PostDetailClient";
import { selectPostByIdMerged, useContentMemoryStore } from "@/lib/content/contentMemoryStore";

export function PostPageClient({ id }: { id: string }) {
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPosts = useContentMemoryStore((s) => s.userPosts);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const post = useMemo(() => selectPostByIdMerged(id), [id, userPosts]);

  if (!post) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-20 text-center">
        <p className="text-sm text-white/55">This post isn&apos;t available.</p>
        <Link href="/home" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
          Back to feed
        </Link>
      </div>
    );
  }

  return <PostDetailClient post={post} />;
}
