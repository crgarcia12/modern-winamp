export interface WinampSkin {
  name: string;
  mainBitmap: string; // Base64 encoded PNG of main window
  playlistBitmap?: string;
  equalizerBitmap?: string;
  colors?: {
    visColor1?: string;
    visColor2?: string;
    visColor3?: string;
    backgroundColor?: string;
  };
  cursor?: string;
}

export interface SkinCoordinates {
  // Main window coordinates
  playButton: { x: number; y: number; w: number; h: number };
  pauseButton: { x: number; y: number; w: number; h: number };
  stopButton: { x: number; y: number; w: number; h: number };
  nextButton: { x: number; y: number; w: number; h: number };
  prevButton: { x: number; y: number; w: number; h: number };
  ejectButton: { x: number; y: number; w: number; h: number };
  shuffleButton: { x: number; y: number; w: number; h: number };
  repeatButton: { x: number; y: number; w: number; h: number };
  
  // Display areas
  timeDisplay: { x: number; y: number; w: number; h: number };
  songTitle: { x: number; y: number; w: number; h: number };
  spectrum: { x: number; y: number; w: number; h: number };
  oscilloscope: { x: number; y: number; w: number; h: number };
  
  // Sliders
  positionSlider: { x: number; y: number; w: number; h: number };
  volumeSlider: { x: number; y: number; w: number; h: number };
}

// Default classic Winamp skin coordinates
export const DEFAULT_SKIN_COORDS: SkinCoordinates = {
  playButton: { x: 23, y: 18, w: 23, h: 18 },
  pauseButton: { x: 46, y: 18, w: 23, h: 18 },
  stopButton: { x: 69, y: 18, w: 23, h: 18 },
  nextButton: { x: 92, y: 18, w: 23, h: 18 },
  prevButton: { x: 0, y: 18, w: 23, h: 18 },
  ejectButton: { x: 115, y: 18, w: 23, h: 18 },
  shuffleButton: { x: 164, y: 89, w: 47, h: 15 },
  repeatButton: { x: 211, y: 89, w: 28, h: 15 },
  
  timeDisplay: { x: 24, y: 28, w: 63, h: 13 },
  songTitle: { x: 111, y: 27, w: 153, h: 6 },
  spectrum: { x: 24, y: 43, w: 76, h: 16 },
  oscilloscope: { x: 107, y: 43, w: 76, h: 16 },
  
  positionSlider: { x: 16, y: 72, w: 248, h: 10 },
  volumeSlider: { x: 107, y: 57, w: 68, h: 13 }
};

export class SkinLoader {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  async loadSkinFromFile(file: File): Promise<WinampSkin | null> {
    try {
      if (file.name.toLowerCase().endsWith('.wsz')) {
        return await this.parseWSZSkin(file);
      } else if (file.type.startsWith('image/')) {
        return await this.parseImageSkin(file);
      }
      return null;
    } catch (error) {
      console.error('Failed to load skin:', error);
      return null;
    }
  }

  private async parseWSZSkin(file: File): Promise<WinampSkin | null> {
    // WSZ files are ZIP archives, for now we'll implement basic functionality
    // In a real implementation, we'd use a ZIP library like JSZip
    return {
      name: file.name,
      mainBitmap: await this.fileToBase64(file),
    };
  }

  private async parseImageSkin(file: File): Promise<WinampSkin | null> {
    const mainBitmap = await this.fileToBase64(file);
    return {
      name: file.name,
      mainBitmap,
    };
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Extract a specific region from the skin bitmap
  extractRegion(skinBitmap: string, coords: { x: number; y: number; w: number; h: number }): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.canvas.width = coords.w;
        this.canvas.height = coords.h;
        this.context.drawImage(img, coords.x, coords.y, coords.w, coords.h, 0, 0, coords.w, coords.h);
        resolve(this.canvas.toDataURL());
      };
      img.src = skinBitmap;
    });
  }

  // Generate CSS for a skinned element
  generateSkinCSS(skinBitmap: string, coords: { x: number; y: number; w: number; h: number }, selector: string): string {
    return `
    ${selector} {
      background-image: url('${skinBitmap}');
      background-position: -${coords.x}px -${coords.y}px;
      width: ${coords.w}px;
      height: ${coords.h}px;
      background-repeat: no-repeat;
    }`;
  }
}

// Hook to manage skin loading
export const useSkinLoader = () => {
  const loader = new SkinLoader();

  const loadSkin = async (file: File): Promise<WinampSkin | null> => {
    return await loader.loadSkinFromFile(file);
  };

  const applySkin = (skin: WinampSkin, coordinates: SkinCoordinates = DEFAULT_SKIN_COORDS) => {
    // Apply skin to the Winamp interface
    const style = document.createElement('style');
    style.id = 'winamp-skin-style';
    
    // Remove existing skin style
    const existingStyle = document.getElementById('winamp-skin-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Generate CSS for skinned elements
    let css = `
    .winamp {
      background-image: url('${skin.mainBitmap}');
      background-size: contain;
      background-repeat: no-repeat;
    }
    
    .winamp-button {
      background-image: url('${skin.mainBitmap}');
      background-repeat: no-repeat;
      border: none;
    }
    `;

    style.textContent = css;
    document.head.appendChild(style);
  };

  const resetToDefaultSkin = () => {
    const existingStyle = document.getElementById('winamp-skin-style');
    if (existingStyle) {
      existingStyle.remove();
    }
  };

  return {
    loadSkin,
    applySkin,
    resetToDefaultSkin
  };
};