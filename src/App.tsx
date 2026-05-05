// Enhanced Winamp v2.0 - Real Audio Engine & Skin Support
import React, { useRef } from 'react';
import { useAudio } from './hooks/useAudio';
import { useSkinLoader } from './hooks/useSkinLoader';

const App: React.FC = () => {
  const {
    audioRef,
    audioState,
    loadFile,
    play,
    pause,
    stop,
    seek,
    setVolume
  } = useAudio();

  const {
    loadSkin,
    applySkin,
    resetToDefaultSkin
  } = useSkinLoader();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const skinInputRef = useRef<HTMLInputElement>(null);

  // Scrolling title effect for filename
  const [scrollingTitle, setScrollingTitle] = React.useState('***** WINAMP 5.666 ***** ');

  React.useEffect(() => {
    const fullTitle = audioState.fileName.length > 30 ? audioState.fileName : audioState.fileName + ' '.repeat(30);
    let scrollIndex = 0;
    
    const scrollInterval = setInterval(() => {
      setScrollingTitle(fullTitle.substring(scrollIndex, scrollIndex + 30));
      scrollIndex = (scrollIndex + 1) % fullTitle.length;
    }, 300);

    return () => clearInterval(scrollInterval);
  }, [audioState.fileName]);

  // Event handlers using new audio engine
  const handleFileOpen = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  const handleSkinOpen = () => {
    skinInputRef.current?.click();
  };

  const handleSkinSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const skin = await loadSkin(file);
      if (skin) {
        applySkin(skin);
      }
    }
  };

  const handleVolumeChange = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const newVolume = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    setVolume(newVolume);
  };

  const handlePositionChange = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const newPosition = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    seek(newPosition);
  };

  // Generate real spectrum visualization from audio data
  const renderSpectrum = () => {
    const bars = [];
    const dataStep = Math.floor(audioState.frequencyData.length / 20);
    
    for (let i = 0; i < 20; i++) {
      const value = audioState.frequencyData[i * dataStep] || 0;
      const height = Math.max(1, (value / 255) * 16);
      bars.push(
        <div
          key={i}
          className="winamp-spectrum-bar"
          style={{
            height: `${height}px`,
            background: height > 8 
              ? 'linear-gradient(to bottom, #ff0000 0%, #ff6600 50%, #ffff00 100%)'
              : 'linear-gradient(to bottom, #00ff41 0%, #00aa00 100%)'
          }}
        />
      );
    }
    return bars;
  };

  // Generate real oscilloscope visualization
  const renderOscilloscope = () => {
    if (audioState.timeDomainData.length === 0) {
      return null;
    }

    const points = [];
    const sliceWidth = 76 / audioState.timeDomainData.length;
    let x = 0;

    for (let i = 0; i < audioState.timeDomainData.length; i++) {
      const v = audioState.timeDomainData[i] / 128.0;
      const y = v * 8;
      
      if (i === 0) {
        points.push(`M${x},${y + 8}`);
      } else {
        points.push(`L${x},${y + 8}`);
      }
      x += sliceWidth;
    }

    return (
      <svg width="76" height="16" style={{ position: 'absolute', top: 0, left: 0 }}>
        <path
          d={points.join(' ')}
          stroke="#00ff41"
          strokeWidth="1"
          fill="none"
          style={{ filter: 'drop-shadow(0 0 2px #00ff41)' }}
        />
      </svg>
    );
  };

  return (
    <div className="winamp">
      {/* Hidden audio element */}
      <audio ref={audioRef} />
      
      {/* File inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={skinInputRef}
        type="file"
        accept=".wsz,image/*"
        style={{ display: 'none' }}
        onChange={handleSkinSelect}
      />
      
      {/* Title Bar */}
      <div className="winamp-titlebar">
        <span className="winamp-title">Winamp</span>
        <div className="winamp-close">×</div>
      </div>

      {/* Display */}
      <div className="winamp-display">
        {/* Spectrum Analyzer with real data */}
        <div className="winamp-spectrum">
          {renderSpectrum()}
        </div>

        <div className="winamp-time">{audioState.currentTime}</div>

        {/* Oscilloscope with real data */}
        <div className="winamp-oscilloscope">
          {renderOscilloscope()}
        </div>

        <div className="winamp-song-info">{scrollingTitle.substring(0, 25)}</div>
        <div className="winamp-kbps">
          {audioState.isLoaded ? `${audioState.duration} • stereo` : '128 kbps • 44 kHz • stereo'}
        </div>
      </div>

      {/* Controls */}
      <div className="winamp-controls">
        <button className="winamp-button" onClick={stop} title="Previous">❮❮</button>
        <button 
          className="winamp-button" 
          onClick={play} 
          title="Play"
          disabled={!audioState.isLoaded}
        >
          ▶
        </button>
        <button 
          className="winamp-button" 
          onClick={pause} 
          title="Pause"
          disabled={!audioState.isPlaying}
        >
          ⏸
        </button>
        <button className="winamp-button" onClick={stop} title="Stop">⏹</button>
        <button className="winamp-button" onClick={stop} title="Next">❯❯</button>
        
        <button className="winamp-button" onClick={handleFileOpen} title="Open File">📁</button>
        <button className="winamp-button" onClick={handleSkinOpen} title="Load Skin">🎨</button>
        <button className="winamp-button" onClick={resetToDefaultSkin} title="Reset Skin">🔄</button>
      </div>

      {/* Position Slider */}
      <div className="winamp-position">
        <div className="winamp-slider" onClick={handlePositionChange}>
          <div className="winamp-slider-track"></div>
          <div 
            className="winamp-slider-thumb" 
            style={{ left: `${Math.max(0, audioState.position - 2)}%` }}
          ></div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="winamp-bottom">
        <div className="winamp-volume">
          <span style={{ fontSize: '8px', color: '#ddd' }}>Volume:</span>
          <div className="winamp-volume-slider" onClick={handleVolumeChange}>
            <div className="winamp-slider-track"></div>
            <div 
              className="winamp-slider-thumb" 
              style={{ left: `${Math.max(0, audioState.volume - 2)}%` }}
            ></div>
          </div>
        </div>

        <div className="winamp-mono-stereo">
          {audioState.isLoaded ? 'STEREO' : 'STEREO'}
        </div>

        <div className="winamp-eq-pl">
          <button className="winamp-eq" title="Equalizer">EQ</button>
          <button className="winamp-pl" title="Playlist">PL</button>
        </div>
      </div>
    </div>
  );
};

export default App;