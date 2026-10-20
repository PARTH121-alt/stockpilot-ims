import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const orgId = user.orgId;

    const items = await prisma.approvalRequest.findMany({
      where: { orgId, status: "PENDING" },
      take: 5,
      include: { requester: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const approvals = items.map((a) => ({
      id: a.id,
      type: a.type,
      createdAt: a.createdAt,
      requester: a.requester,
    }));

    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Pending approvals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
