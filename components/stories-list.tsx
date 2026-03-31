"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type StoryRow = {
  id: string;
  title: string;
  dateLastModified: string | null;
};

async function fetchStories() {
  const res = await fetch("/api/stories");
  if (!res.ok) {
    throw new Error("Could not load stories.");
  }
  return (await res.json()) as { stories: StoryRow[] };
}

export function StoriesList() {
  const [stories, setStories] = useState<StoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshStories = useCallback(async () => {
    void fetchStories().then((result) => {
      setStories(result.stories);
      setError(null);
    });
  }, []);

  useEffect(() => {
    void refreshStories();
  }, [refreshStories]);


  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/stories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete story.");
      return;
    }
    void refreshStories();
  }, [refreshStories]);

  if (stories === null) {
    return <p>Loading stories…</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (stories.length === 0) {
    return <p>No stories yet. Create one with the button below.</p>;
  }

  return (
    <ul>
      {stories.map((s) => (
        <li key={s.id}>
          <Link href={`/stories/${s.id}`}>{s.title}</Link>
          {s.dateLastModified ? (
            <span>
              {" "}
              — last updated{" "}
              {new Date(s.dateLastModified).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          ) : null}
          <button type="button" onClick={() => void handleDelete(s.id)}>Delete Story</button>
        </li>
      ))}
    </ul>
  );
}
