import React, { useState } from 'react';

interface EqualizerProps {
  isVisible: boolean;
  onClose: () => void;
  audioContext: AudioContext | null;
}

const EQ_BANDS = ['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'];

const EQ_PRESETS: Record<string, number[]> = {
  Default:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock:        [8, 4, -5, -8, -3, 4, 8, 11, 11, 11],
  Pop:         [-1, 4, 7, 8, 5, 0, -2, -2, -1, -1],
  Jazz:        [4, 2, -2, 2, -1, -1, 0, 2, 4, 6],
  Classical:   [5, 3, -2, 4, -1, -1, 0, 3, 7, 9],
  Dance:       [9, 7, 2, 0, 0, -5, -7, -7, 0, 0],
  'Full Bass': [7, 9, 9, 5, 1, -4, -8, -10, -11, -11],
  'Full Treble': [-9, -9, -9, -4, 2, 11, 16, 16, 16, 16],
};

export const Equalizer: React.FC<EqualizerProps> = ({ isVisible, onClose }) => {
  const [enabled, setEnabled] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [preamp, setPreamp] = useState(0);
  const [values, setValues] = useState<number[]>(Array(10).fill(0));
  const [preset, setPreset] = useState('Default');

  if (!isVisible) return null;

  const applyPreset = (name: string) => {
    setPreset(name);
    setValues(EQ_PRESETS[name] ?? Array(10).fill(0));
  };

  const setBand = (i: number, v: number) => {
    const next = values.slice();
    next[i] = v;
    setValues(next);
  };

  return (
    <div className="eq-window">
      <div className="eq-titlebar">
        <button className="eq-close-btn" onClick={onClose} title="Close">×</button>
      </div>

      <button
        className={`eq-on ${enabled ? 'active' : ''}`}
        onClick={() => setEnabled((v) => !v)}
        title="On/Off"
      />
      <button
        className={`eq-auto ${autoMode ? 'active' : ''}`}
        onClick={() => setAutoMode((v) => !v)}
        title="Auto"
      />

      <select
        className="eq-presets"
        value={preset}
        onChange={(e) => applyPreset(e.target.value)}
      >
        {Object.keys(EQ_PRESETS).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Preamp slider rendered to the LEFT of the bands (band 0 sentinel) */}
      <div className="eq-bands">
        <div className="eq-band" title={`Preamp: ${preamp}dB`}>
          <input
            type="range"
            min={-12}
            max={12}
            value={preamp}
            onChange={(e) => setPreamp(parseInt(e.target.value, 10))}
          />
          <div
            style={{
              position: 'absolute',
              top: 0, left: 4,
              width: 3,
              height: 64,
              background: '#222',
              border: '1px inset #555',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: 11, height: 11,
              background: 'linear-gradient(to bottom,#aaa,#444)',
              border: '1px outset #777',
              top: `${Math.round(((12 - preamp) / 24) * (64 - 11))}px`,
              pointerEvents: 'none',
            }}
          />
        </div>
        {EQ_BANDS.map((label, i) => (
          <div className="eq-band" key={label} title={`${label}Hz: ${values[i]}dB`}>
            <input
              type="range"
              min={-12}
              max={12}
              value={values[i]}
              onChange={(e) => setBand(i, parseInt(e.target.value, 10))}
            />
            <div
              style={{
                position: 'absolute',
                top: 0, left: 4,
                width: 3, height: 64,
                background: '#222',
                border: '1px inset #555',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                width: 11, height: 11,
                background: 'linear-gradient(to bottom,#aaa,#444)',
                border: '1px outset #777',
                top: `${Math.round(((12 - values[i]) / 24) * (64 - 11))}px`,
                pointerEvents: 'none',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
