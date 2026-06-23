'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- Constants and State ---
    const RAMP_TIME = 0.05; // Smooth transition time for audio parameters
    const DEFAULT_SELECTION = '731.35'; // Default value (can be frequency or noise ID)
    const DEFAULT_MULTIPLIER = 1;
    const NOISE_BUFFER_DURATION = 5; // Seconds for the noise buffer
    const MAX_FILTER_FREQ = 20000; // Max cutoff for noise filter

    // --- Data ---
    const audioSourcesData = [
        // Frequencies
        { value: '174', type: 'frequency', label: "174 Hz - Deep Relief", description: "eases pain, grounds energy, fosters security, soothes tension" },
        { value: '285', type: 'frequency', label: "285 Hz - Healing Pulse", description: "heals tissues, boosts vitality, sparks rejuvenation, energizes cells" },
        { value: '396', type: 'frequency', label: "396 Hz - Fearless Joy", description: "frees fear, sparks joy, clears guilt, anchors stability" },
        { value: '417', type: 'frequency', label: "417 Hz - Transformative Shift", description: "clears trauma, enables change, opens pathways, dissolves blockages" },
        { value: '432', type: 'frequency', label: "432 Hz - Cosmic Harmony", description: "promotes peace, aligns harmony, calms mind, resonates universally" },
        { value: '444', type: 'frequency', label: "444 Hz - Earth's Embrace", description: "grounds energy, connects nature, nurtures stability, boosts calm" },
        { value: '528', type: 'frequency', label: "528 Hz - Love's Miracle", description: "radiates love, fosters miracles, heals DNA, ignites transformation" },
        { value: '639', type: 'frequency', label: "639 Hz - Heart Connection", description: "deepens love, enhances communication, fosters harmony, builds trust" },
        { value: '731.35', type: 'frequency', label: "731.35 Hz - Most Beneficial", description: "sharpens clarity, ignites motivation, eases tension, boosts focus" },
        { value: '741', type: 'frequency', label: "741 Hz - Intuitive Clarity", description: "awakens intuition, purifies energy, enhances expression, clears negativity" },
        { value: '852', type: 'frequency', label: "852 Hz - Spiritual Awakening", description: "elevates intuition, aligns clarity, uplifts energy, opens wisdom" },
        { value: '963', type: 'frequency', label: "963 Hz - Divine Oneness", description: "connects spirit, activates pineal, restores oneness, uplifts light" },
         // Noises - Added at the end
        { value: 'brown', type: 'noise', label: "Brown Noise - Deep Calm", description: "promotes deep relaxation, masks disruptive sounds, aids sleep induction, enhances focus depth" },
        { value: 'pink', type: 'noise', label: "Pink Noise - Balanced Focus", description: "improves concentration span, reduces cognitive load, balances audio spectrum, mimics natural sounds" },
    ];

    // --- Audio Context and Nodes ---
    let audioCtx = null;
    let gainNode = null;
    let oscillator = null;       // For frequencies
    let noiseSource = null;      // For noise (AudioBufferSourceNode)
    let noiseFilter = null;      // For noise shaping (BiquadFilterNode)
    let noiseBuffer = null;      // Pre-generated white noise buffer

    // --- State Variables ---
    let isPlaying = false;
    let selectedSourceValue = DEFAULT_SELECTION; // Can be frequency (string) or noise ID ('brown', 'pink')
    let currentMultiplier = DEFAULT_MULTIPLIER;
    let currentVolume = 0.25;
    let currentAudioNodeType = 'frequency'; // 'frequency' or 'noise'

    // --- DOM Elements ---
    const frequencySelect = document.getElementById('frequency-select');
    const frequencyDescription = document.getElementById('frequency-description');
    const multiplierSlider = document.getElementById('multiplier-slider');
    const actualFrequencyDisplay = document.getElementById('actual-frequency-display');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    const playStopButton = document.getElementById('play-stop-button');
    const starContainer = document.getElementById('star-container');

    // Play/Stop icons SVG paths
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
                 // Generate noise buffer once during initialization
                generateNoiseBuffer();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser:", e);
                alert("Sorry, the Web Audio API is needed for this player to work.");
                disableControls();
                return false; // Indicate failure
            }
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return true; // Indicate success or already initialized
    }

     // --- Noise Buffer Generation ---
    function generateNoiseBuffer() {
        if (!audioCtx || noiseBuffer) return; // Only generate if context exists and not already generated

        const bufferSize = audioCtx.sampleRate * NOISE_BUFFER_DURATION;
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        // Fill buffer with white noise (random values between -1 and 1)
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        console.log("Noise buffer generated.");
    }

    // --- UI Update Functions ---
    function updateFrequencyDescription() {
        const selectedData = audioSourcesData.find(f => f.value === selectedSourceValue);
        if (selectedData) {
            frequencyDescription.innerHTML = '• ' + selectedData.description.replace(/,\s*/g, '<br>• ');
        } else {
            frequencyDescription.textContent = 'Select a base tone or noise.';
        }
         currentAudioNodeType = selectedData ? selectedData.type : 'frequency'; // Update type
    }

    function updateActualFrequencyDisplay() {
        let text = ''; // Initialize empty text
        const selectedData = audioSourcesData.find(f => f.value === selectedSourceValue);

        if (selectedData) {
            if (selectedData.type === 'frequency') {
                const baseFreq = parseFloat(selectedData.value);
                const actualFrequency = baseFreq * currentMultiplier;
                // For frequencies, keep it on one line (or modify if you want breaks here too)
                text = `Actual: ${actualFrequency.toFixed(2)} Hz (${currentMultiplier.toFixed(2)}x)`;
            } else if (selectedData.type === 'noise') {
                // For noise, insert a <br> tag before the multiplier part
                text = `${selectedData.label}<br>(Multiplier: ${currentMultiplier.toFixed(2)}x)`;
            }
        }
        // --- Use innerHTML instead of textContent ---
        // This allows the <br> tag to be rendered as a line break
        actualFrequencyDisplay.innerHTML = text;

        // Keep ARIA update as is
        multiplierSlider.setAttribute('aria-valuenow', currentMultiplier);
    }

    function updateVolumeDisplay() {
        const volumePercent = Math.round(currentVolume * 100);
        volumeDisplay.textContent = `Volume: ${volumePercent}%`;
        volumeSlider.setAttribute('aria-valuenow', currentVolume);
    }

    function updatePlayButton(playing) {
        isPlaying = playing;
        playStopButton.innerHTML = isPlaying ? stopIconSVG : playIconSVG;
        playStopButton.setAttribute('aria-label', isPlaying ? 'Stop sound' : 'Play sound');
        playStopButton.classList.toggle('active', isPlaying);
    }

    function disableControls() {
        frequencySelect.disabled = true;
        multiplierSlider.disabled = true;
        volumeSlider.disabled = true;
        playStopButton.disabled = true;
        playStopButton.style.opacity = '0.5';
        playStopButton.style.cursor = 'not-allowed';
    }

    // --- Populate Dropdown ---
    function populateFrequencyDropdown() {
        audioSourcesData.forEach(source => {
            const option = document.createElement('option');
            option.value = source.value;
            option.textContent = source.label;
            frequencySelect.appendChild(option);
        });
    }

    // --- Set Default Selection ---
    function setDefaultSelection() {
        frequencySelect.value = DEFAULT_SELECTION;
        selectedSourceValue = DEFAULT_SELECTION;
        updateFrequencyDescription(); // Updates type as well

        multiplierSlider.value = DEFAULT_MULTIPLIER;
        currentMultiplier = DEFAULT_MULTIPLIER;
        updateActualFrequencyDisplay();
    }

    // --- Audio Control Functions ---

    // Calculates the filter cutoff frequency based on noise type and multiplier
    function calculateNoiseFilterCutoff(noiseType, multiplier) {
        // Map multiplier (1-35) to a frequency range. Use exponential scale for better feel.
        const minLog = Math.log(100); // Min cutoff ~100Hz
        const maxLog = Math.log(MAX_FILTER_FREQ);
        const scale = (maxLog - minLog) / (35 - 1); // Scale factor based on max multiplier

        // Adjust base and range slightly based on noise type for character
        let baseFreq = (noiseType === 'brown') ? 80 : 150; // Brown starts lower
        let effectiveMaxLog = (noiseType === 'brown') ? maxLog * 0.85 : maxLog; // Brown tops out lower
        let effectiveScale = (effectiveMaxLog - Math.log(baseFreq)) / (35 - 1);

        // Calculate cutoff using exponential scaling
        let cutoff = Math.exp(Math.log(baseFreq) + effectiveScale * (multiplier - 1) );

        return Math.min(cutoff, MAX_FILTER_FREQ); // Clamp to max
    }

    function startSound() {
        if (!initializeAudio()) return; // Ensure context is ready and noise buffer exists

        stopSound(true); // Stop any existing sound first (silent stop)

        if (currentAudioNodeType === 'frequency') {
            createAndStartOscillator();
        } else {
            createAndStartNoiseSource();
        }
    }

    function createAndStartOscillator() {
        oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        const targetFrequency = parseFloat(selectedSourceValue) * currentMultiplier;
        oscillator.frequency.setValueAtTime(targetFrequency, audioCtx.currentTime);
        oscillator.connect(gainNode);
        oscillator.start();
        console.log(`Starting oscillator at ${targetFrequency} Hz`);

        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, RAMP_TIME);
        updatePlayButton(true);
    }

    function createAndStartNoiseSource() {
         if (!noiseBuffer) {
            console.error("Noise buffer not available.");
            return; // Should have been generated by initializeAudio
        }

        // Create Source
        noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        // Create Filter
        noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'lowpass'; // We use lowpass and adjust cutoff/Q to simulate brown/pink
        noiseFilter.Q.setValueAtTime(1, audioCtx.currentTime); // Low resonance

        // Calculate and set initial cutoff based on multiplier and noise type
        const initialCutoff = calculateNoiseFilterCutoff(selectedSourceValue, currentMultiplier);
        noiseFilter.frequency.setValueAtTime(initialCutoff, audioCtx.currentTime);
        console.log(`Starting ${selectedSourceValue} noise with initial cutoff: ${initialCutoff.toFixed(0)} Hz`);

        // Connect nodes: Source -> Filter -> Gain -> Destination
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(gainNode);

        // Start playback
        noiseSource.start();

        // Fade in volume
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, RAMP_TIME);
        updatePlayButton(true);
    }

    function stopSound(silent = false) { // silent flag prevents UI update if we are just switching sounds
        let nodeStopped = false;

        if (gainNode && audioCtx) {
            gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
            gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, RAMP_TIME); // Fade out
        }

        const stopDelay = (RAMP_TIME + 0.05) * 1000; // Delay slightly longer than ramp

        // Stop Oscillator if active
        if (oscillator) {
            try {
                oscillator.stop(audioCtx.currentTime + RAMP_TIME + 0.01);
                nodeStopped = true;
            } catch (e) { console.warn("Error stopping oscillator:", e); }
            oscillator.onended = () => { }; // Clear handler
             // Disconnect after stop time
            setTimeout(() => {
                 if (oscillator) {
                    try { oscillator.disconnect(); } catch (e) {}
                    oscillator = null;
                    if (!silent) updatePlayButton(false);
                }
            }, stopDelay);
        }

        // Stop Noise Source if active
        if (noiseSource) {
            try {
                noiseSource.stop(audioCtx.currentTime + RAMP_TIME + 0.01);
                 nodeStopped = true;
            } catch(e) { console.warn("Error stopping noise source:", e); }
            noiseSource.onended = () => { }; // Clear handler
            // Disconnect after stop time
             setTimeout(() => {
                if (noiseSource) {
                    try { noiseSource.disconnect(); } catch (e) {}
                    noiseSource = null;
                }
                if (noiseFilter) {
                    try { noiseFilter.disconnect(); } catch (e) {}
                    noiseFilter = null;
                }
                if (!silent) updatePlayButton(false);
            }, stopDelay);
        }

        // If no node was active but stop was requested, ensure button is updated
        if (!nodeStopped && !silent) {
            updatePlayButton(false);
        }
    }


    // Update audio parameters (frequency or filter cutoff) when sliders change
    function updateAudioParameters() {
        if (!isPlaying || !audioCtx || !gainNode) return;

        // Update Volume Gain
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, RAMP_TIME);

        // Update specific source parameters
        if (currentAudioNodeType === 'frequency' && oscillator) {
            const targetFrequency = parseFloat(selectedSourceValue) * currentMultiplier;
             if(targetFrequency > 0 && targetFrequency <= audioCtx.sampleRate / 2) {
                 oscillator.frequency.cancelScheduledValues(audioCtx.currentTime);
                 oscillator.frequency.setTargetAtTime(targetFrequency, audioCtx.currentTime, RAMP_TIME);
             } else {
                 console.warn(`Target frequency ${targetFrequency} Hz is out of valid range.`);
             }

        } else if (currentAudioNodeType === 'noise' && noiseFilter) {
            const targetCutoff = calculateNoiseFilterCutoff(selectedSourceValue, currentMultiplier); // selectedSourceValue is 'brown' or 'pink'
            noiseFilter.frequency.cancelScheduledValues(audioCtx.currentTime);
            noiseFilter.frequency.setTargetAtTime(targetCutoff, audioCtx.currentTime, RAMP_TIME);
            // console.log(`Updating noise filter cutoff to: ${targetCutoff.toFixed(0)} Hz`);
        }
    }

   // --- Event Listeners ---
   frequencySelect.addEventListener('change', () => {
        const previousType = currentAudioNodeType;
        selectedSourceValue = frequencySelect.value;
        updateFrequencyDescription(); // This updates currentAudioNodeType
        updateActualFrequencyDisplay();

        if (isPlaying) {
             // If the *type* of sound changes (freq <-> noise), restart the sound
            if (currentAudioNodeType !== previousType) {
                startSound(); // stopSound(true) is called within startSound
            } else {
                // If type is the same, just update parameters
                updateAudioParameters();
            }
        }
    });

    multiplierSlider.addEventListener('input', () => {
        currentMultiplier = parseFloat(multiplierSlider.value);
        updateActualFrequencyDisplay();
        if (isPlaying) {
            updateAudioParameters(); // Update frequency or filter cutoff
        }
    });

    volumeSlider.addEventListener('input', () => {
        currentVolume = parseFloat(volumeSlider.value);
        updateVolumeDisplay();
        if (isPlaying && gainNode && audioCtx) {
            // Apply volume change immediately even if sound source params don't change
            gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
            gainNode.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, RAMP_TIME);
        } else if (gainNode) {
             // Update gain node's base value even when stopped, so it starts at correct volume
             gainNode.gain.value = currentVolume;
        }
    });

    playStopButton.addEventListener('click', () => {
        if (!initializeAudio()) return; // Make sure context is available on first click

        if (isPlaying) {
            stopSound();
        } else {
            startSound();
        }
    });

    // --- Background Star Effect --- (Keep addStars function as is)
    function addStars(count = 150) {
        if (!starContainer) return;
        starContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 2.5 + 0.5;
            const duration = Math.random() * 1.5 + 1.5;
            const delay = Math.random() * 2;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDuration = `${duration}s`;
            star.style.animationDelay = `${delay}s`;
            starContainer.appendChild(star);
        }
    }

    // --- Initial Setup ---
    populateFrequencyDropdown();
    setDefaultSelection();
    updateVolumeDisplay();
    updatePlayButton(false);
    addStars();

}); // End DOMContentLoaded
