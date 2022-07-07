import { createStorage } from "@solid-primitives/storage";
import { createEffect, createSignal, onMount, Show, untrack } from "solid-js";
import { createStore } from "solid-js/store";

import Chords from "./Chords";
import Player from "./Player";

import check from "./helpers/check";

import "./global.css";

import styles from "./Header.module.css";

let length2Bpm = function (length) {
  var sPerMinute = 60;
  return sPerMinute / length;
};
let bpm2Length = function (bpm) {
  var sPerMinute = 60;
  return sPerMinute / bpm;
};

function App() {
  const [storage, setStorage] = createStorage({ prefix: "wave-" });
  const [store, setStore] = createStore({
    time: 0,
    bpm: 120,
    zoom: {
      value: 100,
      offset: 0,
    },
    url: "https://www.vincentvandijck.com/cors/all_of_me.mp3",
    comp: {
      chords: [],
      loop: {
        start: false,
        end: false,
      },
    },
    audio: {
      buffer: null,
      context: null,
      source: null,
      loop: {
        start: 0,
        end: 100,
      },
    },
    mode: "full",
    bools: {
      playing: false,
    },
  });

  const getAudioLoopLength = () =>
    ((store.audio.loop.end - store.audio.loop.start) / 100) *
    store.audio.buffer.duration;

  const getCompLoopLength = () =>
    store.mode === "part"
      ? ((store.comp.loop.end + 1) / store.comp.chords.length) *
          getAudioLoopLength() -
        (store.comp.loop.start / store.comp.chords.length) *
          getAudioLoopLength()
      : getAudioLoopLength();

  const updateBpm = () => {
    if (!store.audio.buffer || !store.comp.chords) return;
    let { start, end } = store.audio.loop;
    let duration =
      ((100 - start - (100 - end)) / 100) * store.audio.buffer.duration;
    let _bpm = length2Bpm(duration / store.comp.chords.length / 4);
    if (_bpm) setStore("bpm", _bpm);
  };

  const calculateEndFromBpm = (bpm) => {
    let length = bpm2Length(bpm) * store.comp.chords.length * 4;
    let start = (store.audio.loop.start * store.audio.buffer.duration) / 100;
    let end = store.audio.buffer.duration - length - start;
    end = 100 - (end / store.audio.buffer.duration) * 100;
    setStore("audio", "loop", "end", end);
  };

  const update = () => {
    if (!store.bools.playing) return;

    const duration = store.audio.buffer.duration;
    const comp_loop_offset =
      store.mode === "part"
        ? (store.comp.loop.start / store.comp.chords.length) *
          getAudioLoopLength()
        : 0;
    const audio_loop_offset =
      (store.audio.loop.start / 100) * store.audio.buffer.duration;

    const current_time =
      ((performance.now() / 1000 - store.audio.source.start_time) %
        getCompLoopLength()) +
      audio_loop_offset +
      comp_loop_offset;

    const percent = (current_time / duration) * 100;

    const { start, end } = store.audio.loop;
    const percent2 =
      ((current_time - (duration * start) / 100) /
        (duration * ((end - start) / 100))) *
      100;

    const index = Math.max(
      0,
      parseInt((percent2 / 100) * store.comp.chords.length)
    );

    setStore("time", percent);
    setStore("focused_index", index);

    requestAnimationFrame(update);
  };

  const loadAudioBuffer = async (url) => {
    try {
      if (!url) return;
      const response = await fetch(url);
      let buffer = await response.arrayBuffer();
      buffer = await store.audio.context.decodeAudioData(buffer);
      setStore("audio", "buffer", buffer);
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const createSource = () => {
    let source = store.audio.context.createBufferSource();
    source.buffer = store.audio.buffer;

    let gainNode = store.audio.context.createGain();
    gainNode.gain.value = 1;
    source.gain = gainNode.gain;

    source.connect(gainNode);
    gainNode.connect(store.audio.context.destination);

    source.loop = true;

    let offset = (store.audio.loop.start / 100) * store.audio.buffer.duration;

    if (store.mode === "part" && store.comp.chords.length > 0) {
      if (!check(store.comp.loop.start) && !check(store.comp.loop.end))
        return false;

      source.loopStart =
        offset +
        (store.comp.loop.start / store.comp.chords.length) *
          getAudioLoopLength();

      let end = store.comp.loop.end
        ? store.comp.loop.end + 1
        : store.comp.loop.start + 1;

      source.loopEnd =
        offset + (end / store.comp.chords.length) * getAudioLoopLength();
    } else {
      source.loopStart = offset;
      source.loopEnd =
        (store.audio.loop.end / 100) * store.audio.buffer.duration;
    }

    setStore("audio", "source", source);
    return source;
  };

  const playAudio = () => {
    if (store.audio.source) {
      store.audio.source.stop();
      setStore("audio", "source", false);
    }
    let source = createSource();
    if (!source) return false;
    setStore("audio", "source", source);
    store.audio.source.start_time = performance.now() / 1000;
    store.audio.source.start(0, source.loopStart);
    setStore("bools", "playing", true);
    return true;
  };

  function easeInCubic(x) {
    return x * x * x;
  }
  function easeInCirc(x) {
    return 1 - Math.sqrt(1 - Math.pow(x, 2));
  }

  const fadeOut = async (source) =>
    new Promise((resolve) => {
      let volume = 1;
      const timeInMs = 375;
      const start_time = performance.now();
      const update = () => {
        const delta = 1 - (performance.now() - start_time) / timeInMs;
        source.gain.setTargetAtTime(
          easeInCirc(Math.max(0, delta)),
          store.audio.context.currentTime,
          0.1
        );
        if (delta <= 0) resolve();
        else requestAnimationFrame(update);
      };
      update();
    });

  const stopAudio = async () => {
    setStore("bools", "playing", false);
    setStore("focused_index", false);
    let source = store.audio.source;
    if (!source) return;
    await fadeOut(source);
    source.stop();
  };

  const toggleAudio = () => {
    if (!store.bools.playing) {
      if (playAudio()) update();
    } else {
      stopAudio();
    }
  };

  const setMode = (mode) => {
    setStore("mode", mode);
    if (store.bools.playing) {
      stopAudio();
    }
  };

  onMount(() => {
    if (storage.chords) setStore("comp", "chords", JSON.parse(storage.chords));
    if (storage.loop) setStore("audio", "loop", JSON.parse(storage.loop));
    if (storage.zoom) setStore("zoom", JSON.parse(storage.zoom));
    setStore("audio", "context", new AudioContext());
  });

  createEffect(() => loadAudioBuffer(store.url));
  createEffect(() => updateBpm());
  // createEffect(() => setStorage("chords", JSON.stringify(store.comp.chords)));
  createEffect(() => setStorage("loop", JSON.stringify(store.audio.loop)));
  createEffect(() => setStorage("zoom", JSON.stringify(store.zoom)));

  return (
    <>
      <div class={styles.header}>
        <div style={{ flex: 1, "font-size": "8pt !important" }}>
          <div class={styles.menu_element}>
            <label>bpm </label>
            <input
              value={Math.round(store.bpm)}
              onChange={(e) => calculateEndFromBpm(e.target.value)}
              type="number"
            />
          </div>
        </div>

        <div class={styles.menu_element} style={{ "padding-right": "15px" }}>
          <label>mode </label>
          <button
            classList={{ [styles.selected]: store.mode === "full" }}
            onClick={() => setMode("full")}
          >
            full
          </button>
          <button
            classList={{ [styles.selected]: store.mode === "part" }}
            onClick={() => setMode("part")}
          >
            part
          </button>
          <button
            classList={{ [styles.selected]: store.mode === "edit" }}
            onClick={() => setMode("edit")}
          >
            edit
          </button>
        </div>
      </div>

      <Chords
        addChord={(value) => {
          setStore("comp", "chords", store.comp.chords.length, { value });
        }}
        setChord={(index, value) => {
          setStore("comp", "chords", index, "value", value);
        }}
        deleteChord={(index) => {
          setStore("comp", "chords", (chords) => {
            chords.splice(index, 1);
            return [...chords];
          });
        }}
        selectChord={(index) => {
          if (store.mode !== "part") return;
          if (
            !check(store.comp.loop.start) ||
            (check(store.comp.loop.start) && check(store.comp.loop.end))
          ) {
            setStore("comp", "loop", "start", index);
            setStore("comp", "loop", "end", false);
            if (store.bools.playing) {
              stopAudio();
            }
          } else {
            if (store.comp.loop.start < index) {
              setStore("comp", "loop", "end", index);
            } else {
              setStore("comp", "loop", "end", store.comp.loop.start);
              setStore("comp", "loop", "start", index);
            }
            if (playAudio()) update();
          }
        }}
        chords={store.comp.chords}
        comp_loop={store.comp.loop}
        focused_index={store.focused_index}
        // editable={editable()}
        // micro={micro()}
        mode={store.mode}
        playing={store.bools.playing}
      ></Chords>
      <Player
        time={store.time}
        storage={storage}
        setStorage={setStorage}
        url={store.url}
        chords={store.comp.chords}
        zoom={store.zoom}
        audio_loop={store.audio.loop}
        comp_loop={store.comp.loop}
        focused_index={store.focused_index}
        editable={store.mode === "edit"}
        setSelection={(side, value) => setStore("audio", "loop", side, value)}
        setZoomValue={(value) => setStore("zoom", "value", value)}
        setZoomOffset={(value) => setStore("zoom", "offset", value)}
        audio_buffer={store.audio.buffer}
        playing={store.bools.playing}
        toggleAudio={toggleAudio}
        mode={store.mode}
      />
    </>
  );
}

export default App;
