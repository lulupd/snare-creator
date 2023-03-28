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

const presetSelect = document.querySelector("#presets");

const knobArray = document.getElementsByClassName("knob");

const knobMarkers = document.getElementsByClassName("knob-marker");

const valueInputs = document.getElementsByClassName("knob-value");

const cornerDropdown = document.querySelector(".dropdown-content");

const cornerOptions = document.getElementsByClassName("corner-option")

const playButton = document.querySelector(".play");

let prevX = 0;
let prevY = 0;

let osc1Playing = false;
let noisePlaying = false;

let db;

let initialPreset = {};

let defaultPresets = {};

const audioCtx = new AudioContext();

let osc = audioCtx.createOscillator();

const mediaStreamNode = audioCtx.createMediaStreamDestination();
const mediaRecorder = new MediaRecorder(mediaStreamNode.stream);
let saveChunks = [];

const globalEnv = audioCtx.createGain();


fetch('/src/data/default-presets.json')
    .then((response) => response.json())
    .then((json) => {
        defaultPresets = json;
        makeDefaultPresetOptions();
        makeUserPresetOptions();
    });

//knob functionality
function turnKnob(e, knob) {
    //Half of the knob marker width and height
    const w = knob.clientWidth / 2;
    const h = knob.clientHeight / 2;

    //Mouse coordinates. 
    const x = e.clientX - knob.offsetLeft;
    const y = e.clientY - knob.offsetTop;

    const deltaX = w - x;
    const deltaY = h - y;

    const rad = Math.atan2(deltaY, deltaX);
    let deg = rad * (180 / Math.PI);

    prevX = x;
    prevY = y;

    if (deg >= 0) {
        let knobRange = +knob.getAttribute("max") - +knob.getAttribute("min");
        let knobVal = (knobRange * (deg/180));
        knob.setAttribute("value", knobVal) + +knob.getAttribute("min");
        knob.setAttribute("angle", deg)
        let knobInput = knob.previousElementSibling;
        
        if (knobInput.value.endsWith("Hz")) {
            knobInput.value = `${knobVal.toFixed(2)} Hz`;
        } else if (knobInput.value.endsWith("s")) {
            knobInput.value = `${knobVal.toFixed(2)} s`;
        } else if (knobInput.value.endsWith("dB") && knob.id.includes("volume")) {
            knobVal = 20 * (Math.log(knobVal)/Math.LN10);
            knobInput.value = `${knobVal.toFixed(2)} dB`;
        } else if (knobInput.value.endsWith("dB")) {
            knobInput.value = `${knobVal.toFixed(2)} dB`;
        } else if (knobInput.value.endsWith("%")) {
            if (knob.id.includes("sustain")) {
                knobVal *= 100;
            }
            knobInput.value = `${knobVal.toFixed(2)}%`;
        }
    }

    return deg;
}

function slideTurnKnob(e, knob) {

    //Mouse coordinates. 
    const x = e.clientX - knob.offsetLeft;
    const y = e.clientY - knob.offsetTop;

    let deg = +knob.getAttribute("angle");
    
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

    let knobRange = +knob.getAttribute("max") - +knob.getAttribute("min");
    let knobVal = (knobRange * (deg/180)) + +knob.getAttribute("min");
    knob.setAttribute("value", knobVal);
    knob.setAttribute("angle", deg);
    let knobInput = knob.previousElementSibling;
    
    if (knobInput.value.endsWith("Hz")) {
        knobInput.value = `${knobVal.toFixed(2)} Hz`;
    } else if (knobInput.value.endsWith("s")) {
        knobInput.value = `${knobVal.toFixed(2)} s`;
    } else if (knobInput.value.endsWith("dB") && knob.id.includes("volume")) {
        knobVal = 20 * (Math.log(knobVal)/Math.LN10);
        knobInput.value = `${knobVal.toFixed(2)} dB`;
    } else if (knobInput.value.endsWith("dB")) {
        knobInput.value = `${knobVal.toFixed(2)} dB`;
    } else if (knobInput.value.endsWith("%")) {
        if (knob.id.includes("sustain")) {
            knobVal *= 100;
        }
        knobInput.value = `${knobVal.toFixed(2)}%`;
    }

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
    
    window.addEventListener("mouseup", () => {
        window.removeEventListener("mousemove", rotateKnob);
    });
}

