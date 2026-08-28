import { startScheduler } from "../src/lib/scheduler"

// Background worker: jalankan `npx ts-node scripts/worker.ts` sebagai proses long-running.
// Per Section 39A: scheduler tidak cocok di serverless (Vercel), harus worker terpisah.
startScheduler()
