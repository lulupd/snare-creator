const osc1VolKnob = document.querySelector("#osc1-volume");
const osc1FreqKnob = document.querySelector("#osc1-frequency");
const osc1DistKnob = document.querySelector("#osc1-distortion");
const osc1FMKnob = document.querySelector("#osc1-fm");

const osc1AttackKnob = document.querySelector("#osc1-attack");
const osc1DecayKnob = document.querySelector("#osc1-decay");
const osc1SustainKnob = document.querySelector("#osc1-sustain");
const osc1ReleaseKnob = document.querySelector("#osc1-release");

const noiseVolKnob = document.querySelector("#noise-volume");
const noiseHighPassKnob = document.querySelector("#noise-high-pass");
const noiseDistKnob = document.querySelector("#noise-distortion");
const noiseLowPassKnob = document.querySelector("#noise-low-pass");

const noiseAttackKnob = document.querySelector("#noise-attack");
const noiseDecayKnob = document.querySelector("#noise-decay");
const noiseSustainKnob = document.querySelector("#noise-sustain");
const noiseReleaseKnob = document.querySelector("#noise-release");

const knobArray = document.getElementsByClassName("knob");

const knobMarkers = document.getElementsByClassName("knob-marker");

const valueInputs = document.getElementsByClassName("knob-value");

const playButton = document.querySelector(".play");

const canvas = document.querySelector(".visualizer");


let prevX = 0;
let prevY = 0;


const audioCtx = new AudioContext();
const canvasCtx = canvas.getContext("2d");

let osc = audioCtx.createOscillator();

const genEnv = audioCtx.createGain();
genEnv.connect(audioCtx.destination);

