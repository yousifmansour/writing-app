import mongoose from "mongoose";

import { requireAuthenticatedUser } from "@/lib/api-auth";
import {
  type DraftPayload,
  serializeDraft,
} from "@/lib/api/draft-serialization";
import { StoryDraftModel, StoryModel } from "@/lib/db/story-collections";

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

  const story = await StoryModel.findOne({
    _id: storyId,
    creatorId: authResult.userId,
  }).lean();

  if (!story) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const draftIds = story.storyDrafts ?? [];
  const draftDocs =
    draftIds.length > 0
      ? await StoryDraftModel.find({ _id: { $in: draftIds } }).lean()
      : [];

  const drafts: DraftPayload[] = draftDocs
    .map((d) =>
      serializeDraft({
        _id: d._id,
        content: d.content,
        dateCreated: d.dateCreated,
        dateLastModified: d.dateLastModified,
      })
    )
    .sort(
      (a, b) =>
        new Date(b.dateLastModified).getTime() -
        new Date(a.dateLastModified).getTime()
    );

  const latestDraft = drafts[0] ?? null;

  return Response.json({
    id: String(story._id),
    title: story.title ?? "Untitled story",
    dateLastModified: story.dateLastModified?.toISOString() ?? null,
    drafts,
    latestDraftId: latestDraft?.id ?? null,
    latestContent: latestDraft?.content ?? "",
  });
}

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
    return Response.json({ error: "Expected { content: string }" }, { status: 400 });
  }

  const content = (body as { content: string }).content;

  const authResult = await requireAuthenticatedUser();
  if (!authResult.ok) return authResult.response;

  const story = await StoryModel.findOne({
    _id: storyId,
    creatorId: authResult.userId,
  });

  if (!story) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const draftIds = story.storyDrafts ?? [];

  if (draftIds.length === 0) {
    const draft = await StoryDraftModel.create({
      content,
      dateCreated: now,
      dateLastModified: now,
    });
    story.storyDrafts.push(draft._id);
    story.dateLastModified = now;
    await story.save();

    return Response.json({
      latestDraftId: String(draft._id),
      dateLastModified: now.toISOString(),
      draft: serializeDraft({
        _id: draft._id,
        content: draft.content,
        dateCreated: draft.dateCreated,
        dateLastModified: draft.dateLastModified,
      }),
    });
  }

  const latest = await StoryDraftModel.findOne({
    _id: { $in: draftIds },
  })
    .sort({ dateLastModified: -1 })
    .exec();

  if (!latest) {
    const draft = await StoryDraftModel.create({
      content,
      dateCreated: now,
      dateLastModified: now,
    });
    story.storyDrafts.push(draft._id);
    story.dateLastModified = now;
    await story.save();

    return Response.json({
      latestDraftId: String(draft._id),
      dateLastModified: now.toISOString(),
      draft: serializeDraft({
        _id: draft._id,
        content: draft.content,
        dateCreated: draft.dateCreated,
        dateLastModified: draft.dateLastModified,
      }),
    });
  }

  latest.content = content;
  latest.dateLastModified = now;
  await latest.save();

  story.dateLastModified = now;
  await story.save();

  return Response.json({
    latestDraftId: String(latest._id),
    dateLastModified: now.toISOString(),
    draft: serializeDraft({
      _id: latest._id,
      content: latest.content,
      dateCreated: latest.dateCreated,
      dateLastModified: latest.dateLastModified,
    }),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;

  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    return Response.json({ error: "Not found" }, { status: 404 });
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
  if (draftIds.length > 0) {
    await StoryDraftModel.deleteMany({ _id: { $in: draftIds } });
  }

  await story.deleteOne();

  return new Response(null, { status: 204 });
}
