const attackKnob = document.querySelector("#attack");
const decayKnob = document.querySelector("#decay");
const playButton = document.querySelector(".play");

let prevX = 0;
let prevY = 0;


let audioCtx = new AudioContext();

let osc = audioCtx.createOscillator();
let osc1Freq = 440;


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
    // deg = (deg + 360) % 360;
    deg = Math.floor(deg);
    if (deg >= 0) {
        let knobRange = Math.abs(+knob.getAttribute("min")) + Math.abs(+knob.getAttribute("max"));
        let knobVal = (knobRange * (deg/180)) + +knob.getAttribute("min");
        knob.setAttribute("value", knobVal);
    }
    console.log(knob.getAttribute("value"));
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

function playOsc1(time) {
    osc = audioCtx.createOscillator();
    osc.frequency.value = osc1Freq;

    let osc1Env = audioCtx.createGain();

    let attackTime = +attackKnob.getAttribute("value");

    osc1Env.gain.setValueAtTime(0, time);
    osc1Env.gain.linearRampToValueAtTime(1, time + attackTime);


    osc.connect(osc1Env).connect(audioCtx.destination);
    osc.start(time);
}


playButton.onclick = () => {
    if (playButton.getAttribute("playing") === "false") {
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        let currentTime = audioCtx.currentTime;
        playOsc1(currentTime);
        playButton.setAttribute("playing", "true");
        playButton.innerHTML = "Stop";
    } else {
        osc.stop();
        playButton.setAttribute("playing", "false")
        playButton.innerHTML = "Play";
    }
};

attackKnob.addEventListener("mousedown", () => {startRotation(attackKnob)});
decayKnob.addEventListener("mousedown", () => {startRotation(decayKnob)});
