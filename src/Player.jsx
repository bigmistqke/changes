import Wave from "./Wave";
import Selection from "./Selection";
import styles from "./Player.module.css";
import { createEffect, Show } from "solid-js";

export default function Player(props) {
  let navigation_container;

  createEffect(() => console.log(navigation_container));
  return (
    <div class={styles.container}>
      <div class={styles.button_container} ref={navigation_container}>
        <div class={styles.navigation}>
          <label>zoom </label>
          <button
            class={styles.plusMinus}
            onClick={() => props.setZoomValue((v) => Math.max(100, v * 1.2))}
          >
            +
          </button>
          <button
            class={styles.plusMinus}
            onClick={() => props.setZoomValue((v) => Math.max(100, v * 0.8))}
          >
            –
          </button>
        </div>
        <div class={styles.navigation}>
          <label>offset </label>
          <button
            class={styles.plusMinus}
            onClick={() =>
              props.setZoomOffset((v) => Math.max(0, Math.min(100, v + 1)))
            }
          >
            +
          </button>
          <button
            class={styles.plusMinus}
            onClick={() =>
              props.setZoomOffset((v) => Math.max(0, Math.min(100, v - 1)))
            }
          >
            –
          </button>
        </div>
      </div>
      <div class={styles.visualizer}>
        <div class={styles.waveContainer}>
          <Wave
            url={props.url}
            storage={props.storage}
            setStorage={props.setStorage}
            zoom={props.zoom}
            audio_buffer={props.audio_buffer}
          />
        </div>
        <div
          style={{
            transform: `translateX(${props.zoom.offset * -1}%)`,
            width: props.zoom.value + "%",
            height: "100%",
          }}
        >
          <div
            class={styles.caret}
            style={{
              left: props.time + "%",
              display: !props.playing ? "none" : null,
            }}
          />
          <Selection
            chords={props.chords}
            setSelection={props.setSelection}
            audio_loop={props.audio_loop}
            comp_loop={props.comp_loop}
            focused_index={props.focused_index}
            editable={props.editable}
            zoom={props.zoom}
            mode={props.mode}
            offset_left={
              navigation_container ? navigation_container.offsetWidth : 0
            }
          />
        </div>
      </div>
      <div class={styles.button_container}>
        <button onClick={props.toggleAudio} class={styles.play_button}>
          <Show when={!props.playing}>
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              width="33.3px"
              height="33.3px"
              viewBox="0 0 33.3 33.3"
              style="overflow:visible;enable-background:new 0 0 33.3 33.3;"
              xml:space="preserve"
            >
              <defs></defs>
              <circle class={styles.guide} cx="16.6" cy="16.6" r="16.6" />
              <path d="M31.5,13.7L11.7,2.3C9.5,0.9,6.6,2.6,6.6,5.2v22.9c0,2.6,2.8,4.3,5.1,2.9l19.8-11.4C33.8,18.3,33.8,15,31.5,13.7z" />
            </svg>
          </Show>
          <Show when={props.playing}>
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              width="20px"
              height="29.7px"
              viewBox="0 0 20 29.7"
              style="overflow:visible;enable-background:new 0 0 20 29.7;"
              xml:space="preserve"
            >
              <defs></defs>
              <path d="M3.4,0L3.4,0C1.5,0,0,1.5,0,3.4v22.9c0,1.9,1.5,3.4,3.4,3.4h0c1.9,0,3.4-1.5,3.4-3.4V3.4C6.7,1.5,5.2,0,3.4,0z" />
              <path d="M16.6,0L16.6,0c-1.9,0-3.4,1.5-3.4,3.4v22.9c0,1.9,1.5,3.4,3.4,3.4h0c1.9,0,3.4-1.5,3.4-3.4V3.4C20,1.5,18.5,0,16.6,0z" />
            </svg>
          </Show>
        </button>
      </div>
    </div>
  );
}
