export type MotionDirection = "forward" | "reverse";
export type MotionEasing = "linear" | "easeInOut" | "circInOut";
export type MotionPreset = "close-monitor" | "exception-scan" | "calm-review" | "custom";
export type InterfaceTheme = "light" | "focus";

export interface MotionSettings {
  playing: boolean;
  speed: number;
  direction: MotionDirection;
  loop: boolean;
  duration: number;
  delay: number;
  easing: MotionEasing;
  scale: number;
  rotation: number;
  pulse: number;
  pointerResponse: boolean;
  preset: MotionPreset;
  theme: InterfaceTheme;
}

export const DEFAULT_MOTION_SETTINGS: MotionSettings = {
  playing: true,
  speed: 1,
  direction: "forward",
  loop: true,
  duration: 8,
  delay: 0,
  easing: "easeInOut",
  scale: 1,
  rotation: 360,
  pulse: 0.55,
  pointerResponse: true,
  preset: "close-monitor",
  theme: "light",
};

