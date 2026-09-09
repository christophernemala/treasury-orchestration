import { type Response, Router } from 'express';
import { authenticateToken, legacyScopeAllowed, requireLegacyScope, requireMembership } from '../middleware/auth.js';
import { requirePermission } from '../middleware/requestContext.js';
import { verifyToken } from '../services/auth.js';
import { buildTreasurySnapshot } from '../services/treasuryService.js';

const router = Router();
interface StreamClient { response: Response; token: string; cleanup: () => void }
const activeClients = new Set<StreamClient>();
let eventId = 0;

function writeEvent(client: StreamClient, event: string, data: () => unknown) {
  try {
    // Re-resolve membership and permissions before every snapshot or heartbeat.
    // Expired credentials, disabled users and revoked grants close the stream.
    const user = verifyToken(client.token);
    if (!legacyScopeAllowed(user) || !user.permissions.includes('bank.read') || !user.permissions.includes('ledger.read')) throw new Error('Access revoked');
    if (client.response.destroyed || client.response.writableEnded) throw new Error('Disconnected');
    if (!client.response.write(`id: ${++eventId}\nevent: ${event}\ndata: ${JSON.stringify(data())}\n\n`)) client.cleanup();
  } catch { client.cleanup(); }
}

export function broadcastTreasurySnapshot() {
  for (const client of [...activeClients]) writeEvent(client, 'treasury.snapshot', buildTreasurySnapshot);
}

router.get('/api/treasury/live-stream', authenticateToken, requireMembership, requireLegacyScope,
  requirePermission('bank.read'), requirePermission('ledger.read'), (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive', 'X-Accel-Buffering': 'no',
    });
    let closed = false;
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const client: StreamClient = {
      response: res, token: req.headers.authorization!.slice(7), cleanup() {
        if (closed) return;
        closed = true;
        clearInterval(heartbeatTimer);
        clearTimeout(expiryTimer);
        activeClients.delete(client);
        if (!res.writableEnded) res.end();
      },
    };
    res.on('close', client.cleanup);
    res.on('error', client.cleanup);
    activeClients.add(client);
    heartbeatTimer = setInterval(() => writeEvent(client, 'treasury.heartbeat', () => ({ at: new Date().toISOString() })), 15_000);
    expiryTimer = setTimeout(client.cleanup, Math.max(0, req.user!.exp * 1000 - Date.now()));
    res.flushHeaders();
    res.write('retry: 5000\n\n');
    writeEvent(client, 'treasury.snapshot', buildTreasurySnapshot);
  });

export default router;
