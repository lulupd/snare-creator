const osc1VolKnob = document.querySelector("#osc1-volume");
const osc1FreqKnob = document.querySelector("#osc1-frequency");
const osc1DistKnob = document.querySelector("#osc1-distortion");
const osc1FMKnob = document.querySelector("#osc1-fm");

const osc1AttackKnob = document.querySelector("#osc1-attack");
const osc1DecayKnob = document.querySelector("#osc1-decay");
const osc1SustainKnob = document.querySelector("#osc1-sustain");
const osc1ReleaseKnob = document.querySelector("#osc1-release");

const noiseVolKnob = document.querySelector("#noise-volume");
const noiseHighPassKnob = document.querySelector("#noise-highpass");
const noiseDistKnob = document.querySelector("#noise-distortion");
const noiseLowPassKnob = document.querySelector("#noise-lowpass");

const noiseAttackKnob = document.querySelector("#noise-attack");
const noiseDecayKnob = document.querySelector("#noise-decay");
const noiseSustainKnob = document.querySelector("#noise-sustain");
const noiseReleaseKnob = document.querySelector("#noise-release");

const globalVolKnob = document.querySelector("#global-volume");
const globalDistKnob = document.querySelector("#global-distortion");
const globalSweepKnob = document.querySelector("#global-sweep");

const htmlBase = document.querySelector("html");

const presetSelect = document.querySelector("#presets");

const knobArray = document.getElementsByClassName("knob");

const knobMarkers = document.getElementsByClassName("knob-marker");

const valueInputs = document.getElementsByClassName("knob-value");

const cornerDropdown = document.querySelector(".dropdown-content");

const cornerOptions = document.getElementsByClassName("corner-option")

const playButton = document.querySelector(".play");

const saveButton = document.querySelector(".save");

const toTopButton = document.querySelector(".to-top");

let prevX = 0;
let prevY = 0;

let tapTimer = null;

let initialPreset = {};

let defaultPresets = {};

let impulseResponse;

let snareURL;

const audioCtx = new AudioContext();

let osc = audioCtx.createOscillator();
let noiseNode = createNoise(1);
let emptySource = createNoise(1);

const globalEnv = audioCtx.createGain();

const mediaStreamNode = audioCtx.createMediaStreamDestination();
const mediaRecorder = new MediaRecorder(mediaStreamNode.stream);

let saveChunks = [];

const knobValueChanged = new Event("valuechanged");

fetch('./src/data/default-presets.json')
    .then((response) => response.json())
    .then((json) => {
        defaultPresets = json;
        makeDefaultPresetOptions();
        makeUserPresetOptions();
    });

fetch("./sounds/ir6.wav")
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioCtx.decodeAudioData(arrayBuffer))
    .then((irData) => impulseResponse = irData);

//knob functionality
function turnKnob(e, knob) {
    //Half of the knob marker width and height
    const w = knob.clientWidth / 2;
    const h = knob.clientHeight / 2;

    let x, y;

    if (e.changedTouches === undefined) {
        x = e.clientX - knob.offsetLeft;
        y = e.clientY - knob.offsetTop;
    } else {
        const touches = e.changedTouches;
        x = touches[0].clientX - knob.offsetLeft;
        y = touches[0].clientY - knob.offsetTop;
    }

    const deltaX = w - x;
    const deltaY = h - y;

    const rad = Math.atan2(deltaY, deltaX);
    let deg = rad * (180 / Math.PI);

    prevX = x;
    prevY = y;

    if (deg >= 0) {
        let knobRange = +knob.dataset.max - +knob.dataset.min;
        let knobVal = (knobRange * (deg/180)) + +knob.dataset.min;
        knob.dataset.value = knobVal;
        knob.dataset.angle = deg;
        let knobInput = knob.previousElementSibling;


        if (knob.dataset.unit === "%" || knob.dataset.unit === "") {
            if (knob.id.includes("sustain") || knob.className.includes("feedback") || knob.className.includes("wet")) {
                knobVal *= 100;
            }
            knobInput.value = `${knobVal.toFixed(2)}${knob.dataset.unit}`;
        } else {
            if (knob.id.includes("volume") || knob.className.includes("volume")) {
                knobVal = 20 * Math.log10(knobVal);
            }
            knobInput.value = `${knobVal.toFixed(2)} ${knob.dataset.unit}`;
        }
    }

    knob.dispatchEvent(knobValueChanged);

    return deg;
}

function slideTurnKnob(e, knob) {
    let x, y;

    if (e.changedTouches === undefined) {
        x = e.clientX - knob.offsetLeft;
        y = e.clientY - knob.offsetTop;
    } else {
        const touches = e.changedTouches;
        x = touches[0].clientX - knob.offsetLeft;
        y = touches[0].clientY - knob.offsetTop;
    }

    let deg = +knob.dataset.angle;
    
    if (Math.abs(x - prevX) > Math.abs(y - prevY)) {
        if (Math.abs(x - prevX) < 30) {
            deg += x - prevX;
        }
    } else if (Math.abs(x - prevX) < Math.abs(y - prevY)){
        if (Math.abs(y - prevY) < 30) {
            deg -= y - prevY;
        } 
    }

    if (deg > 180) {
        deg = 180
    } else if (deg < 0) {
        deg = 0;
    }

    prevX = x;
    prevY = y;

    let knobRange = +knob.dataset.max - +knob.dataset.min;
    let knobVal = (knobRange * (deg/180)) + +knob.dataset.min;
    knob.dataset.value = knobVal;
    knob.dataset.angle = deg;
    let knobInput = knob.previousElementSibling;

    
    if (knob.dataset.unit === "%" || knob.dataset.unit === "") {
        if (knob.id.includes("sustain") || knob.className.includes("feedback") || knob.className.includes("wet")) {
            knobVal *= 100;
        }
        knobInput.value = `${knobVal.toFixed(2)}${knob.dataset.unit}`;
    } else {
        if (knob.id.includes("volume") || knob.className.includes("volume")) {
            knobVal = 20 * Math.log10(knobVal);
        }
        knobInput.value = `${knobVal.toFixed(2)} ${knob.dataset.unit}`;
    }

    knob.dispatchEvent(knobValueChanged);

    return deg;
}

function rotate(e, knob) {
    const result = Math.floor(turnKnob(e, knob) - 90);
    if (result >= -90) {
        knob.style.transform = `rotate(${result}deg)`;
    }
}

function slide(e, knob) {
    const result = Math.floor(slideTurnKnob(e, knob) - 90);
    if (result >= -90) {
        knob.style.transform = `rotate(${result}deg)`;
    }
}

function startRotation(knob) {
    let rotateKnob = (e) => {rotate(e, knob)};
    
    window.addEventListener("mousemove", rotateKnob);
    window.addEventListener("touchmove", rotateKnob);

    window.addEventListener("mouseup", () => {
        window.removeEventListener("mousemove", rotateKnob);
    });
    window.addEventListener("touchend", () => {
        window.removeEventListener("touchmove", rotateKnob);
    });
}

function startSlideRotation(knob) {
    let slideKnob = (e) => {slide(e, knob)};

    window.addEventListener("mousemove", slideKnob);
    window.addEventListener("touchmove", slideKnob);
    
    window.addEventListener("mouseup", () => {
        window.removeEventListener("mousemove", slideKnob);
    });
    window.addEventListener("touchend", () => {
        window.removeEventListener("touchmove", slideKnob);
    });
}

