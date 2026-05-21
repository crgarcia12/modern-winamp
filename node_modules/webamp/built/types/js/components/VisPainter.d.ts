import { FFT } from "./FFTNullsoft";
export interface Vis {
    canvas: HTMLCanvasElement;
    colors: string[];
    analyser?: AnalyserNode;
    oscStyle?: "dots" | "solid" | "lines";
    bandwidth?: "wide" | "thin";
    coloring?: "fire" | "line" | "normal";
    peaks?: boolean;
    saFalloff?: "slower" | "slow" | "moderate" | "fast" | "faster";
    saPeakFalloff?: "slower" | "slow" | "moderate" | "fast" | "faster";
    sa?: "analyzer" | "oscilloscope" | "none";
    renderHeight: number;
    smallVis?: boolean;
    pixelDensity?: number;
    doubled?: boolean;
    isMWOpen?: boolean;
}
/**
 * Base class of Visualizer (animation frame renderer engine)
 */
declare abstract class VisPaintHandler {
    _vis: Vis;
    _ctx: CanvasRenderingContext2D | null;
    constructor(vis: Vis);
    /**
     * Attempt to build cached bitmaps for later use while rendering a frame.
     * Purpose: fast rendering in animation loop
     */
    prepare(): void;
    /**
     * Called once per frame rendering
     */
    paintFrame(): void;
    /**
     * Attempt to cleanup cached bitmaps
     */
    dispose(): void;
}
type PaintFrameFunction = () => void;
type PaintBarFunction = (ctx: CanvasRenderingContext2D, x1: number, x2: number, barHeight: number, peakHeight: number) => void;
export declare class BarPaintHandler extends VisPaintHandler {
    private saPeaks;
    private saData2;
    private saData;
    private saFalloff;
    private sample;
    private barPeak;
    private chunk;
    private uVar12;
    private falloff;
    private peakFalloff;
    private pushDown;
    private inWaveData;
    private outSpectralData;
    _analyser: AnalyserNode;
    _fft: FFT;
    _color: string;
    _colorPeak: string;
    _bar: HTMLCanvasElement;
    _peak: HTMLCanvasElement;
    _16h: HTMLCanvasElement;
    _bufferLength: number;
    _dataArray: Uint8Array;
    colorssmall: string[];
    colorssmall2: string[];
    _renderHeight: number;
    _smallVis: boolean;
    _pixelDensity: number;
    _doubled: boolean;
    _isMWOpen: boolean;
    paintBar: PaintBarFunction;
    paintFrame: PaintFrameFunction;
    constructor(vis: Vis);
    prepare(): void;
    /**
     * ⬜⬜⬜ ⬜⬜⬜
     * 🟧🟧🟧
     * 🟫🟫🟫 🟧🟧🟧
     * 🟫🟫🟫 🟫🟫🟫
     * 🟫🟫🟫 🟫🟫🟫 ⬜⬜⬜
     * 🟫🟫🟫 🟫🟫🟫 🟧🟧🟧
     * 🟫🟫🟫 🟫🟫🟫 🟫🟫🟫
     * 1 bar = multiple pixels
     */
    /**
     * ⬜⬜
     * 🟧
     * 🟫🟧
     * 🟫🟫⬜⬜
     * 🟫🟫🟧
     * 🟫🟫🟫🟧⬜
     * 🟫🟫🟫🟫🟧
     * drawing 1pixel width bars
     */
    paintAnalyzer(): void;
    /**
     * 🟥
     * 🟧🟧
     * 🟨🟨🟨
     * 🟩🟩🟩🟩
     */
    paintBarNormal(ctx: CanvasRenderingContext2D, x: number, x2: number, barHeight: number, peakHeight: number): void;
    /**
     * 🟥
     * 🟧🟥
     * 🟨🟧🟥
     * 🟩🟨🟧🟥
     */
    paintBarFire(ctx: CanvasRenderingContext2D, x: number, x2: number, barHeight: number, peakHeight: number): void;
    /**
     * 🟥
     * 🟥🟧
     * 🟥🟧🟨
     * 🟥🟧🟨🟩
     */
    paintBarLine(ctx: CanvasRenderingContext2D, x: number, x2: number, barHeight: number, peakHeight: number): void;
}
type PaintWavFunction = (x: number, y: number) => void;
export declare class WavePaintHandler extends VisPaintHandler {
    private pushDown;
    _analyser: AnalyserNode;
    _bufferLength: number;
    _lastX: number;
    _lastY: number;
    _dataArray: Uint8Array;
    _pixelRatio: number;
    _bar: HTMLCanvasElement;
    _16h: HTMLCanvasElement;
    paintWav: PaintWavFunction;
    constructor(vis: Vis);
    prepare(): void;
    paintFrame(): void;
    /**
     *
     * @param y 0..5
     * @returns value in use for coloring stuff in
     */
    colorIndex(y: number): number;
    paintOscilloscope(x: number, y: number): void;
}
export declare class NoVisualizerHandler extends VisPaintHandler {
    cleared: boolean;
    prepare(): void;
    paintFrame(): void;
}
export {};
