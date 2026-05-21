export declare class FFT {
    private bitrevtable;
    private envelope;
    private equalize;
    private temp1;
    private temp2;
    private cossintable;
    private static readonly TWO_PI;
    private static readonly HALF_PI;
    constructor();
    private initEqualizeTable;
    private initEnvelopeTable;
    private initBitRevTable;
    private initCosSinTable;
    timeToFrequencyDomain(inWavedata: Float32Array, outSpectraldata: Float32Array): void;
}