function calculateRepetitions(gain, feedback, repetitions = 1) {
    gain *= feedback;
    if (gain <= 0.01) {
        return repetitions;
    } else if (feedback === 1) {
        return 0;
    } else {
        repetitions += 1;
        return calculateRepetitions(gain, feedback, repetitions);
    }
}

function createDistortionCurve(amount) {
    let k = amount;
    let n_samples = audioCtx.sampleRate;
    let curve = new Float32Array(n_samples);
    let x;

    for (let i = 0; i < n_samples; i++) {
        x = (i * 2 / n_samples) - 1;

        //Hard Clipping
        // curve[i] = (3 + k) * Math.atan(Math.sinh(x * 0.25) * 5) / (Math.PI + (k * Math.abs(x)));

        //Soft Clipping
        curve[i] = (1 + k) * x / (1 + k * Math.abs(x))
    }
    return curve;
}

function createWaveform(source, visualizer) {
    const WIDTH = visualizer.width;
    const HEIGHT = visualizer.height;

    const canvasCtx = visualizer.getContext("2d");

    const analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const volumeData = new Float32Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const draw = function () {

        const drawVisual = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(255, 255, 255)";
        canvasCtx.beginPath();

        const sliceWidth = WIDTH / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * (HEIGHT / 2);

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
        
            x += sliceWidth;
        }
        canvasCtx.lineTo(WIDTH, HEIGHT / 2);
        canvasCtx.stroke();
    };

    draw();
}

function createBarVisualizer(source, visualizer, color = "rgb(255, 255, 255)") {
    const WIDTH = visualizer.width;
    const HEIGHT = visualizer.height;

    const canvasCtx = visualizer.getContext("2d");

    const analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const draw = function () {

        const drawVisual = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        let bar_count = WIDTH / 2;
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);


        let x = 0;

        for (let i = 0; i < bar_count; i++) {
            let bar_pos = i * 4;
            let bar_width = 2;
            let bar_height = -(dataArray[i]/ 2);

            canvasCtx.fillStyle = color;
            canvasCtx.fillRect(bar_pos, HEIGHT, bar_width, bar_height);
        }
    };

    draw();
}

function createNoise(duration) {
    let bufferSize = audioCtx.sampleRate * duration;
    let noiseBuffer = new AudioBuffer({
        length: bufferSize,
        sampleRate: audioCtx.sampleRate,
    });
    
    let noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() - 0.5;
    }
    let noise = new AudioBufferSourceNode(audioCtx, {
        buffer: noiseBuffer,
    });

    return noise;
}

function createEmptyBufferSource(duration) {
    let bufferSize = audioCtx.sampleRate * duration;
    let buffer = new AudioBuffer({
        length: bufferSize,
        sampleRate: audioCtx.sampleRate,
    });
    
    let bufferSource = new AudioBufferSourceNode(audioCtx, {
        buffer: buffer,
    });

    return bufferSource;
}

function createClamper(headroom) {
    let volumeClamper = audioCtx.createWaveShaper();
    let clamperCurve = new Float32Array(3);
    clamperCurve[0] = -1;
    clamperCurve[1] = 0;
    clamperCurve[2] = 1;

    volumeClamper.curve = clamperCurve;

    this.input = volumeClamper;
    this.output = audioCtx.createGain();

    this.output.gain.value = Math.pow(10, (headroom / 20));

    volumeClamper.connect(this.output);
}

function createCompressor(time, card) {
    const compVolume = +card.querySelector(".comp-volume").dataset.value;
    const threshold = +card.querySelector(".comp-threshold").dataset.value;
    const knee = +card.querySelector(".comp-knee").dataset.value;
    const ratio = +card.querySelector(".comp-ratio").dataset.value;
    const attack = +card.querySelector(".comp-attack").dataset.value;
    const release = +card.querySelector(".comp-release").dataset.value;

    const compressor = audioCtx.createDynamicsCompressor();
    const compressorEnv = audioCtx.createGain();

    compressorEnv.gain.value = compVolume;
    compressor.threshold.setValueAtTime(threshold, time);
    compressor.knee.setValueAtTime(knee, time);
    compressor.ratio.setValueAtTime(ratio, time);
    compressor.attack.setValueAtTime(attack, time);
    compressor.release.setValueAtTime(release, time);

    compressor.connect(compressorEnv);

    this.input = compressor;
    this.output = compressorEnv;
}

function createDelay(lastGain, card) {
    const feedbackVolume = +card.querySelector(".delay-feedback").dataset.value;
    let delayTime = +card.querySelector(".delay-time").dataset.value;
    const bandpassFreq = +card.querySelector(".delay-frequency").dataset.value;
    const bandpassQ = +card.querySelector(".delay-q").dataset.value;
    
    this.input = audioCtx.createGain();
    this.output = audioCtx.createGain();
    const delay = audioCtx.createDelay();
    const feedbackGain = audioCtx.createGain();
    const bandpass = new BiquadFilterNode(audioCtx, {
        type: "bandpass",
        
    });

    feedbackGain.gain.value = feedbackVolume;
    delay.delayTime.value = delayTime;
    bandpass.frequency.value = bandpassFreq;
    bandpass.Q.value = bandpassQ;

    //Prevents infinite feedback loop while still allowing for metallic sounds.
    if (feedbackGain.gain.value === 1) {
        feedbackGain.gain.value -= 0.05;
        if (delay.delayTime.value === 0) {
            delayTime = 0.001;
        }
    }

    this.totalTime = delayTime * calculateRepetitions(lastGain.gain.value, feedbackGain.gain.value);

    if (feedbackVolume > 0 || delayTime > 0) {
        this.input.connect(this.output);
        this.input.connect(delay);
        delay.connect(feedbackGain);
        feedbackGain.connect(bandpass);
        bandpass.connect(delay);
        delay.connect(this.output);   
    } else {
        this.input.connect(this.output);
    }
}

function createComb(delayTime, frequency, gainValue) {
    this.delay = audioCtx.createDelay();
    this.lowpass = audioCtx.createBiquadFilter();
    this.gain = audioCtx.createGain();

    this.delay.delayTime.value = delayTime;
    this.lowpass.frequency.value = frequency;
    this.gain.gain.value = gainValue;

    this.delay.connect(this.lowpass);
    this.lowpass.connect(this.gain);

    this.input = this.delay;
    this.output = this.gain;
}

function createFreeverb(frequency, gainValue) {
    const COMB_FILTER_TUNINGS = [1557, 1617, 1491,  1422,  1277,  1356, 1188,  1116 ]
    .map(delayPerSecond => delayPerSecond / audioCtx.sampleRate);
    const ALLPASS_FREQUENCIES = [225, 556, 441, 341];

    this.splitter = audioCtx.createChannelSplitter(2);
    this.merger = audioCtx.createChannelMerger(2);
    this.combfilters = COMB_FILTER_TUNINGS.map((delayTime) => new createComb(delayTime, frequency, gainValue));
    this.allpasses = ALLPASS_FREQUENCIES.map((frequency) => new BiquadFilterNode(audioCtx, {type: "allpass", frequency: frequency}));

    const combLeft = this.combfilters.slice(0, 1);
    const combRight = this.combfilters.slice(7);

    combLeft.forEach((comb) => {
        this.splitter.connect(comb.input, 0);
        comb.output.connect(this.splitter);
        this.splitter.connect(this.merger, 0, 0);
    });

    combRight.forEach((comb) => {
        this.splitter.connect(comb.input, 1);
        comb.output.connect(this.splitter);
        this.splitter.connect(this.merger, 0, 1);
    });

    this.merger.connect(this.allpasses[0]);
    this.allpasses[0].connect(this.allpasses[1]);
    this.allpasses[1].connect(this.allpasses[2]);
    this.allpasses[2].connect(this.allpasses[3]);

    this.input = this.splitter;
    this.output = this.allpasses[3];
}

