import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/lib/notifications";
import { requireUser } from "@/lib/session";

export async function POST() {
  try {
    const user = await requireUser();
    await markAllNotificationsRead(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
