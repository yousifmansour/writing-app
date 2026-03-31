import { InferSchemaType, Schema, model, models } from "mongoose";

export const STORY_DRAFTS_COLLECTION = "story_drafts";
export const STORIES_COLLECTION = "stories";

const storyDraftSchema = new Schema(
  {
    content: { type: String, default: "" },
    dateCreated: { type: Date, default: Date.now },
    dateLastModified: { type: Date, default: Date.now },
  },
  { collection: STORY_DRAFTS_COLLECTION }
);

const storySchema = new Schema(
  {
    creatorId: { type: String, required: true },
    title: { type: String, required: true },
    storyDrafts: [{ type: Schema.Types.ObjectId, ref: "StoryDraft" }],
    dateCreated: { type: Date, required: true },
    dateLastModified: { type: Date, required: true },
    dateLastOpened: { type: Date, required: false },
  },
  { collection: STORIES_COLLECTION }
);

export type StoryDraftDocument = InferSchemaType<typeof storyDraftSchema>;
export type StoryDocument = InferSchemaType<typeof storySchema>;

export const StoryDraftModel =
  models.StoryDraft ?? model("StoryDraft", storyDraftSchema);

export const StoryModel = models.Story ?? model("Story", storySchema);
