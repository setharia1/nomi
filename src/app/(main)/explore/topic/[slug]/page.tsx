import { TopicHubClient } from "./TopicHubClient";

export default async function TopicHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TopicHubClient slug={slug} />;
}
