"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  storyId: string;
  title: string;
  onTitleChange: (title: string) => void;
  onStoryDateUpdated: (dateLastModified: string) => void;
};

export function StoryEditorTitle({
  storyId,
  title,
  onTitleChange,
  onStoryDateUpdated,
}: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  function beginTitleEdit() {
    setTitleDraft(title);
    setTitleError(null);
    setEditingTitle(true);
  }

  function cancelTitleEdit() {
    setEditingTitle(false);
    setTitleDraft(title);
  }

  async function commitTitleEdit() {
    const trimmed = titleDraft.trim();
    const nextTitle = trimmed.length > 0 ? trimmed : "Untitled story";
    setEditingTitle(false);

    if (nextTitle === title) {
      return;
    }

    const previous = title;
    onTitleChange(nextTitle);

    try {
      const res = await fetch(`/api/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        onTitleChange(previous);
        setTitleError(err?.error ?? "Could not update title.");
        return;
      }

      const payload = (await res.json()) as { dateLastModified: string };
      onStoryDateUpdated(payload.dateLastModified);
      setTitleError(null);
    } catch {
      onTitleChange(previous);
      setTitleError("Could not update title.");
    }
  }

  return (
    <>
      {editingTitle ? (
        <input
          ref={titleInputRef}
          type="text"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => void commitTitleEdit()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              cancelTitleEdit();
            }
          }}
          aria-label="Story title"
          style={{
            display: "block",
            fontSize: "2rem",
            fontWeight: 700,
            width: "100%",
            maxWidth: "42rem",
            fontFamily: "inherit",
            margin: "0.67em 0",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <h1>
          <button
            type="button"
            onClick={beginTitleEdit}
            style={{
              all: "unset",
              cursor: "pointer",
              display: "inline",
            }}
          >
            {title}
          </button>
        </h1>
      )}
      {titleError ? (
        <p role="alert" style={{ color: "var(--foreground)" }}>
          {titleError}
        </p>
      ) : null}
    </>
  );
}
