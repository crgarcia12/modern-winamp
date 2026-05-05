import React, { useState, useRef } from 'react';

interface PlaylistEntry {
  id: string;
  filename: string;
  duration: string;
  file?: File;
}

interface PlaylistEditorProps {
  isVisible: boolean;
  onClose: () => void;
  onLoadTrack: (entry: PlaylistEntry) => void;
}

export const PlaylistEditor: React.FC<PlaylistEditorProps> = ({
  isVisible,
  onClose,
  onLoadTrack,
}) => {
  const [playlist, setPlaylist] = useState<PlaylistEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isVisible) return null;

  const handleFileAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const entries: PlaylistEntry[] = files.map((file) => ({
      id: Math.random().toString(36),
      filename: file.name,
      duration: '--:--',
      file,
    }));
    setPlaylist((prev) => [...prev, ...entries]);
  };

  const removeSelected = () => {
    if (selectedIndex >= 0) {
      setPlaylist((prev) => prev.filter((_, i) => i !== selectedIndex));
      setSelectedIndex(-1);
    }
  };

  const clearAll = () => {
    setPlaylist([]);
    setSelectedIndex(-1);
  };

  return (
    <div className="pl-window">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileAdd}
      />

      <div className="pl-titlebar">
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 3,
            right: 6,
            width: 9,
            height: 9,
            background: 'linear-gradient(to bottom,#f0f0f0,#b0b0b0)',
            border: '1px solid #000',
            cursor: 'pointer',
            color: '#000',
            fontSize: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>

      {/* Vertical edge strips compose the side borders */}
      <div className="pl-edge-left" />
      <div className="pl-edge-right" />

      <div className="pl-content">
        {playlist.map((entry, index) => (
          <div
            key={entry.id}
            className={`pl-item ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => setSelectedIndex(index)}
            onDoubleClick={() => onLoadTrack(entry)}
          >
            {String(index + 1).padStart(2, '0')}. {entry.filename}
          </div>
        ))}
        {playlist.length === 0 && (
          <div className="pl-empty">PLAYLIST EMPTY — CLICK +FILE TO ADD TRACKS</div>
        )}
      </div>

      {/* Bottom strip composed of left corner + tiled middle + right corner */}
      <div className="pl-bottom">
        <div className="pl-bottom-left" />
        <div className="pl-bottom-mid" />
        <div className="pl-bottom-right" />
      </div>

      <div className="pl-actions">
        <button onClick={() => fileInputRef.current?.click()}>+ FILE</button>
        <button onClick={removeSelected}>REM</button>
        <button onClick={clearAll}>CLR</button>
      </div>
      <div className="pl-counter">
        {playlist.length} item{playlist.length === 1 ? '' : 's'}
      </div>
    </div>
  );
};
