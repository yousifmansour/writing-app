"use client";

import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/store/auth-store";

export function AuthSessionSync() {
  const { data, error, isPending } = authClient.useSession();
  const reset = useAuthStore((state) => state.reset);
  const setLoading = useAuthStore((state) => state.setLoading);
  const syncSession = useAuthStore((state) => state.syncSession);

  useEffect(() => {
    if (isPending) {
      setLoading();
      return;
    }

    if (error || !data) {
      reset();
      return;
    }

    syncSession(data);
  }, [data, error, isPending, reset, setLoading, syncSession]);

  return null;
}
