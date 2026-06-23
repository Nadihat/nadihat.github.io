'use strict';

/**
 * Enhanced Frequency & Noise Generator (v2.1 – Apr‑2025)
 * ---------------------------------------------------------------------------
 * • True pink & brown noise (pre‑coloured buffers) **plus** dynamic low‑pass
 *   shaping so your multiplier slider again darkens / brightens the noise just
 *   like in your original build.
 * • Changing the dropdown while audio is playing now swaps seamlessly even
 *   when you go brown ⇄ pink (Web‑Audio cannot change a BufferSource buffer on
 *   the fly, so we destroy & rebuild under the hood).
 * • Multiplier / dropdown / volume all update in real‑time whether you are on a
 *   tone or one of the noises.
 * ---------------------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
    // ── Constants ───────────────────────────────────────────────────────────
    const RAMP_TIME          = 0.05;     // Gain / param smoothing (s)
    const DEFAULT_SELECTION  = '731.35'; // Default base tone
    const DEFAULT_MULTIPLIER = 1;        // 1 ×
    const BUFFER_SECONDS     = 6;        // Duration of generated noise buffers
    const MAX_SAFE_GAIN      = 0.9;      // Ceiling before limiter

    // ── Tone / noise meta‑data ─────────────────────────────────────────────
    const audioSourcesData = [
        // Frequencies
        { value: '174',     type: 'frequency', label: '174 Hz – Deep Relief',          description: 'eases pain, grounds energy, fosters security, soothes tension' },
        { value: '285',     type: 'frequency', label: '285 Hz – Healing Pulse',        description: 'heals tissues, boosts vitality, sparks rejuvenation, energizes cells' },
        { value: '396',     type: 'frequency', label: '396 Hz – Fearless Joy',         description: 'frees fear, sparks joy, clears guilt, anchors stability' },
        { value: '417',     type: 'frequency', label: '417 Hz – Transformative Shift', description: 'clears trauma, enables change, opens pathways, dissolves blockages' },
        { value: '432',     type: 'frequency', label: '432 Hz – Cosmic Harmony',       description: 'promotes peace, aligns harmony, calms mind, resonates universally' },
        { value: '444',     type: 'frequency', label: '444 Hz – Earth\'s Embrace',     description: 'grounds energy, connects nature, nurtures stability, boosts calm' },
        { value: '528',     type: 'frequency', label: '528 Hz – Love\'s Miracle',       description: 'radiates love, fosters miracles, heals DNA, ignites transformation' },
        { value: '639',     type: 'frequency', label: '639 Hz – Heart Connection',     description: 'deepens love, enhances communication, fosters harmony, builds trust' },
        { value: '731.35',  type: 'frequency', label: '731.35 Hz – Most Beneficial',   description: 'sharpens clarity, ignites motivation, eases tension, boosts focus' },
        { value: '741',     type: 'frequency', label: '741 Hz – Intuitive Clarity',    description: 'awakens intuition, purifies energy, enhances expression, clears negativity' },
        { value: '852',     type: 'frequency', label: '852 Hz – Spiritual Awakening',  description: 'elevates intuition, aligns clarity, uplifts energy, opens wisdom' },
        { value: '963',     type: 'frequency', label: '963 Hz – Divine Oneness',       description: 'connects spirit, activates pineal, restores oneness, uplifts light' },
        // Noises
        { value: 'brown', type: 'noise', label: 'Brown Noise – Deep Calm',  description: 'soothing 1/f² spectrum, deep nervous-system calm, masks low-frequency distractions, guides brain toward delta-wave sleep' },
        { value: 'pink',  type: 'noise', label: 'Pink Noise – Balanced Focus', description: 'natural 1/f spectrum, balances audio energy, enhances focus & memory, promotes stable sleep cycles' }
    ];

    // ── Web‑Audio objects ──────────────────────────────────────────────────
    let audioCtx       = null;
    let masterGain     = null;   // Gain before limiter
    let limiter        = null;   // Soft‑clip tanh

    let oscNode        = null;   // Sine oscillator
    let noiseNode      = null;   // BufferSource (pink/brown)
    let noiseFilter    = null;   // Low‑pass for multiplier shaping

    let pinkBuffer     = null;
    let brownBuffer    = null;

    // ── State ──────────────────────────────────────────────────────────────
    let isPlaying         = false;
    let selectedSourceVal = DEFAULT_SELECTION;
    let currentMultiplier = DEFAULT_MULTIPLIER;
    let currentVolume     = 0.25;
    let currentType       = 'frequency';

    // ── DOM shortcuts ──────────────────────────────────────────────────────
    const freqSelect = document.getElementById('frequency-select');
    const freqDesc   = document.getElementById('frequency-description');
    const multSlider = document.getElementById('multiplier-slider');
    const actualDisp = document.getElementById('actual-frequency-display');
    const volSlider  = document.getElementById('volume-slider');
    const volDisp    = document.getElementById('volume-display');
    const playBtn    = document.getElementById('play-stop-button');

    // ── Soft‑clip curve helper ─────────────────────────────────────────────
    function makeSoftClipCurve(len=1024){
        const c=new Float32Array(len);
        for(let i=0;i<len;i++){const x=i/len*2-1;c[i]=Math.tanh(x*2);}return c;
    }

    // ── Audio initialisation ───────────────────────────────────────────────
    function initAudio(){
        if(audioCtx) return true;
        try{
            const AC=window.AudioContext||window.webkitAudioContext;
            audioCtx=new AC();
            masterGain=audioCtx.createGain();
            limiter=audioCtx.createWaveShaper();
            limiter.curve=makeSoftClipCurve();
            limiter.oversample='4x';
            masterGain.connect(limiter); limiter.connect(audioCtx.destination);
            masterGain.gain.value=0;
            // Build noise buffers once
            pinkBuffer = buildPinkBuffer();
            brownBuffer= buildBrownBuffer();
        }catch(e){alert('Web Audio API unsupported');console.error(e);return false;}
        return true;
    }

    // ── Pink & brown buffer creators ───────────────────────────────────────
    function buildPinkBuffer(){
        const len=audioCtx.sampleRate*BUFFER_SECONDS;
        const b=audioCtx.createBuffer(1,len,audioCtx.sampleRate);
        const d=b.getChannelData(0);
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for(let i=0;i<len;i++){
            const white=Math.random()*2-1;
            b0=0.99886*b0+white*0.0555179;
            b1=0.99332*b1+white*0.0750759;
            b2=0.96900*b2+white*0.1538520;
            b3=0.86650*b3+white*0.3104856;
            b4=0.55000*b4+white*0.5329522;
            b5=-0.7616*b5-white*0.0168980;
            const pink=b0+b1+b2+b3+b4+b5+b6+white*0.5362;
            b6=white*0.115926;
            d[i]=pink*0.11;
        }
        return b;
    }
    function buildBrownBuffer(){
        const len=audioCtx.sampleRate*BUFFER_SECONDS;
        const b=audioCtx.createBuffer(1,len,audioCtx.sampleRate);
        const d=b.getChannelData(0);
        let last=0;
        for(let i=0;i<len;i++){
            const white=Math.random()*2-1;
            last=(last+0.02*white)/1.02;
            d[i]=last*3.5;
        }
        return b;
    }

    // ── Multiplier‑>cutoff mapper (exponential) ────────────────────────────
    function calcNoiseCutoff(noiseType,mult){
        const min=100, max=20000; // Hz
        let base = noiseType==='brown'? 80 : 150;
        const minLog=Math.log(base);
        const maxLog=Math.log(max*(noiseType==='brown'?0.85:1));
        const scale=(maxLog-minLog)/(35-1);
        return Math.exp(minLog+scale*(mult-1));
    }

    // ── UI helpers ─────────────────────────────────────────────────────────
    function updateFreqDesc(){
        const d=audioSourcesData.find(s=>s.value===selectedSourceVal);
        freqDesc.innerHTML=d?'• '+d.description.replace(/,\s*/g,'<br>• '):'';
        currentType=d?d.type:'frequency';
    }
    function updateActualDisp(){
        const d=audioSourcesData.find(s=>s.value===selectedSourceVal);
        if(!d)return;
        if(d.type==='frequency'){
            const hz=(+d.value)*currentMultiplier;
            actualDisp.textContent=`Actual: ${hz.toFixed(2)} Hz (${currentMultiplier.toFixed(2)}×)`;
        }else{
            actualDisp.innerHTML=`${d.label}<br>(Multiplier ${currentMultiplier.toFixed(2)}×)`;
        }
    }
    function updateVolDisp(){volDisp.textContent=`Volume: ${Math.round(currentVolume*100)}%`;}
    function setBtn(state){isPlaying=state;playBtn.classList.toggle('active',state);
        playBtn.innerHTML=state?'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="20" height="20"><path d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"/></svg> Stop':'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="20" height="20"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg> Play';}

    // ── Graph construction helpers ────────────────────────────────────────
    function createOsc(){
        oscNode=audioCtx.createOscillator();
        oscNode.type='sine';
        oscNode.frequency.value=(+selectedSourceVal)*currentMultiplier;
        oscNode.connect(masterGain);
        oscNode.start();
    }
    function createNoise(){
        noiseNode=audioCtx.createBufferSource();
        noiseNode.buffer=selectedSourceVal==='pink'?pinkBuffer:brownBuffer;
        noiseNode.loop=true;
        // Dynamic low‑pass for multiplier shaping
        noiseFilter=audioCtx.createBiquadFilter();
        noiseFilter.type='lowpass';
        noiseFilter.Q.value=1;
        noiseFilter.frequency.value=calcNoiseCutoff(selectedSourceVal,currentMultiplier);
        noiseNode.connect(noiseFilter); noiseFilter.connect(masterGain);
        noiseNode.start();
    }

    function startSound(){
        if(!initAudio())return;
        stopSound(true); // silent
        masterGain.gain.setTargetAtTime(0,audioCtx.currentTime,0);
        if(currentType==='frequency') createOsc(); else createNoise();
        masterGain.gain.setTargetAtTime(Math.min(currentVolume,MAX_SAFE_GAIN),audioCtx.currentTime,RAMP_TIME);
        setBtn(true);
    }
    function stopSound(silent=false){
        masterGain.gain.setTargetAtTime(0,audioCtx.currentTime,RAMP_TIME);
        const off=audioCtx.currentTime+RAMP_TIME+0.02;
        if(oscNode){try{oscNode.stop(off);}catch(e){} oscNode=null;}
        if(noiseNode){try{noiseNode.stop(off);}catch(e){} noiseNode=null;}
        if(!silent) setTimeout(()=>setBtn(false),(RAMP_TIME*1000)+60);
        if(noiseFilter){try{noiseFilter.disconnect();}catch(e){} noiseFilter=null;}
    }

    function updateAudioParams(){
        if(!isPlaying) return;
        masterGain.gain.setTargetAtTime(Math.min(currentVolume,MAX_SAFE_GAIN),audioCtx.currentTime,RAMP_TIME);
        if(currentType==='frequency'&&oscNode){
            oscNode.frequency.setTargetAtTime((+selectedSourceVal)*currentMultiplier,audioCtx.currentTime,RAMP_TIME);
        }else if(currentType==='noise'&&noiseFilter){
            const target=calcNoiseCutoff(selectedSourceVal,currentMultiplier);
            noiseFilter.frequency.setTargetAtTime(target,audioCtx.currentTime,RAMP_TIME);
        }
    }

    // ── Populate dropdown & defaults ───────────────────────────────────────
    audioSourcesData.forEach(s=>{const o=document.createElement('option');o.value=s.value;o.textContent=s.label;freqSelect.appendChild(o);});
    freqSelect.value=DEFAULT_SELECTION;
    updateFreqDesc(); updateActualDisp(); updateVolDisp();

    // ── UI event wiring ───────────────────────────────────────────────────
    freqSelect.addEventListener('change',()=>{
        const prevVal=selectedSourceVal;
        const prevType=currentType;
        selectedSourceVal=freqSelect.value;
        updateFreqDesc(); updateActualDisp();
        if(isPlaying){
            // if type changed OR buffer changed within same type (noise→noise)
            if(prevType!==currentType || currentType==='noise' && prevVal!==selectedSourceVal){
                startSound();
            }else{
                updateAudioParams();
            }
        }
    });
    multSlider.addEventListener('input',()=>{currentMultiplier=+multSlider.value;updateActualDisp();updateAudioParams();});
    volSlider.addEventListener('input',()=>{currentVolume=+volSlider.value;updateVolDisp();updateAudioParams();});
    playBtn.addEventListener('click',()=>{if(!initAudio())return;isPlaying?stopSound():startSound();});
});
