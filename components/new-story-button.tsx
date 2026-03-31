"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewStoryButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const res = await fetch("/api/stories", { method: "POST" });
      if (!res.ok) {
        setPending(false);
        return;
      }
      const data = (await res.json()) as { id: string };
      router.push(`/stories/${data.id}`);
      router.refresh();
    } catch {
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending}>
      {pending ? "Creating…" : "New story"}
    </button>
  );
}
