import React, { useState, useRef, useCallback, useEffect } from 'react';

interface PlaylistEntry {
  id: string;
  filename: string;
  duration: string;       // "M:SS" or "--:--"
  durationSec?: number;
  file?: File;
  url?: string;
}

interface PlaylistEditorProps {
  isVisible: boolean;
  onClose: () => void;
  onLoadTrack: (entry: PlaylistEntry) => void;
}

const fmtDuration = (sec: number): string => {
  if (!isFinite(sec) || sec <= 0) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Probe audio metadata to get duration
const probeDuration = (file: File): Promise<number> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('audio');
    a.preload = 'metadata';
    a.src = url;
    a.onloadedmetadata = () => {
      const d = a.duration;
      URL.revokeObjectURL(url);
      resolve(isFinite(d) ? d : 0);
    };
    a.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });

export const PlaylistEditor: React.FC<PlaylistEditorProps> = ({
  isVisible,
  onClose,
  onLoadTrack,
}) => {
  const [playlist, setPlaylist] = useState<PlaylistEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  // Total length of playlist (sum of known durations)
  const totalSec = playlist.reduce((acc, e) => acc + (e.durationSec || 0), 0);
  const totalLabel = playlist.length === 0
    ? '0:00'
    : `${Math.floor(totalSec / 60)}:${Math.floor(totalSec % 60).toString().padStart(2, '0')}`;

  const addFiles = useCallback(async (files: File[]) => {
    const audioFiles = files.filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(f.name));
    if (audioFiles.length === 0) return;
    const entries: PlaylistEntry[] = audioFiles.map((file) => ({
      id: Math.random().toString(36).slice(2),
      filename: file.name,
      duration: '--:--',
      file,
    }));
    setPlaylist((prev) => [...prev, ...entries]);
    // Async-resolve durations
    audioFiles.forEach(async (file, i) => {
      const d = await probeDuration(file);
      setPlaylist((prev) =>
        prev.map((p) =>
          p.id === entries[i].id
            ? { ...p, durationSec: d, duration: fmtDuration(d) }
            : p,
        ),
      );
    });
  }, []);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    void addFiles(files);
    event.target.value = ''; // allow same file re-selection
  };

  const handleAddUrl = () => {
    const url = window.prompt('Enter audio URL:', 'https://');
    if (!url) return;
    const filename = decodeURIComponent(url.split('/').pop() || url);
    setPlaylist((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        filename,
        duration: '--:--',
        url,
      },
    ]);
  };

  const removeSelected = () => {
    if (selectedIndex >= 0) {
      setPlaylist((prev) => prev.filter((_, i) => i !== selectedIndex));
      setSelectedIndex(-1);
    }
  };

  const cropSelected = () => {
    if (selectedIndex >= 0) {
      setPlaylist((prev) => prev.filter((_, i) => i === selectedIndex));
      setSelectedIndex(0);
    }
  };

  const clearAll = () => {
    setPlaylist([]);
    setSelectedIndex(-1);
  };

  const selectAll = () => setSelectedIndex(playlist.length > 0 ? 0 : -1);
  const invertSel = () => {
    if (playlist.length === 0) return;
    setSelectedIndex((idx) => (idx < 0 ? 0 : -1));
  };

  // Drag-and-drop support: drop audio files anywhere on the playlist
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    void addFiles(files);
  };

  // Keyboard nav
  useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowDown') {
        setSelectedIndex((i) => Math.min(playlist.length - 1, (i < 0 ? 0 : i + 1)));
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex((i) => Math.max(0, (i < 0 ? 0 : i - 1)));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        onLoadTrack(playlist[selectedIndex]);
      } else if (e.key === 'Delete') {
        removeSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isVisible, playlist, selectedIndex, onLoadTrack]);

  if (!isVisible) return null;

  // Render bitmap-font row character (5x6 sprite at Pledit.bmp y=0..6 region for title text).
  // Simpler: render the title with a CSS pixel font look, since it's only ~20px tall.

  return (
    <div
      className={`pl-window ${dragOver ? 'pl-dragover' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      <input
        ref={dirInputRef}
        type="file"
        // @ts-expect-error non-standard but widely supported
        webkitdirectory=""
        directory=""
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Title bar (composed from 3 sprite pieces of Pledit.bmp) */}
      <div className="pl-titlebar">
        <div className="pl-tb-left" />
        <div className="pl-tb-mid" />
        <div className="pl-tb-right" />
        <button className="pl-tb-close" onClick={onClose} title="Close" />
      </div>

      {/* Vertical edge strips composed from Pledit.bmp */}
      <div className="pl-edge-left" />
      <div className="pl-edge-right" />

      {/* Body — dark green list area with classic 1px metallic inset border */}
      <div className="pl-content">
        {playlist.length === 0 && (
          <div className="pl-empty">
            {dragOver
              ? '+ DROP TO ADD FILES +'
              : 'PLAYLIST IS EMPTY — DRAG AUDIO FILES HERE OR CLICK +FILE'}
          </div>
        )}
        {playlist.map((entry, index) => {
          const isSel = selectedIndex === index;
          return (
            <div
              key={entry.id}
              className={`pl-item ${isSel ? 'selected' : ''}`}
              onClick={() => setSelectedIndex(index)}
              onDoubleClick={() => onLoadTrack(entry)}
            >
              <span className="pl-item-num">{index + 1}.</span>
              <span className="pl-item-title">{entry.filename}</span>
              <span className="pl-item-dur">{entry.duration}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom strip composed from Pledit.bmp pieces */}
      <div className="pl-bottom">
        <div className="pl-bottom-left" />
        <div className="pl-bottom-mid" />
        <div className="pl-bottom-right" />
      </div>

      {/* Five button groups, classic Winamp layout: ADD / REM / SEL / MISC / LIST */}
      <div className="pl-btn-grp pl-grp-add">
        <div className="pl-grp-label">ADD</div>
        <button className="pl-btn" onClick={() => fileInputRef.current?.click()}>FILE</button>
        <button className="pl-btn" onClick={() => dirInputRef.current?.click()}>DIR</button>
        <button className="pl-btn" onClick={handleAddUrl}>URL</button>
      </div>

      <div className="pl-btn-grp pl-grp-rem">
        <div className="pl-grp-label">REM</div>
        <button className="pl-btn" onClick={removeSelected}>SEL</button>
        <button className="pl-btn" onClick={cropSelected}>CROP</button>
        <button className="pl-btn" onClick={clearAll}>ALL</button>
      </div>

      <div className="pl-btn-grp pl-grp-sel">
        <div className="pl-grp-label">SEL</div>
        <button className="pl-btn" onClick={invertSel}>INV</button>
        <button className="pl-btn" onClick={selectAll}>ALL</button>
        <button className="pl-btn" onClick={() => setSelectedIndex(-1)}>NONE</button>
      </div>

      <div className="pl-btn-grp pl-grp-misc">
        <div className="pl-grp-label">MISC</div>
        <button className="pl-btn" disabled>OPTS</button>
        <button className="pl-btn" disabled>SORT</button>
        <button className="pl-btn" disabled>FILE</button>
      </div>

      <div className="pl-btn-grp pl-grp-list">
        <div className="pl-grp-label">LIST</div>
        <button className="pl-btn" disabled>NEW</button>
        <button className="pl-btn" disabled>SAVE</button>
        <button className="pl-btn" disabled>LOAD</button>
      </div>

      {/* Bottom info: track count and total duration (classic green LCD) */}
      <div className="pl-counter">
        {playlist.length} item{playlist.length === 1 ? '' : 's'} · {totalLabel}
      </div>
    </div>
  );
};