function createReverb(time, card, previousTotalTime = 0) {
    const highpassFreq = +card.querySelector(".reverb-highpass").dataset.value;
    const lowpassFreq = +card.querySelector(".reverb-lowpass").dataset.value;
    const dampeningFreq = +card.querySelector(".reverb-dampening").dataset.value;
    let roomSize = 1 - +card.querySelector(".reverb-room-size").dataset.value;
    const preDelayTime = +card.querySelector(".reverb-predelay").dataset.value;
    const decayTime = +card.querySelector(".reverb-decay").dataset.value;
    const diffuseVolume = +card.querySelector(".reverb-diffuse-volume").dataset.value;
    const reflectionVolume = +card.querySelector(".reverb-reflection-volume").dataset.value;
    const wetAmount = +card.querySelector(".reverb-wet").dataset.value;

    
    this.input = audioCtx.createGain();
    this.output = audioCtx.createGain();
    const reverbIR = audioCtx.createConvolver();
    const reverbNoise = audioCtx.createConvolver();
    const freeverb = new createFreeverb(dampeningFreq, roomSize);
    const freeverbGain = audioCtx.createGain();
    const noiseGain = audioCtx.createGain();
    const wet = audioCtx.createGain();
    const dry = audioCtx.createGain();
    const preDelay = audioCtx.createDelay();
    const diffuseGain = audioCtx.createGain();
    const reflectionGain = audioCtx.createGain();
    const highpass = new BiquadFilterNode(audioCtx, {
        type: "highpass",
        frequency: highpassFreq,
    });
    const lowpass = new BiquadFilterNode(audioCtx, {
        type: "lowpass",
        frequency: lowpassFreq,
    });

    
    this.totalTime = preDelayTime + decayTime;
    
    const tailNoise = createNoise(decayTime + 0.1);
    reverbIR.buffer = impulseResponse;
    reverbNoise.buffer = tailNoise.buffer;

    freeverbGain.gain.cancelScheduledValues(time);
    freeverbGain.gain.setValueAtTime( 1, time + preDelayTime);
    freeverbGain.gain.linearRampToValueAtTime(0, time + this.totalTime + previousTotalTime + 0.1);

    noiseGain.gain.cancelScheduledValues(time);
    noiseGain.gain.setValueAtTime( 1, time + preDelayTime);
    noiseGain.gain.linearRampToValueAtTime(0, time + this.totalTime + previousTotalTime + 0.1);

    wet.gain.value = wetAmount;
    dry.gain.value = 1 - wetAmount;

    preDelay.delayTime.value = preDelayTime;

    diffuseGain.gain.value = diffuseVolume;
    reflectionGain.gain.value = reflectionVolume;

    this.input.connect(dry);
    dry.connect(this.output);

    this.input.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(preDelay);
    preDelay.connect(reverbIR);
    preDelay.connect(reverbNoise);
    preDelay.connect(freeverb.input);
    reverbIR.connect(diffuseGain);
    reverbNoise.connect(noiseGain);
    noiseGain.connect(diffuseGain);
    freeverb.output.connect(freeverbGain);
    freeverbGain.connect(reflectionGain);
    reflectionGain.connect(wet);
    diffuseGain.connect(wet);
    wet.connect(this.output);

    if (wetAmount <= 0) {
        this.totalTime = 0;
    }
}

