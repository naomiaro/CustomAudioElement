class AudioVisualizer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Create audio element
    this.audio = document.createElement("audio");
    this.audio.controls = true;
    this.shadowRoot.appendChild(this.audio);

    // Create canvas for waveform
    this.canvas = document.createElement("canvas");
    this.canvas.width = 400;
    this.canvas.height = 100;

    const div = document.createElement("div");
    div.appendChild(this.canvas);
    this.shadowRoot.appendChild(div);

    // Web Audio setup
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.sourceNode = null;

    this.draw = this.draw.bind(this);
  }

  connectedCallback() {
    this.audio.addEventListener("play", () => {
      // Only connect once
      if (!this.sourceNode) {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      }
      this.audioCtx.resume(); // Needed in some browsers
      this.draw();
    });
  }

  draw() {
    const bufferLength = this.analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = this.canvas.getContext("2d");

    const drawFrame = () => {
      requestAnimationFrame(drawFrame);
      this.analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "lime";
      ctx.beginPath();

      const sliceWidth = this.canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * this.canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(this.canvas.width, this.canvas.height / 2);
      ctx.stroke();
    };

    drawFrame();
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(value) {
    this.setAttribute("src", value);
  }

  // Allow setting audio src via attribute
  static get observedAttributes() {
    return ["src"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "src") {
      this.audio.src = newVal;
    }
  }
}

customElements.define("audio-visualizer", AudioVisualizer);
