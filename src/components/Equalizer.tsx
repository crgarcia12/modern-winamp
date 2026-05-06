import React, { useEffect, useState } from 'react';

interface EqualizerProps {
  isVisible: boolean;
  onClose: () => void;
  onEnabledChange: (enabled: boolean) => void;
  onBandChange: (index: number, db: number) => void;
  onPreampChange: (db: number) => void;
  onValuesChange: (values: number[]) => void;
}

const EQ_BANDS = ['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'];

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

const TRACK_HEIGHT = 64;
const THUMB_HEIGHT = 11;
// Range is ±20 dB to give the user audible headroom.
const MAX_DB = 20;

const dbToY = (db: number) =>
  Math.round(((MAX_DB - db) / (MAX_DB * 2)) * (TRACK_HEIGHT - THUMB_HEIGHT));

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
      <div className="eq-titlebar">
        <div className="eq-title-text">EQUALIZER</div>
        <button className="eq-close-btn" onClick={onClose} title="Close">×</button>
      </div>

      <button
        className={`eq-toggle eq-on ${enabled ? 'active' : ''}`}
        onClick={toggleEnabled}
        title="EQ On/Off"
      >ON</button>
      <button
        className={`eq-toggle eq-auto ${autoMode ? 'active' : ''}`}
        onClick={() => setAutoMode((v) => !v)}
        title="Auto"
      >AUTO</button>

      <select
        className="eq-presets"
        value={preset}
        onChange={(e) => applyPreset(e.target.value)}
      >
        {Object.keys(EQ_PRESETS).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
        {preset === 'Custom' && <option value="Custom">Custom</option>}
      </select>

      <div className="eq-bands">
        {/* Preamp slider */}
        <div className="eq-band eq-preamp" title={`Preamp: ${preamp}dB`}>
          <div className="eq-band-label">PRE</div>
          <div className="eq-slot">
            <div className="eq-track" />
            <div className="eq-zero-line" />
            <input
              type="range"
              min={-MAX_DB}
              max={MAX_DB}
              step={1}
              value={preamp}
              onChange={(e) => updatePreamp(parseInt(e.target.value, 10))}
            />
            <div
              className="eq-thumb"
              style={{ top: `${dbToY(preamp)}px` }}
            />
          </div>
          <div className="eq-band-value">{preamp > 0 ? `+${preamp}` : preamp}</div>
        </div>

        {EQ_BANDS.map((label, i) => (
          <div className="eq-band" key={label} title={`${label}Hz: ${values[i]}dB`}>
            <div className="eq-band-label">{label}</div>
            <div className="eq-slot">
              <div className="eq-track" />
              <div className="eq-zero-line" />
              <input
                type="range"
                min={-MAX_DB}
                max={MAX_DB}
                step={1}
                value={values[i]}
                onChange={(e) => setBand(i, parseInt(e.target.value, 10))}
              />
              <div
                className="eq-thumb"
                style={{ top: `${dbToY(values[i])}px` }}
              />
            </div>
            <div className="eq-band-value">{values[i] > 0 ? `+${values[i]}` : values[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
