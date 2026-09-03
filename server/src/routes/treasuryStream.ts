import { Request, Response, Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { buildTreasurySnapshot } from "../services/treasuryService.js";

const router = Router();
const activeClients = new Set<Response>();
let eventId = 0;

function writeEvent(client: Response, event: string, data: unknown) {
  if (client.destroyed || client.writableEnded) return false;
  client.write(
    `id: ${++eventId}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );
  return true;
}

export function broadcastTreasurySnapshot() {
  const snapshot = buildTreasurySnapshot();
  for (const client of [...activeClients]) {
    try {
      if (!writeEvent(client, "treasury.snapshot", snapshot))
        activeClients.delete(client);
    } catch {
      activeClients.delete(client);
    }
  }
}

router.get(
  "/api/treasury/live-stream",
  authenticateToken,
  (req: Request, res: Response) => {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write("retry: 5000\n\n");
    writeEvent(res, "treasury.snapshot", buildTreasurySnapshot());
    activeClients.add(res);

    const heartbeatTimer = setInterval(() => {
      try {
        if (
          !writeEvent(res, "treasury.heartbeat", {
            at: new Date().toISOString(),
          })
        )
          activeClients.delete(res);
      } catch {
        activeClients.delete(res);
      }
    }, 15_000);

    let closed = false;
    const cleanup = () => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeatTimer);
      activeClients.delete(res);
      if (!res.writableEnded) res.end();
    };
    req.on("close", cleanup);
    res.on("error", cleanup);
  },
);

export default router;
