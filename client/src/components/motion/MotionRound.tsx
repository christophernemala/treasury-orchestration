import { KeyboardEvent, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { ConnectionStatus } from "../../types";
import type { MotionSettings } from "../../types/motion";

interface Props {
  settings: MotionSettings;
  connectionStatus: ConnectionStatus;
  matchRate: number;
  exceptions: number;
  onToggle: () => void;
  onSpeedChange: (speed: number) => void;
}

const statusCopy: Record<ConnectionStatus, string> = {
  connected: "Live treasury feed",
  connecting: "Connecting to feed",
  reconnecting: "Restoring live feed",
  offline: "Live feed offline",
};

export function MotionRound({ settings, connectionStatus, matchRate, exceptions, onToggle, onSpeedChange }: Props) {
  const reduced = useReducedMotion();
  const surface = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const active = settings.playing && !reduced;
  const signedRotation = settings.rotation * (settings.direction === "forward" ? 1 : -1);
  const cycleDuration = settings.duration / settings.speed;

  function handlePointer(event: React.PointerEvent<HTMLDivElement>) {
    if (!settings.pointerResponse || reduced || !surface.current) return;
    const rect = surface.current.getBoundingClientRect();
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * 14);
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * -14);
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === " ") {
      event.preventDefault();
      onToggle();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      onSpeedChange(Math.min(2.5, settings.speed + 0.1));
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onSpeedChange(Math.max(0.25, settings.speed - 0.1));
    }
  }

  return (
    <div
      ref={surface}
      className={`motion-round status-${connectionStatus}`}
      tabIndex={0}
      role="img"
      aria-label={`${statusCopy[connectionStatus]}. ${matchRate}% reconciled. ${exceptions} exceptions. ${settings.playing ? "Animation playing" : "Animation paused"}.`}
      onPointerMove={handlePointer}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      onKeyDown={handleKey}
      data-testid="motion-round"
    >
      <motion.div className="motion-round-tilt" style={{ rotateX: y, rotateY: x, scale: settings.scale }}>
        <motion.div
          className="round-orbit orbit-outer"
          animate={active ? { rotate: signedRotation } : { rotate: 0 }}
          transition={{ duration: cycleDuration, delay: settings.delay, ease: settings.easing, repeat: settings.loop ? Infinity : 0 }}
        >
          <i /><i /><i />
        </motion.div>
        <motion.div
          className="round-orbit orbit-inner"
          animate={active ? { rotate: -signedRotation * 0.72 } : { rotate: 0 }}
          transition={{ duration: cycleDuration * 0.8, delay: settings.delay, ease: settings.easing, repeat: settings.loop ? Infinity : 0 }}
        />
        <svg className="round-progress" viewBox="0 0 220 220" aria-hidden="true">
          <circle cx="110" cy="110" r="93" className="progress-track" />
          <motion.circle
            cx="110" cy="110" r="93"
            className="progress-value"
            initial={false}
            animate={{ pathLength: matchRate / 100 }}
            transition={{ duration: reduced ? 0 : 0.6, ease: "easeOut" }}
          />
        </svg>
        <motion.div
          className="round-core"
          animate={active ? { scale: [1, 1 + settings.pulse * 0.07, 1] } : { scale: 1 }}
          transition={{ duration: Math.max(1.4, cycleDuration * 0.32), repeat: settings.loop ? Infinity : 0, ease: "easeInOut" }}
        >
          <span>{matchRate}%</span>
          <small>reconciled</small>
          <b>{exceptions} exceptions</b>
        </motion.div>
      </motion.div>
      <div className="round-status" aria-hidden="true"><i />{statusCopy[connectionStatus]}</div>
      <span className="round-shortcut">Space: play/pause · ↑↓: speed</span>
    </div>
  );
}