//noise buffer creation
let bufferSize = audioCtx.sampleRate * (+noiseAttackKnob.getAttribute("value") + +noiseDecayKnob.getAttribute("value") + +noiseReleaseKnob.getAttribute("value"));
const noiseBuffer = new AudioBuffer({
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

    deg = Math.floor(deg);
    if (deg >= 0) {
        let knobRange = +knob.getAttribute("max") - +knob.getAttribute("min");
        let knobVal = (knobRange * (deg/180));
        knob.setAttribute("value", knobVal);
        let valueVisualizer = knob.previousElementSibling;
        
        if (valueVisualizer.value.endsWith("Hz")) {
            valueVisualizer.value = `${knobVal.toFixed(2)} Hz`;
        } else if (valueVisualizer.value.endsWith("s")) {
            valueVisualizer.value = `${knobVal.toFixed(2)} s`;
        } else if (valueVisualizer.value.endsWith("dB")) {
            knobVal = 20 * (Math.log(knobVal)/Math.LN10);
            valueVisualizer.value = `${knobVal.toFixed(2)} dB`;
        } else if (valueVisualizer.value.endsWith("%")) {
            if (knob.id.includes("sustain")) {
                knobVal *= 100;
            }
            valueVisualizer.value = `${knobVal.toFixed(2)}%`;
        }
    }

    return deg;
}

function slideTurnKnob(e, knob) {

    //Mouse coordinates. 
    const x = e.clientX - knob.offsetLeft;
    const y = e.clientY - knob.offsetTop;

    let knobRange = +knob.getAttribute("max") - +knob.getAttribute("min");
    let knobVal = +knob.getAttribute("value");
    let deg = (knobVal / knobRange) * 180;
    console.log(deg);
    
    if (Math.abs(x - prevX) > Math.abs(y - prevY)) {
        deg += x - prevX;
    } else {
        deg -= y - prevY;
    }

    if (deg > 180) {
        deg = 180
    } else if (deg < 0) {
        deg = 0;
    }

    prevX = x;
    prevY = y;

    deg = Math.floor(deg);
    knobVal = (knobRange * (deg/180));
    knob.setAttribute("value", knobVal);
    let valueVisualizer = knob.previousElementSibling;
    
    if (valueVisualizer.value.endsWith("Hz")) {
        valueVisualizer.value = `${knobVal.toFixed(2)} Hz`;
    } else if (valueVisualizer.value.endsWith("s")) {
        valueVisualizer.value = `${knobVal.toFixed(2)} s`;
    } else if (valueVisualizer.value.endsWith("dB")) {
        knobVal = 20 * (Math.log(knobVal)/Math.LN10);
        valueVisualizer.value = `${knobVal.toFixed(2)} dB`;
    } else if (valueVisualizer.value.endsWith("%")) {
        if (knob.id.includes("sustain")) {
            knobVal *= 100;
        }
        valueVisualizer.value = `${knobVal.toFixed(2)}%`;
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
    let deg = Math.PI/180
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

function createWaveform(source) {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

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

function playOsc1(time) {
    const osc1Gain = +osc1VolKnob.getAttribute("value");
    const osc1Freq = +osc1FreqKnob.getAttribute("value");
    const distAmount = +osc1DistKnob.getAttribute("value");
    const fmAmount = +osc1FMKnob.getAttribute("value");

    const attackTime = +osc1AttackKnob.getAttribute("value");
    const decayTime = +osc1DecayKnob.getAttribute("value");
    const sustainVolume = +osc1SustainKnob.getAttribute("value");
    const releaseTime = +osc1ReleaseKnob.getAttribute("value");

    osc = audioCtx.createOscillator();
    osc.frequency.value = osc1Freq;
    osc.type ="triangle"

    let modulator = audioCtx.createOscillator();
    modulator.frequency.value = 500;

    const osc1Env = audioCtx.createGain();
    const modulatorGain = audioCtx.createGain();
 
    modulatorGain.gain.value = fmAmount * 10;

    const distortionNode = audioCtx.createWaveShaper();

    distortionNode.curve = createDistortionCurve(distAmount);

    osc1Env.gain.setValueAtTime(0, time);
    osc1Env.gain.linearRampToValueAtTime(osc1Gain, time + attackTime);
    if (osc1Gain > 0) {
        osc1Env.gain.linearRampToValueAtTime(sustainVolume, time + attackTime + decayTime);
    }
    osc1Env.gain.linearRampToValueAtTime(0, time + decayTime + releaseTime);

    

    modulator.connect(modulatorGain);
    modulatorGain.connect(osc.frequency);
    
    osc.connect(distortionNode);
    distortionNode.connect(osc1Env).connect(genEnv);

    createWaveform(genEnv);

    modulator.start(time);
    osc.start(time);

    osc.addEventListener("ended", () => {
        playButton.setAttribute("playing", "false")
        playButton.innerHTML = "Play";
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

    bufferSize = audioCtx.sampleRate * (attackTime + decayTime + releaseTime);
    noiseBuffer.length = bufferSize;

    noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() - 0.5;
    }

    noise = new AudioBufferSourceNode(audioCtx, {
        buffer: noiseBuffer,
    });

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
    noiseEnv.gain.linearRampToValueAtTime(0, time + decayTime + releaseTime);

    noise.connect(highpass);
    highpass.connect(distortionNode);
    distortionNode.connect(lowpass)
    lowpass.connect(noiseEnv).connect(genEnv);
    noise.start()
    noise.stop(time + attackTime + decayTime + releaseTime);
}

function updateKnobs(kArray) {
    for (let i = 0; i < kArray.length; i++) {    
        const initialValue = +kArray[i].getAttribute("value")
        const knobRange = +kArray[i].getAttribute("max") - +kArray[i].getAttribute("min");
        if (initialValue !== (knobRange / 2)) {
            const deg = (initialValue / knobRange) * 180;
            const result = Math.floor(deg - 90);
            kArray[i].style.transform = `rotate(${result}deg)`;
        }
    }
}

function handleInputChange(e) {
    knob = e.target.nextElementSibling;
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
    updateKnobs();
}



playButton.onclick = () => {
    if (playButton.getAttribute("playing") === "false") {
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        let currentTime = audioCtx.currentTime;
        playOsc1(currentTime);
        playNoise(currentTime);
        playButton.setAttribute("playing", "true");
        playButton.innerHTML = "Stop";
    } else {
        osc.stop();
        playButton.setAttribute("playing", "false")
        playButton.innerHTML = "Play";
    }
};

for (let i = 0; i < knobArray.length; i++) {
    knobArray[i].addEventListener("mousedown", () => {startSlideRotation(knobArray[i])});
}

for (let i = 0; i < knobMarkers.length; i++) {
    const knob = knobMarkers[i].parentElement;
    knobMarkers[i].addEventListener("mousedown", () => {startRotation(knob)});
}

updateKnobs(knobArray);

for (let j = 0; j < valueInputs.length; j++) {
    valueInputs[j].addEventListener("change", handleInputChange);
    valueInputs[j].addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            handleInputChange(e);
            valueInputs[j].blur();
        }
    });
}
