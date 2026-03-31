"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/store/auth-store";

export function AuthStatusCard() {
  const router = useRouter();
  const { session, status, reset, setLoading } = useAuthStore((state) => state);
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      setLoading();

      const result = await authClient.signOut();

      if (result.error) {
        reset();
        return;
      }

      reset();
      router.push("/signin");
      router.refresh();
    });
  }

  return (
    <div>
      <div>
        <div>
          <p>
            Auth status: <span>{status}</span>
          </p>
          <p>
            {session?.user.name ?? session?.user.email ?? "Authenticated user"}
          </p>
          <p>{session?.user.email}</p>
        </div>

        <button type="button" onClick={handleSignOut} disabled={isPending}>
          {isPending ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
