"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/store/auth-store";

type AuthFormMode = "signin" | "signup";

type AuthFormProps = {
  mode: AuthFormMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reset = useAuthStore((state) => state.reset);
  const setLoading = useAuthStore((state) => state.setLoading);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const redirectTo = useMemo(
    () => searchParams.get("redirectTo") ?? "/",
    [searchParams],
  );

  const isSignUp = mode === "signup";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    startTransition(async () => {
      setLoading();

      const result = isSignUp
        ? await authClient.signUp.email({
            name,
            email,
            password,
            callbackURL: redirectTo,
          })
        : await authClient.signIn.email({
            email,
            password,
            callbackURL: redirectTo,
          });

      if (result.error) {
        reset();
        setErrorMessage(result.error.message ?? "Authentication failed.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <main>
      <div>
        <div>
          <h1>{isSignUp ? "Create your account" : "Welcome back"}</h1>
          <p>
            {isSignUp
              ? "Sign up to start writing and unlock your stories."
              : "Sign in to access your protected stories."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp ? (
            <label>
              <span>Name</span>
              <input
                required
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Writer"
              />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              required
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="••••••••"
            />
          </label>

          {errorMessage ? <p>{errorMessage}</p> : null}

          <button type="submit" disabled={isPending}>
            {isPending
              ? isSignUp
                ? "Creating account..."
                : "Signing in..."
              : isSignUp
                ? "Sign up"
                : "Sign in"}
          </button>
        </form>

        <p>
          {isSignUp ? "Already have an account? " : "Need an account? "}
          <Link href={isSignUp ? "/signin" : "/signup"}>
            {isSignUp ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </main>
  );
}
