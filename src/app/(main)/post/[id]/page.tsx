import { PostPageClient } from "./PostPageClient";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostPageClient id={id} />;
}