function createParametricEQ(card, canvas) {
    let nodesNum = 5;

    let FREQ_MIN = 10;
    let FREQ_MAX = Math.round(audioCtx.sampleRate * 0.5);

    let MAG_MIN = -100;
    let MAG_MAX = 100;

    this.eqNodes = [];
    this.eqParams = [];

    this.input = audioCtx.createGain();
    this.output = audioCtx.createGain();
    let previousNode = this.input;
    let nextNode = this.output;

    const knobs = Array.from(card.getElementsByClassName("knob"));
    const freqKnobs = knobs.filter((knob) => knob.className.includes("frequency"));
    const gainKnobs = knobs.filter((knob) => knob.className.includes("gain"));
    const qKnobs = knobs.filter((knob) => knob.className.includes("-q"));

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const canvasCtx = canvas.getContext("2d");

    for (let i = 0; i < nodesNum; i++) {
        let eqNode = audioCtx.createBiquadFilter();

        if (i === 0) {
            eqNode.type = "lowshelf";
        } else if (i === nodesNum - 1) {
            eqNode.type = "highshelf";
        } else {
            eqNode.type = "peaking";
            eqNode.Q.value = qKnobs[i - 1].dataset.value;
        }

        eqNode.frequency.value = freqKnobs[i].dataset.value;
        eqNode.gain.value = gainKnobs[i].dataset.value;

        previousNode.connect(eqNode);

        this.eqNodes.push(eqNode);

        previousNode = eqNode;
    }

    previousNode.connect(this.output);

    this.updateEqGraphic = function () {
        for (let i = 0; i < this.eqNodes.length; i++) {
            this.eqNodes[i].frequency.value = freqKnobs[i].dataset.value;
            this.eqNodes[i].gain.value = gainKnobs[i].dataset.value;

            if (this.eqNodes[i].type === "peaking") {
                this.eqNodes[i].Q.value = qKnobs[i- 1].dataset.value;
            }
        }

        if (this.eqFreqs == null) {
            let freqsNum = 100;
            let freqStep = (FREQ_MAX - FREQ_MIN) / (freqsNum - 1);
    
            this.eqFreqs = new Float32Array(freqsNum);
    
            for (let i = 0; i < freqsNum; i++) {
                this.eqFreqs[i] = Math.round(FREQ_MIN + (i * freqStep));
            }
        }
    
        let stepX = WIDTH / (FREQ_MAX - FREQ_MIN);
        let stepY = HEIGHT / (MAG_MAX - MAG_MIN);
    
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        let eqMag = getEqResponse(this.eqFreqs, this.eqNodes);
        let firstPart = true;
    
        canvasCtx.beginPath();
    
        for (let i = 0; i < this.eqFreqs.length; i++) {
            let x = Math.round((this.eqFreqs[i] - FREQ_MIN) * stepX);
            let y = HEIGHT - Math.round((eqMag[i] - MAG_MIN) * stepY);
            
            if (firstPart) {
                firstPart = false;
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
        }
    
        canvasCtx.strokeStyle = "#ff0000";
        canvasCtx.stroke();
    }

    for (knob of knobs) {
        knob.addEventListener("valuechanged", () => {
            this.updateEqGraphic();
        });
    }

    this.updateEqGraphic();
}

function getEqResponse(freqs, eqNodes) {
    let magCombined = new Float32Array(freqs.length);
    
    let magCurr = new Float32Array(freqs.length);
    let phaseCurr = new Float32Array(freqs.length);

    for (let i = 0; i < eqNodes.length; i++) {
        eqNodes[i].getFrequencyResponse(freqs, magCurr, phaseCurr);

        for (let j = 0; j < freqs.length; j++) {
            let magDB = 20 * Math.log10(magCurr[j]);
            magCombined[j] += magDB;
        }
    } 

    return magCombined;
}

function createEmptyCard() {
    if (document.querySelector(".empty-card") === null) {
        let cardOptions = ["Compressor", "Delay", "Reverb", "Equalizer"];
        let newCard = document.createElement("div");
        newCard.classList.add("card");
        newCard.classList.add("effect");
        newCard.classList.add("empty-card");
    
        let topBar = document.createElement("div");
        topBar.classList.add("top-bar");
        
        let closeButton = document.createElement("div");
        closeButton.classList.add("close-button");
    
        let closeImg = document.createElement("img");
        closeImg.setAttribute("src", "images/close.svg");
        closeImg.setAttribute("width", 15);
        closeImg.setAttribute("alt", "An X. Click to close this card");
    
        closeButton.appendChild(closeImg);
    
        closeButton.addEventListener("click", () => newCard.remove());
    
        topBar.appendChild(closeButton);
        newCard.appendChild(topBar);
    
        let title = document.createElement("h2");
        title.innerText = "Pick a new card:";
        newCard.appendChild(title);
    
        let optionContainer = document.createElement("div");
        optionContainer.classList.add("option-container");
        newCard.appendChild(optionContainer);
        for (card of cardOptions) {
            let option = document.createElement("p");
            option.innerText = card;
            option.onclick = () => createEffectCard(option.innerText);
            optionContainer.appendChild(option);
        }
        document.querySelector(".card-container").appendChild(newCard);

        let portraitMode = window.matchMedia("(max-width: 700px)  and (orientation: portrait)").matches;

        if (portraitMode) {
            newCard.scrollIntoView({
                block: "center",
                behavior: "smooth"
            });
        } else {
            window.scrollBy({
                left: 450,
                behavior: "smooth"
            });
        }
    }
}

function createEffectCard(type) {
    let emptyCard = document.querySelector(".empty-card");
    emptyCard.innerHTML = "";

    //General Effect Card Layout
    emptyCard.classList.remove("empty-card");
    emptyCard.classList.add(`${type.toLowerCase()}-card`);

    let top = document.createElement("div");
    top.classList.add("top");

    let topBar = document.createElement("div");
    topBar.classList.add("top-bar");

    let muteButton = document.createElement("div");
    muteButton.classList.add("mute-button");
    muteButton.dataset.muted = false;
    
    let muteImg = document.createElement("img");
    muteImg.setAttribute("src", "images/unmuted.svg");
    muteImg.setAttribute("width", 15);
    muteImg.setAttribute("alt", "A crossed out speaker. Click to mute the effects of this card");

    muteButton.appendChild(muteImg);
    
    let closeButton = document.createElement("div");
    closeButton.classList.add("close-button");

    let closeImg = document.createElement("img");
    closeImg.setAttribute("src", "images/close.svg");
    closeImg.setAttribute("width", 15);
    closeImg.setAttribute("alt", "An X. Click to close this card");

    closeButton.appendChild(closeImg);

    topBar.appendChild(muteButton);
    topBar.appendChild(closeButton);

    let visualizerContainer = document.querySelector(".visualizer-container").cloneNode(true);

    top.appendChild(topBar);
    top.appendChild(visualizerContainer);
    emptyCard.appendChild(top);

    closeButton.addEventListener("click", () => emptyCard.remove());
    muteButton.addEventListener("click", () => {
        let muted = muteButton.dataset.muted === "true";
        muteButton.dataset.muted = !muted;

        if (muted) {
            muteImg.setAttribute("src", "images/unmuted.svg");
            muteImg.setAttribute("alt", "A speaker. Click to mute the effects of this card");
        } else {
            muteImg.setAttribute("src", "images/muted.svg");
            muteImg.setAttribute("alt", "A crossed out speaker. Click to unmute the effects of this card");
        }
    });

    if (type === "Compressor") {
        let knobs = document.createElement("div");
        knobs.classList.add("knobs");

        knobs.innerText = type;

        let knobRow1 = document.createElement("div");
        knobRow1.classList.add("knob-row");
        let knobRow2 = document.createElement("div");
        knobRow2.classList.add("knob-row");

        let volume = new createKnob("comp-volume", 1, 0, 1, " dB");
        let threshhold = new createKnob("comp-threshold", 0, -100, 0, " dB");
        let knee = new createKnob("comp-knee", 0, 0, 40, " dB");
        let ratio = new createKnob("comp-ratio", 1, 1, 20);
        let attack = new createKnob("comp-attack", 0, 0, 1, " s");
        let release = new createKnob("comp-release", 0, 0, 1, " s");
        
        knobRow1.appendChild(volume.container);
        knobRow1.appendChild(threshhold.container);
        knobRow1.appendChild(knee.container);
        knobRow1.appendChild(ratio.container);

        knobRow2.appendChild(attack.container);
        knobRow2.appendChild(release.container);

        knobs.appendChild(knobRow1);
        knobs.appendChild(knobRow2);

        emptyCard.appendChild(knobs);

        updateKnobs(emptyCard.getElementsByClassName("knob"));
        updateValueInputs();
    } else if (type === "Delay") {
        let knobs = document.createElement("div");
        knobs.classList.add("knobs");

        knobs.innerText = type;

        let knobRow1 = document.createElement("div");
        knobRow1.classList.add("knob-row");
        let knobRow2 = document.createElement("div");
        knobRow2.classList.add("knob-row");

        let feedback = new createKnob("delay-feedback", 0, 0, 1, "%");
        let delayTime = new createKnob("delay-time", 0, 0, 1, "s");
        let bandpassFreq = new createKnob("delay-frequency", 10000, 30, 24000, "Hz") ;
        let bandpassQ = new createKnob("delay-q", 0.0001, 0.0001, 1);
        
        knobRow1.appendChild(feedback.container);
        knobRow1.appendChild(delayTime.container);

        knobRow2.appendChild(bandpassFreq.container);
        knobRow2.appendChild(bandpassQ.container);

        knobs.appendChild(knobRow1);
        knobs.appendChild(knobRow2);

        emptyCard.appendChild(knobs);

        updateKnobs(emptyCard.getElementsByClassName("knob"));
        updateValueInputs();
    } else if (type === "Reverb") {
        let knobs = document.createElement("div");
        knobs.classList.add("knobs");

        knobs.innerText = type;

        let knobRow1 = document.createElement("div");
        knobRow1.classList.add("knob-row");
        let knobRow2 = document.createElement("div");
        knobRow2.classList.add("knob-row");
        let knobRow3 = document.createElement("div");
        knobRow3.classList.add("knob-row");

        let wet = new createKnob("reverb-wet", 0, 0, 1, "%");
        let decayTime = new createKnob("reverb-decay", 1, 0, 3, "s");
        let preDelay = new createKnob("reverb-predelay", 0, 0, 0.25, "s");
        let lowpassFreq = new createKnob("reverb-lowpass", 24000, 30, 24000, "Hz");
        let highpassFreq = new createKnob("reverb-highpass", 0, 0, 24000, "Hz");
        let dampeningFreq = new createKnob("reverb-dampening", 3000, 0, 24000, "Hz");
        let roomSize = new createKnob("reverb-room-size", 0.5, 0.2, 0.8);
        let reflectionVolume = new createKnob("reverb-reflection-volume",  1, 0, 2, "dB");
        let diffuseVolume = new createKnob("reverb-diffuse-volume", 1, 0, 2, "dB");
        
        knobRow1.appendChild(wet.container);
        knobRow1.appendChild(decayTime.container);
        knobRow1.appendChild(preDelay.container);

        knobRow2.appendChild(lowpassFreq.container);
        knobRow2.appendChild(highpassFreq.container);
        knobRow2.appendChild(dampeningFreq.container);
        knobRow2.appendChild(roomSize.container);

        knobRow3.appendChild(reflectionVolume.container);
        knobRow3.appendChild(diffuseVolume.container);

        knobs.appendChild(knobRow1);
        knobs.appendChild(knobRow2);
        knobs.appendChild(knobRow3);

        emptyCard.appendChild(knobs);

        updateKnobs(emptyCard.getElementsByClassName("knob"));
        updateValueInputs();
    } else if (type === "Equalizer") {
        let visualizerOverlay = document.querySelector(".visualizer").cloneNode();
        visualizerOverlay.classList.remove("visualizer");
        visualizerOverlay.classList.add("visualizer-overlay");

        let eqCanvas = document.querySelector(".visualizer").cloneNode();
        eqCanvas.classList.remove("visualizer");
        eqCanvas.classList.add("eq-canvas");

        visualizerContainer.appendChild(visualizerOverlay);
        visualizerContainer.appendChild(eqCanvas);

        let knobs = document.createElement("div");
        knobs.classList.add("knobs");

        knobs.innerText = type;

        let knobRow1 = document.createElement("div");
        knobRow1.classList.add("knob-row");
        let knobRow2 = document.createElement("div");
        knobRow2.classList.add("knob-row");
        let knobRow3 = document.createElement("div");
        knobRow3.classList.add("knob-row");

        let lowshelfFreq = new createKnob("lowshelf-frequency", 2400, 30, 24000, "Hz");
        let peakFreq = new createKnob("peak-frequency", 7200, 30, 24000, "Hz");
        let peakFreq2 = new createKnob("peak-frequency", 12000, 30, 24000, "Hz");
        let peakFreq3 = new createKnob("peak-frequency", 16800, 30, 24000, "Hz");
        let highshelfFreq = new createKnob("highshelf-frequency", 21600, 30, 24000, "Hz");

        //Gain values are directly in Decibels.
        let lowshelfGain = new createKnob("lowshelf-gain", 0, -20, 20, "dB");
        let peakGain = new createKnob("peak-gain", 0, -20, 20, "dB");
        let peakGain2 = new createKnob("peak-gain", 0, -20, 20, "dB");
        let peakGain3 = new createKnob("peak-gain", 0, -20, 20, "dB");
        let highshelfGain = new createKnob("highshelf-gain", 0, -20, 20, "dB");

        let lowshelfQ = new createKnob("lowshelf-q", 1, 0.0001, 100);
        let peakQ = new createKnob("peak-q", 1, 0.0001, 100);
        let peakQ2 = new createKnob("peak-q", 1, 0.0001, 100);
        let peakQ3 = new createKnob("peak-q", 1, 0.0001, 100);
        let highshelfQ = new createKnob("highshelf-q", 1, 0.0001, 100);
        
        lowshelfQ.container.innerHTML = "";
        highshelfQ.container.innerHTML = "";

        knobRow1.appendChild(lowshelfFreq.container);
        knobRow1.appendChild(peakFreq.container);
        knobRow1.appendChild(peakFreq2.container);
        knobRow1.appendChild(peakFreq3.container);
        knobRow1.appendChild(highshelfFreq.container);

        knobRow2.appendChild(lowshelfGain.container);
        knobRow2.appendChild(peakGain.container);
        knobRow2.appendChild(peakGain2.container);
        knobRow2.appendChild(peakGain3.container);
        knobRow2.appendChild(highshelfGain.container);

        knobRow3.appendChild(lowshelfQ.container);
        knobRow3.appendChild(peakQ.container);
        knobRow3.appendChild(peakQ2.container);
        knobRow3.appendChild(peakQ3.container);
        knobRow3.appendChild(highshelfQ.container);

        knobs.appendChild(knobRow1);
        knobs.appendChild(knobRow2);
        knobs.appendChild(knobRow3);

        emptyCard.appendChild(knobs);

        updateKnobs(emptyCard.getElementsByClassName("knob"));
        updateValueInputs();
    }
}

function createKnob(name, value, min, max, unit = "") {
    let knobContainer = document.createElement("div");
    knobContainer.classList.add("knob-container");

    let inputError = document.querySelector(".error").cloneNode();
    let knobInput = document.querySelector(".knob-value").cloneNode();
    if (unit === "%" || unit === "") {
        knobInput.value = `${value}${unit}`;
    } else {
        knobInput.value = `${value} ${unit}`;
    }

    let knob = document.querySelector(".knob").cloneNode(true);
    knob.removeAttribute("id");
    knob.classList.add(name);

    knob.dataset.value = value;
    knob.dataset.initial = value;
    knob.dataset.min = min;
    knob.dataset.max = max;
    knob.dataset.unit = unit;
    knob.dataset.angle = 0;

    let knobLabel = document.createElement("div");
    knobLabel.classList.add("label");
    let splitName = name.split("-");
    knobLabel.innerText = splitName[1].charAt(0).toUpperCase() + splitName[1].slice(1);
    if (splitName.length > 2) {
        for (let i = 2; i < splitName.length; i++) {
            knobLabel.innerText += " ";
            knobLabel.innerText += splitName[i].charAt(0).toUpperCase() + splitName[i].slice(1);
        }
    }

    knobContainer.appendChild(inputError);
    knobContainer.appendChild(knobInput);
    knobContainer.appendChild(knob);
    knobContainer.appendChild(knobLabel);

    let knobMarker = knob.querySelector(".knob-marker");


    knob.addEventListener("mousedown", () => {startSlideRotation(knob)});
    knob.addEventListener("touchstart", () => {startSlideRotation(knob)});
    knob.addEventListener("touchstart", handleTouchStart);
    knob.addEventListener("dblclick", initializeKnob);

    knobMarker.addEventListener("mousedown", () => {startRotation(knob)});
    knobMarker.addEventListener("touchstart", () => {startRotation(knob)});

    knobInput.addEventListener("change", handleInputChange);
    knobInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            handleInputChange(e);
            knobInput.blur();
        }
    });
    
    this.container = knobContainer;
    this.input = knobInput;
    this.knob = knob;
}

