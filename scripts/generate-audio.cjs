/**
 * Generate simple synthesized audio files (WAV) for VitaBalance.
 * Run with: node scripts/generate-audio.js
 *
 * Creates .mp3 files in public/assets/audio/ using raw WAV generation
 * (no external dependencies needed).
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'audio');
const SAMPLE_RATE = 44100;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Create a WAV file buffer from raw PCM samples (16-bit mono).
 */
function createWav(samples) {
    const numSamples = samples.length;
    const byteRate = SAMPLE_RATE * 2; // 16-bit mono
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // chunk size
    buffer.writeUInt16LE(1, 20); // PCM format
    buffer.writeUInt16LE(1, 22); // mono
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(2, 32); // block align
    buffer.writeUInt16LE(16, 34); // bits per sample

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < numSamples; i++) {
        const sample = Math.max(-1, Math.min(1, samples[i]));
        const int16 = Math.round(sample * 32767);
        buffer.writeInt16LE(int16, 44 + i * 2);
    }

    return buffer;
}

/**
 * Generate a sine wave tone.
 */
function sine(freq, duration, volume = 0.5) {
    const numSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.min(1, Math.min(t * 20, (duration - t) * 20)); // fade in/out
        samples[i] = Math.sin(2 * Math.PI * freq * t) * volume * envelope;
    }
    return samples;
}

/**
 * Mix multiple sample arrays together.
 */
function mix(...arrays) {
    const maxLen = Math.max(...arrays.map(a => a.length));
    const result = new Float64Array(maxLen);
    for (const arr of arrays) {
        for (let i = 0; i < arr.length; i++) {
            result[i] += arr[i];
        }
    }
    // Normalize if clipping
    let peak = 0;
    for (let i = 0; i < maxLen; i++) {
        peak = Math.max(peak, Math.abs(result[i]));
    }
    if (peak > 1) {
        for (let i = 0; i < maxLen; i++) {
            result[i] /= peak;
        }
    }
    return result;
}

/**
 * Concatenate sample arrays sequentially.
 */
function concat(...arrays) {
    const totalLen = arrays.reduce((sum, a) => sum + a.length, 0);
    const result = new Float64Array(totalLen);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

/**
 * Add silence.
 */
function silence(duration) {
    return new Float64Array(Math.floor(SAMPLE_RATE * duration));
}

/**
 * Generate noise burst (for percussion-like sounds).
 */
function noise(duration, volume = 0.3) {
    const numSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.exp(-t * 15); // fast decay
        samples[i] = (Math.random() * 2 - 1) * volume * envelope;
    }
    return samples;
}

// ─── Sound Definitions ─────────────────────────────────────────────────────────

// sfx-correct: Happy ascending chime (C5 → E5 → G5)
function generateCorrect() {
    const note1 = sine(523.25, 0.12, 0.4); // C5
    const note2 = sine(659.25, 0.12, 0.4); // E5
    const note3 = sine(783.99, 0.18, 0.5); // G5
    return concat(note1, note2, note3);
}

// sfx-spoiled: Low warning buzz (descending)
function generateSpoiled() {
    const numSamples = Math.floor(SAMPLE_RATE * 0.35);
    const samples = new Float64Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        const t = i / SAMPLE_RATE;
        const freq = 200 - t * 150; // descending
        const envelope = Math.exp(-t * 4);
        samples[i] = (Math.sin(2 * Math.PI * freq * t) * 0.3 +
            Math.sin(2 * Math.PI * freq * 2.01 * t) * 0.15) * envelope;
    }
    return samples;
}

// sfx-unsolicited: Neutral soft thud
function generateUnsolicited() {
    const thud = noise(0.15, 0.25);
    const tone = sine(180, 0.1, 0.2);
    return mix(thud, tone);
}

// sfx-victory: Triumphant fanfare (C major arpeggio + octave)
function generateVictory() {
    const c5 = sine(523.25, 0.15, 0.35);
    const e5 = sine(659.25, 0.15, 0.35);
    const g5 = sine(783.99, 0.15, 0.35);
    const c6 = sine(1046.50, 0.4, 0.45);
    const gap = silence(0.03);
    return concat(c5, gap, e5, gap, g5, gap, c6);
}

// sfx-gameover: Sad descending tones
function generateGameover() {
    const g4 = sine(392.00, 0.2, 0.35);
    const f4 = sine(349.23, 0.2, 0.35);
    const eb4 = sine(311.13, 0.2, 0.35);
    const d4 = sine(293.66, 0.4, 0.3);
    const gap = silence(0.05);
    return concat(g4, gap, f4, gap, eb4, gap, d4);
}

// bgm-level: Simple looping melody (short, 8 bars at ~120 BPM)
function generateBgm() {
    const bpm = 120;
    const beatDuration = 60 / bpm;
    const noteLen = beatDuration * 0.45;

    // C major pentatonic melody pattern
    const melody = [
        523.25, 587.33, 659.25, 783.99, 880.00,  // ascending
        783.99, 659.25, 587.33, 523.25, 440.00,  // descending
        523.25, 659.25, 783.99, 880.00, 783.99,  // variation
        659.25, 523.25, 440.00, 523.25, 523.25,  // resolve
    ];

    // Bass notes (root following)
    const bassNotes = [
        130.81, 130.81, 146.83, 146.83, 164.81,
        164.81, 146.83, 146.83, 130.81, 130.81,
        130.81, 146.83, 164.81, 164.81, 146.83,
        146.83, 130.81, 130.81, 130.81, 130.81,
    ];

    const parts = [];
    for (let i = 0; i < melody.length; i++) {
        const melodyTone = sine(melody[i], noteLen, 0.2);
        const bassTone = sine(bassNotes[i], noteLen, 0.12);
        const combined = mix(melodyTone, bassTone);
        const gap = silence(beatDuration - noteLen);
        parts.push(combined, gap);
    }

    // Repeat the pattern 3 times for a longer loop (~30 seconds)
    const oneLoop = concat(...parts);
    return concat(oneLoop, oneLoop, oneLoop);
}

// ─── Generate and Save ─────────────────────────────────────────────────────────

const sounds = [
    { name: 'sfx-correct', generate: generateCorrect },
    { name: 'sfx-spoiled', generate: generateSpoiled },
    { name: 'sfx-unsolicited', generate: generateUnsolicited },
    { name: 'sfx-victory', generate: generateVictory },
    { name: 'sfx-gameover', generate: generateGameover },
    { name: 'bgm-level', generate: generateBgm },
];

for (const sound of sounds) {
    const samples = sound.generate();
    const wavBuffer = createWav(Array.from(samples));
    // Save as .mp3 extension but WAV content — Phaser handles both
    // Actually let's save as .wav and update the loader
    const filePath = path.join(OUTPUT_DIR, `${sound.name}.wav`);
    fs.writeFileSync(filePath, wavBuffer);
    console.log(`Generated: ${filePath} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);
}

console.log('\nDone! All audio files generated.');
console.log('Note: Files are WAV format. Update PreloadScene to use .wav extension.');
