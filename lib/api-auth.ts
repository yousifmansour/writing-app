import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";

export async function withDatabase<T>(fn: () => Promise<T>): Promise<T> {
  await connectDB();
  return fn();
}

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type AuthenticatedUser =
  | { ok: true; userId: string; session: Session }
  | { ok: false; response: Response };

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  await connectDB();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, userId: session.user.id, session };
}