function playOsc1(time) {
    const osc1Gain = +osc1VolKnob.dataset.value;
    const osc1Freq = +osc1FreqKnob.dataset.value;
    const distAmount = +osc1DistKnob.dataset.value;
    const fmAmount = +osc1FMKnob.dataset.value;

    const attackTime = +osc1AttackKnob.dataset.value;
    const decayTime = +osc1DecayKnob.dataset.value;
    const sustainVolume = +osc1SustainKnob.dataset.value;
    const releaseTime = +osc1ReleaseKnob.dataset.value;

    const globalSweepAmount = +globalSweepKnob.dataset.value;

    osc = audioCtx.createOscillator();
    osc.frequency.value = osc1Freq;

    let modulator = audioCtx.createOscillator();
    modulator.frequency.value = 500;

    const osc1Env = audioCtx.createGain();
    const modulatorGain = audioCtx.createGain();
 
    modulatorGain.gain.value = fmAmount * 10;

    const osc1DistortionNode = audioCtx.createWaveShaper();

    osc1DistortionNode.curve = createDistortionCurve(distAmount);

    osc1Env.gain.cancelScheduledValues(time);
    osc1Env.gain.setValueAtTime(0, time);
    osc1Env.gain.linearRampToValueAtTime(osc1Gain, time + attackTime);
    if (osc1Gain > 0) {
        osc1Env.gain.linearRampToValueAtTime(sustainVolume, time + attackTime + decayTime);
    }
    osc1Env.gain.linearRampToValueAtTime(0, time + attackTime + decayTime + releaseTime);

    //Pitch sweep
    osc.frequency.cancelScheduledValues(time);
    osc.frequency.setValueAtTime(osc1Freq + (globalSweepAmount * 10), time);
    osc.frequency.exponentialRampToValueAtTime(osc1Freq, time + (decayTime / 4));

    modulator.connect(modulatorGain);
    modulatorGain.connect(osc.frequency);
    
    osc.disconnect();

    if (distAmount > 0) {
        osc.connect(osc1DistortionNode);
        osc1DistortionNode.connect(osc1Env).connect(globalEnv);
    } else {
        osc.connect(osc1Env).connect(globalEnv);
    }

    modulator.start(time);
    osc.start(time);
    osc.stop(time + attackTime + decayTime + releaseTime);
}

