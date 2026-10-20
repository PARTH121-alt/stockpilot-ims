import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });

  if (!user) redirect("/login");

  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <AppShell
      roleSlug={user.role.slug}
      permissions={session.user.permissions as string[]}
      user={{
        name: user.name,
        email: user.email,
        roleName: user.role.name,
      }}
      notificationCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
