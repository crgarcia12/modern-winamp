# Modern Winamp - Web Edition

A faithful recreation of the classic Winamp media player interface as a web application. This project recreates the iconic look and feel of Winamp's classic skin with all the familiar controls and visual elements.

## Features

- **Authentic Classic Interface**: Pixel-perfect recreation of the original Winamp classic skin
- **Interactive Controls**: Fully functional play, pause, stop, previous, next buttons
- **File Upload**: Support for loading audio files
- **Volume Control**: Interactive volume slider
- **Position Scrubbing**: Clickable position bar for seeking
- **Shuffle & Repeat**: Toggle buttons with visual feedback
- **Scrolling Display**: Animated song title text scrolling
- **Green LCD Display**: Classic green monospace time display with glow effect
- **3D Button Effects**: Authentic raised/pressed button animations
- **Teal Desktop Background**: Classic Windows 95-era teal pattern background

## Technology Stack

- **React 18**: Modern React with hooks and TypeScript
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **CSS3**: Authentic 90s styling with gradients, text-shadow, and animations
- **Docker**: Containerized deployment

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Serve production build
npm run serve
```

## Deployment

The application is configured for deployment with Liliput with proper base path handling:

```bash
# Build Docker image
docker build -t winamp-web .

# Run container
docker run -p 3000:3000 winamp-web
```

## Original Winamp Inspiration

This project is inspired by the classic Winamp media player that was first released in 1997 by Nullsoft. The interface faithfully recreates:

- The iconic teal titlebar with "Winamp" text
- Green LCD-style display with time counter
- Classic gray control buttons with 3D effects
- Volume and position sliders
- EQ and PL (Equalizer/Playlist) buttons
- The characteristic compact 275x116 pixel window size

## Development

The application is built with modern web technologies while maintaining the authentic retro aesthetic of the original Winamp player. All visual elements use CSS to recreate the pixel-perfect look without requiring the original bitmap assets.

## License

This project is a fan recreation for educational and nostalgic purposes. Original Winamp design and trademark belong to their respective owners.