// Authentic Winamp 2.x classic — pixel-perfect bitmap sprite UI
import React, { useRef, useState, useEffect } from 'react';
import { useAudio } from './hooks/useAudio';
import { useSkinLoader } from './hooks/useSkinLoader';
import { PlaylistEditor } from './components/PlaylistEditor';
import { Equalizer } from './components/Equalizer';

// Render two zero-padded digits using NUMBERS.BMP sprite (cells 9x13)
const Digits: React.FC<{ value: number; pad?: number }> = ({ value, pad = 2 }) => {
  const str = String(Math.max(0, Math.floor(value))).padStart(pad, '0').slice(-pad);
  return (
    <>
      {str.split('').map((d, i) => (
        <div
          key={i}
          className="wa-digit"
          style={{ backgroundPosition: `-${parseInt(d, 10) * 9}px 0` }}
        />
      ))}
    </>
  );
};

const App: React.FC = () => {
  const {
    audioRef,
    audioState,
    loadFile,
    loadUrl,
    play,
    pause,
    stop,
    seek,
    setVolume,
  } = useAudio();

  const { loadSkin, applySkin, resetToDefaultSkin } = useSkinLoader();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const skinInputRef = useRef<HTMLInputElement>(null);

  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showEqualizer, setShowEqualizer] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  // Auto-load the classic "It really whips the llama's ass" sample on mount.
  // Served from same-origin (public/audio/llama.mp3) to avoid CORS issues.
  // Use Vite's BASE_URL so the path includes the Liliput proxy prefix.
  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}audio/llama.mp3`;
    loadUrl(url, "It really whips the llama's ass!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scrolling marquee for the song title (classic Winamp behavior)
  const baseTitle = audioState.fileName || '*** Winamp 2.x ***';
  const [scroll, setScroll] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setScroll((s) => s + 1), 220);
    return () => clearInterval(id);
  }, []);
  const padded = '   ' + baseTitle + '   ***   ';
  const cycle = padded.length > 30 ? padded : padded.padEnd(30, ' ');
  const offset = scroll % cycle.length;
  const marquee = (cycle + cycle).substring(offset, offset + 30);

  // Parse "MM:SS" current time
  const [mmStr, ssStr] = (audioState.currentTime || '00:00').split(':');
  const minutes = parseInt(mmStr, 10) || 0;
  const seconds = parseInt(ssStr, 10) || 0;

  // Spectrum bars (19 bars to fit 76px / 4px each)
  const NUM_BARS = 19;
  const renderSpectrum = () => {
    const bars: JSX.Element[] = [];
    const step = Math.max(1, Math.floor(audioState.frequencyData.length / NUM_BARS));
    for (let i = 0; i < NUM_BARS; i++) {
      const v = audioState.frequencyData[i * step] || 0;
      const h = Math.max(1, Math.round((v / 255) * 16));
      bars.push(<div key={i} className="wa-vis-bar" style={{ height: `${h}px` }} />);
    }
    return bars;
  };

  // Oscilloscope SVG path
  const renderOscilloscope = () => {
    const data = audioState.timeDomainData;
    if (!data || data.length === 0) return null;
    const step = Math.max(1, Math.floor(data.length / 76));
    const points: string[] = [];
    for (let x = 0; x < 76; x++) {
      const v = (data[x * step] ?? 128) / 128 - 1; // -1..1
      const y = 8 + v * 7;
      points.push(`${x === 0 ? 'M' : 'L'}${x},${y.toFixed(1)}`);
    }
    return (
      <svg className="wa-vis-osc" viewBox="0 0 76 16" preserveAspectRatio="none">
        <path d={points.join(' ')} stroke="#ffd400" strokeWidth="1" fill="none" />
      </svg>
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
  };
  const handleSkinSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const skin = await loadSkin(f);
      if (skin) applySkin(skin);
    }
  };

  const onPosClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    seek(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  };
  const onVolClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setVolume(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  };

  // Volume.bmp: 28 frames of 68x15 stacked vertically; pick the right one
  const volFrame = Math.min(27, Math.floor((audioState.volume / 100) * 27));
  const volumeStyle: React.CSSProperties = {
    backgroundPosition: `0 -${volFrame * 15}px`,
  };
  // Thumb position inside the 68px-wide track (thumb is 14px wide)
  const volThumbX = Math.round((audioState.volume / 100) * (68 - 14));

  // Position thumb (track 248px, thumb 29px)
  const posThumbX = Math.round((audioState.position / 100) * (248 - 29));

  // Play status indicator: stop / play / pause
  const statusClass = audioState.isPlaying
    ? 'playing'
    : audioState.isPaused
    ? 'paused'
    : 'stopped';

  return (
    <>
      <div className="winamp" id="main-window">
        <audio ref={audioRef} />
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="wa-hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={skinInputRef}
          type="file"
          accept=".wsz,image/*"
          className="wa-hidden"
          onChange={handleSkinSelect}
        />

        {/* Titlebar with active blue gradient + close/shade/min */}
        <div className="wa-titlebar">
          <div className="wa-tb-btn wa-tb-min" title="Minimize" />
          <div className="wa-tb-btn wa-tb-shade" title="Windowshade" />
          <div className="wa-tb-btn wa-tb-close" title="Close" />
        </div>

        {/* Clutterbar (decorative, baked into MAIN.BMP for cells; we leave bare) */}

        {/* Play status little square */}
        <div className={`wa-status ${statusClass}`} />

        {/* Time display: MM : SS using NUMBERS.BMP */}
        <div
          className={`wa-time ${audioState.isPaused ? 'paused' : ''}`}
          onDoubleClick={() => fileInputRef.current?.click()}
          title="Double-click to open file"
        >
          <Digits value={minutes} pad={2} />
          <div className="wa-digit-gap" />
          <Digits value={seconds} pad={2} />
        </div>

        {/* Visualization (spectrum) */}
        <div className="wa-vis" title="Click to load file" onClick={() => fileInputRef.current?.click()}>
          {renderSpectrum()}
          <div style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
            {/* Optionally overlay oscilloscope ghost */}
            {/* {renderOscilloscope()} */}
          </div>
        </div>

        {/* Song title scrolling marquee */}
        <div className="wa-songtitle">{marquee}</div>

        {/* Bitrate / kHz */}
        <div className="wa-kbps">128</div>
        <div className="wa-khz">44</div>

        {/* Mono / Stereo (stereo always on when loaded) */}
        <div className={`wa-mono ${!audioState.isLoaded ? 'on' : ''}`} />
        <div className={`wa-stereo ${audioState.isLoaded ? 'on' : ''}`} />

        {/* Volume slider (clickable track) */}
        <div className="wa-volume" style={volumeStyle} onClick={onVolClick} title="Volume">
          <div className="wa-volume-thumb" style={{ left: `${volThumbX}px` }} />
        </div>

        {/* Balance (decorative, centered) */}
        <div className="wa-balance" title="Balance">
          <div className="wa-balance-thumb" style={{ left: '12px' }} />
        </div>

        {/* EQ + PL toggle */}
        <button
          className={`wa-eq-btn ${showEqualizer ? 'on' : ''}`}
          onClick={() => setShowEqualizer((v) => !v)}
          title="Equalizer"
        />
        <button
          className={`wa-pl-btn ${showPlaylist ? 'on' : ''}`}
          onClick={() => setShowPlaylist((v) => !v)}
          title="Playlist"
        />

        {/* Position slider */}
        <div className="wa-pos" onClick={onPosClick} title="Seek">
          <div className="wa-pos-thumb" style={{ left: `${posThumbX}px` }} />
        </div>

        {/* Transport buttons */}
        <button className="wa-cbtn wa-prev"  onClick={stop} title="Previous" />
        <button className="wa-cbtn wa-play"  onClick={play} title="Play" />
        <button className="wa-cbtn wa-pause" onClick={pause} title="Pause" />
        <button className="wa-cbtn wa-stop"  onClick={stop} title="Stop" />
        <button className="wa-cbtn wa-next"  onClick={stop} title="Next" />
        <button className="wa-cbtn wa-eject" onClick={() => fileInputRef.current?.click()} title="Eject / Open File" />

        {/* Shuffle / Repeat */}
        <button
          className={`wa-shuffle ${shuffle ? 'on' : ''}`}
          onClick={() => setShuffle((v) => !v)}
          title="Shuffle"
        />
        <button
          className={`wa-repeat ${repeat ? 'on' : ''}`}
          onClick={() => setRepeat((v) => !v)}
          title="Repeat"
        />

        {/* Hidden skin loader trigger via right-click on titlebar */}
        <div
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          onContextMenu={(e) => {
            e.preventDefault();
            skinInputRef.current?.click();
          }}
        />
      </div>

      {/* Order matches classic Winamp: main window → equalizer → playlist */}
      {showEqualizer && (
        <Equalizer
          isVisible={showEqualizer}
          onClose={() => setShowEqualizer(false)}
          audioContext={null}
        />
      )}
      {showPlaylist && (
        <PlaylistEditor
          isVisible={showPlaylist}
          onClose={() => setShowPlaylist(false)}
          onLoadTrack={(entry: any) => entry?.file && loadFile(entry.file)}
        />
      )}

      {/* Toolbar buttons below for skin/file load (small classic dock) */}
      <div style={{ position: 'fixed', bottom: 8, right: 8, display: 'flex', gap: 6, zIndex: 100 }}>
        <button
          onClick={() => skinInputRef.current?.click()}
          style={{
            background: 'linear-gradient(to bottom,#5a5a5a,#2a2a2a)',
            color: '#fff',
            border: '1px outset #555',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: 'Arial,sans-serif',
          }}
        >
          Load .wsz Skin
        </button>
        <button
          onClick={resetToDefaultSkin}
          style={{
            background: 'linear-gradient(to bottom,#5a5a5a,#2a2a2a)',
            color: '#fff',
            border: '1px outset #555',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: 'Arial,sans-serif',
          }}
        >
          Reset Skin
        </button>
      </div>
    </>
  );
};

export default App;