function startSlideRotation(knob) {
    let slideKnob = (e) => {slide(e, knob)};

    window.addEventListener("mousemove", slideKnob);
    
    window.addEventListener("mouseup", () => {
        window.removeEventListener("mousemove", slideKnob);
    });
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
    WIDTH = visualizer.width;
    HEIGHT = visualizer.height;

    const canvasCtx = visualizer.getContext("2d");

    const analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const draw = function () {

        const drawVisual = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = "rgb(0, 0, 0)";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

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

function createEmptyCard() {
    let cardOptions = ["Compressor"];
    let newCard = document.createElement("div");
    newCard.classList.add("card");
    newCard.classList.add("effect");
    newCard.id = "empty-card"
    let title = document.createElement("h2");
    title.innerHTML = "Pick a new card:";
    newCard.appendChild(title);

    let optionContainer = document.createElement("div");
    optionContainer.classList.add("option-container");
    newCard.appendChild(optionContainer);
    for (card of cardOptions) {
        let option = document.createElement("p");
        option.innerHTML = card;
        option.onclick = () => createEffectCard(card);
        optionContainer.appendChild(option);
    }
    document.querySelector(".card-container").appendChild(newCard);
}

function createEffectCard(type) {
    let emptyCard = document.querySelector("#empty-card");
    emptyCard.innerHTML = "";

    //General Effect Card Layout
    emptyCard.id = `${type.toLowerCase()}-card`;

    let top = document.createElement("div");
    top.classList.add("top");

    let topBar = document.createElement("div");
    topBar.classList.add("top-bar");

    let muteButton = document.createElement("div");
    muteButton.classList.add("mute-button");
    muteButton.setAttribute("muted", false);
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

    let visualizer = document.querySelector(".visualizer").cloneNode();

    top.appendChild(topBar);
    top.appendChild(visualizer);
    emptyCard.appendChild(top);

    closeButton.onclick = () => emptyCard.remove();
    muteButton.onclick = () => {
        let muted = muteButton.getAttribute("muted") === "true";
        muteButton.setAttribute("muted", !muted);
        if (muted) {
            muteImg.setAttribute("src", "images/unmuted.svg");
            muteImg.setAttribute("alt", "A speaker. Click to mute the effects of this card");
        } else {
            muteImg.setAttribute("src", "images/muted.svg");
            muteImg.setAttribute("alt", "A crossed out speaker. Click to unmute the effects of this card");
        }
    };

    switch(type) {
        case "Compressor":
            let knobs = document.createElement("div");
            knobs.classList.add("knobs");

            knobs.innerHTML = type;

            let knobRow1 = document.createElement("div");
            knobRow1.classList.add("knob-row");
            let knobRow2 = document.createElement("div");
            knobRow2.classList.add("knob-row");

            let volume = new createKnob("comp-volume", 1, 0, 1, " dB");
            let threshhold = new createKnob("comp-threshold", 0, -100, 0, " dB");
            let knee = new createKnob("comp-knee", 0, 0, 40, " dB");
            let ratio = new createKnob("comp-ratio", 1, 1, 20, " dB");
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
    }
}

function createKnob(name, value, min, max, unit) {
    let knobContainer = document.createElement("div");
    knobContainer.classList.add("knob-container");

    let knobInput = document.querySelector(".knob-value").cloneNode();
    knobInput.setAttribute("value", `${value}${unit}`);
    knobInput.value = `${value}${unit}`;

    let knob = document.querySelector(".knob").cloneNode(true);
    knob.removeAttribute("id");
    knob.classList.add(name);
    knob.setAttribute("value", value);
    knob.setAttribute("min", min);
    knob.setAttribute("max", max);
    knob.setAttribute("angle", 0);

    let knobLabel = document.createElement("div");
    knobLabel.classList.add("label");
    let splitName = name.split("-");
    knobLabel.innerHTML = splitName[1].charAt(0).toUpperCase() + splitName[1].slice(1);

    knobContainer.appendChild(knobInput);
    knobContainer.appendChild(knob);
    knobContainer.appendChild(knobLabel);

    let knobMarker;

    for (child of knob.childNodes) {
        if (child.innerHTML !== undefined) {
            knobMarker = child;
            break;
        }
    }

    knob.addEventListener("mousedown", () => {startSlideRotation(knob)});
    knobMarker.addEventListener("mousedown", () => {startRotation(knob)});

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
    const osc1Gain = +osc1VolKnob.getAttribute("value");
    const osc1Freq = +osc1FreqKnob.getAttribute("value");
    const distAmount = +osc1DistKnob.getAttribute("value");
    const fmAmount = +osc1FMKnob.getAttribute("value");

    const attackTime = +osc1AttackKnob.getAttribute("value");
    const decayTime = +osc1DecayKnob.getAttribute("value");
    const sustainVolume = +osc1SustainKnob.getAttribute("value");
    const releaseTime = +osc1ReleaseKnob.getAttribute("value");

    const globalSweepAmount = +globalSweepKnob.getAttribute("value");

    osc = audioCtx.createOscillator();
    osc.frequency.value = osc1Freq;

    let modulator = audioCtx.createOscillator();
    modulator.frequency.value = 500;

    const osc1Env = audioCtx.createGain();
    const modulatorGain = audioCtx.createGain();
 
    modulatorGain.gain.value = fmAmount * 10;

    const osc1DistortionNode = audioCtx.createWaveShaper();

    osc1DistortionNode.curve = createDistortionCurve(distAmount);

    osc1Env.gain.setValueAtTime(0, time);
    osc1Env.gain.linearRampToValueAtTime(osc1Gain, time + attackTime);
    if (osc1Gain > 0) {
        osc1Env.gain.linearRampToValueAtTime(sustainVolume, time + attackTime + decayTime);
    }
    osc1Env.gain.linearRampToValueAtTime(0, time + attackTime + decayTime + releaseTime);

    //Pitch sweep
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
    osc1Playing = true;
    osc.addEventListener("ended", () => {
        osc1Playing = false;
        handleSoundEnd()
    }); 

    osc.stop(time + attackTime + decayTime + releaseTime);
}

function playNoise(time) {
    const noiseGain = +noiseVolKnob.getAttribute("value");
    const highpassFreq = +noiseHighPassKnob.getAttribute("value");
    const distAmount = +noiseDistKnob.getAttribute("value");
    const lowpassFreq = +noiseLowPassKnob.getAttribute("value");

    const attackTime = +noiseAttackKnob.getAttribute("value");
    const decayTime = +noiseDecayKnob.getAttribute("value");
    const sustainVolume = +noiseSustainKnob.getAttribute("value");
    const releaseTime = +noiseReleaseKnob.getAttribute("value");

    const globalSweepAmount = +globalSweepKnob.getAttribute("value");
    if (attackTime + decayTime + releaseTime > 0) {
        let noise = createNoise(attackTime + decayTime + releaseTime);

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

        noiseEnv.gain.setValueAtTime(0, time);
        noiseEnv.gain.linearRampToValueAtTime(noiseGain, time + attackTime);
        if (noiseGain > 0) {
            noiseEnv.gain.linearRampToValueAtTime(sustainVolume, time + attackTime + decayTime);
        }
        noiseEnv.gain.linearRampToValueAtTime(0, time + attackTime + decayTime + releaseTime);

        noise.detune.setValueAtTime(globalSweepAmount, time);
        noise.detune.linearRampToValueAtTime(0, time + (decayTime / 4))

        noise.connect(highpass);
        highpass.disconnect();

        if (distAmount > 0) {
            highpass.connect(distortionNode);
            distortionNode.connect(lowpass)
            lowpass.connect(noiseEnv).connect(globalEnv);
        } else {
            highpass.connect(lowpass);
            lowpass.connect(noiseEnv).connect(globalEnv);
        }
    

        noise.start()
        noisePlaying = true;
        noise.addEventListener("ended", () => {
            noisePlaying = false;
            handleSoundEnd()
        }); 
        noise.stop(time + attackTime + decayTime + releaseTime);
    }
}

function playAll(time) {
    const globalGain = +globalVolKnob.getAttribute("value");
    const globalDistAmount = +globalDistKnob.getAttribute("value");

    const canvas = document.querySelector(".visualizer");

    const compressorCard = document.querySelector("#compressor-card");


    const globalDistortionNode = audioCtx.createWaveShaper();
    globalDistortionNode.curve = createDistortionCurve(globalDistAmount);
    globalDistortionNode.oversample = "2x";
    
    globalEnv.gain.value = globalGain;

    lastNode = globalEnv;
    globalEnv.disconnect();
    if (globalDistAmount > 0) {
        lastNode.connect(globalDistortionNode);
        lastNode = globalDistortionNode;
    }
    //Main card waveform.
    createWaveform(globalEnv, canvas);

    let effectCards = document.getElementsByClassName("effect");

    for (card of effectCards) {
        let muteButton = card.querySelector(".mute-button");
        if (muteButton !== null) {
            if (muteButton.getAttribute("muted") !== "true") {
                if (card.id.includes("compressor")) {
                    const visualizer = card.querySelector(".visualizer");
                    const compressor = audioCtx.createDynamicsCompressor();
                    const compressorEnv = audioCtx.createGain();
        
                    compressorEnv.gain.value = +card.querySelector(".comp-volume").getAttribute("value");
                    compressor.threshold.setValueAtTime(+card.querySelector(".comp-threshold").getAttribute("value"), time);
                    compressor.knee.setValueAtTime(+card.querySelector(".comp-knee").getAttribute("value"), time);
                    compressor.ratio.setValueAtTime(+card.querySelector(".comp-ratio").getAttribute("value"), time);
                    compressor.attack.setValueAtTime(+card.querySelector(".comp-attack").getAttribute("value"), time);
                    compressor.release.setValueAtTime(+card.querySelector(".comp-release").getAttribute("value"), time);
        
                    lastNode.connect(compressor);
                    compressor.connect(compressorEnv);
                    lastNode = compressorEnv;
        
                    createWaveform(lastNode, visualizer);
                }
            }
        }
    }

    lastNode.connect(mediaStreamNode);
    lastNode.connect(audioCtx.destination); 

    playOsc1(time);
    playNoise(time);
}

function updateKnobs(kArray) {
    for (let i = 0; i < kArray.length; i++) {    
        const initialValue = +kArray[i].getAttribute("value") - +kArray[i].getAttribute("min");
        const knobRange = +kArray[i].getAttribute("max") - +kArray[i].getAttribute("min");
        const deg = (initialValue / knobRange) * 180;
        const result = Math.floor(deg - 90);
        kArray[i].style.transform = `rotate(${result}deg)`;
        kArray[i].setAttribute("angle", deg);
    }
}

function updateValueInputs() {
    for (input of valueInputs) {
        let knob = input.nextElementSibling;
        let knobVal = +knob.getAttribute("value");
        if (input.value.endsWith("Hz")) {
            input.value = `${knobVal.toFixed(2)} Hz`;
        } else if (input.value.endsWith("s")) {
            input.value = `${knobVal.toFixed(2)} s`;
        } else if (input.value.endsWith("dB") && knob.id.includes("volume")) {
            knobVal = 20 * (Math.log(knobVal)/Math.LN10);
            input.value = `${knobVal.toFixed(2)} dB`;
        } else if (input.value.endsWith("dB")) {
            input.value = `${knobVal.toFixed(2)} dB`;
        } else if (input.value.endsWith("%")) {
            if (knob.id.includes("sustain")) {
                knobVal *= 100;
            }
            input.value = `${knobVal.toFixed(2)}%`;
        }
    }
}

function handleInputChange(e) {
    let knob = e.target.nextElementSibling;
    let newValue = e.target.value;
    if (newValue.endsWith("Hz")) {
        newValue = newValue.slice(0, -2);
        newValue.trimEnd();
    } else if (newValue.endsWith("s") || newValue.endsWith("%")) {
        newValue = newValue.slice(0, -1);
        newValue.trimEnd();
    } else if (newValue.endsWith("dB")) {
        newValue = newValue.slice(0, -2);
        newValue.trimEnd();
        newValue = Math.pow(10, (+newValue / 20));
    }

    if (knob.id.includes("sustain")) {
        newValue = +newValue / 100;
    }

    if (+newValue < +knob.getAttribute("min")) {
        newValue = +knob.getAttribute("min");
    } else if (+newValue > +knob.getAttribute("max")) {
        newValue = +knob.getAttribute("max");
    }

    if (!isNaN(newValue) && !isNaN(parseInt(newValue))) {
        knob.setAttribute("value", +newValue);

        let knobVal = +knob.getAttribute("value");
    
        if (e.target.value.endsWith("Hz")) {
            e.target.value = `${knobVal} Hz`
        } else if (e.target.value.endsWith("dB")) {
            knobVal = 20 * (Math.log(knobVal)/Math.LN10);
            e.target.value = `${knobVal.toFixed(2)} dB`
        } else if (e.target.value.endsWith("%")) {
            if (knob.id.includes("sustain")) {
                knobVal *= 100;
            }
            e.target.value = `${knobVal}%`
        } else {
            e.target.value = `${knobVal} s`
        }
    }
    updateKnobs(knobArray);
}

function handleSoundEnd() {
    if (osc1Playing === false && noisePlaying === false) {
        if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
        playButton.setAttribute("playing", "false")
        playButton.innerHTML = "Play";
    }
}

function handleCornerMenuClick(e) {
    if (e.target.id.includes("save")) {
        savePreset();
    } else if (e.target.id.includes("delete")) {
        deletePreset();
    } else if (e.target.id.includes("clear")) {
        clearPresets();
    } else if (e.target.id.includes("init")) {
        initializePreset();
    } else if (e.target.id.includes("random")) {
        randomizePreset();
    }
    updateKnobs(knobArray);
    updateValueInputs();
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
        let knobVal = knob.getAttribute("value");
        presetData[knobId] = knobVal;
    }

    localStorage.setItem(presetData["name"], JSON.stringify(presetData));

    let presetOption = document.createElement("option");
    presetOption.setAttribute("value", presetData["name"]);
    presetOption.classList.add("preset");
    presetOption.classList.add("user");
    presetOption.innerHTML = presetData["name"];
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
                    knob.setAttribute("value", value);
                    knob.value = value;
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
                knob.setAttribute("value", value);
                knob.value = value;
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
    presetSelect.selectedIndex = 0;
    const userPresetCollection = document.getElementsByClassName("user");
    let userPresets = Array.prototype.slice.call(userPresetCollection);

    for (let i = 0; i < userPresets.length; i++) {
        userPresets[i].remove();
    }
}

function initializePreset() {
    for (const [key, value] of Object.entries(initialPreset)) {
        const knob = document.getElementById(key);
        knob.setAttribute("value", value);
        knob.value = value;
    }
    updateValueInputs();
    updateKnobs(knobArray);
}

function randomizePreset() {
    let presetData = {};
    for (knob of knobArray) {
        let knobRange = +knob.getAttribute("max") - +knob.getAttribute("min");
        let knobVal = (Math.random() * knobRange) + +knob.getAttribute("min");
        knob.setAttribute("value", knobVal);
    }
    updateValueInputs();
    updateKnobs(knobArray);
}

function makeUserPresetOptions() {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        let preset = JSON.parse(localStorage.getItem(key));
        let presetOption = document.createElement("option");
        presetOption.setAttribute("value", preset["name"]);
        presetOption.classList.add("preset");
        presetOption.classList.add("user");
        presetOption.innerHTML = preset["name"];
        presetSelect.appendChild(presetOption);
    }
}