function playNoise(time) {
    const noiseGain = +noiseVolKnob.dataset.value;
    const highpassFreq = +noiseHighPassKnob.dataset.value;
    const distAmount = +noiseDistKnob.dataset.value;
    const lowpassFreq = +noiseLowPassKnob.dataset.value;

    const attackTime = +noiseAttackKnob.dataset.value;
    const decayTime = +noiseDecayKnob.dataset.value;
    const sustainVolume = +noiseSustainKnob.dataset.value;
    const releaseTime = +noiseReleaseKnob.dataset.value;

    const globalSweepAmount = +globalSweepKnob.dataset.value;
    if (attackTime + decayTime + releaseTime > 0) {
        noiseNode = createNoise(attackTime + decayTime + releaseTime);

        const noiseEnv = audioCtx.createGain();
        const highpass = new BiquadFilterNode(audioCtx, {
            type: "highpass",
            
        });
        const lowpass = new BiquadFilterNode(audioCtx, {
            type: "lowpass",
            
        });
        
        highpass.frequency.value = highpassFreq;
        lowpass.frequency.value = lowpassFreq;

        const distortionNode = audioCtx.createWaveShaper();

        distortionNode.curve = createDistortionCurve(distAmount);

        noiseEnv.gain.cancelScheduledValues(time);
        noiseEnv.gain.setValueAtTime(0, time);
        noiseEnv.gain.linearRampToValueAtTime(noiseGain, time + attackTime);
        if (noiseGain > 0) {
            noiseEnv.gain.linearRampToValueAtTime(sustainVolume, time + attackTime + decayTime);
        }
        noiseEnv.gain.linearRampToValueAtTime(0, time + attackTime + decayTime + releaseTime);

        noiseNode.detune.cancelScheduledValues(time);
        noiseNode.detune.setValueAtTime(globalSweepAmount, time);
        noiseNode.detune.linearRampToValueAtTime(0, time + (decayTime / 4))

        noiseNode.connect(highpass);
        highpass.disconnect();

        if (distAmount > 0) {
            highpass.connect(distortionNode);
            distortionNode.connect(lowpass)
            lowpass.connect(noiseEnv).connect(globalEnv);
        } else {
            highpass.connect(lowpass);
            lowpass.connect(noiseEnv).connect(globalEnv);
        }
    
        noiseNode.start()
        noiseNode.stop(time + attackTime + decayTime + releaseTime);
    }
}

function playAll(time) {
    const globalGain = +globalVolKnob.dataset.value;
    const globalDistAmount = +globalDistKnob.dataset.value;

    const canvas = document.querySelector(".visualizer");

    const globalDistortionNode = audioCtx.createWaveShaper();
    globalDistortionNode.curve = createDistortionCurve(globalDistAmount);
    
    globalEnv.gain.setValueAtTime(globalGain, time);

    let lastNode = globalEnv;
    let outputs = [globalEnv];

    globalEnv.disconnect();

    if (globalDistAmount > 0) {
        lastNode.connect(globalDistortionNode);
        lastNode = globalDistortionNode;
    }
    
    //Main card waveform.
    createWaveform(globalEnv, canvas);

    let delayTotalTime = 0;
    let reverbTotalTime = 0;
    let effectCards = document.getElementsByClassName("effect");

    for (card of effectCards) {
        let muteButton = card.querySelector(".mute-button");
        let closeButton = card.querySelector(".close-button");
        if (muteButton !== null) {
            if (muteButton.dataset.muted !== "true") {
                if (card.className.includes("compressor")) {
                    const visualizer = card.querySelector(".visualizer");
                    const compressor = new createCompressor(time, card);

                    lastNode.connect(compressor.input);

                    outputs.push(compressor.output);

                    lastNode = compressor.output;
                    createWaveform(lastNode, visualizer);
                } else if (card.className.includes("delay")) {
                    const visualizer = card.querySelector(".visualizer");
                    const delay = new createDelay(lastNode, card);
                    
                    delayTotalTime = delay.totalTime;
                    
                    lastNode.connect(delay.input);

                    outputs.push(delay.output);

                    lastNode = delay.output;
                    createWaveform(lastNode, visualizer);
                } else if (card.className.includes("reverb")) {
                    const visualizer = card.querySelector(".visualizer");
                    const reverb = new createReverb(time, card, delayTotalTime);

                    reverbTotalTime = reverb.totalTime;

                    lastNode.connect(reverb.input);

                    outputs.push(reverb.output);

                    lastNode = reverb.output;
                    createWaveform(lastNode, visualizer);
                } else if (card.className.includes("equalizer")) {
                    const visualizer = card.querySelector(".visualizer");
                    const visualizerOverlay = card.querySelector(".visualizer-overlay");
                    const eqCanvas = card.querySelector(".eq-canvas");

                    createBarVisualizer(lastNode, visualizer, "rgb(100, 100, 100)");
                    
                    const equalizer = new createParametricEQ(card, eqCanvas);

                    lastNode.connect(equalizer.input);

                    outputs.push(equalizer.output);

                    lastNode = equalizer.output;
                    createBarVisualizer(lastNode, visualizerOverlay);
                }
            }
            muteButton.addEventListener("click", () => {
                if (muteButton.dataset.muted === "true") {
                    lastNode.gain.value = 0;
                } else {
                    lastNode.gain.value = 1;
                }
            });
            if (closeButton !== null) {
                closeButton.addEventListener("click", () => {
                    lastNode.disconnect()
                    emptySource.stop();
                });
            }
        }
    }

    let volumeClamper = new createClamper(-0.3);

    lastNode.connect(volumeClamper.input);

    lastNode = volumeClamper.output;

    lastNode.connect(mediaStreamNode);
    lastNode.connect(audioCtx.destination); 

    let attack = +osc1AttackKnob.dataset.value > +noiseAttackKnob.dataset.value ?
        +osc1AttackKnob.dataset.value :
        +noiseAttackKnob.dataset.value;
    let decay = +osc1DecayKnob.dataset.value > +noiseDecayKnob.dataset.value ?
        +osc1DecayKnob.dataset.value :
        +noiseDecayKnob.dataset.value;
    let release = +osc1ReleaseKnob.dataset.value > +noiseReleaseKnob.dataset.value ?
        +osc1ReleaseKnob.dataset.value :
        +noiseReleaseKnob.dataset.value;    

    emptySource = createEmptyBufferSource(attack + decay + release + delayTotalTime + reverbTotalTime + 0.1);
    

    emptySource.addEventListener("ended", () => {
        handleSoundEnd();
        disconnectNodes(outputs);
    });

    playOsc1(time);
    playNoise(time);

    emptySource.start(time);
    emptySource.stop(time + attack + decay + release + delayTotalTime + reverbTotalTime + 0.1);
}

function disconnectNodes(nodes) {
    for (node of nodes) {
        node.disconnect();
    }
}

