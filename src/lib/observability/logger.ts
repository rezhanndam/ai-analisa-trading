import { prisma } from "@/lib/db/prisma"

export async function logSystemHealth(provider: string, isUp: boolean, latency: number, errorCount: number = 0) {
  await prisma.systemHealthLog.create({
    data: {
      provider,
      status: isUp ? "UP" : "DOWN",
      latencyMs: latency,
      errorCount
    }
  })
}

export async function logAudit(action: string, details: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      action,
      details: JSON.stringify(details)
    }
  })
}

// Error tracking (Section 40): log exception ke SystemHealthLog.
// Sentry opsional — swap di sini saat production tanpa ubah caller.
export async function reportError(error: unknown, context: Record<string, unknown> = {}) {
  const msg = error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error)
  console.error("[ERROR]", context, error)
  try {
    await prisma.auditLog.create({
      data: {
        action: "ERROR",
        details: JSON.stringify({ msg, context })
      }
    })
  } catch (e) {
    console.error("Failed to persist error log:", e)
  }
}
