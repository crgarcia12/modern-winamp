import React, { useState, useRef } from 'react';

interface PlaylistEntry {
  id: string;
  filename: string;
  duration: string;
  file?: File;
  url?: string;
}

interface PlaylistEditorProps {
  isVisible: boolean;
  onClose: () => void;
  onLoadTrack: (entry: PlaylistEntry) => void;
}

export const PlaylistEditor: React.FC<PlaylistEditorProps> = ({ 
  isVisible, 
  onClose, 
  onLoadTrack 
}) => {
  const [playlist, setPlaylist] = useState<PlaylistEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newEntries: PlaylistEntry[] = files.map(file => ({
      id: Math.random().toString(36),
      filename: file.name,
      duration: '--:--',
      file
    }));
    
    setPlaylist(prev => [...prev, ...newEntries]);
  };

  const removeSelected = () => {
    if (selectedIndex >= 0) {
      setPlaylist(prev => prev.filter((_, i) => i !== selectedIndex));
      setSelectedIndex(-1);
    }
  };

  const clearAll = () => {
    setPlaylist([]);
    setSelectedIndex(-1);
  };

  if (!isVisible) return null;

  return (
    <div className="playlist-window">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileAdd}
      />
      
      {/* Playlist Header */}
      <div className="playlist-header">
        <span className="playlist-title">Winamp Playlist Editor</span>
        <div className="playlist-controls">
          <button className="playlist-btn" onClick={onClose}>×</button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="playlist-actions">
        <button className="playlist-action-btn" onClick={addFiles}>Add</button>
        <button className="playlist-action-btn" onClick={removeSelected}>Rem</button>
        <button className="playlist-action-btn" onClick={clearAll}>Clr</button>
        <div className="playlist-info">
          {playlist.length} files
        </div>
      </div>

      {/* Playlist Items */}
      <div className="playlist-content">
        <div className="playlist-items">
          {playlist.map((entry, index) => (
            <div
              key={entry.id}
              className={`playlist-item ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => setSelectedIndex(index)}
              onDoubleClick={() => onLoadTrack(entry)}
            >
              <span className="playlist-number">{index + 1}.</span>
              <span className="playlist-filename">{entry.filename}</span>
            </div>
          ))}
          
          {playlist.length === 0 && (
            <div className="playlist-empty">
              Click "Add" to load files
            </div>
          )}
        </div>
      </div>
    </div>
  );
};