function updateKnobs(kArray) {
    for (let i = 0; i < kArray.length; i++) {    
        const initialValue = +kArray[i].dataset.value - +kArray[i].dataset.min;
        const knobRange = +kArray[i].dataset.max - +kArray[i].dataset.min;
        const deg = (initialValue / knobRange) * 180;
        const result = Math.floor(deg - 90);
        kArray[i].style.transform = `rotate(${result}deg)`;
        kArray[i].dataset.angle = deg;
    }
}

function updateValueInputs() {
    for (input of valueInputs) {
        let knob = input.nextElementSibling;
        let knobVal = +knob.dataset.value;

        if (knob.dataset.unit === "%" || knob.dataset.unit === "") {
            if (knob.id.includes("sustain") || knob.className.includes("feedback") || knob.className.includes("wet")) {
                knobVal *= 100;
            }
            input.value = `${knobVal.toFixed(2)}${knob.dataset.unit}`;
        } else {
            if (knob.id.includes("volume") || knob.className.includes("volume")) {
                knobVal = 20 * Math.log10(knobVal);
            }
            input.value = `${knobVal.toFixed(2)} ${knob.dataset.unit}`;
        }
    }
}

function initializeKnob(e) {
    const oscCard = document.querySelector("#osc-card");
    const oscKnobs = Array.from(oscCard.getElementsByClassName("knob"));

    if (oscKnobs.includes(e.target)) {
        const presetName = presetSelect.value;
        const selectedOption = presetSelect.options[presetSelect.selectedIndex];
        if (selectedOption.classList.contains("user")) {
            let preset = JSON.parse(localStorage.getItem([presetName]));
            if (preset !== null) {
                e.target.dataset.value = preset[e.target.id];
                updateValueInputs();
                updateKnobs(knobArray);
            }
        } else if (presetName === "init") {
            e.target.dataset.value = initialPreset[e.target.id];
            updateValueInputs();
            updateKnobs(knobArray);
        } else {
            let preset = defaultPresets[presetName];
            e.target.dataset.value = preset[e.target.id];
            updateValueInputs();
            updateKnobs(knobArray);
        }

    } else {
        e.target.dataset.value = e.target.dataset.initial;
        updateValueInputs();
        updateKnobs(knobArray);
    }
}

function isScrolledToView(element, visibleAt) {
    let windowHeight = window.innerHeight;
    let elementTop = element.getBoundingClientRect().top;    

    if (elementTop < windowHeight - visibleAt) {
        return true;
    } else {
        return false;
    }
}

function handleInputChange(e) {
    let knob = e.target.nextElementSibling;
    let newValue = e.target.value;
    
    if (newValue.endsWith("Hz") || newValue.endsWith("dB")) {
        newValue = newValue.slice(0, -2);
        newValue.trimEnd();
    } else if (newValue.endsWith("s") || newValue.endsWith("%")) {
        newValue = newValue.slice(0, -1);
        newValue.trimEnd();
    }
    
    newValue = +newValue;
    let knobUnit = knob.dataset.unit;

    if (!isNaN(newValue) && !isNaN(parseInt(newValue))) {
        if (knob.id.includes("sustain") || knob.className.includes("feedback") || knob.className.includes("wet")) {
            newValue = newValue / 100;
        } else if (knob.id.includes("volume") || knob.className.includes("volume")) {
            newValue = Math.pow(10, (newValue / 20));
        }

        if (newValue < +knob.dataset.min) {
            newValue = +knob.dataset.min;
        } else if (newValue > +knob.dataset.max) {
            newValue = +knob.dataset.max;
        }

    
        knob.dataset.value = newValue;
    
        if (knobUnit === "%" || knobUnit === "") {
            if (knob.id.includes("sustain") || knob.className.includes("feedback") || knob.className.includes("wet")) {
                newValue = newValue * 100;
            }
            e.target.value = `${newValue.toFixed(2)}${knobUnit}`
        } else {
            if (knob.id.includes("volume") || knob.className.includes("volume")) {
                newValue = 20 * Math.log10(newValue);
            }
            e.target.value = `${newValue.toFixed(2)} ${knobUnit}`
        }
    } else {
        let knobVal = +knob.dataset.value;

        if (knobUnit === "%" || knobUnit === "") {
            if (knob.id.includes("sustain") || knob.className.includes("feedback") || knob.className.includes("wet")) {
                knobVal = knobVal * 100;
            }
            e.target.value = `${knobVal.toFixed(2)}${knobUnit}`
        } else {
            if (knob.id.includes("volume") || knob.className.includes("volume")) {
                knobVal = 20 * Math.log10(knobVal);
            }
            e.target.value = `${knobVal.toFixed(2)} ${knobUnit}`
        }
        handleInvalidInput(e);
    }
    updateKnobs(knobArray);
    knob.dispatchEvent(knobValueChanged);
}

function handleInvalidInput(e) {
    const error = e.target.previousElementSibling;

    if (!error.className.includes("faded-in")) {
        error.innerText = "Please enter a number, optionally followed by the appropriate unit.";
        error.classList.add("faded-in");
        error.classList.remove("faded-out");
        e.target.style.borderColor = "red";
        let timer = setTimeout(() => {
            error.classList.add("faded-out");
            error.classList.remove("faded-in");
            e.target.style.borderColor = "";
        }, 5000)
    }
}

function handleSoundEnd() {
    if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    }
    playButton.dataset.playing = false;
    playButton.innerText = "Play";
}

function handleCornerMenuClick(e) {
    if (e.target.id.includes("save-preset")) {
        savePreset();
    } else if (e.target.id.includes("delete")) {
        deletePreset();
    } else if (e.target.id.includes("clear")) {
        clearPresets();
    } else if (e.target.id.includes("init")) {
        initializePreset();
    } else if (e.target.id.includes("random")) {
        randomizePreset();
    } else if (e.target.id.includes("json")) {
        savePresetsToJSON();
    }
    updateKnobs(knobArray);
    updateValueInputs();
}

function handlePlayButton() {
    if (playButton.dataset.playing === "false") {
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        mediaRecorder.start();
        let currentTime = audioCtx.currentTime;
        playButton.dataset.playing = true;
        playButton.innerText = "Stop";
        playAll(currentTime);
    } else {
        osc.stop();
        noiseNode.stop();
        emptySource.stop();
        if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
        playButton.dataset.playing = false;
        playButton.innerText = "Play";
    }
}

function handleScrolling(container) {
    let scrollWidth;

    let targetLeft;

    let getScrollStep = () => scrollWidth / 100;

    const scrollLeft = () => {
        let previousLeft = container.scrollLeft;
        let step = getScrollStep();
        let diff = targetLeft - container.scrollLeft;
        let deltaX = step >= Math.abs(diff) ? diff : Math.sign(diff) * step;

        container.scrollBy(deltaX, 0);

        if (previousLeft === container.scrollLeft || container.scrollLeft === targetLeft) {
            return;
        }
        requestAnimationFrame(scrollLeft);
    };

    container.addEventListener("wheel", (e) => {
        e.preventDefault();

        scrollWidth = container.scrollWidth - container.clientWidth;
        targetLeft = Math.min(scrollWidth, Math.max(0, container.scrollLeft + e.deltaY));
        
        requestAnimationFrame(scrollLeft);
    }, {
        passive: false
    });

}

