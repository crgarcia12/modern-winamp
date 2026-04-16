'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './WinampPlayer.module.css';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
}

type PlayState = 'stopped' | 'playing' | 'paused';

export default function WinampPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playState, setPlayState] = useState<PlayState>('stopped');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [balance, setBalance] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showEq, setShowEq] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [marqueeOffset, setMarqueeOffset] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  const currentTrack = tracks[currentTrackIndex] || null;

  // Fetch tracks
  useEffect(() => {
    fetch('/api/tracks')
      .then((res) => res.json())
      .then((data: Track[]) => setTracks(data))
      .catch(() => {});
  }, []);

  // Setup Web Audio graph
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return;

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    sourceNodeRef.current = source;
    gainRef.current = gain;
    pannerRef.current = panner;

    gain.gain.value = volume / 100;
    panner.pan.value = balance / 100;
  }, [volume, balance]);

  // Update volume
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume / 100;
    }
    if (audioRef.current && !audioContextRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Update balance
  useEffect(() => {
    if (pannerRef.current) {
      pannerRef.current.pan.value = balance / 100;
    }
  }, [balance]);

  // Marquee scrolling for track title
  useEffect(() => {
    if (playState !== 'playing' || !currentTrack) return;
    const interval = setInterval(() => {
      setMarqueeOffset((prev) => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [playState, currentTrack]);

  // Spectrum visualizer
  useEffect(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const y = canvas.height - barHeight;

        // Winamp-style gradient: green bottom, yellow middle, red top
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#00cc00');
        gradient.addColorStop(0.5, '#cccc00');
        gradient.addColorStop(1, '#cc0000');
        ctx.fillStyle = gradient;

        ctx.fillRect(x, y, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    if (playState === 'playing') {
      draw();
    } else {
      cancelAnimationFrame(animFrameRef.current);
      if (playState === 'stopped') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playState]);

  // Time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeat, currentTrackIndex, tracks]);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    initAudioContext();
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (playState === 'stopped') {
      audio.src = `/api/tracks/${tracks[currentTrackIndex].id}/stream`;
      audio.load();
    }

    audio.play().then(() => setPlayState('playing')).catch(() => {});
  }, [tracks, currentTrackIndex, playState, initAudioContext]);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    setPlayState('paused');
  }, []);

  const handleStop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlayState('stopped');
    setCurrentTime(0);
  }, []);

  const handlePrev = useCallback(() => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
    setCurrentTrackIndex(newIndex);
    if (playState === 'playing' && audio) {
      audio.src = `/api/tracks/${tracks[newIndex].id}/stream`;
      audio.load();
      audio.play().catch(() => {});
    }
  }, [tracks, currentTrackIndex, playState]);

  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    let newIndex: number;
    if (shuffle) {
      newIndex = Math.floor(Math.random() * tracks.length);
    } else {
      newIndex = currentTrackIndex < tracks.length - 1 ? currentTrackIndex + 1 : 0;
    }
    setCurrentTrackIndex(newIndex);
    const audio = audioRef.current;
    if (playState === 'playing' && audio) {
      audio.src = `/api/tracks/${tracks[newIndex].id}/stream`;
      audio.load();
      audio.play().catch(() => {});
    }
  }, [tracks, currentTrackIndex, playState, shuffle]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    const audio = audioRef.current;
    if (audio) {
      initAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audio.src = `/api/tracks/${tracks[index].id}/stream`;
      audio.load();
      audio.play().then(() => setPlayState('playing')).catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getMarqueeText = () => {
    if (!currentTrack) return 'Winamp - Not Playing';
    const text = `${currentTrack.artist} - ${currentTrack.title}  ***  `;
    const repeated = text + text;
    const offset = marqueeOffset % text.length;
    return repeated.substring(offset, offset + 40);
  };

  return (
    <div className={styles.winampContainer}>
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />

      {/* Main Window */}
      <div className={styles.mainWindow}>
        {/* Title Bar */}
        <div className={styles.titleBar}>
          <span className={styles.titleText}>
            {playState === 'playing' ? '▶' : playState === 'paused' ? '❚❚' : '■'} Winamp
          </span>
          <div className={styles.titleButtons}>
            <button className={styles.titleBtn}>_</button>
            <button className={styles.titleBtn}>□</button>
            <button className={styles.titleBtn}>×</button>
          </div>
        </div>

        {/* Display Section */}
        <div className={styles.displaySection}>
          <div className={styles.displayPanel}>
            {/* Left side: visualizer + time */}
            <div className={styles.displayLeft}>
              <canvas
                ref={canvasRef}
                width={150}
                height={32}
                className={styles.visualizer}
              />
              <div className={styles.timeDisplay}>
                <span className={styles.timeText}>{formatTime(currentTime)}</span>
              </div>
            </div>

            {/* Right side: info */}
            <div className={styles.displayRight}>
              <div className={styles.marquee}>
                <span className={styles.marqueeText}>{getMarqueeText()}</span>
              </div>
              <div className={styles.trackInfo}>
                <span className={styles.infoItem}>{currentTrack?.bitrate || '---'} kbps</span>
                <span className={styles.infoItem}>{currentTrack ? `${currentTrack.sampleRate / 1000}` : '--'} kHz</span>
                <span className={styles.infoItem}>{currentTrack?.channels === 2 ? 'stereo' : currentTrack?.channels === 1 ? 'mono' : '---'}</span>
              </div>
            </div>
          </div>

          {/* Seek Bar */}
          <div className={styles.seekBarContainer}>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className={styles.seekBar}
            />
          </div>
        </div>

        {/* Controls Section */}
        <div className={styles.controlsSection}>
          {/* Transport Controls */}
          <div className={styles.transportControls}>
            <button onClick={handlePrev} className={styles.transportBtn} title="Previous">
              <span className={styles.transportIcon}>⏮</span>
            </button>
            <button onClick={handlePlay} className={`${styles.transportBtn} ${playState === 'playing' ? styles.active : ''}`} title="Play">
              <span className={styles.transportIcon}>▶</span>
            </button>
            <button onClick={handlePause} className={`${styles.transportBtn} ${playState === 'paused' ? styles.active : ''}`} title="Pause">
              <span className={styles.transportIcon}>⏸</span>
            </button>
            <button onClick={handleStop} className={`${styles.transportBtn} ${playState === 'stopped' ? styles.active : ''}`} title="Stop">
              <span className={styles.transportIcon}>⏹</span>
            </button>
            <button onClick={handleNext} className={styles.transportBtn} title="Next">
              <span className={styles.transportIcon}>⏭</span>
            </button>
          </div>

          {/* Volume & Balance */}
          <div className={styles.slidersSection}>
            <div className={styles.sliderGroup}>
              <label className={styles.sliderLabel}>VOL</label>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className={styles.volumeSlider}
              />
            </div>
            <div className={styles.sliderGroup}>
              <label className={styles.sliderLabel}>BAL</label>
              <input
                type="range"
                min={-100}
                max={100}
                value={balance}
                onChange={(e) => setBalance(parseInt(e.target.value))}
                className={styles.balanceSlider}
              />
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className={styles.toggleSection}>
            <button
              onClick={() => setShowEq(!showEq)}
              className={`${styles.toggleBtn} ${showEq ? styles.toggleActive : ''}`}
            >
              EQ
            </button>
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`${styles.toggleBtn} ${showPlaylist ? styles.toggleActive : ''}`}
            >
              PL
            </button>
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`${styles.toggleBtn} ${shuffle ? styles.toggleActive : ''}`}
            >
              S
            </button>
            <button
              onClick={() => setRepeat(!repeat)}
              className={`${styles.toggleBtn} ${repeat ? styles.toggleActive : ''}`}
            >
              R
            </button>
          </div>
        </div>
      </div>

      {/* Equalizer Window (placeholder) */}
      {showEq && (
        <div className={styles.eqWindow}>
          <div className={styles.eqTitleBar}>
            <span className={styles.eqTitle}>Winamp Equalizer</span>
            <button onClick={() => setShowEq(false)} className={styles.titleBtn}>×</button>
          </div>
          <div className={styles.eqContent}>
            <div className={styles.eqToggle}>
              <span className={styles.eqLabel}>ON</span>
            </div>
            <div className={styles.eqSliders}>
              {['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'].map((freq) => (
                <div key={freq} className={styles.eqBand}>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    defaultValue={0}
                    className={styles.eqSlider}
                  />
                  <span className={styles.eqFreq}>{freq}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Playlist Window */}
      {showPlaylist && (
        <div className={styles.playlistWindow}>
          <div className={styles.playlistTitleBar}>
            <span className={styles.playlistTitle}>Winamp Playlist Editor</span>
            <button onClick={() => setShowPlaylist(false)} className={styles.titleBtn}>×</button>
          </div>
          <div className={styles.playlistContent}>
            {tracks.length === 0 ? (
              <div className={styles.playlistEmpty}>No tracks loaded</div>
            ) : (
              <ul className={styles.playlistList}>
                {tracks.map((track, index) => (
                  <li
                    key={track.id}
                    className={`${styles.playlistItem} ${index === currentTrackIndex ? styles.playlistItemActive : ''}`}
                    onDoubleClick={() => handleTrackSelect(index)}
                  >
                    <span className={styles.playlistNumber}>{index + 1}.</span>
                    <span className={styles.playlistTrackName}>
                      {track.artist} - {track.title}
                    </span>
                    <span className={styles.playlistDuration}>{formatTime(track.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.playlistFooter}>
            <span className={styles.playlistInfo}>
              {tracks.length} track{tracks.length !== 1 ? 's' : ''} / {formatTime(tracks.reduce((sum, t) => sum + t.duration, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
