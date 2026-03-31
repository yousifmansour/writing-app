import type mongoose from "mongoose";

export type DraftPayload = {
  id: string;
  content: string;
  dateCreated: string;
  dateLastModified: string;
};

export function serializeDraft(d: {
  _id: mongoose.Types.ObjectId;
  content: string;
  dateCreated: Date;
  dateLastModified: Date;
}): DraftPayload {
  return {
    id: String(d._id),
    content: d.content,
    dateCreated: d.dateCreated.toISOString(),
    dateLastModified: d.dateLastModified.toISOString(),
  };
}
