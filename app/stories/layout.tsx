import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/get-auth-session";

export default async function StoriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/signin");
  }

  return children;
}
