import { ReadyToPostFlow } from "@/components/generation/ReadyToPostFlow";

export default async function ReadyToPostPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <ReadyToPostFlow jobId={jobId} />;
}
