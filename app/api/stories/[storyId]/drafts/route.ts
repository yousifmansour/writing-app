import mongoose from "mongoose";

import { requireAuthenticatedUser } from "@/lib/api-auth";
import { StoryDraftModel, StoryModel } from "@/lib/db/story-collections";
import { serializeDraft } from "@/lib/api/draft-serialization";

// get all drafts of the story
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
    const { storyId } = await params;

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
        return Response.json({ error: "Not found" }, { status: 404 });
    }

    const authResult = await requireAuthenticatedUser();
    if (!authResult.ok) return authResult.response;

    const story = await StoryModel.findOne({ _id: storyId, creatorId: authResult.userId });
    if (!story) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    const draftIds = story.storyDrafts ?? [];
    const draftDocs = await StoryDraftModel.find({ _id: { $in: draftIds } }).lean();
    return Response.json(draftDocs.map((d) => serializeDraft(d)));
}

// create a new draft for the story
export async function POST(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;

  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const authResult = await requireAuthenticatedUser();
  if (!authResult.ok) return authResult.response;

  const story = await StoryModel.findOne({ _id: storyId, creatorId: authResult.userId });
  if (!story) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const draft = await StoryDraftModel.create({ content: "", dateCreated: new Date(), dateLastModified: new Date() });
  story.storyDrafts.push(draft._id);
  await story.save();
  return Response.json(serializeDraft(draft));
}

// delete a draft from the story
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;

  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const authResult = await requireAuthenticatedUser();
  if (!authResult.ok) return authResult.response;

  const story = await StoryModel.findOne({ _id: storyId, creatorId: authResult.userId });
  if (!story) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const draftIds = story.storyDrafts ?? [];
  const draftDocs = await StoryDraftModel.find({ _id: { $in: draftIds } }).lean();
  if (draftDocs.length === 0) {
    return Response.json({ error: "No drafts found" }, { status: 404 });
  }
  const draft = draftDocs[0];
  await draft.deleteOne();
  story.drafts = story.drafts?.filter((id: mongoose.Types.ObjectId) => id !== draft._id) ?? [];
  await story.save();
  return Response.json({ message: "Draft deleted" });
}