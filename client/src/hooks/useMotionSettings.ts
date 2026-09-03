import { useCallback, useEffect, useState } from "react";
import { MOTION_PRESETS } from "../components/motion/motionPresets";
import { DEFAULT_MOTION_SETTINGS } from "../types/motion";
import type { MotionPreset, MotionSettings } from "../types/motion";

const STORAGE_KEY = "treasury-atom:motion:v1";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

function normalise(input: Partial<MotionSettings>): MotionSettings {
  return {
    ...DEFAULT_MOTION_SETTINGS,
    ...input,
    speed: clamp(Number(input.speed ?? DEFAULT_MOTION_SETTINGS.speed), 0.25, 2.5),
    duration: clamp(Number(input.duration ?? DEFAULT_MOTION_SETTINGS.duration), 2, 30),
    delay: clamp(Number(input.delay ?? DEFAULT_MOTION_SETTINGS.delay), 0, 5),
    scale: clamp(Number(input.scale ?? DEFAULT_MOTION_SETTINGS.scale), 0.75, 1.3),
    rotation: clamp(Number(input.rotation ?? DEFAULT_MOTION_SETTINGS.rotation), 0, 720),
    pulse: clamp(Number(input.pulse ?? DEFAULT_MOTION_SETTINGS.pulse), 0, 1),
  };
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalise(JSON.parse(saved) as Partial<MotionSettings>) : DEFAULT_MOTION_SETTINGS;
  } catch {
    return DEFAULT_MOTION_SETTINGS;
  }
}

export function useMotionSettings() {
  const [settings, setSettings] = useState<MotionSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.theme;
  }, [settings]);

  const update = useCallback(<K extends keyof MotionSettings>(key: K, value: MotionSettings[K]) => {
    setSettings((current) => normalise({ ...current, [key]: value, preset: key === "preset" ? current.preset : "custom" }));
  }, []);

  const applyPreset = useCallback((preset: Exclude<MotionPreset, "custom">) => {
    setSettings((current) => normalise({ ...current, ...MOTION_PRESETS[preset], preset }));
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_MOTION_SETTINGS);
  }, []);

  return { settings, update, applyPreset, reset };
}

