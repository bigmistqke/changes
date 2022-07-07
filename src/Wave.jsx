import { createStorage } from "@solid-primitives/storage";
import { createEffect, createSignal, onMount } from "solid-js";

// https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/
window.AudioContext = window.AudioContext || window.webkitAudioContext;

export default function Wave(props) {
  let canvas;
  const [processedBuffer, setProcessedBuffer] = createSignal();

  let zoom = { value: 120, offset: 2 };

  const filterData = (processedBuffer) => {
    const rawData = processedBuffer.getChannelData(0);
    const samples = 500;
    const blockSize = Math.floor(
      (rawData.length * (100 / props.zoom.value)) / samples
    );

    const offset = Math.floor((props.zoom.offset / 100) * rawData.length);

    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i + offset;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        if (blockStart + j >= rawData.length) break;
        sum = sum + Math.abs(rawData[blockStart + j]);
      }
      filteredData.push(sum / blockSize);
    }

    return filteredData;
  };

  const normalizeData = (filteredData) => {
    const multiplier = Math.pow(Math.max(...filteredData), -1) * 2;
    return filteredData.map((n) => n * multiplier);
  };

  const draw = (normalizedData) => {
    // set up the canvas
    const dpr = window.devicePixelRatio || 1;
    const padding = 10;
    // canvas.setAttribute("width", )
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.translate(0, canvas.offsetHeight / 2);

    // draw the line segments
    const width = canvas.offsetWidth / normalizedData.length;
    for (let i = 0; i < normalizedData.length; i++) {
      const x = width * i;
      let height =
        (normalizedData[i] * canvas.offsetHeight) / 2 - width / 2 - padding;
      if (height < 0) {
        height = 0;
      } else if (height > canvas.offsetHeight / 2) {
        height = height > canvas.offsetHeight / 2;
      }
      drawLineSegment(ctx, x, height, width, (i + 1) % 2);
    }
  };

  const drawLineSegment = (ctx, x, height, width, isEven) => {
    ctx.lineWidth = 1; // how thick the line is
    ctx.strokeStyle = "black"; // what color our line is
    ctx.beginPath();
    height = isEven ? height : -height;
    ctx.moveTo(x, isEven ? 0 : 0);
    ctx.lineTo(x + width / 2, height);
    // ctx.arc(x + width / 2, height, width / 2, Math.PI, 0, isEven);
    ctx.lineTo(x + width, isEven ? -0.5 : 0.5);
    ctx.stroke();
  };

  const initDrawing = async () => {
    let buffer = props.audio_buffer;
    if (!buffer) return;
    let processed_buffer = normalizeData(filterData(buffer));
    props.setStorage("processedBuffer", JSON.stringify(processed_buffer));
    setProcessedBuffer(processed_buffer);
    draw(processedBuffer());
  };

  // audio

  onMount(() => {
    /*     if (props.storage.processedBuffer) {
      draw(JSON.parse(props.storage.processedBuffer));
    } */

    window.addEventListener("resize", () => {
      if (processedBuffer()) draw(processedBuffer());
    });
  });

  createEffect(() => {
    let buffer = props.audio_buffer;
    if (!canvas || !buffer) return;
    let processed_buffer = normalizeData(filterData(buffer));
    props.setStorage("processedBuffer", JSON.stringify(processed_buffer));
    setProcessedBuffer(processed_buffer);
    draw(processed_buffer);
  });

  return (
    <canvas
      style={{
        width: "100%",
        height: "75px",
      }}
      width={window.innerWidth}
      height="75"
      ref={canvas}
    />
  );
}
