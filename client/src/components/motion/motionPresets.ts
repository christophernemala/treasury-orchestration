import type { MotionPreset, MotionSettings } from "../../types/motion";

export const MOTION_PRESETS: Record<Exclude<MotionPreset, "custom">, Partial<MotionSettings>> = {
  "close-monitor": { speed: 1, duration: 8, rotation: 360, scale: 1, pulse: 0.55, direction: "forward", loop: true },
  "exception-scan": { speed: 1.35, duration: 5.5, rotation: 270, scale: 1.08, pulse: 0.9, direction: "forward", loop: true },
  "calm-review": { speed: 0.65, duration: 12, rotation: 180, scale: 0.96, pulse: 0.25, direction: "reverse", loop: true },
};

export const PRESET_LABELS: Record<MotionPreset, string> = {
  "close-monitor": "Close monitor",
  "exception-scan": "Exception scan",
  "calm-review": "Calm review",
  custom: "Custom",
};

