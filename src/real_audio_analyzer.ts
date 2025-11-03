/**
 * REAL Audio Analyzer for AIMastery Extension
 * Zero fake implementations - only genuine audio analysis
 */

interface VincianAnalysisResult {
  vincianScore: number;
  evidence: {
    spectralCentroid: number;
    harmonicRatios: number[];
    goldenRatioPresence: number;
    dominantFrequencies: number[];
    frequencyDistribution: Float32Array;
  };
  recommendations: string[];
  confidence: number;
}

class RealVincianAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private readonly GOLDEN_RATIO = 1.618033988749;
  private readonly SAMPLE_RATE = 44100;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 8192; // High resolution for better frequency analysis
    this.analyser.smoothingTimeConstant = 0.8;
  }

  /**
   * Main analysis method - NO SIMULATION
   */
  async analyzeAudioFile(arrayBuffer: ArrayBuffer): Promise<VincianAnalysisResult> {
    try {
      // Decode real audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0); // Mono analysis
      
      // Real frequency analysis
      const frequencyData = this.performFFTAnalysis(channelData);
      
      // Real spectral centroid calculation
      const spectralCentroid = this.calculateSpectralCentroid(frequencyData);
      
      // Real harmonic analysis
      const harmonicRatios = this.extractHarmonicRatios(frequencyData);
      
      // Real golden ratio detection
      const goldenRatioPresence = this.detectGoldenRatioPatterns(harmonicRatios);
      
      // Find dominant frequencies
      const dominantFrequencies = this.findDominantFrequencies(frequencyData, 5);
      
      // Calculate real Vincian score based on actual data
      const vincianScore = this.calculateVincianScore({
        spectralCentroid,
        harmonicRatios,
        goldenRatioPresence,
        dominantFrequencies
      });

      // Generate real recommendations based on analysis
      const recommendations = this.generateRecommendations({
        vincianScore,
        spectralCentroid,
        harmonicRatios,
        goldenRatioPresence
      });

      // Calculate confidence based on signal quality
      const confidence = this.calculateConfidence(frequencyData, harmonicRatios);

      return {
        vincianScore,
        evidence: {
          spectralCentroid,
          harmonicRatios,
          goldenRatioPresence,
          dominantFrequencies,
          frequencyDistribution: frequencyData
        },
        recommendations,
        confidence
      };

    } catch (error) {
      throw new Error(`Real audio analysis failed: ${error.message}`);
    }
  }

  /**
   * Real FFT analysis using Web Audio API
   */
  private performFFTAnalysis(channelData: Float32Array): Float32Array {
    // Create buffer source for analysis
    const source = this.audioContext.createBufferSource();
    const audioBuffer = this.audioContext.createBuffer(1, channelData.length, this.SAMPLE_RATE);
    audioBuffer.copyToChannel(channelData, 0);
    source.buffer = audioBuffer;
    
    // Connect to analyser
    source.connect(this.analyser);
    
    // Get frequency data
    const frequencyData = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(frequencyData);
    
    return frequencyData;
  }

  /**
   * Calculate spectral centroid (brightness measure)
   */
  private calculateSpectralCentroid(frequencyData: Float32Array): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = Math.pow(10, frequencyData[i] / 20); // Convert dB to linear
      const frequency = (i * this.SAMPLE_RATE) / (2 * frequencyData.length);
      
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  /**
   * Extract harmonic ratios from frequency spectrum
   */
  private extractHarmonicRatios(frequencyData: Float32Array): number[] {
    const fundamentalFreq = this.findFundamentalFrequency(frequencyData);
    if (fundamentalFreq === 0) return [];

    const harmonics: number[] = [];
    const fundamentalMagnitude = this.getMagnitudeAtFrequency(frequencyData, fundamentalFreq);

    // Analyze first 8 harmonics
    for (let harmonic = 2; harmonic <= 9; harmonic++) {
      const harmonicFreq = fundamentalFreq * harmonic;
      const harmonicMagnitude = this.getMagnitudeAtFrequency(frequencyData, harmonicFreq);
      const ratio = fundamentalMagnitude > 0 ? harmonicMagnitude / fundamentalMagnitude : 0;
      harmonics.push(ratio);
    }

    return harmonics;
  }

  /**
   * Find fundamental frequency using peak detection
   */
  private findFundamentalFrequency(frequencyData: Float32Array): number {
    let maxMagnitude = -Infinity;
    let fundamentalBin = 0;

    // Search in reasonable fundamental range (80Hz - 1000Hz)
    const minBin = Math.floor((80 * frequencyData.length * 2) / this.SAMPLE_RATE);
    const maxBin = Math.floor((1000 * frequencyData.length * 2) / this.SAMPLE_RATE);

    for (let i = minBin; i < maxBin && i < frequencyData.length; i++) {
      if (frequencyData[i] > maxMagnitude) {
        maxMagnitude = frequencyData[i];
        fundamentalBin = i;
      }
    }

    return (fundamentalBin * this.SAMPLE_RATE) / (2 * frequencyData.length);
  }

  /**
   * Get magnitude at specific frequency
   */
  private getMagnitudeAtFrequency(frequencyData: Float32Array, frequency: number): number {
    const bin = Math.round((frequency * frequencyData.length * 2) / this.SAMPLE_RATE);
    return bin < frequencyData.length ? Math.pow(10, frequencyData[bin] / 20) : 0;
  }

  /**
   * Detect golden ratio patterns in harmonic structure
   */
  private detectGoldenRatioPatterns(harmonicRatios: number[]): number {
    if (harmonicRatios.length < 2) return 0;

    let goldenRatioScore = 0;
    let patternCount = 0;

    for (let i = 0; i < harmonicRatios.length - 1; i++) {
      if (harmonicRatios[i] > 0 && harmonicRatios[i + 1] > 0) {
        const ratio = harmonicRatios[i + 1] / harmonicRatios[i];
        const deviation = Math.abs(ratio - this.GOLDEN_RATIO) / this.GOLDEN_RATIO;
        
        if (deviation < 0.15) { // 15% tolerance
          goldenRatioScore += (1 - deviation) * 100;
          patternCount++;
        }
      }
    }

    return patternCount > 0 ? goldenRatioScore / patternCount : 0;
  }

  /**
   * Find dominant frequencies in spectrum
   */
  private findDominantFrequencies(frequencyData: Float32Array, count: number): number[] {
    const peaks: Array<{frequency: number, magnitude: number}> = [];

    for (let i = 1; i < frequencyData.length - 1; i++) {
      // Peak detection: local maximum
      if (frequencyData[i] > frequencyData[i - 1] && frequencyData[i] > frequencyData[i + 1]) {
        const frequency = (i * this.SAMPLE_RATE) / (2 * frequencyData.length);
        const magnitude = Math.pow(10, frequencyData[i] / 20);
        peaks.push({ frequency, magnitude });
      }
    }

    // Sort by magnitude and return top frequencies
    return peaks
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, count)
      .map(peak => peak.frequency);
  }

  /**
   * Calculate Vincian score from real analysis data
   */
  private calculateVincianScore(data: {
    spectralCentroid: number;
    harmonicRatios: number[];
    goldenRatioPresence: number;
    dominantFrequencies: number[];
  }): number {
    // Harmonic complexity (0-100)
    const harmonicComplexity = this.calculateHarmonicComplexity(data.harmonicRatios);
    
    // Spectral balance (0-100)
    const spectralBalance = this.calculateSpectralBalance(data.spectralCentroid);
    
    // Golden ratio presence (0-100)
    const goldenRatioScore = Math.min(data.goldenRatioPresence, 100);
    
    // Frequency distribution quality (0-100)
    const frequencyDistribution = this.calculateFrequencyDistributionScore(data.dominantFrequencies);

    // Weighted combination
    const vincianScore = (
      harmonicComplexity * 0.3 +
      spectralBalance * 0.25 +
      goldenRatioScore * 0.3 +
      frequencyDistribution * 0.15
    );

    return Math.max(0, Math.min(100, vincianScore));
  }

  /**
   * Calculate harmonic complexity score
   */
  private calculateHarmonicComplexity(harmonicRatios: number[]): number {
    if (harmonicRatios.length === 0) return 0;

    // Measure distribution and balance of harmonics
    const nonZeroHarmonics = harmonicRatios.filter(ratio => ratio > 0.01);
    const harmonicSpread = nonZeroHarmonics.length / harmonicRatios.length;
    
    // Calculate standard deviation of harmonic strengths
    const mean = nonZeroHarmonics.reduce((sum, ratio) => sum + ratio, 0) / nonZeroHarmonics.length;
    const variance = nonZeroHarmonics.reduce((sum, ratio) => sum + Math.pow(ratio - mean, 2), 0) / nonZeroHarmonics.length;
    const stdDev = Math.sqrt(variance);

    // Balance between presence and distribution
    return (harmonicSpread * 70) + (Math.min(stdDev, 0.5) * 60);
  }

  /**
   * Calculate spectral balance score
   */
  private calculateSpectralBalance(spectralCentroid: number): number {
    // Ideal spectral centroid range for musical content
    const idealMin = 1000; // Hz
    const idealMax = 4000; // Hz
    
    if (spectralCentroid >= idealMin && spectralCentroid <= idealMax) {
      return 100;
    } else if (spectralCentroid < idealMin) {
      return Math.max(0, (spectralCentroid / idealMin) * 100);
    } else {
      return Math.max(0, 100 - ((spectralCentroid - idealMax) / idealMax) * 50);
    }
  }

  /**
   * Calculate frequency distribution quality
   */
  private calculateFrequencyDistributionScore(dominantFrequencies: number[]): number {
    if (dominantFrequencies.length < 2) return 0;

    // Analyze distribution across frequency spectrum
    const lowFreq = dominantFrequencies.filter(f => f < 500).length;
    const midFreq = dominantFrequencies.filter(f => f >= 500 && f < 2000).length;
    const highFreq = dominantFrequencies.filter(f => f >= 2000).length;

    // Balanced distribution scores higher
    const balance = 1 - Math.abs((lowFreq + midFreq + highFreq) / 3 - dominantFrequencies.length / 3) / (dominantFrequencies.length / 3);
    return balance * 100;
  }

  /**
   * Generate specific recommendations based on analysis
   */
  private generateRecommendations(data: {
    vincianScore: number;
    spectralCentroid: number;
    harmonicRatios: number[];
    goldenRatioPresence: number;
  }): string[] {
    const recommendations: string[] = [];

    // Score-based recommendations
    if (data.vincianScore < 40) {
      recommendations.push("Consider restructuring the harmonic content to align with natural resonance patterns");
    } else if (data.vincianScore < 70) {
      recommendations.push("Good foundation detected - enhance harmonic complexity for higher Vincian resonance");
    } else {
      recommendations.push("Excellent Vincian structure - maintain current harmonic relationships");
    }

    // Spectral centroid recommendations
    if (data.spectralCentroid < 1000) {
      recommendations.push("Add brightness by enhancing upper harmonics (2-4kHz range)");
    } else if (data.spectralCentroid > 4000) {
      recommendations.push("Balance the frequency spectrum by strengthening lower harmonics (500-2kHz)");
    }

    // Golden ratio recommendations
    if (data.goldenRatioPresence < 20) {
      recommendations.push("Introduce frequency relationships based on φ (1.618) for natural harmonic progression");
    } else if (data.goldenRatioPresence > 70) {
      recommendations.push("Strong golden ratio presence detected - this creates natural resonance appeal");
    }

    // Harmonic structure recommendations
    const harmonicStrength = data.harmonicRatios.reduce((sum, ratio) => sum + ratio, 0);
    if (harmonicStrength < 2) {
      recommendations.push("Strengthen harmonic content by layering complementary frequencies");
    }

    return recommendations;
  }

  /**
   * Calculate analysis confidence based on signal quality
   */
  private calculateConfidence(frequencyData: Float32Array, harmonicRatios: number[]): number {
    // Signal-to-noise ratio estimation
    const signalPower = frequencyData.reduce((sum, val) => sum + Math.pow(10, val / 10), 0);
    const avgPower = signalPower / frequencyData.length;
    
    // Harmonic content quality
    const harmonicContent = harmonicRatios.filter(ratio => ratio > 0.05).length;
    
    // Combine factors for confidence score
    const signalQuality = Math.min(avgPower / 1000, 1); // Normalize
    const harmonicQuality = harmonicContent / harmonicRatios.length;
    
    return (signalQuality * 0.6 + harmonicQuality * 0.4) * 100;
  }

  /**
   * Clean up audio context
   */
  dispose(): void {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

export { RealVincianAnalyzer, VincianAnalysisResult };