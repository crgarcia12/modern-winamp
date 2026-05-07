import { Band } from "../types";
import Emitter from "../emitter";
import Disposable from "../Disposable";
import ElementSource from "./elementSource";
interface StereoBalanceNodeType extends AudioNode {
    constructor(context: AudioContext): StereoBalanceNodeType;
    balance: {
        value: number;
    };
}
export interface IMedia {
    /**
     * Set the volume from 0 to 100
     */
    setVolume(volume: number): void;
    /**
     * Set the stereo balance from -100 to 100
     */
    setBalance(balance: number): void;
    /**
     * Set the preamp value from 0 to 100
     * The input value represents -12db to 12db, where 50 is 0db (no change)
     * Equation used is: 10^((dB)/20) = x, where x is the gain value
     */
    setPreamp(value: number): void;
    /**
     * Register an event listener
     */
    on(event: string, callback: (...args: any[]) => void): void;
    /**
     * Get the current playback time in seconds
     */
    timeElapsed(): number;
    /**
     * Get the total duration of the current track in seconds
     */
    duration(): number;
    /**
     * Start or resume playback
     */
    play(): Promise<void>;
    /**
     * Pause playback
     */
    pause(): void;
    /**
     * Stop playback and reset position to beginning
     */
    stop(): void;
    /**
     * Seek to a specific position as a percentage of the total duration
     */
    seekToPercentComplete(percent: number): void;
    /**
     * Load a track from a URL and optionally start playing it
     * Used only for the initial load, since it must have a CORS header
     */
    loadFromUrl(url: string, autoPlay: boolean): Promise<void>;
    /**
     * Set the gain value for a specific EQ band
     */
    setEqBand(band: Band, value: number): void;
    /**
     * Disable the equalizer by bypassing all EQ bands
     */
    disableEq(): void;
    /**
     * Enable the equalizer processing
     */
    enableEq(): void;
    /**
     * Get the analyser node for visualizer data
     */
    getAnalyser(): AnalyserNode;
    /**
     * Clean up resources and dispose of the media instance
     */
    dispose(): void;
}
export interface IMediaClass {
    new (): IMedia;
}
export default class Media implements IMedia {
    _emitter: Emitter;
    _context: AudioContext;
    _balance: StereoBalanceNodeType;
    _staticSource: GainNode;
    _preamp: GainNode;
    _analyser: AnalyserNode;
    _gainNode: GainNode;
    _source: ElementSource;
    _bands: {
        [band: number]: BiquadFilterNode;
    };
    _disposable: Disposable;
    constructor();
    getAnalyser(): AnalyserNode;
    duration(): number;
    timeElapsed(): number;
    timeRemaining(): number;
    percentComplete(): number;
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    seekToPercentComplete(percent: number): void;
    setVolume(volume: number): void;
    setPreamp(value: number): void;
    setBalance(balance: number): void;
    setEqBand(band: Band, value: number): void;
    disableEq(): void;
    enableEq(): void;
    on(event: string, callback: (...args: any[]) => void): void;
    seekToTime(time: number): void;
    loadFromUrl(url: string, autoPlay: boolean): Promise<void>;
    dispose(): void;
}
export {};
