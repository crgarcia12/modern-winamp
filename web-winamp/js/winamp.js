/**
 * Web Winamp - Modern web version of the classic Winamp media player
 */

class WebWinamp {
    constructor() {
        this.audioContext = null;
        this.currentAudio = null;
        this.analyser = null;
        this.gainNode = null;
        this.panNode = null;
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.isPaused = false;
        this.volume = 75;
        this.balance = 0;
        this.shuffle = false;
        this.repeat = false;
        this.isDragging = false;
        this.dragTarget = null;
        this.dragOffset = { x: 0, y: 0 };
        
        this.initializeAudio();
        this.bindEvents();
        this.initializeUI();
        this.startSpectrumAnalyzer();
    }

    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.gainNode = this.audioContext.createGain();
            this.panNode = this.audioContext.createStereoPanner();
            
            this.analyser.fftSize = 64;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Connect audio graph
            this.gainNode.connect(this.panNode);
            this.panNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Set initial volume and balance
            this.setVolume(this.volume);
            this.setBalance(this.balance);
            
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }

    bindEvents() {
        // Transport controls
        document.getElementById('play-btn').addEventListener('click', () => this.play());
        document.getElementById('pause-btn').addEventListener('click', () => this.pause());
        document.getElementById('stop-btn').addEventListener('click', () => this.stop());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousTrack());
        document.getElementById('next-btn').addEventListener('click', () => this.nextTrack());

        // Playlist controls
        document.getElementById('pl-btn').addEventListener('click', () => this.togglePlaylist());
        document.getElementById('add-url-btn').addEventListener('click', () => this.addUrl());
        document.getElementById('clear-playlist-btn').addEventListener('click', () => this.clearPlaylist());
        document.getElementById('url-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addUrl();
        });

        // Volume and balance controls
        this.bindSlider('volume-slider', 'volume-thumb', (value) => this.setVolume(value * 100));
        this.bindSlider('balance-slider', 'balance-thumb', (value) => this.setBalance((value - 0.5) * 2));
        this.bindSlider('position-slider', 'position-thumb', (value) => this.seek(value));

        // Window dragging
        this.bindDragging('main-window');
        this.bindDragging('playlist-window');

        // Window controls
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const window = e.target.closest('.window');
                if (window.id === 'main-window') {
                    // Don't close main window, just minimize
                    this.minimize(window);
                } else {
                    window.style.display = 'none';
                }
            });
        });

        // Audio events
        window.addEventListener('beforeunload', () => {
            if (this.currentAudio) {
                this.currentAudio.pause();
            }
        });
    }

    bindSlider(sliderId, thumbId, callback) {
        const slider = document.getElementById(sliderId);
        const thumb = document.getElementById(thumbId);
        let isDragging = false;

        const handleMove = (e) => {
            if (!isDragging) return;
            
            const rect = slider.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const value = x / rect.width;
            
            thumb.style.left = `${x}px`;
            callback(value);
        };

        slider.addEventListener('mousedown', (e) => {
            isDragging = true;
            handleMove(e);
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', () => {
                isDragging = false;
                document.removeEventListener('mousemove', handleMove);
            }, { once: true });
        });
    }

    bindDragging(windowId) {
        const window = document.getElementById(windowId);
        const titlebar = window.querySelector('.titlebar');
        
        titlebar.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragTarget = window;
            this.dragOffset = {
                x: e.clientX - window.offsetLeft,
                y: e.clientY - window.offsetTop
            };
            
            document.addEventListener('mousemove', this.handleDrag.bind(this));
            document.addEventListener('mouseup', this.stopDrag.bind(this), { once: true });
        });
    }

    handleDrag(e) {
        if (!this.isDragging || !this.dragTarget) return;
        
        this.dragTarget.style.left = `${e.clientX - this.dragOffset.x}px`;
        this.dragTarget.style.top = `${e.clientY - this.dragOffset.y}px`;
    }

    stopDrag() {
        this.isDragging = false;
        this.dragTarget = null;
        document.removeEventListener('mousemove', this.handleDrag.bind(this));
    }

    initializeUI() {
        this.updateDisplay();
        this.updateTimeDisplay('0:00');
    }

    async addUrl() {
        const input = document.getElementById('url-input');
        const url = input.value.trim();
        
        if (!url) return;
        
        if (!url.toLowerCase().endsWith('.mp3')) {
            alert('Please enter a valid MP3 URL');
            return;
        }

        try {
            // Test if URL is accessible
            const response = await fetch(url, { method: 'HEAD' });
            if (!response.ok) {
                throw new Error('URL not accessible');
            }
            
            const track = {
                url: url,
                title: this.extractTitleFromUrl(url),
                duration: null
            };
            
            this.playlist.push(track);
            this.updatePlaylistDisplay();
            input.value = '';
            
            // If this is the first track, select it
            if (this.playlist.length === 1) {
                this.currentTrackIndex = 0;
                this.updateDisplay();
            }
            
        } catch (error) {
            console.error('Failed to add URL:', error);
            alert('Failed to add URL. Please check the URL and try again.');
        }
    }

    extractTitleFromUrl(url) {
        const filename = url.split('/').pop().split('?')[0];
        return filename.replace(/\.[^/.]+$/, ""); // Remove extension
    }

    clearPlaylist() {
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.stop();
        this.updatePlaylistDisplay();
        this.updateDisplay();
    }

    updatePlaylistDisplay() {
        const container = document.getElementById('playlist-tracks');
        container.innerHTML = '';
        
        this.playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = 'track-item';
            if (index === this.currentTrackIndex) {
                item.classList.add('playing');
            }
            item.textContent = `${index + 1}. ${track.title}`;
            item.addEventListener('click', () => {
                this.currentTrackIndex = index;
                this.loadTrack();
                this.play();
            });
            container.appendChild(item);
        });
    }

    togglePlaylist() {
        const playlist = document.getElementById('playlist-window');
        playlist.style.display = playlist.style.display === 'none' ? 'block' : 'none';
    }

    async loadTrack() {
        if (this.currentTrackIndex < 0 || this.currentTrackIndex >= this.playlist.length) {
            return false;
        }

        const track = this.playlist[this.currentTrackIndex];
        
        try {
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.removeEventListener('loadedmetadata', this.onLoadedMetadata);
                this.currentAudio.removeEventListener('timeupdate', this.onTimeUpdate);
                this.currentAudio.removeEventListener('ended', this.onEnded);
            }

            this.currentAudio = new Audio(track.url);
            this.currentAudio.crossOrigin = 'anonymous';
            
            // Bind audio events
            this.currentAudio.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
            this.currentAudio.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
            this.currentAudio.addEventListener('ended', this.onEnded.bind(this));
            this.currentAudio.addEventListener('error', this.onError.bind(this));

            // Connect to Web Audio API
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const source = this.audioContext.createMediaElementSource(this.currentAudio);
            source.connect(this.gainNode);
            
            this.updateDisplay();
            this.updatePlaylistDisplay();
            
            return true;
            
        } catch (error) {
            console.error('Failed to load track:', error);
            return false;
        }
    }

    onLoadedMetadata() {
        const track = this.playlist[this.currentTrackIndex];
        if (track) {
            track.duration = this.currentAudio.duration;
        }
    }

    onTimeUpdate() {
        const currentTime = this.currentAudio.currentTime;
        const duration = this.currentAudio.duration;
        
        this.updateTimeDisplay(this.formatTime(currentTime));
        
        if (duration > 0) {
            const progress = currentTime / duration;
            const thumb = document.getElementById('position-thumb');
            const slider = document.getElementById('position-slider');
            thumb.style.left = `${progress * (slider.offsetWidth - thumb.offsetWidth)}px`;
        }
    }

    onEnded() {
        if (this.repeat) {
            this.currentAudio.currentTime = 0;
            this.currentAudio.play();
        } else {
            this.nextTrack();
        }
    }

    onError(e) {
        console.error('Audio error:', e);
        alert('Failed to play track. Please check the URL.');
        this.nextTrack();
    }

    async play() {
        if (this.playlist.length === 0) {
            alert('Please add some tracks to the playlist first.');
            return;
        }

        if (!this.currentAudio || this.currentTrackIndex < 0) {
            this.currentTrackIndex = 0;
            if (!(await this.loadTrack())) return;
        }

        try {
            await this.currentAudio.play();
            this.isPlaying = true;
            this.isPaused = false;
        } catch (error) {
            console.error('Failed to play:', error);
        }
    }

    pause() {
        if (this.currentAudio && this.isPlaying) {
            this.currentAudio.pause();
            this.isPaused = true;
            this.isPlaying = false;
        }
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.isPlaying = false;
            this.isPaused = false;
            this.updateTimeDisplay('0:00');
            
            // Reset position thumb
            const thumb = document.getElementById('position-thumb');
            thumb.style.left = '0px';
        }
    }

    nextTrack() {
        if (this.playlist.length === 0) return;
        
        if (this.shuffle) {
            this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        }
        
        this.loadTrack().then(() => {
            if (this.isPlaying || !this.isPaused) {
                this.play();
            }
        });
    }

    previousTrack() {
        if (this.playlist.length === 0) return;
        
        if (this.shuffle) {
            this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentTrackIndex = this.currentTrackIndex <= 0 ? this.playlist.length - 1 : this.currentTrackIndex - 1;
        }
        
        this.loadTrack().then(() => {
            if (this.isPlaying || !this.isPaused) {
                this.play();
            }
        });
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume / 100;
        }
    }

    setBalance(balance) {
        this.balance = Math.max(-1, Math.min(1, balance));
        if (this.panNode) {
            this.panNode.pan.value = this.balance;
        }
    }

    seek(position) {
        if (this.currentAudio && this.currentAudio.duration) {
            this.currentAudio.currentTime = position * this.currentAudio.duration;
        }
    }

    updateDisplay() {
        const titleElement = document.getElementById('track-title');
        
        if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.playlist.length) {
            const track = this.playlist[this.currentTrackIndex];
            titleElement.textContent = track.title;
        } else {
            titleElement.textContent = 'Winamp ***';
        }
    }

    updateTimeDisplay(time) {
        document.getElementById('time-display').textContent = time;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    minimize(window) {
        // Simple minimize effect
        window.style.transform = 'scale(0.1)';
        window.style.opacity = '0';
        setTimeout(() => {
            window.style.transform = 'scale(1)';
            window.style.opacity = '1';
        }, 300);
    }

    startSpectrumAnalyzer() {
        const canvas = document.getElementById('spectrum');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        const bufferLength = this.analyser ? this.analyser.frequencyBinCount : 32;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            requestAnimationFrame(draw);
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);
            
            if (this.analyser && this.isPlaying) {
                this.analyser.getByteFrequencyData(dataArray);
                
                const barWidth = width / bufferLength;
                
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * height;
                    
                    ctx.fillStyle = '#00ff00';
                    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
                }
            }
        };
        
        draw();
    }
}

// Initialize Winamp when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.winamp = new WebWinamp();
    
    // Allow dropping files (for future enhancement)
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        // Could implement file drop support here
    });
    
    console.log('🎵 Web Winamp initialized! Add MP3 URLs to start playing.');
});