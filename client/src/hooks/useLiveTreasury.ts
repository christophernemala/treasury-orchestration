import { useEffect, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { ConnectionStatus, TreasurySnapshot } from "../types";
import { API_ROOT } from "../api";

class FatalStreamError extends Error {}

function isSnapshot(value: unknown): value is TreasurySnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as TreasurySnapshot;
  return (
    Array.isArray(candidate.balances) &&
    typeof candidate.generatedAt === "string" &&
    typeof candidate.dataMode === "string" &&
    typeof candidate.reconciliation?.total === "number" &&
    typeof candidate.reconciliation?.matchRate === "number"
  );
}

export function useLiveTreasury(
  initialData: TreasurySnapshot | null,
  token: string | null,
) {
  const [snapshot, setSnapshot] = useState<TreasurySnapshot | null>(
    initialData,
  );
  const [status, setStatus] = useState<ConnectionStatus>(
    token ? "connecting" : "offline",
  );
  const [lastEventAt, setLastEventAt] = useState<string | null>(
    initialData?.generatedAt ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) setSnapshot(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!token) {
      setStatus("offline");
      return;
    }

    const controller = new AbortController();
    let attempts = 0;
    setStatus("connecting");

    void fetchEventSource(`${API_ROOT}/treasury/live-stream`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      openWhenHidden: false,
      async onopen(response) {
        if (response.status === 401 || response.status === 403) {
          setStatus("offline");
          throw new FatalStreamError("Live stream authorization expired");
        }
        if (
          !response.ok ||
          !response.headers.get("content-type")?.includes("text/event-stream")
        ) {
          setStatus("reconnecting");
          throw new Error(`Live stream unavailable (${response.status})`);
        }
        attempts = 0;
        setStatus("connected");
        setError(null);
      },
      onmessage(event) {
        if (event.event !== "treasury.snapshot") return;
        try {
          const parsed: unknown = JSON.parse(event.data);
          if (!isSnapshot(parsed))
            throw new Error("Snapshot schema is invalid");
          setSnapshot(parsed);
          setLastEventAt(parsed.generatedAt);
          setStatus("connected");
          setError(null);
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Invalid live-stream payload",
          );
        }
      },
      onclose() {
        if (!controller.signal.aborted) {
          setStatus("reconnecting");
          throw new Error("Live stream closed unexpectedly");
        }
      },
      onerror(cause) {
        if (cause instanceof FatalStreamError) throw cause;
        attempts += 1;
        setStatus("reconnecting");
        setError(
          cause instanceof Error ? cause.message : "Stream connection issue",
        );
        return Math.min(1_000 * 2 ** (attempts - 1), 30_000);
      },
    }).catch((cause) => {
      if (controller.signal.aborted) return;
      setStatus("offline");
      setError(cause instanceof Error ? cause.message : "Live stream stopped");
    });

    return () => controller.abort();
  }, [token]);

  return { snapshot, status, lastEventAt, error };
}
