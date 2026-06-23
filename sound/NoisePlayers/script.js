document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('noise-player-container');
    let audioContext;
    let whiteNoiseBuffer = null;
    let activeNodes = null;
    let currentlyPlayingNoiseType = null;

    // --- Configuration ---
    const NOISE_SPECTRUM_BANDS = 30; // Increased granularity
    const START_FREQ_LABEL = "20 Hz";
    const END_FREQ_LABEL = "20 kHz";
    const defaultVolume = 0.25; // Default volume

    // --- Spectrum Generation Helpers ---
    function interpolateLinear(startVal, endVal, steps) {
        const arr = [];
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1); // Normalized step (0 to 1)
            arr.push(startVal * (1 - t) + endVal * t);
        }
        return arr;
    }

    function interpolatePeak(peakVal, baseVal, peakPositionRatio, falloff, steps) {
        // peakPositionRatio: 0 (start) to 1 (end) where the peak occurs
        // falloff: higher value means steeper drop from peak
        const arr = [];
        const peakIndex = Math.round(peakPositionRatio * (steps - 1));
        for (let i = 0; i < steps; i++) {
            const distance = Math.abs(i - peakIndex);
            const normalizedDistance = distance / (steps / 2); // Normalize distance relative to half the width
            const val = baseVal + (peakVal - baseVal) * Math.max(0, 1 - Math.pow(normalizedDistance, falloff));
            arr.push(Math.max(0, Math.min(1, val))); // Clamp between 0 and 1
        }
        return arr;
    }

    function generateConstant(value, steps) {
        return Array(steps).fill(value);
    }

    // --- Noise Definitions with Interpolated Spectra (30 bands) ---
    const noiseTypes = [
        {
            name: 'White Noise',
            description: 'Equal energy across all frequencies. Sounds like static or hiss.',
            filterType: null,
            spectrum: generateConstant(0.8, NOISE_SPECTRUM_BANDS),
            spectrumUnderwater: interpolateLinear(1.0, 0.05, NOISE_SPECTRUM_BANDS) // Strong roll-off
        },
        {
            name: 'Pink Noise',
            description: 'Energy decreases by 3dB per octave. Sounds more balanced.',
            filterType: 'biquad',
            filterParams: { type: 'lowshelf', frequency: 800, gain: -10, Q: 0.707 },
            spectrum: interpolateLinear(1.0, 0.1, NOISE_SPECTRUM_BANDS), // Gentle slope down
            spectrumUnderwater: interpolateLinear(1.0, 0.02, NOISE_SPECTRUM_BANDS) // Steeper slope underwater
        },
        {
            name: 'Brown Noise',
            description: 'Energy decreases by 6dB per octave (stronger bass). Sounds like heavy rain.',
            filterType: 'biquad',
            filterParams: { type: 'lowpass', frequency: 400, Q: 1 },
            spectrum: interpolateLinear(1.0, 0.05, NOISE_SPECTRUM_BANDS), // Steeper slope down
            spectrumUnderwater: interpolateLinear(1.0, 0.01, NOISE_SPECTRUM_BANDS) // Very steep slope underwater
        },
        {
            name: 'Green Noise',
            description: 'Mid-frequency emphasis, often likened to ambient nature sounds.',
            filterType: 'biquad',
            filterParams: { type: 'bandpass', frequency: 1500, Q: 2 },
            spectrum: interpolatePeak(1.0, 0.1, 0.4, 1.5, NOISE_SPECTRUM_BANDS), // Peak around 40% mark
            spectrumUnderwater: interpolatePeak(0.85, 0.05, 0.3, 1.8, NOISE_SPECTRUM_BANDS) // Underwater peak shifted lower, steeper falloff
        },
        {
            name: 'Blue Noise',
            description: 'Energy increases by 3dB per octave (stronger treble). Sounds like hiss.',
            filterType: 'biquad',
            filterParams: { type: 'highpass', frequency: 1000, Q: 1 },
            spectrum: interpolateLinear(0.1, 1.0, NOISE_SPECTRUM_BANDS), // Slope up
            spectrumUnderwater: interpolateLinear(0.5, 0, NOISE_SPECTRUM_BANDS) // Starts mid, drops fast underwater
        },
        {
            name: 'Violet Noise',
            description: 'Energy increases by 6dB per octave (strong high treble). Very hissy.',
            filterType: 'biquad',
            filterParams: { type: 'highshelf', frequency: 2000, gain: 15, Q: 0.707 },
            spectrum: interpolateLinear(0.05, 1.0, NOISE_SPECTRUM_BANDS), // Steep slope up
            spectrumUnderwater: interpolateLinear(0.3, 0, NOISE_SPECTRUM_BANDS) // Starts low, drops fast underwater
        },
        {
            name: 'Grey Noise',
            description: 'Psychoacoustically weighted for equal loudness perception (Approximation).',
            filterType: 'biquad',
            filterParams: { type: 'bandpass', frequency: 1500, Q: 1.5 },
             spectrum: interpolatePeak(0.9, 0.2, 0.5, 2, NOISE_SPECTRUM_BANDS), // Different peak/base than Green
            spectrumUnderwater: interpolatePeak(0.8, 0.1, 0.4, 2.2, NOISE_SPECTRUM_BANDS)
         }
    ];

    // --- Initialize Audio Context ---
    function initAudioContext() {
        // ... (no changes needed here) ...
         if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                 if (audioContext.state === 'suspended') {
                    console.log("AudioContext suspended. Resume on user interaction.");
                }
                createWhiteNoiseBuffer(); // Generate noise buffer after context creation attempt
            } catch (e) {
                console.error("Web Audio API is not supported.", e);
                alert("Sorry, your browser doesn't support the Web Audio API needed for this feature.");
                return false;
            }
        }
        if (audioContext && audioContext.state === 'suspended') {
             audioContext.resume().then(() => {
                 console.log("AudioContext resumed.");
                 if (!whiteNoiseBuffer) createWhiteNoiseBuffer();
             }).catch(e => console.error("Error resuming AudioContext:", e));
        }
        return !!audioContext;
    }

    // --- Generate White Noise Buffer ---
    function createWhiteNoiseBuffer() {
        // ... (no changes needed here) ...
       if (!audioContext || whiteNoiseBuffer) return;
        const bufferSize = audioContext.sampleRate * 2; // 2 seconds
        whiteNoiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = whiteNoiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        console.log("White noise buffer created.");
    }

    // --- Stop Currently Playing Sound ---
    function stopCurrentSound(updateUI = true) {
        // ... (no changes needed here) ...
        if (activeNodes && activeNodes.source) {
            try {
                 activeNodes.source.stop();
                activeNodes.source.disconnect();
                if (activeNodes.noiseSpecificFilter) activeNodes.noiseSpecificFilter.disconnect();
                if (activeNodes.underwaterFilter) activeNodes.underwaterFilter.disconnect();
                if (activeNodes.gain) activeNodes.gain.disconnect();
                console.log(`Stopped noise: ${currentlyPlayingNoiseType}`);
            } catch (e) {
                console.warn("Error stopping/disconnecting nodes:", e.message);
            }

            if (updateUI && currentlyPlayingNoiseType) {
                 const previousButton = container.querySelector(`.noise-player-item[data-noise-type="${currentlyPlayingNoiseType}"] .play-button`);
                if (previousButton) {
                    previousButton.classList.remove('playing');
                    previousButton.textContent = 'Listen';
                    previousButton.setAttribute('data-playing', 'false');
                }
                updateSpectrumVisual(currentlyPlayingNoiseType, false, true); // Reset to off state
            }
            activeNodes = null;
            currentlyPlayingNoiseType = null;
        }
    }

    // --- Update Spectrum Visualizer ---
     function updateSpectrumVisual(noiseType, isUnderwater, reset = false) {
        // ... (no changes needed here, uses NOISE_SPECTRUM_BANDS correctly) ...
         const item = container.querySelector(`.noise-player-item[data-noise-type="${noiseType}"]`);
        if (!item) return;
        const visualizer = item.querySelector('.spectrum-visualizer');
        const bars = visualizer.querySelectorAll('.spectrum-bar');
        const noiseData = noiseTypes.find(n => n.name === noiseType);
        if (!noiseData || !bars.length) return; // Check if bars exist

        const spectrumData = reset ? generateConstant(0, NOISE_SPECTRUM_BANDS) : (isUnderwater ? noiseData.spectrumUnderwater : noiseData.spectrum);

        // Ensure spectrumData has the correct length, pad with 0 if necessary (safety check)
         const finalSpectrumData = spectrumData.length === NOISE_SPECTRUM_BANDS ? spectrumData : [...spectrumData, ...generateConstant(0, NOISE_SPECTRUM_BANDS - spectrumData.length)];


        if (bars.length !== NOISE_SPECTRUM_BANDS) {
             console.warn(`Mismatch between bars found (${bars.length}) and expected bands (${NOISE_SPECTRUM_BANDS}) for ${noiseType}.`);
              // Attempt rebuild if needed (advanced recovery - optional)
              // rebuildSpectrumBars(visualizer, NOISE_SPECTRUM_BANDS);
              // bars = visualizer.querySelectorAll('.spectrum-bar'); // Re-query bars
              // if (bars.length !== NOISE_SPECTRUM_BANDS) return; // Exit if still wrong
        }


         try {
            bars.forEach((bar, index) => {
                if (index < finalSpectrumData.length) { // Ensure index is valid
                    const heightPercent = Math.max(0, Math.min(100, (finalSpectrumData[index] || 0) * 100));
                    bar.style.height = `${heightPercent}%`;
                    bar.classList.toggle('underwater', isUnderwater && !reset);
                } else {
                     bar.style.height = `0%`; // Handle potential mismatch gracefully
                }
             });
         } catch (e) {
             console.error("Error updating spectrum visual bars:", e);
         }
    }

    // Optional helper if needed for dynamic rebuild (more robust)
    // function rebuildSpectrumBars(visualizerElement, bandCount) {
    //     visualizerElement.innerHTML = ''; // Clear existing bars
    //     for (let i = 0; i < bandCount; i++) {
    //         const bar = document.createElement('div');
    //         bar.classList.add('spectrum-bar');
    //         visualizerElement.appendChild(bar);
    //     }
    // }

    // --- Play Noise ---
      function playNoise(noiseType, volume, isUnderwater) {
       // ... (no changes needed in core playback logic) ...
       if (!initAudioContext() || !whiteNoiseBuffer) {
            console.error("AudioContext or White Noise Buffer not ready.");
            if (audioContext && audioContext.state === 'suspended') {
                 audioContext.resume().then(() => {
                     if (!whiteNoiseBuffer) createWhiteNoiseBuffer();
                     console.log("Context resumed, trying play again...");
                     setTimeout(() => playNoise(noiseType, volume, isUnderwater), 100);
                 });
             } else {
                  alert("Audio system not ready. Please click again.");
             }
             return;
        }

        stopCurrentSound();

        const noiseData = noiseTypes.find(n => n.name === noiseType);
        if (!noiseData) {
            console.error(`Noise type "${noiseType}" not found.`);
            return;
        }

        currentlyPlayingNoiseType = noiseType;

        const source = audioContext.createBufferSource();
        source.buffer = whiteNoiseBuffer;
        source.loop = true;

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

        const underwaterFilter = audioContext.createBiquadFilter();
        underwaterFilter.type = 'lowpass';
        underwaterFilter.frequency.setValueAtTime(isUnderwater ? 500 : 22000, audioContext.currentTime);
        underwaterFilter.Q.setValueAtTime(1, audioContext.currentTime);

        let noiseSpecificFilter = null;
        if (noiseData.filterType === 'biquad' && noiseData.filterParams) {
            noiseSpecificFilter = audioContext.createBiquadFilter();
            noiseSpecificFilter.type = noiseData.filterParams.type;
             if(noiseData.filterParams.frequency) noiseSpecificFilter.frequency.setValueAtTime(noiseData.filterParams.frequency, audioContext.currentTime);
            if(noiseData.filterParams.gain !== undefined) noiseSpecificFilter.gain.setValueAtTime(noiseData.filterParams.gain, audioContext.currentTime);
            if(noiseData.filterParams.Q) noiseSpecificFilter.Q.setValueAtTime(noiseData.filterParams.Q, audioContext.currentTime);
        }

        let currentNode = source;
        if (noiseSpecificFilter) {
            currentNode.connect(noiseSpecificFilter);
            currentNode = noiseSpecificFilter;
        }
        currentNode.connect(underwaterFilter);
        underwaterFilter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        activeNodes = { source, gain: gainNode, underwaterFilter, noiseSpecificFilter, noiseType };

        source.start(0);
        console.log(`Started noise: ${noiseType}`);
        updateSpectrumVisual(noiseType, isUnderwater); // Visual update here

        source.onended = () => {
            if (currentlyPlayingNoiseType == noiseType && activeNodes && activeNodes.source === source) {
                console.log(`${noiseType} source ended`);
                 const button = container.querySelector(`.noise-player-item[data-noise-type="${noiseType}"] .play-button`);
                 if (button && button.getAttribute('data-playing') === 'true') {
                    stopCurrentSound(true);
                 } else {
                     stopCurrentSound(false);
                 }
            }
        };
    }

    // --- Generate HTML and Add Event Listeners for each noise type ---
    noiseTypes.forEach(noise => {
        const item = document.createElement('div');
        item.classList.add('noise-player-item');
        item.setAttribute('data-noise-type', noise.name);

        // Create spectrum bars HTML
        let spectrumBarsHTML = '';
        for (let i = 0; i < NOISE_SPECTRUM_BANDS; i++) {
            spectrumBarsHTML += `<div class="spectrum-bar"></div>`;
        }

        // *** MODIFIED HTML Structure ***
        item.innerHTML = `
            <div class="noise-info">
                 <h3>${noise.name}</h3>
                 <p>${noise.description}</p>
            </div>

            <div class="spectrum-container">
                <div class="spectrum-visualizer" aria-label="${noise.name} Spectrum Visualization">
                    ${spectrumBarsHTML}
                </div>
                <div class="frequency-labels">
                    <span class="freq-label-start">${START_FREQ_LABEL}</span>
                    <span class="freq-label-end">${END_FREQ_LABEL}</span>
                </div>
            </div>

            <div class="audio-controls">
                <div class="control-row">
                    <button class="play-button" data-playing="false">Listen</button>
                    <label class="volume-label" for="volume-${noise.name}">Vol:</label>
                    <input type="range" id="volume-${noise.name}" class="volume-slider" min="0" max="1" step="0.01" value="${defaultVolume}" aria-label="${noise.name} Volume">
                </div>
                <div class="control-row">
                     <label class="underwater-label" for="underwater-${noise.name}">
                        <input type="checkbox" id="underwater-${noise.name}" class="underwater-toggle" aria-label="Toggle Underwater Effect for ${noise.name}"> Underwater
                    </label>
                </div>
            </div>
        `;
        container.appendChild(item);
        updateSpectrumVisual(noise.name, false, true); // Initialize spectrum


        // --- Add Event Listeners ---
        const playButton = item.querySelector('.play-button');
        const volumeSlider = item.querySelector('.volume-slider');
        const underwaterToggle = item.querySelector('.underwater-toggle');

        playButton.addEventListener('click', () => {
            const noiseType = item.getAttribute('data-noise-type');
            const isPlaying = playButton.getAttribute('data-playing') === 'true';

            if (isPlaying) {
                 stopCurrentSound();
            } else {
                 const volume = parseFloat(volumeSlider.value);
                const isUnderwater = underwaterToggle.checked;
                playNoise(noiseType, volume, isUnderwater); // This internally calls stopCurrentSound()

                // Update button state only if play succeeded
                if (currentlyPlayingNoiseType === noiseType) {
                   playButton.textContent = 'Stop';
                   playButton.classList.add('playing');
                   playButton.setAttribute('data-playing', 'true');
                }
            }
        });

        volumeSlider.addEventListener('input', () => {
            const noiseType = item.getAttribute('data-noise-type');
            const newVolume = parseFloat(volumeSlider.value);
            if (currentlyPlayingNoiseType === noiseType && activeNodes && activeNodes.gain) {
                 activeNodes.gain.gain.linearRampToValueAtTime(
                    newVolume,
                    audioContext.currentTime + 0.05
                );
            }
        });

        underwaterToggle.addEventListener('change', () => {
            const noiseType = item.getAttribute('data-noise-type');
            const isUnderwater = underwaterToggle.checked;
            // Update visual immediately, resetting if not playing
            updateSpectrumVisual(noiseType, isUnderwater, (currentlyPlayingNoiseType !== noiseType));

            if (currentlyPlayingNoiseType === noiseType && activeNodes && activeNodes.underwaterFilter) {
                 const cutoffFreq = isUnderwater ? 500 : 22000;
                 activeNodes.underwaterFilter.frequency.linearRampToValueAtTime(
                    cutoffFreq,
                    audioContext.currentTime + 0.1
                );
            }
        });
    });

    // --- Initial User Gesture Handling ---
    function initialUserGestureHandler() {
       if (!initAudioContext()) { // initAudioContext now returns boolean
           console.log("AudioContext initialization failed or requires user action.");
       };
       // Remove listeners after first interaction
       document.removeEventListener('click', initialUserGestureHandler);
       document.removeEventListener('touchstart', initialUserGestureHandler);
    }
    document.addEventListener('click', initialUserGestureHandler);
    document.addEventListener('touchstart', initialUserGestureHandler);

}); // End of DOMContentLoaded