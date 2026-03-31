import mongoose from "mongoose";
import { notFound } from "next/navigation";

import { StoryEditor } from "@/components/story-editor";
import { getAuthSession } from "@/lib/get-auth-session";

type Props = { params: Promise<{ storyId: string }> };

export default async function StoryPage({ params }: Props) {
  const { storyId } = await params;

  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    notFound();
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    notFound();
  }

  return <StoryEditor storyId={storyId} />;
}
