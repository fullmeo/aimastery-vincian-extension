# ===== AUDIO ANALYSIS TOOLKITS =====

# 1. WEB AUDIO API - Native browser audio
# Pas d'installation, API native JavaScript
# const audioContext = new AudioContext();

# 2. TONE.JS - Audio synthesis & analysis
npm install tone
# Framework audio complet

# 3. MEYDA - Audio feature extraction
npm install meyda
# Spectral analysis, MFCC, ZCR

# 4. PITCHFINDER - Pitch detection
npm install pitchfinder
# Détection de hauteur

# 5. PEAK-DETECTION - Peak finding
npm install ml-peak-finding
# Détection de pics dans spectres

# 6. FFT-JS - Fast Fourier Transform
npm install fft-js
# Transformation Fourier rapide

# 7. AUDIO-BUFFER-UTILS - Audio buffer manipulation
npm install audio-buffer-utils
# Manipulation des buffers audio

# 8. WAVEFILE - WAV file processing
npm install wavefile
# Lecture/écriture fichiers WAV

# 9. NODE-FFMPEG - Audio conversion
npm install fluent-ffmpeg
# Conversion formats audio

# 10. ML-MATRIX - Mathematical operations
npm install ml-matrix
# Calculs matriciels pour DSP

# EXEMPLE VINCIAN ANALYSIS:
/*
import { Meyda } from 'meyda';
import { fft } from 'fft-js';

class VincianAudioAnalyzer {
    analyzeHarmonics(audioBuffer) {
        const features = Meyda.extract([
            'spectralCentroid',
            'spectralRolloff', 
            'mfcc',
            'chroma'
        ], audioBuffer);
        
        return this.calculateVincianScore(features);
    }
}
*/