import mongoose from "mongoose";

import { requireAuthenticatedUser } from "@/lib/api-auth";
import { serializeDraft } from "@/lib/api/draft-serialization";
import { StoryDraftModel, StoryModel } from "@/lib/db/story-collections";

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

// update a draft's content by id (stories always have at least one draft when created)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;

  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("content" in body) ||
    typeof (body as { content: unknown }).content !== "string"
  ) {
    return Response.json({ error: "Expected content" }, { status: 400 });
  }

  const content = (body as { content: string }).content;
  const draftIdRaw =
    "draftId" in body ? (body as { draftId: unknown }).draftId : undefined;

  if (typeof draftIdRaw !== "string") {
    return Response.json({ error: "Expected draftId" }, { status: 400 });
  }

  const authResult = await requireAuthenticatedUser();
  if (!authResult.ok) return authResult.response;

  const story = await StoryModel.findOne({
    _id: storyId,
    creatorId: authResult.userId,
  });

  if (!story) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const draftIds = story.storyDrafts ?? [];
  if (draftIds.length === 0) {
    return Response.json({ error: "Story has no drafts" }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(draftIdRaw)) {
    return Response.json({ error: "Draft not found" }, { status: 404 });
  }
  const draftObjectId = new mongoose.Types.ObjectId(draftIdRaw);
  const allowed = draftIds.some((id: mongoose.Types.ObjectId) =>
    id.equals(draftObjectId)
  );
  if (!allowed) {
    return Response.json({ error: "Draft not found" }, { status: 404 });
  }

  const draft = await StoryDraftModel.findById(draftObjectId).exec();
  if (!draft) {
    return Response.json({ error: "Draft not found" }, { status: 404 });
  }

  const now = new Date();
  draft.content = content;
  draft.dateLastModified = now;
  await draft.save();

  story.dateLastModified = now;
  await story.save();

  const draftPayload = serializeDraft({
    _id: draft._id,
    content: draft.content,
    dateCreated: draft.dateCreated,
    dateLastModified: draft.dateLastModified,
  });

  return Response.json({
    latestDraftId: String(draft._id),
    dateLastModified: now.toISOString(),
    draft: draftPayload,
  });
}

// delete a draft from the story (?draftId=) — not allowed when it is the only draft
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;

  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const draftIdParam = new URL(request.url).searchParams.get("draftId");
  if (!draftIdParam || !mongoose.Types.ObjectId.isValid(draftIdParam)) {
    return Response.json({ error: "Expected draftId query parameter" }, { status: 400 });
  }

  const authResult = await requireAuthenticatedUser();
  if (!authResult.ok) return authResult.response;

  const story = await StoryModel.findOne({
    _id: storyId,
    creatorId: authResult.userId,
  });
  if (!story) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const draftIds = story.storyDrafts ?? [];
  if (draftIds.length <= 1) {
    return Response.json(
      { error: "Cannot delete the only remaining draft" },
      { status: 409 }
    );
  }

  const draftObjectId = new mongoose.Types.ObjectId(draftIdParam);
  const allowed = draftIds.some((id: mongoose.Types.ObjectId) =>
    id.equals(draftObjectId)
  );
  if (!allowed) {
    return Response.json({ error: "Draft not found" }, { status: 404 });
  }

  const deleted = await StoryDraftModel.findOneAndDelete({
    _id: draftObjectId,
  }).exec();
  if (!deleted) {
    return Response.json({ error: "Draft not found" }, { status: 404 });
  }

  story.storyDrafts = draftIds.filter(
    (id: mongoose.Types.ObjectId) => !id.equals(draftObjectId)
  );
  story.dateLastModified = new Date();
  await story.save();

  return Response.json({ message: "Draft deleted" });
}