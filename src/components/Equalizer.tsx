import React, { useEffect, useState } from 'react';

interface EqualizerProps {
  isVisible: boolean;
  onClose: () => void;
  onEnabledChange: (enabled: boolean) => void;
  onBandChange: (index: number, db: number) => void;
  onPreampChange: (db: number) => void;
  onValuesChange: (values: number[]) => void;
}

// Classic Winamp EQ has 10 bands at these center frequencies:
const EQ_BANDS = ['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'];

// X position (in 275-px window coords) of the centre of each slider thumb.
// Preamp is the leftmost. The 10 bands are evenly spaced starting at x=78.
const SLIDER_X = [21, 78, 96, 114, 132, 150, 168, 186, 204, 222, 240];

const EQ_PRESETS: Record<string, number[]> = {
  Default:       [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock:          [8, 4, -5, -8, -3, 4, 8, 11, 11, 11],
  Pop:           [-1, 4, 7, 8, 5, 0, -2, -2, -1, -1],
  Jazz:          [4, 2, -2, 2, -1, -1, 0, 2, 4, 6],
  Classical:     [5, 3, -2, 4, -1, -1, 0, 3, 7, 9],
  Dance:         [9, 7, 2, 0, 0, -5, -7, -7, 0, 0],
  'Full Bass':   [7, 9, 9, 5, 1, -4, -8, -10, -11, -11],
  'Full Treble': [-9, -9, -9, -4, 2, 11, 16, 16, 16, 16],
};

// Slider thumb dimensions (sprite from Eqmain.bmp)
const THUMB_H = 11;
// Vertical pixel range the thumb top can occupy (top of trough → bottom of trough)
const TRACK_TOP = 38;
const TRACK_BOTTOM = 89; // thumb top max → -20 dB
const TRACK_RANGE = TRACK_BOTTOM - TRACK_TOP; // 51 px
const MAX_DB = 20;

// Map dB → thumb top (in window pixels). +20 dB = top, -20 dB = bottom.
const dbToTop = (db: number) =>
  TRACK_TOP + Math.round(((MAX_DB - db) / (MAX_DB * 2)) * TRACK_RANGE);

// Map mouse Y (relative to slider area top) → dB.
const yToDb = (y: number) => {
  const clamped = Math.max(0, Math.min(TRACK_RANGE, y));
  const db = MAX_DB - (clamped / TRACK_RANGE) * (MAX_DB * 2);
  return Math.round(db);
};

interface SliderProps {
  x: number;
  value: number;
  onChange: (db: number) => void;
}

const Slider: React.FC<SliderProps> = ({ x, value, onChange }) => {
  const [pressed, setPressed] = useState(false);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setPressed(true);
    const slot = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const update = (clientY: number) => {
      // The slot starts where TRACK_TOP is; convert client y to internal y.
      onChange(yToDb(clientY - slot.top));
    };
    update(e.clientY);
    const move = (ev: MouseEvent) => update(ev.clientY);
    const up = () => {
      setPressed(false);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // Double-click resets to 0 dB
  const onDouble = () => onChange(0);

  return (
    <div
      className="eq-slot"
      style={{ left: `${x - 7}px`, top: `${TRACK_TOP}px` }}
      onMouseDown={startDrag}
      onDoubleClick={onDouble}
    >
      <div
        className={`eq-thumb ${pressed ? 'pressed' : ''}`}
        style={{ top: `${dbToTop(value) - TRACK_TOP}px` }}
      />
    </div>
  );
};

export const Equalizer: React.FC<EqualizerProps> = ({
  isVisible,
  onClose,
  onEnabledChange,
  onBandChange,
  onPreampChange,
  onValuesChange,
}) => {
  const [enabled, setEnabled] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [preamp, setPreamp] = useState(0);
  const [values, setValues] = useState<number[]>(Array(10).fill(0));
  const [preset, setPreset] = useState('Default');

  // Push initial state on mount so the audio chain matches the UI.
  useEffect(() => {
    onEnabledChange(enabled);
    onPreampChange(preamp);
    onValuesChange(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isVisible) return null;

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    onEnabledChange(next);
  };

  const applyPreset = (name: string) => {
    setPreset(name);
    const next = EQ_PRESETS[name] ?? Array(10).fill(0);
    setValues(next);
    onValuesChange(next);
  };

  const setBand = (i: number, v: number) => {
    const next = values.slice();
    next[i] = v;
    setValues(next);
    setPreset('Custom');
    onBandChange(i, v);
  };

  const updatePreamp = (v: number) => {
    setPreamp(v);
    onPreampChange(v);
  };

  return (
    <div className="eq-window">
      {/* Drag handle over the title region (titlebar art is baked in) */}
      <div className="eq-titlebar" title="Equalizer" />

      {/* Close button overlay (sprite art baked into bg) */}
      <button className="eq-close-btn" onClick={onClose} title="Close" />

      {/* ON / AUTO toggle overlays — when active, show the lit "ON"/"AUTO" sprite */}
      <button
        className={`eq-on ${enabled ? 'active' : ''}`}
        onClick={toggleEnabled}
        title="EQ On/Off"
        aria-label="EQ On/Off"
      />
      <button
        className={`eq-auto ${autoMode ? 'active' : ''}`}
        onClick={() => setAutoMode((v) => !v)}
        title="Auto"
        aria-label="Auto"
      />

      {/* Presets dropdown — sits over the "PRESETS" button baked in the bg.
          We render a transparent native select so the menu is fully native. */}
      <select
        className="eq-presets"
        value={preset}
        onChange={(e) => applyPreset(e.target.value)}
        title="Presets"
      >
        {Object.keys(EQ_PRESETS).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
        {preset === 'Custom' && <option value="Custom">Custom</option>}
      </select>

      {/* 11 sliders (preamp + 10 bands) positioned absolutely over the troughs */}
      <Slider x={SLIDER_X[0]} value={preamp} onChange={updatePreamp} />
      {EQ_BANDS.map((label, i) => (
        <Slider
          key={label}
          x={SLIDER_X[i + 1]}
          value={values[i]}
          onChange={(v) => setBand(i, v)}
        />
      ))}
    </div>
  );
};
