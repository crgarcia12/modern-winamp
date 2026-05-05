import React, { useState } from 'react';

interface EqualizerProps {
  isVisible: boolean;
  onClose: () => void;
  audioContext: AudioContext | null;
}

const EQ_BANDS = [
  { freq: '60', label: '60' },
  { freq: '170', label: '170' },
  { freq: '310', label: '310' },
  { freq: '600', label: '600' },
  { freq: '1K', label: '1K' },
  { freq: '3K', label: '3K' },
  { freq: '6K', label: '6K' },
  { freq: '12K', label: '12K' },
  { freq: '14K', label: '14K' },
  { freq: '16K', label: '16K' }
];

const EQ_PRESETS = [
  { name: 'Default', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Rock', values: [8, 4, -5, -8, -3, 4, 8, 11, 11, 11] },
  { name: 'Pop', values: [-1, 4, 7, 8, 5, 0, -2, -2, -1, -1] },
  { name: 'Jazz', values: [4, 2, -2, 2, -1, -1, 0, 2, 4, 6] },
  { name: 'Classical', values: [5, 3, -2, 4, -1, -1, 0, 3, 7, 9] },
  { name: 'Dance', values: [9, 7, 2, 0, 0, -5, -7, -7, 0, 0] },
  { name: 'Full Bass', values: [7, 9, 9, 5, 1, -4, -8, -10, -11, -11] },
  { name: 'Full Treble', values: [-9, -9, -9, -4, 2, 11, 16, 16, 16, 16] }
];

export const Equalizer: React.FC<EqualizerProps> = ({ 
  isVisible, 
  onClose, 
  audioContext 
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [preamp, setPreamp] = useState(0);
  const [bandValues, setBandValues] = useState(Array(10).fill(0));
  const [selectedPreset, setSelectedPreset] = useState('Default');
  const [autoMode, setAutoMode] = useState(false);

  const updateBand = (index: number, value: number) => {
    const newValues = [...bandValues];
    newValues[index] = value;
    setBandValues(newValues);
  };

  const applyPreset = (presetName: string) => {
    const preset = EQ_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setBandValues([...preset.values]);
      setSelectedPreset(presetName);
    }
  };

  const resetEQ = () => {
    setBandValues(Array(10).fill(0));
    setPreamp(0);
    setSelectedPreset('Default');
  };

  if (!isVisible) return null;

  return (
    <div className="equalizer-window">
      {/* EQ Header */}
      <div className="eq-header">
        <span className="eq-title">Winamp Equalizer</span>
        <div className="eq-controls">
          <button className="eq-btn" onClick={onClose}>×</button>
        </div>
      </div>

      {/* Main Controls */}
      <div className="eq-main-controls">
        <button 
          className={`eq-power-btn ${isEnabled ? 'enabled' : ''}`}
          onClick={() => setIsEnabled(!isEnabled)}
        >
          ON
        </button>
        <button 
          className={`eq-auto-btn ${autoMode ? 'enabled' : ''}`}
          onClick={() => setAutoMode(!autoMode)}
        >
          AUTO
        </button>
        <select 
          className="eq-preset-select"
          value={selectedPreset}
          onChange={(e) => applyPreset(e.target.value)}
        >
          {EQ_PRESETS.map(preset => (
            <option key={preset.name} value={preset.name}>
              {preset.name}
            </option>
          ))}
        </select>
        <button className="eq-reset-btn" onClick={resetEQ}>
          Reset
        </button>
      </div>

      {/* Preamp */}
      <div className="eq-preamp-section">
        <label>Preamp</label>
        <input
          type="range"
          min="-20"
          max="20"
          value={preamp}
          onChange={(e) => setPreamp(Number(e.target.value))}
          className="eq-preamp-slider"
          orient="vertical"
        />
        <span className="eq-value">{preamp > 0 ? '+' : ''}{preamp}</span>
      </div>

      {/* EQ Bands */}
      <div className="eq-bands">
        {EQ_BANDS.map((band, index) => (
          <div key={band.freq} className="eq-band">
            <input
              type="range"
              min="-20"
              max="20"
              value={bandValues[index]}
              onChange={(e) => updateBand(index, Number(e.target.value))}
              className="eq-band-slider"
              orient="vertical"
            />
            <span className="eq-band-value">
              {bandValues[index] > 0 ? '+' : ''}{bandValues[index]}
            </span>
            <label className="eq-band-label">{band.label}</label>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="eq-status">
        EQ {isEnabled ? 'ENABLED' : 'DISABLED'} • Preset: {selectedPreset}
      </div>
    </div>
  );
};