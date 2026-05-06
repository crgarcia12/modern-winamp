import { useState, useRef, useEffect, useCallback } from 'react';

export interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: string;
  duration: string;
  position: number; // 0-100
  volume: number; // 0-100
  fileName: string;
  isLoaded: boolean;
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
}

// 10-band ISO-style frequencies, matching the labels shown in the EQ window.
export const EQ_FREQUENCIES = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number>();

  // EQ chain: preamp gain → 10 peaking biquads → analyser → destination.
  // We keep refs for the nodes plus shadow values so we can re-apply when
  // the chain is finally constructed (audio context is created lazily on play).
  const preampRef = useRef<GainNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const eqEnabledRef = useRef(false);
  const eqValuesRef = useRef<number[]>(Array(10).fill(0));
  const eqPreampRef = useRef(0);

  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isPaused: false,
    currentTime: '00:00',
    duration: '00:00',
    position: 0,
    volume: 75,
    fileName: '***** WINAMP 5.666 ***** ',
    isLoaded: false,
    frequencyData: new Uint8Array(256),
    timeDomainData: new Uint8Array(256)
  });

  // Initialize audio context and analyzer
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current && audioRef.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
        analyzerRef.current = ctx.createAnalyser();
        analyzerRef.current.fftSize = 512;
        analyzerRef.current.smoothingTimeConstant = 0.8;

        if (!sourceRef.current) {
          sourceRef.current = ctx.createMediaElementSource(audioRef.current);

          // Build EQ chain
          const preamp = ctx.createGain();
          preamp.gain.value = dbToGain(eqPreampRef.current, eqEnabledRef.current);
          preampRef.current = preamp;

          const filters: BiquadFilterNode[] = EQ_FREQUENCIES.map((freq, i) => {
            const f = ctx.createBiquadFilter();
            f.type = 'peaking';
            f.frequency.value = freq;
            f.Q.value = 1.0;
            f.gain.value = eqEnabledRef.current ? eqValuesRef.current[i] : 0;
            return f;
          });
          eqFiltersRef.current = filters;

          // source -> preamp -> f0 -> f1 -> ... -> analyser -> destination
          sourceRef.current.connect(preamp);
          let prev: AudioNode = preamp;
          for (const f of filters) {
            prev.connect(f);
            prev = f;
          }
          prev.connect(analyzerRef.current);
          analyzerRef.current.connect(ctx.destination);
        }
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    }
  }, []);

  // Format time helper
  const formatTime = (time: number): string => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Animation loop for frequency data
  const updateAnalyzer = useCallback(() => {
    if (analyzerRef.current && audioState.isPlaying && !audioState.isPaused) {
      const frequencyData = new Uint8Array(analyzerRef.current.frequencyBinCount);
      const timeDomainData = new Uint8Array(analyzerRef.current.frequencyBinCount);
      
      analyzerRef.current.getByteFrequencyData(frequencyData);
      analyzerRef.current.getByteTimeDomainData(timeDomainData);
      
      setAudioState(prev => ({
        ...prev,
        frequencyData,
        timeDomainData
      }));
    }
    animationRef.current = requestAnimationFrame(updateAnalyzer);
  }, [audioState.isPlaying, audioState.isPaused]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioState(prev => ({
        ...prev,
        duration: formatTime(audio.duration),
        isLoaded: true
      }));
    };

    const handleTimeUpdate = () => {
      const position = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      setAudioState(prev => ({
        ...prev,
        currentTime: formatTime(audio.currentTime),
        position
      }));
    };

    const handlePlay = () => {
      initializeAudioContext();
      setAudioState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
      animationRef.current = requestAnimationFrame(updateAnalyzer);
    };

    const handlePause = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    const handleEnded = () => {
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isPaused: false,
        position: 0,
        currentTime: '00:00'
      }));
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initializeAudioContext, updateAnalyzer]);

  // Control functions
  const loadFile = useCallback((file: File) => {
    const audio = audioRef.current;
    if (!audio) return;

    const url = URL.createObjectURL(file);
    audio.src = url;
    
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    setAudioState(prev => ({
      ...prev,
      fileName: `♫ ${fileName.toUpperCase()} ♫`,
      position: 0,
      currentTime: '00:00',
      isPlaying: false,
      isPaused: false,
      isLoaded: false
    }));
  }, []);

  // Load audio from a URL (e.g. for the default track shipped with the app)
  const loadUrl = useCallback((url: string, displayName?: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = url;
    const name = displayName ?? url.split('/').pop()?.replace(/\.[^/.]+$/, '') ?? 'TRACK';
    setAudioState(prev => ({
      ...prev,
      fileName: `♫ ${name.toUpperCase()} ♫`,
      position: 0,
      currentTime: '00:00',
      isPlaying: false,
      isPaused: false,
      isLoaded: false,
    }));
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.src) {
      audio.play().catch(console.error);
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const seek = useCallback((percentage: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = (percentage / 100) * audio.duration;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (audio) {
      const clampedVolume = Math.max(0, Math.min(100, volume));
      audio.volume = clampedVolume / 100;
      setAudioState(prev => ({ ...prev, volume: clampedVolume }));
    }
  }, []);

  // ----- EQ controls -----
  const setEqEnabled = useCallback((enabled: boolean) => {
    eqEnabledRef.current = enabled;
    const filters = eqFiltersRef.current;
    filters.forEach((f, i) => {
      f.gain.value = enabled ? eqValuesRef.current[i] : 0;
    });
    if (preampRef.current) {
      preampRef.current.gain.value = dbToGain(eqPreampRef.current, enabled);
    }
  }, []);

  const setEqBand = useCallback((index: number, db: number) => {
    eqValuesRef.current[index] = db;
    const f = eqFiltersRef.current[index];
    if (f && eqEnabledRef.current) f.gain.value = db;
  }, []);

  const setEqValues = useCallback((values: number[]) => {
    eqValuesRef.current = values.slice();
    eqFiltersRef.current.forEach((f, i) => {
      f.gain.value = eqEnabledRef.current ? (values[i] ?? 0) : 0;
    });
  }, []);

  const setEqPreamp = useCallback((db: number) => {
    eqPreampRef.current = db;
    if (preampRef.current) {
      preampRef.current.gain.value = dbToGain(db, eqEnabledRef.current);
    }
  }, []);

  return {
    audioRef,
    audioState,
    loadFile,
    loadUrl,
    play,
    pause,
    stop,
    seek,
    setVolume,
    // EQ controls
    setEqEnabled,
    setEqBand,
    setEqPreamp,
    setEqValues,
  };
};

// Convert a dB value (used by the EQ UI for preamp) to a linear gain.
// When `enabled` is false the preamp gain is forced to 1.0 (bypass).
function dbToGain(db: number, enabled: boolean): number {
  if (!enabled) return 1.0;
  return Math.pow(10, db / 20);
}