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

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number>();

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
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 512;
        analyzerRef.current.smoothingTimeConstant = 0.8;
        
        if (!sourceRef.current) {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          sourceRef.current.connect(analyzerRef.current);
          analyzerRef.current.connect(audioContextRef.current.destination);
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

  return {
    audioRef,
    audioState,
    loadFile,
    play,
    pause,
    stop,
    seek,
    setVolume
  };
};