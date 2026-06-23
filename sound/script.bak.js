'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- Constants and State ---
    const BASE_FREQUENCY = 731.35;
    const MAX_MULTIPLIER = 35;
    const RAMP_TIME = 0.05; // Smooth transition time for frequency/gain changes (in seconds)

    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;
    let isPlaying = false;
    let currentMultiplier = 1;
    let currentVolume = 0.25;
    let currentWaveform = 'sine'; // Default waveform

    // Pre-calculate frequencies (improves performance slightly)
    const frequencies = Array.from({ length: MAX_MULTIPLIER }, (_, i) => ({
        multiple: i + 1,
        frequency: BASE_FREQUENCY * (i + 1)
    }));

    // --- DOM Elements ---
    const multiplierSlider = document.getElementById('multiplier-slider');
    const frequencyDisplay = document.getElementById('frequency-display');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    const playStopButton = document.getElementById('play-stop-button');
    const waveformSelect = document.getElementById('waveform-select');
    const starContainer = document.getElementById('star-container');

    // Play/Stop icons (SVG paths)
    const playIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="20" height="20" fill="currentColor"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg> Play';
    const stopIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="20" height="20" fill="currentColor"><path d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"/></svg> Stop';

    // --- Audio Initialization ---
    function initializeAudio() {
        if (!audioCtx) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
                gainNode = audioCtx.createGain();
                gainNode.connect(audioCtx.destination);
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Start muted
            } catch (e) {
                console.error("Web Audio API is not supported in this browser:", e);
                alert("Sorry, the Web Audio API is needed for this player to work.");
                // Disable controls if AudioContext fails
                disableControls();
            }
        }
        // Resume context on user interaction (required by browsers)
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // --- UI Update Functions ---
    function updateFrequencyDisplay() {
        const freqData = frequencies[currentMultiplier - 1];
        const displayFreq = freqData.frequency.toFixed(2);
        frequencyDisplay.textContent = `${freqData.multiple}x - ${displayFreq} Hz`;
        // Update ARIA value for accessibility
        multiplierSlider.setAttribute('aria-valuenow', currentMultiplier);
    }

    function updateVolumeDisplay() {
        const volumePercent = Math.round(currentVolume * 100);
        volumeDisplay.textContent = `Volume: ${volumePercent}%`;
        // Update ARIA value for accessibility
        volumeSlider.setAttribute('aria-valuenow', currentVolume);
    }

    function updatePlayButton(playing) {
        isPlaying = playing;
        playStopButton.innerHTML = isPlaying ? stopIconSVG : playIconSVG;
        playStopButton.setAttribute('aria-label', isPlaying ? 'Stop sound' : 'Play sound');
        if (isPlaying) {
            playStopButton.classList.add('active');
        } else {
            playStopButton.classList.remove('active');
        }
    }

    function disableControls() {
        multiplierSlider.disabled = true;
        volumeSlider.disabled = true;
        waveformSelect.disabled = true;
        playStopButton.disabled = true;
        playStopButton.style.opacity = '0.5';
        playStopButton.style.cursor = 'not-allowed';
    }

    // --- Audio Control Functions ---
    function startSound() {
        if (!audioCtx || !gainNode) initializeAudio(); // Initialize if not already done
        if(!audioCtx) return; // Exit if initialization failed

        // Resume context just in case it suspended again
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        if (!oscillator) {
            oscillator = audioCtx.createOscillator();
            oscillator.type = currentWaveform; // Set selected waveform
            const targetFrequency = frequencies[currentMultiplier - 1].frequency;
            // Use setTargetAtTime for smoother frequency transitions from slider interaction
             oscillator.frequency.setValueAtTime(targetFrequency, audioCtx.currentTime);

            oscillator.connect(gainNode);
            oscillator.start(); // Start the oscillator indefinitely

            // Smoothly ramp up volume
            gainNode.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, RAMP_TIME);

            updatePlayButton(true);
        }
    }

    function stopSound() {
        if (oscillator && gainNode && audioCtx) {
            // Smoothly ramp down volume before stopping
            gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, RAMP_TIME);

            // Schedule stop after ramp finishes
            oscillator.stop(audioCtx.currentTime + RAMP_TIME + 0.01); // Added small buffer
            oscillator.onended = () => {
                if(oscillator) oscillator.disconnect(); // Disconnect after stopped
                oscillator = null; // Allow creation of a new oscillator
                 // Update button only after sound fully stops IF the state hasn't changed again
                if (gainNode.gain.value < 0.01) { // Check gain value as proxy for stopped state
                   updatePlayButton(false);
                }
            };
             // Fallback in case onended doesn't fire reliably or quickly
            setTimeout(() => {
                 if (!oscillator && !isPlaying) { // Only update if state is consistent
                    updatePlayButton(false);
                 } else if (oscillator) {
                    // Force cleanup if needed
                     // console.warn("Oscillator cleanup check needed");
                 }
            }, (RAMP_TIME + 0.05) * 1000); // Timeout slightly after expected stop
        } else {
             // Ensure button state is correct if stop called unnecessarily
            updatePlayButton(false);
        }
    }


    function updateAudioParameters() {
        if (oscillator && audioCtx && gainNode) {
            const targetFrequency = frequencies[currentMultiplier - 1].frequency;
            // Smoothly change frequency and gain
            oscillator.frequency.setTargetAtTime(targetFrequency, audioCtx.currentTime, RAMP_TIME);
            gainNode.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, RAMP_TIME);
            oscillator.type = currentWaveform; // Update waveform type immediately
        }
    }

   // --- Event Listeners ---
   multiplierSlider.addEventListener('input', () => {
        currentMultiplier = parseInt(multiplierSlider.value, 10);
        updateFrequencyDisplay();
        if (isPlaying) {
            updateAudioParameters();
        }
    });

    volumeSlider.addEventListener('input', () => {
        currentVolume = parseFloat(volumeSlider.value);
        updateVolumeDisplay();
        if (isPlaying) {
            updateAudioParameters();
        } else if (gainNode) {
             // Update gainNode value even when stopped, so it starts at the right volume
             gainNode.gain.setValueAtTime(currentVolume, audioCtx ? audioCtx.currentTime : 0);
        }
    });

    waveformSelect.addEventListener('change', (event) => {
        currentWaveform = event.target.value;
        if (isPlaying) {
            updateAudioParameters();
        }
    });

    playStopButton.addEventListener('click', () => {
        initializeAudio(); // Ensure AudioContext is ready and resumed
        if (!audioCtx) return; // Don't proceed if context failed

        if (isPlaying) {
            stopSound();
        } else {
            startSound();
        }
    });

    // --- Background Star Effect ---
    function addStars(count = 150) {
        if (!starContainer) return;
        starContainer.innerHTML = ''; // Clear existing stars if any

        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';

            const size = Math.random() * 2.5 + 0.5; // Star size between 0.5px and 3px
            const duration = Math.random() * 1.5 + 1.5; // Animation duration 1.5s to 3s
            const delay = Math.random() * 2; // Animation delay up to 2s

            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`; // Use percentage for better responsiveness
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDuration = `${duration}s`;
            star.style.animationDelay = `${delay}s`;
            // Vary opacity start/end slightly per star (optional, handled in CSS keyframes now)
            // star.style.setProperty('--start-opacity', Math.random() * 0.4 + 0.2);
            // star.style.setProperty('--end-opacity', Math.random() * 0.3 + 0.7);

            starContainer.appendChild(star);
        }
    }

    // --- Initial Setup ---
    updateFrequencyDisplay();
    updateVolumeDisplay();
    updatePlayButton(false); // Set initial button state to 'Play'
    addStars(); // Generate background stars

}); // End DOMContentLoaded