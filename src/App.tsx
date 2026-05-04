import React, { useState, useEffect, useRef } from 'react';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('00:00');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [position, setPosition] = useState(0);
  const [songTitle, setSongTitle] = useState('***** WINAMP 5.666 ***** ');
  const [scrollingTitle, setScrollingTitle] = useState('***** WINAMP 5.666 ***** ');
  const [isPaused, setIsPaused] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scrolling title effect
  useEffect(() => {
    const fullTitle = songTitle.length > 30 ? songTitle : songTitle + ' '.repeat(30);
    let scrollIndex = 0;
    
    const scrollInterval = setInterval(() => {
      setScrollingTitle(fullTitle.substring(scrollIndex, scrollIndex + 30));
      scrollIndex = (scrollIndex + 1) % fullTitle.length;
    }, 300);

    return () => clearInterval(scrollInterval);
  }, [songTitle]);

  // Animation effect for visualizations
  useEffect(() => {
    if (isPlaying && !isPaused) {
      const animationInterval = setInterval(() => {
        // This will trigger re-renders for animation
        setPosition(prev => prev);
      }, 100);
      
      return () => clearInterval(animationInterval);
    }
  }, [isPlaying, isPaused]);

  // Timer effect
  useEffect(() => {
    if (isPlaying && !isPaused) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          const [min, sec] = prev.split(':').map(Number);
          const totalSeconds = min * 60 + sec + 1;
          const newMin = Math.floor(totalSeconds / 60);
          const newSec = totalSeconds % 60;
          return `${newMin.toString().padStart(2, '0')}:${newSec.toString().padStart(2, '0')}`;
        });
        setPosition(prev => {
          const newPos = prev + (100/180); // Assuming 3-minute song
          return newPos >= 100 ? 100 : newPos;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, isPaused]);

  const handlePlay = () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime('00:00');
    setPosition(0);
  };

  const handlePrev = () => {
    setCurrentTime('00:00');
    setPosition(0);
    setSongTitle('***** PREVIOUS TRACK *****');
    setTimeout(() => setSongTitle('***** WINAMP 5.666 ***** '), 2000);
  };

  const handleNext = () => {
    setCurrentTime('00:00');
    setPosition(0);
    setSongTitle('***** NEXT TRACK *****');
    setTimeout(() => setSongTitle('***** WINAMP 5.666 ***** '), 2000);
  };

  const handleFileOpen = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setSongTitle(`♫ ${fileName.toUpperCase()} ♫`);
      setCurrentTime('00:00');
      setPosition(0);
      setIsPlaying(false);
      setIsPaused(false);
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
    setPosition(newPosition);
    
    // Update time based on position (assuming 3-minute song)
    const totalSeconds = Math.floor((newPosition / 100) * 180);
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    setCurrentTime(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`);
  };

  return (
    <div className="winamp">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      {/* Title Bar */}
      <div className="winamp-titlebar">
        <span className="winamp-title">Winamp</span>
        <div className="winamp-close">×</div>
      </div>

      {/* Display */}
      <div className="winamp-display">
        {/* Spectrum Analyzer */}
        <div className="winamp-spectrum">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="winamp-spectrum-bar"
              style={{
                height: isPlaying && !isPaused 
                  ? `${Math.random() * 16}px` 
                  : '1px',
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>

        <div className="winamp-time">{currentTime}</div>

        {/* Oscilloscope */}
        <div className="winamp-oscilloscope">
          <div 
            className="winamp-oscilloscope-line" 
            style={{
              transform: isPlaying && !isPaused 
                ? `scaleY(${Math.sin(Date.now() * 0.01) * 0.5 + 1})` 
                : 'scaleY(0.1)'
            }}
          />
        </div>

        <div className="winamp-song-info">{scrollingTitle.substring(0, 25)}</div>
        <div className="winamp-kbps">128 kbps • 44 kHz • stereo</div>
      </div>

      {/* Controls */}
      <div className="winamp-controls">
        <button className="winamp-button" onClick={handlePrev} title="Previous">❮❮</button>
        <button className="winamp-button" onClick={handlePlay} title="Play">▶</button>
        <button className="winamp-button" onClick={handlePause} title="Pause">⏸</button>
        <button className="winamp-button" onClick={handleStop} title="Stop">⏹</button>
        <button className="winamp-button" onClick={handleNext} title="Next">❯❯</button>
        
        <button className="winamp-button" onClick={handleFileOpen} title="Open File">📁</button>
        <button 
          className="winamp-button" 
          onClick={() => setShuffle(!shuffle)} 
          title="Shuffle"
          style={{ background: shuffle ? '#ffff80' : undefined }}
        >
          🔀
        </button>
        <button 
          className="winamp-button" 
          onClick={() => setRepeat(!repeat)} 
          title="Repeat"
          style={{ background: repeat ? '#ffff80' : undefined }}
        >
          🔁
        </button>
      </div>

      {/* Position Slider */}
      <div className="winamp-position">
        <div className="winamp-slider" onClick={handlePositionChange}>
          <div className="winamp-slider-track"></div>
          <div 
            className="winamp-slider-thumb" 
            style={{ left: `${Math.max(0, position - 2)}%` }}
          ></div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="winamp-bottom">
        <div className="winamp-volume">
          <span style={{ fontSize: '8px', color: '#000' }}>Volume:</span>
          <div className="winamp-volume-slider" onClick={handleVolumeChange}>
            <div className="winamp-slider-track"></div>
            <div 
              className="winamp-slider-thumb" 
              style={{ left: `${Math.max(0, volume - 2)}%` }}
            ></div>
          </div>
        </div>

        <div className="winamp-mono-stereo">STEREO</div>

        <div className="winamp-eq-pl">
          <button className="winamp-eq" title="Equalizer">EQ</button>
          <button className="winamp-pl" title="Playlist">PL</button>
        </div>
      </div>
    </div>
  );
};

export default App;