function makeDefaultPresetOptions() {
    let presets = Object.keys(defaultPresets);
    for (let i = 0; i < presets.length; i++) {
        let presetOption = document.createElement("option");
        presetOption.setAttribute("value", presets[i]);
        presetOption.classList.add("preset");
        presetOption.innerHTML = presets[i];
        presetSelect.appendChild(presetOption);
    }
}

playButton.onclick = () => {
    if (playButton.getAttribute("playing") === "false") {
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        mediaRecorder.start();
        let currentTime = audioCtx.currentTime;
        playAll(currentTime);
        playButton.setAttribute("playing", "true");
        playButton.innerHTML = "Stop";
    } else {
        osc.stop();
        noise.stop();
        if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
        playButton.setAttribute("playing", "false")
        playButton.innerHTML = "Play";
    }
};

mediaRecorder.ondataavailable = (e) => {
    saveChunks = [];
    saveChunks.push(e.data);
};

mediaRecorder.onstop = (e) => {
    const blob = new Blob(saveChunks, {type: "audio/wav; codec=opus"});
    document.querySelector("#save-link").setAttribute("href", URL.createObjectURL(blob))
};

for (let i = 0; i < knobArray.length; i++) {
    knobArray[i].addEventListener("mousedown", () => {startSlideRotation(knobArray[i])});
}

for (let i = 0; i < knobMarkers.length; i++) {
    const knob = knobMarkers[i].parentElement;
    knobMarkers[i].addEventListener("mousedown", () => {startRotation(knob)});
}

for (let i = 0; i < valueInputs.length; i++) {
    valueInputs[i].addEventListener("change", handleInputChange);
    valueInputs[i].addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            handleInputChange(e);
            valueInputs[i].blur();
        }
    });
}

for (let i = 0; i < cornerOptions.length; i++) {
    cornerOptions[i].addEventListener("click", handleCornerMenuClick);
}

for (let i = 0; i < knobArray.length; i++) {
    let knobId = knobArray[i].id;
    let knobVal = knobArray[i].getAttribute("value");
    initialPreset[knobId] = knobVal;
}

presetSelect.addEventListener("change", (e) => {
    loadPreset(e.target);
});

presetSelect.addEventListener("click", (e) => {
    if (e.detail === 0) {
        loadPreset(e.target);
    }
});

window.addEventListener("click", (e) => {
    if (!e.target.matches(".corner-button") && cornerDropdown.classList.contains("show")) {
        cornerDropdown.classList.remove("show");
    }
});

updateKnobs(knobArray);
updateValueInputs();
