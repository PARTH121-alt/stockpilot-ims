export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/session";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const path = getDashboardPath(session.user.roleSlug);
    redirect(path);
  }

  redirect("/login");
}
