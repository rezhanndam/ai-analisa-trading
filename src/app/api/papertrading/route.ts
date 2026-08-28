import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {}
  if (status && (status === "OPEN" || status === "CLOSED")) {
    whereClause.status = status
  }

  const positions = await prisma.paperPosition.findMany({
    where: whereClause,
    orderBy: { openTime: "desc" },
    take: 100
  })

  return NextResponse.json(positions)
}