function handleMobileInstructions() {
    let mobileInstructions = document.querySelector(".mobile-instructions")
    let portraitMode = window.matchMedia("(max-width: 700px)  and (orientation: portrait)").matches;

    if (portraitMode) {
        if (isScrolledToView(mobileInstructions, 300)) {
            mobileInstructions.classList.remove("faded-in");
            mobileInstructions.classList.add("faded-out");
        } else {
            if (document.querySelector(".effect") === null && document.querySelector(".empty-card") === null) {
                mobileInstructions.classList.remove("faded-out");
                mobileInstructions.classList.add("faded-in");
            }
        }
    }
}

function handleTouchStart (e) {
    if (tapTimer == null) {
        tapTimer = setTimeout(() => {
            tapTimer = null;
        }, 500);
    } else {
        clearTimeout(tapTimer);
        tapTimer = null;
        initializeKnob(e);
    }
}

function openCornerMenu() {
    cornerDropdown.classList.toggle("show");
}

function savePreset() {
    let presetData = {};
    presetData["name"] = prompt("Name your preset:");

    if (presetData["name"] === "") {
        presetData["name"] = `Preset ${localStorage.length + 1}`;
    } else if (presetData["name"] == null) {
        return;
    }

    for (knob of knobArray) {
        let knobId = knob.id;
        let knobVal = knob.dataset.value;
        presetData[knobId] = knobVal;
    }

    localStorage.setItem(presetData["name"], JSON.stringify(presetData));

    let presetOption = document.createElement("option");
    presetOption.setAttribute("value", presetData["name"]);
    presetOption.classList.add("preset");
    presetOption.classList.add("user");
    presetOption.innerText = presetData["name"];
    presetSelect.appendChild(presetOption);
}

function loadPreset(selectBox) {
    const presetName = selectBox.value;
    const selectedOption = selectBox.options[selectBox.selectedIndex];

    if (selectedOption.classList.contains("user")) {
        let preset = JSON.parse(localStorage.getItem([presetName]));
        if (preset !== null) {
            for (const [key, value] of Object.entries(preset)) {
                if (key !== "name") {
                    const knob = document.getElementById(key);
                    knob.dataset.value = value;
                }
            }
            updateValueInputs();
            updateKnobs(knobArray);
        }
    } else if (presetName === "init") {
        initializePreset();
    } else {
        let preset = defaultPresets[presetName];
        for (const [key, value] of Object.entries(preset)) {
            if (key !== "name") {
                const knob = document.getElementById(key);
                knob.dataset.value = value;
            }
        }
        updateValueInputs();
        updateKnobs(knobArray);
    }
    
}

function deletePreset() {
    const presetName = presetSelect.value;
    const selectedOption = presetSelect.options[presetSelect.selectedIndex];
    if (selectedOption.classList.contains("user")) {
        presetSelect.selectedIndex = 0;
        selectedOption.remove();
        localStorage.removeItem(presetName);
    }
}

function clearPresets() {
    localStorage.clear();
    const userPresetCollection = document.getElementsByClassName("user");
    let userPresets = Array.from(userPresetCollection);
    for (let i = 0; i < userPresets.length; i++) {
        if (userPresets[i].value === presetSelect.value) {
            presetSelect.selectedIndex = 0;
            initializePreset();
        }
        userPresets[i].remove();
    }
}

function initializePreset() {
    for (const [key, value] of Object.entries(initialPreset)) {
        const knob = document.getElementById(key);
        knob.dataset.value = value;
    }
    updateValueInputs();
    updateKnobs(knobArray);
}

function randomizePreset() {
    for (knob of knobArray) {
        if (knob.id.includes("global") || knob.id.includes("osc1") || knob.id.includes("noise")) {
            let knobRange = +knob.dataset.max - +knob.dataset.min;
            let knobVal = (Math.random() * knobRange) + +knob.dataset.min;
            knob.dataset.value = knobVal;
        }
    }
    updateValueInputs();
    updateKnobs(knobArray);
}

function savePresetsToJSON() {
    if (localStorage.length > 0) {
        let finalObject = {};
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            let preset = JSON.parse(localStorage.getItem(key));
            let name = preset["name"];
            delete preset["name"];
            finalObject[name] = preset;
        }
        
        let finalString = JSON.stringify(finalObject);
        let url = 'data:application/json;charset=utf-8,' + encodeURIComponent(finalString);
        download("presets", url);
    }
}

function makeUserPresetOptions() {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        let preset = JSON.parse(localStorage.getItem(key));
        let presetOption = document.createElement("option");
        presetOption.setAttribute("value", preset["name"]);
        presetOption.classList.add("preset");
        presetOption.classList.add("user");
        presetOption.innerText = preset["name"];
        presetSelect.appendChild(presetOption);
    }
}

function makeDefaultPresetOptions() {
    let presets = Object.keys(defaultPresets);
    for (let i = 0; i < presets.length; i++) {
        let presetOption = document.createElement("option");
        presetOption.setAttribute("value", presets[i]);
        presetOption.classList.add("preset");
        presetOption.innerText = presets[i];
        presetSelect.appendChild(presetOption);
    }
}

function download(name, url) {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

playButton.addEventListener("click", handlePlayButton);

saveButton.addEventListener("click", () => {
    if (snareURL !== undefined) {
        download("snare", snareURL);
    }
})

mediaRecorder.ondataavailable = (e) => {
    saveChunks = [];
    saveChunks.push(e.data);
};

mediaRecorder.onstop = (e) => {
    const blob = new Blob(saveChunks, {type: "audio/wav; codec=opus"});
    snareURL = URL.createObjectURL(blob);
};

for (let i = 0; i < knobArray.length; i++) {
    knobArray[i].addEventListener("mousedown", () => {startSlideRotation(knobArray[i])});
    knobArray[i].addEventListener("touchstart", () => {startSlideRotation(knobArray[i])});
    knobArray[i].addEventListener("touchstart", handleTouchStart);
    knobArray[i].addEventListener("dblclick", initializeKnob);
}

for (let i = 0; i < knobArray.length; i++) {
    let knobId = knobArray[i].id;
    let knobVal = knobArray[i].dataset.value;
    initialPreset[knobId] = knobVal;
}

for (let i = 0; i < knobMarkers.length; i++) {
    const knob = knobMarkers[i].parentElement;
    knobMarkers[i].addEventListener("mousedown", () => {startRotation(knob)});
    knobMarkers[i].addEventListener("touchstart", () => {startRotation(knob)});
}

for (let i = 0; i < valueInputs.length; i++) {
    valueInputs[i].addEventListener("change", handleInputChange);
    valueInputs[i].addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            valueInputs[i].blur();
        }
    });
}

for (let i = 0; i < cornerOptions.length; i++) {
    cornerOptions[i].addEventListener("click", handleCornerMenuClick);
}

presetSelect.addEventListener("change", (e) => {
    loadPreset(presetSelect);
});

presetSelect.addEventListener("click", (e) => {
    if ((e.detail === 0 && (navigator.userAgent.indexOf("Chrome") > -1))|| e.target.tagName === "OPTION") {
        loadPreset(presetSelect);
    }
});

window.addEventListener("click", (e) => {
    if (!e.target.matches(".corner-button") && cornerDropdown.classList.contains("show")) {
        cornerDropdown.classList.remove("show");
    }
});

window.addEventListener("scroll", handleMobileInstructions);

window.addEventListener("scroll", () => {
    if (window.scrollY >= window.innerHeight * 0.3) {
        toTopButton.classList.remove("faded-out");
        toTopButton.classList.add("faded-in");
    } else {
        toTopButton.classList.remove("faded-in");
        toTopButton.classList.add("faded-out");
    }
})

toTopButton.addEventListener("click", () => window.scrollTo(0,0));

handleScrolling(htmlBase);
updateKnobs(knobArray);
updateValueInputs();
