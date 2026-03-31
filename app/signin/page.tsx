import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getAuthSession } from "@/lib/get-auth-session";

export default async function SignInPage() {
  const session = await getAuthSession();

  if (session) {
    redirect("/");
  }

  return <AuthForm mode="signin" />;
}
