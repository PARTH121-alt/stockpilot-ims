export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/session";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const path = getDashboardPath(session.user.roleSlug);
  redirect(path);
}
