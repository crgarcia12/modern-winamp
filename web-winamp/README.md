# Web Winamp

A modern web version of the classic Winamp media player, recreated with pixel-perfect accuracy using the original source code as reference.

## Features

- **Pixel-perfect classic Winamp interface** - Uses original bitmap assets and exact dimensions
- **MP3 streaming support** - Play MP3s directly from URLs
- **Full transport controls** - Play, pause, stop, previous, next
- **Real-time spectrum analyzer** - Visual audio frequency analysis
- **Draggable windows** - Classic Winamp window behavior
- **Playlist management** - Add multiple tracks via URLs
- **Volume and balance controls** - Full audio control
- **Cross-browser compatibility** - Works in modern browsers

## Usage

1. Open `index.html` in a modern web browser
2. Click the "PL" button to open the playlist window
3. Paste MP3 URLs into the input field and click "Add"
4. Use the transport controls to play, pause, and navigate tracks
5. Drag the windows around to position them as desired

## Technical Details

- **HTML5 + CSS3** for pixel-perfect UI recreation
- **Web Audio API** for audio playback and analysis
- **Canvas API** for spectrum visualization
- **No external dependencies** - pure vanilla JavaScript

## Browser Requirements

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

To run a local development server:

```bash
cd web-winamp
python -m http.server 8080
```

Then open http://localhost:8080 in your browser.

## Credits

Based on the original Winamp source code and assets. This is a web tribute to the iconic media player that defined an era of digital music.