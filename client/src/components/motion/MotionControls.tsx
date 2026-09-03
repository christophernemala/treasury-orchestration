import { Pause, Play, RefreshCcw, RotateCcw, RotateCw, SunMoon } from "lucide-react";
import type { MotionEasing, MotionPreset, MotionSettings } from "../../types/motion";
import { PRESET_LABELS } from "./motionPresets";

interface Props {
  settings: MotionSettings;
  onUpdate: <K extends keyof MotionSettings>(key: K, value: MotionSettings[K]) => void;
  onPreset: (preset: Exclude<MotionPreset, "custom">) => void;
  onReset: () => void;
}

export function MotionControls({ settings, onUpdate, onPreset, onReset }: Props) {
  return (
    <form className="motion-controls" onSubmit={(event) => event.preventDefault()} aria-label="Live motion controls">
      <div className="control-heading">
        <div><span>LIVE CONTROL PANEL</span><h3>Motion behaviour</h3></div>
        <button type="button" className="icon-button reset-control" onClick={onReset} aria-label="Reset motion controls"><RefreshCcw size={16} /></button>
      </div>

      <div className="control-actions">
        <button type="button" className="control-button primary-control" aria-pressed={settings.playing} onClick={() => onUpdate("playing", !settings.playing)}>
          {settings.playing ? <Pause size={16} /> : <Play size={16} />}{settings.playing ? "Pause" : "Play"}
        </button>
        <button type="button" className="control-button" aria-pressed={settings.direction === "reverse"} onClick={() => onUpdate("direction", settings.direction === "forward" ? "reverse" : "forward")}>
          {settings.direction === "forward" ? <RotateCw size={16} /> : <RotateCcw size={16} />}{settings.direction}
        </button>
        <button type="button" className="control-button" aria-pressed={settings.loop} onClick={() => onUpdate("loop", !settings.loop)}>Loop {settings.loop ? "on" : "off"}</button>
      </div>

      <label className="control-field">Preset
        <select name="motion-preset" value={settings.preset} onChange={(event) => event.target.value !== "custom" && onPreset(event.target.value as Exclude<MotionPreset, "custom">)}>
          {(Object.keys(PRESET_LABELS) as MotionPreset[]).map((key) => <option key={key} value={key} disabled={key === "custom"}>{PRESET_LABELS[key]}</option>)}
        </select>
      </label>

      <label className="control-field control-range"><span>Speed <output>{settings.speed.toFixed(2)}×</output></span>
        <input name="motion-speed" type="range" min="0.25" max="2.5" step="0.05" value={settings.speed} onChange={(event) => onUpdate("speed", Number(event.target.value))} />
      </label>
      <label className="control-field control-range"><span>Rotation <output>{settings.rotation}°</output></span>
        <input name="motion-rotation" type="range" min="0" max="720" step="15" value={settings.rotation} onChange={(event) => onUpdate("rotation", Number(event.target.value))} />
      </label>
      <label className="control-field control-range"><span>Scale <output>{settings.scale.toFixed(2)}</output></span>
        <input name="motion-scale" type="range" min="0.75" max="1.3" step="0.01" value={settings.scale} onChange={(event) => onUpdate("scale", Number(event.target.value))} />
      </label>
      <label className="control-field control-range"><span>Pulse <output>{Math.round(settings.pulse * 100)}%</output></span>
        <input name="motion-pulse" type="range" min="0" max="1" step="0.05" value={settings.pulse} onChange={(event) => onUpdate("pulse", Number(event.target.value))} />
      </label>

      <div className="control-grid">
        <label className="control-field">Duration
          <span className="number-field"><input name="motion-duration" type="number" min="2" max="30" step="0.5" value={settings.duration} onChange={(event) => onUpdate("duration", Number(event.target.value))} /><small>sec</small></span>
        </label>
        <label className="control-field">Delay
          <span className="number-field"><input name="motion-delay" type="number" min="0" max="5" step="0.1" value={settings.delay} onChange={(event) => onUpdate("delay", Number(event.target.value))} /><small>sec</small></span>
        </label>
      </div>
      <label className="control-field">Easing
        <select name="motion-easing" value={settings.easing} onChange={(event) => onUpdate("easing", event.target.value as MotionEasing)}>
          <option value="easeInOut">Smooth</option><option value="linear">Linear</option><option value="circInOut">Circular</option>
        </select>
      </label>

      <div className="control-toggles">
        <button type="button" className="toggle-row" aria-pressed={settings.pointerResponse} onClick={() => onUpdate("pointerResponse", !settings.pointerResponse)}><span>Pointer response<small>Tilt follows pointer movement</small></span><i className={settings.pointerResponse ? "on" : ""} /></button>
        <button type="button" className="toggle-row" aria-pressed={settings.theme === "focus"} onClick={() => onUpdate("theme", settings.theme === "light" ? "focus" : "light")}><span><SunMoon size={15} /> Focus theme<small>{settings.theme === "focus" ? "Enabled" : "Light theme active"}</small></span><i className={settings.theme === "focus" ? "on" : ""} /></button>
      </div>
      <p className="control-help">Values are constrained automatically: speed 0.25–2.5×, duration 2–30s, delay 0–5s.</p>
    </form>
  );
}
