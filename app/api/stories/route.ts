import { requireAuthenticatedUser } from "@/lib/api-auth";
import { StoryDraftModel, StoryModel } from "@/lib/db/story-collections";

export async function GET() {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.ok) return authResult.response;

  const stories = await StoryModel.find({ creatorId: authResult.userId })
    .select("_id title dateLastModified")
    .sort({ dateLastModified: -1 })
    .lean();

  return Response.json({
    stories: stories.map((s) => ({
      id: String(s._id),
      title: s.title,
      dateLastModified: s.dateLastModified?.toISOString() ?? null,
    })),
  });
}

export async function POST() {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.ok) return authResult.response;

  const now = new Date();
  const initialDraft = await StoryDraftModel.create({
    content: "",
    dateCreated: now,
    dateLastModified: now,
  });

  const story = await StoryModel.create({
    creatorId: authResult.userId,
    title: "Untitled story",
    storyDrafts: [initialDraft._id],
    dateCreated: now,
    dateLastModified: now,
  });

  return Response.json({
    id: String(story._id),
    title: story.title,
  });
}
