import { Activity, Radio, ShieldCheck } from "lucide-react";
import type { ConnectionStatus } from "../../types";
import { useMotionSettings } from "../../hooks/useMotionSettings";
import { MotionControls } from "./MotionControls";
import { MotionRound } from "./MotionRound";

interface Props {
  connectionStatus: ConnectionStatus;
  matchRate: number;
  exceptions: number;
  lastEventAt: string | null;
}

export function MotionWorkspace({ connectionStatus, matchRate, exceptions, lastEventAt }: Props) {
  const { settings, update, applyPreset, reset } = useMotionSettings();
  const updated = lastEventAt ? new Date(lastEventAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Awaiting event";
  return (
    <section className="motion-workspace card" aria-labelledby="motion-workspace-title">
      <header className="motion-workspace-header">
        <div><span className="section-kicker">REAL-TIME ORCHESTRATION</span><h3 id="motion-workspace-title">Treasury state visualizer</h3><p>The round responds to live reconciliation data. Controls change the animation immediately and persist on this device.</p></div>
        <div className={`workspace-live status-${connectionStatus}`} role="status" aria-live="polite"><Radio size={15} /><span><b>{connectionStatus}</b>Last event {updated}</span></div>
      </header>
      <div className="motion-workspace-grid">
        <div className="motion-stage">
          <MotionRound settings={settings} connectionStatus={connectionStatus} matchRate={matchRate} exceptions={exceptions} onToggle={() => update("playing", !settings.playing)} onSpeedChange={(speed) => update("speed", speed)} />
          <div className="motion-state-row"><span><Activity size={14} />State-linked</span><span><ShieldCheck size={14} />No mutation access</span></div>
        </div>
        <MotionControls settings={settings} onUpdate={update} onPreset={applyPreset} onReset={reset} />
      </div>
    </section>
  );
}

