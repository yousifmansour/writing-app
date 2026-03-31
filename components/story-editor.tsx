"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type DraftRow = {
  id: string;
  content: string;
  dateCreated: string;
  dateLastModified: string;
};

type StoryDetailResponse = {
  id: string;
  title: string;
  dateLastModified: string | null;
  drafts: DraftRow[];
  latestDraftId: string | null;
  latestContent: string;
};

type Props = { storyId: string };

export function StoryEditor({ storyId }: Props) {
  const [title, setTitle] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [latestDraftId, setLatestDraftId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [storyUpdated, setStoryUpdated] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    const res = await fetch(`/api/stories/${storyId}`);

    if (res.status === 404) {
      setLoadError("Story not found.");
      return;
    }

    if (res.status === 401) {
      setLoadError("You need to sign in to view this story.");
      return;
    }

    if (!res.ok) {
      setLoadError("Could not load this story.");
      return;
    }

    const data = (await res.json()) as StoryDetailResponse;
    setTitle(data.title);
    setDrafts(data.drafts);
    setLatestDraftId(data.latestDraftId);
    setContent(data.latestContent);
    setStoryUpdated(data.dateLastModified);
  }, [storyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);

    try {
      const res = await fetch(`/api/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setSaveError(err?.error ?? "Save failed.");
        return;
      }

      const payload = (await res.json()) as {
        latestDraftId: string;
        dateLastModified: string;
        draft: DraftRow;
      };

      setLatestDraftId(payload.latestDraftId);
      setStoryUpdated(payload.dateLastModified);
      setDrafts((prev) => {
        const without = prev.filter((d) => d.id !== payload.draft.id);
        const next = [...without, payload.draft];
        next.sort(
          (a, b) =>
            new Date(b.dateLastModified).getTime() -
            new Date(a.dateLastModified).getTime()
        );
        return next;
      });
      setSaveOk(true);
    } catch {
      setSaveError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <main>
        <p>
          <Link href="/">← Back to stories</Link>
        </p>
        <p role="alert">{loadError}</p>
      </main>
    );
  }

  if (title === null) {
    return (
      <main>
        <p>
          <Link href="/">← Back to stories</Link>
        </p>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main>
      <p>
        <Link href="/">← Back to stories</Link>
      </p>

      <article>
        <h1>{title}</h1>
        {storyUpdated ? (
          <p>
            Last updated{" "}
            {new Date(storyUpdated).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        ) : null}

        {drafts.length > 0 ? (
          <section aria-label="All drafts">
            <h2>Drafts ({drafts.length})</h2>
            <ul>
              {drafts.map((d, index) => {
                const isLatest =
                  latestDraftId != null
                    ? d.id === latestDraftId
                    : index === 0;
                return (
                  <li key={d.id}>
                    {isLatest ? (
                      <strong>Latest</strong>
                    ) : (
                      <span>Draft</span>
                    )}
                    {" — "}
                    {new Date(d.dateLastModified).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <label htmlFor="story-draft-content" style={{ display: "block", marginTop: "1rem" }}>
          Latest draft
        </label>
        <textarea
          id="story-draft-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setSaveOk(false);
          }}
          rows={18}
          style={{
            width: "100%",
            maxWidth: "42rem",
            marginTop: "1rem",
            fontFamily: "inherit",
            fontSize: "1rem",
            padding: "0.75rem",
          }}
        />

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          {saveOk ? <span>Saved.</span> : null}
          {saveError ? (
            <span role="alert" style={{ color: "var(--foreground)" }}>
              {saveError}
            </span>
          ) : null}
        </div>
      </article>
    </main>
  );
}
