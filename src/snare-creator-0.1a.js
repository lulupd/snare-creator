const osc1AttackKnob = document.querySelector("#osc1-attack");
const osc1DecayKnob = document.querySelector("#osc1-decay");
const osc1SustainKnob = document.querySelector("#osc1-sustain");
const osc1ReleaseKnob = document.querySelector("#osc1-release");

const noiseAttackKnob = document.querySelector("#noise-attack");
const noiseDecayKnob = document.querySelector("#noise-decay");
const noiseSustainKnob = document.querySelector("#noise-sustain");
const noiseReleaseKnob = document.querySelector("#noise-release");

const knobArray = [osc1AttackKnob, osc1DecayKnob, osc1SustainKnob, osc1ReleaseKnob, noiseAttackKnob, noiseDecayKnob, noiseSustainKnob, noiseReleaseKnob];

const playButton = document.querySelector(".play");

const canvas = document.querySelector(".visualizer");


let prevX = 0;
let prevY = 0;


const audioCtx = new AudioContext();
const canvasCtx = canvas.getContext("2d");

let osc = audioCtx.createOscillator();
let osc1Freq = 440;

//noise buffer creation
const bufferSize = audioCtx.sampleRate * +noiseDecayKnob.getAttribute("value");
const noiseBuffer = new AudioBuffer({
    length: bufferSize,
    sampleRate: audioCtx.sampleRate,
});

const data = noiseBuffer.getChannelData(0);
for (let i = 0; i < bufferSize; i++) {
  data[i] = Math.random() - 0.5;
}
let noise = new AudioBufferSourceNode(audioCtx, {
    buffer: noiseBuffer,
});

//knob functionality
function valueKnob(e, knob) {
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
    
    // if (y < h && x > w) {
    // //1st quadrant

    //     if (prevX <= x && prevY <= y) {
    //         let knobVal = +knob.getAttribute("value");
    //         knobVal += +knob.getAttribute("step");
    //         if (knobVal > +knob.getAttribute("max")) {
    //             knobVal = +knob.getAttribute("max");
    //         }
    //         knob.setAttribute("value", knobVal);
    //     } else if (prevX >= x && prevY >= y) {
    //         let knobVal = +knob.getAttribute("value");
    //         knobVal -= +knob.getAttribute("step");
    //         if (knobVal < +knob.getAttribute("min")) {
    //             knobVal = +knob.getAttribute("min");
    //         }
    //         knob.setAttribute("value", knobVal);
    //     }
    // } else if (y < h && x < w) {
    //     //2nd quadrant
    //     if (prevX <= x && prevY >= y) {
    //         let knobVal = +knob.getAttribute("value");
    //         knobVal += +knob.getAttribute("step");
    //         if (knobVal > +knob.getAttribute("max")) {
    //             knobVal = +knob.getAttribute("max");
    //         }
    //         knob.setAttribute("value", knobVal);
    //     } else if (prevX >= x && prevY <= y) {
    //         let knobVal = +knob.getAttribute("value");
    //         knobVal -= +knob.getAttribute("step");
    //         if (knobVal < +knob.getAttribute("min")) {
    //             knobVal = +knob.getAttribute("min");
    //         }
    //         knob.setAttribute("value", knobVal);
    //     }
    // } else if (y > h && x < w) {
    //     //3rd quadrant
    //     if (prevX >= x && prevY >= y) {
    //         let knobVal = +knob.getAttribute("value");
    //         knobVal += +knob.getAttribute("step");
    //         if (knobVal > +knob.getAttribute("max")) {
    //             knobVal = +knob.getAttribute("max");
    //         }
    //         knob.setAttribute("value", knobVal);
    //     } else if (prevX <= x && prevY >= y) {
    //         let knobVal = +knob.getAttribute("value");
    //         knobVal -= +knob.getAttribute("step");
    //         if (knobVal < +knob.getAttribute("min")) {
    //             knobVal = +knob.getAttribute("min");
    //         }
    //         knob.setAttribute("value", knobVal);
    //     }
    // } else if (y > h && x > w) {
    //     //4th quadrant
    //     if (prevX >= x && prevY <= y) {
    //         let knobVal = +knob.getAttribute("value");
    //         knobVal += +knob.getAttribute("step");
    //         if (knobVal > +knob.getAttribute("max")) {
    //             knobVal = +knob.getAttribute("max");
    //         }
    //         knob.setAttribute("value", knobVal);
    //     } else if (prevX <= x && prevY >= y) {
    //         let knobVal = +knob.getAttribute("value");
    //         knobVal -= +knob.getAttribute("step");
    //         if (knobVal < +knob.getAttribute("min")) {
    //             knobVal = +knob.getAttribute("min");
    //         }
    //         knob.setAttribute("value", knobVal);
    //     }
    // }


    prevX = x;
    prevY = y;

    deg = Math.floor(deg);
    if (deg >= 0) {
        let knobRange = Math.abs(+knob.getAttribute("min")) + Math.abs(+knob.getAttribute("max"));
        let knobVal = (knobRange * (deg/180)) + +knob.getAttribute("min");
        knob.setAttribute("value", knobVal);
    }

    return deg;
}

function rotate(e, knob) {
    const result = Math.floor(valueKnob(e, knob) - 90);
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
    osc = audioCtx.createOscillator();
    osc.frequency.value = osc1Freq;

    const osc1Env = audioCtx.createGain();

    const attackTime = +osc1AttackKnob.getAttribute("value");
    const decayTime = +osc1DecayKnob.getAttribute("value");
    const sustainVolume = +osc1SustainKnob.getAttribute("value");
    const releaseTime = +osc1ReleaseKnob.getAttribute("value");

    osc1Env.gain.setValueAtTime(0, time);
    osc1Env.gain.linearRampToValueAtTime(1, time + attackTime);
    osc1Env.gain.linearRampToValueAtTime(sustainVolume, time + decayTime + releaseTime);


    osc.connect(osc1Env).connect(audioCtx.destination);

    createWaveform(osc1Env);

    osc.start(time);

    osc.addEventListener("ended", () => {
        playButton.setAttribute("playing", "false")
        playButton.innerHTML = "Play";
    }); 

    osc.stop(time + decayTime + releaseTime);
}

function playNoise(time) {
    noise = new AudioBufferSourceNode(audioCtx, {
        buffer: noiseBuffer,
    });

    const noiseEnv = audioCtx.createGain();

    const attackTime = +noiseAttackKnob.getAttribute("value");
    const decayTime = +noiseDecayKnob.getAttribute("value");
    const sustainVolume = +noiseSustainKnob.getAttribute("value");
    const releaseTime = +noiseReleaseKnob.getAttribute("value");

    noiseEnv.gain.setValueAtTime(0, time);
    noiseEnv.gain.linearRampToValueAtTime(1, time + attackTime);
    noiseEnv.gain.linearRampToValueAtTime(sustainVolume, time + decayTime + releaseTime);


    noise.connect(noiseEnv).connect(audioCtx.destination);
    noise.start()
    noise.stop(time + decayTime + releaseTime);
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
    knobArray[i].addEventListener("mousedown", () => {startRotation(knobArray[i])});

    const initialValue = +knobArray[i].getAttribute("value")
    const knobRange = Math.abs(+knobArray[i].getAttribute("min")) + Math.abs(+knobArray[i].getAttribute("max"));
    if (initialValue !== (knobRange / 2)) {
        const deg = (initialValue / knobRange) * 180;
        const result = Math.floor(deg - 90);
        knobArray[i].style.transform = `rotate(${result}deg)`;
    }
}
